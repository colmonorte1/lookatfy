'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

export default function ExpertDisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDisputes = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // We need to find disputes linked to bookings where I am the expert.
            // But 'disputes' only has created_by. We need to join with bookings.
            // AND the booking must have expert_id = my_id.

            // Supabase filter on foreign table relationship:
            // .eq('booking.expert_id', user.id) -> this syntax depends on postgrest version.
            // Typical way: 
            // .select('*, booking!inner(expert_id)') .eq('booking.expert_id', user.id)

            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    booking:bookings!inner (
                        id, date, time, expert_id,
                        user:profiles!user_id(full_name)
                    )
                `)
                .eq('booking.expert_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setDisputes(data);
            }
            setLoading(false);
        };

        fetchDisputes();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span style={{ background: '#fff3cd', color: '#856404', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>En Revisión</span>;
            case 'resolved_refunded': return <span style={{ background: '#f8d7da', color: '#721c24', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>Reembolsado (Contra Ti)</span>;
            case 'resolved_dismissed': return <span style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>Desestimado (A Favor)</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle /> Disputas Recibidas
            </h1>

            {loading ? (
                <p>Cargando...</p>
            ) : disputes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
                    <p style={{ color: '#666' }}>No tienes disputas en tu contra.</p>
                    <Link href="/expert/bookings"><Button variant="outline" style={{ marginTop: '1rem' }}>Volver a mis reservas</Button></Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {disputes.map(dispute => (
                        <div key={dispute.id} style={{
                            background: 'white', padding: '1.5rem', borderRadius: '8px',
                            border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                        {new Date(dispute.created_at).toLocaleDateString()}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{dispute.reason}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                                        Cliente: {dispute.booking?.user?.full_name}
                                    </p>
                                </div>
                                <div>
                                    {getStatusBadge(dispute.status)}
                                </div>
                            </div>

                            <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px', fontSize: '0.95rem', color: '#333' }}>
                                "{dispute.description}"
                            </div>

                            {dispute.resolution_notes && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>Soporte:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{dispute.resolution_notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
