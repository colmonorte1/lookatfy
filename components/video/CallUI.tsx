"use client";

import { useParticipantIds } from '@daily-co/daily-react';
import Tile from './Tile';
import Controls from './Controls';

export default function CallUI({ roomUrl, bookingId }: { roomUrl: string; bookingId?: string }) {
    const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
    const localParticipantId = useParticipantIds({ filter: 'local' })[0];

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: '#1a1a1a', position: 'relative'
        }}>

            {/* Video Grid */}
            <div style={{
                flex: 1,
                padding: '2rem',
                display: 'grid',
                gridTemplateColumns: remoteParticipantIds.length > 0 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr',
                gap: '1.5rem',
                alignContent: 'center'
            }}>
                {/* Local Participant (You) */}
                {localParticipantId && (
                    <div style={{ aspectRatio: '16/9', maxHeight: '600px', margin: '0 auto', width: remoteParticipantIds.length === 0 ? '80%' : '100%' }}>
                        <Tile id={localParticipantId} isLocal />
                    </div>
                )}

                {/* Remote Participants */}
                {remoteParticipantIds.map((id) => (
                    <div key={id} style={{ aspectRatio: '16/9', maxHeight: '600px' }}>
                        <Tile id={id} />
                    </div>
                ))}

                {remoteParticipantIds.length === 0 && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        color: 'white', textAlign: 'center', pointerEvents: 'none'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Esperando a los demás...</h2>
                        <p style={{ opacity: 0.7 }}>Comparte el enlace para que se unan.</p>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div style={{
                padding: '2rem',
                display: 'flex', justifyContent: 'center',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
            }}>
                <Controls roomUrl={roomUrl} bookingId={bookingId} />
            </div>
        </div>
    );
}
