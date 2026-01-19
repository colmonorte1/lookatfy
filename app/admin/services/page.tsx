import { createClient } from '@/utils/supabase/server';
import ServicesClient from './ServicesClient';

export default async function AdminServicesPage() {
    const supabase = await createClient();

    // Fetch services joined with expert -> profile
    const { data: services, error } = await supabase
        .from('services')
        .select(`
            *,
            experts (
                profiles (
                    full_name
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching services:", error);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Catálogo de Servicios</h1>
            <ServicesClient services={services || []} />
        </div>
    );
}
