"use client";

import { useLocalParticipant, useDaily } from '@daily-co/daily-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Circle, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function Controls({ roomUrl, bookingId }: { roomUrl: string; bookingId?: string }) {
    const localParticipant = useLocalParticipant();
    const callObject = useDaily();
    const router = useRouter();
    const [recording, setRecording] = useState(false);
    const [instanceId, setInstanceId] = useState<string | null>(null);
    const [recordingProcessing, setRecordingProcessing] = useState(false);
    const [canRecord, setCanRecord] = useState(false);

    const isMicOn = !localParticipant?.audio; // 'audio' is boolean: true if muted? No, Daily logic is tricky. 
    // Correction: localParticipant object has 'audio' property which is boolean 'muted' status?
    // Let's rely on daily-react hooks better or check docs.
    // Actually, useLocalParticipant returns the participant object. 
    // .audio is Boolean: True if the participant is publishing audio.

    const audioOn = localParticipant?.audio;
    const videoOn = localParticipant?.video;

    const toggleAudio = () => {
        if (!callObject) return;
        callObject.setLocalAudio(!audioOn);
    };

    const toggleVideo = () => {
        if (!callObject) return;
        callObject.setLocalVideo(!videoOn);
    };

    const startRecording = async () => {
        if (!callObject || !canRecord) return;
        const id = crypto.randomUUID();
        setInstanceId(id);
        await callObject.startRecording({ type: 'cloud', layout: { preset: 'default' }, instanceId: id });
        setRecording(true);
    };

    const stopRecording = async () => {
        if (!callObject) return;
        await callObject.stopRecording();
        setRecording(false);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const body = {
                instanceId,
                roomUrl,
                bookingId,
                type: 'cloud'
            };
            await fetch('/api/recordings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            await fetch('/api/recordings/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomUrl, instanceId })
            });
            setRecordingProcessing(true);
            await fetch('/api/recordings/resolve/poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomUrl, instanceId })
            });
            setRecordingProcessing(false);
        } catch {}
    };

    useEffect(() => {
        if (!callObject) return;
        const onStarted = (ev: any) => {
            const id = ev?.instanceId || instanceId || null;
            if (id) setInstanceId(id);
            setRecording(true);
        };
        const onStopped = async (ev: any) => {
            setRecording(false);
            setRecordingProcessing(true);
            try {
                await fetch('/api/recordings/resolve/poll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomUrl, instanceId: instanceId || ev?.instanceId })
                });
            } catch {}
            setRecordingProcessing(false);
        };
        callObject.on('recording-started', onStarted);
        callObject.on('recording-stopped', onStopped);
        return () => {
            callObject.off('recording-started', onStarted as any);
            callObject.off('recording-stopped', onStopped as any);
        };
    }, [callObject, roomUrl, instanceId]);

    useEffect(() => {
        const checkPermission = async () => {
            try {
                if (!bookingId) { setCanRecord(false); return; }
                const supabase = createClient();
                const { data: addons } = await supabase
                    .from('booking_addons')
                    .select('admin_service_id')
                    .eq('booking_id', bookingId);
                const ids = (addons || []).map((a: { admin_service_id?: string }) => a.admin_service_id).filter(Boolean) as string[];
                if (!ids.length) { setCanRecord(false); return; }
                const { data: services } = await supabase
                    .from('admin_services')
                    .select('id, recording_enabled')
                    .in('id', ids);
                const allowed = (services || []).some((s: { recording_enabled?: boolean }) => !!s.recording_enabled);
                setCanRecord(allowed);
            } catch {
                setCanRecord(false);
            }
        };
        checkPermission();
    }, [bookingId]);

    const leaveCall = async () => {
        if (!callObject) return;
        try { await callObject.leave(); } catch {}
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            let path = '/user/bookings';
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (profile?.role === 'expert') path = '/expert/bookings';
            }
            router.push(path);
        } catch {
            router.push('/user/bookings');
        }
    };

    return (
        <div style={{
            display: 'flex', gap: '1rem', padding: '1.5rem',
            background: 'rgb(var(--surface))', borderRadius: '2rem',
            boxShadow: 'var(--shadow-lg)', border: '1px solid rgb(var(--border))'
        }}>
            <button
                onClick={toggleAudio}
                style={{
                    width: '50px', height: '50px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: audioOn ? 'rgb(var(--surface-hover))' : 'rgb(var(--error))',
                    color: audioOn ? 'rgb(var(--text-main))' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                {audioOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
                onClick={toggleVideo}
                style={{
                    width: '50px', height: '50px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: videoOn ? 'rgb(var(--surface-hover))' : 'rgb(var(--error))',
                    color: videoOn ? 'rgb(var(--text-main))' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
            </button>

            {canRecord && (
                <button
                    onClick={recording ? stopRecording : startRecording}
                    style={{
                        width: '50px', height: '50px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: recording ? 'rgb(var(--warning))' : 'rgb(var(--success))',
                        color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    {recording ? <Square size={24} /> : <Circle size={24} />}
                </button>
            )}

            {recordingProcessing && (
                <div style={{
                    padding: '0.5rem 0.75rem', borderRadius: '12px', border: '1px solid rgb(var(--border))',
                    background: 'rgb(var(--surface))', color: 'rgb(var(--text-secondary))', fontSize: '0.85rem'
                }}>
                    Procesando...
                </div>
            )}

            <button
                onClick={leaveCall}
                style={{
                    width: '60px', height: '50px', borderRadius: '25px', border: 'none', cursor: 'pointer',
                    background: 'rgb(var(--error))', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <PhoneOff size={24} />
            </button>
        </div>
    );
}
