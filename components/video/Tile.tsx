"use client";

import { useVideoTrack, useAudioTrack, useParticipant } from '@daily-co/daily-react';
import { MicOff } from 'lucide-react';

export default function Tile({ id, isLocal }: { id: string; isLocal?: boolean }) {
    const videoState = useVideoTrack(id);
    const audioState = useAudioTrack(id);
    const participant = useParticipant(id);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#2c2c2c',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
            {/* Video Element */}
            {videoState.track && !videoState.isOff ? (
                <video
                    autoPlay
                    muted={isLocal} // Always mute local video to avoid feedback
                    playsInline
                    ref={(el) => {
                        if (el && videoState.track) {
                            el.srcObject = new MediaStream([videoState.track]);
                        }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
                />
            ) : (
                /* Avatar / Placeholder when video is off */
                <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexDirection: 'column', gap: '1rem'
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: '#4a4a4a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600
                    }}>
                        {participant?.user_name?.charAt(0) || '?'}
                    </div>
                    {videoState.isOff && <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Cámara apagada</span>}
                </div>
            )}

            {/* Name Label */}
            <div style={{
                position: 'absolute', bottom: '1rem', left: '1rem',
                background: 'rgba(0,0,0,0.5)', color: 'white',
                padding: '0.25rem 0.75rem', borderRadius: '4px',
                fontSize: '0.875rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
                {participant?.user_name || 'Participante'} {isLocal && '(Tú)'}
                {(audioState.isOff || (audioState.blocked && (audioState.blocked.byDeviceMissing || audioState.blocked.byDeviceInUse || audioState.blocked.byPermissions))) && <MicOff size={14} style={{ color: '#ff4444' }} />}
            </div>

            {/* Audio Element (for remote participants) */}
            {!isLocal && audioState.track && (
                <audio autoPlay playsInline ref={(el) => {
                    if (el && audioState.track) {
                        el.srcObject = new MediaStream([audioState.track]);
                    }
                }} />
            )}
        </div>
    );
}
