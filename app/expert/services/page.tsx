import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import ServiceCard from '@/components/expert/ServiceCard';

export default async function ExpertServicesPage() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch Services (excluding deleted)
    let services: any[] = [];

    if (user) {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('expert_id', user.id)
            .neq('status', 'deleted') // Filter out soft-deleted items
            .order('created_at', { ascending: false });

        if (data) services = data;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Mis Servicios</h1>
                <Link href="/expert/services/new">
                    <Button style={{ gap: '0.5rem' }}>
                        <Plus size={18} />
                        Nuevo Servicio
                    </Button>
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {services.map((service: any) => (
                    <ServiceCard key={service.id} service={service} />
                ))}

                {services.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'rgb(var(--text-muted))', border: '2px dashed rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>No tienes servicios activos.</p>
                        <Link href="/expert/services/new">
                            <Button size="lg" style={{ gap: '0.5rem' }}>
                                <Plus size={20} />
                                Crear mi primer servicio
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
