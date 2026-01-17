"use client";

import { useLocalParticipant, useDaily } from '@daily-co/daily-react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Controls() {
    const localParticipant = useLocalParticipant();
    const callObject = useDaily();
    const router = useRouter();

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

    const leaveCall = () => {
        if (!callObject) return;
        callObject.leave();
        router.push('/expert/bookings'); // Return to bookings
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
