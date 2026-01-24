import { createClient } from '@/utils/supabase/server';
import ServicesClient from './ServicesClient';
import AdminServicesClient from './AdminServicesClient';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';

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
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Servicios</h1>
            <Tabs defaultValue="expert">
                <TabsList>
                    <TabsTrigger value="expert">Servicios de Expertos</TabsTrigger>
                    <TabsTrigger value="platform">Servicios de Plataforma</TabsTrigger>
                </TabsList>

                <TabsContent value="expert">
                    <ServicesClient services={services || []} />
                </TabsContent>

                <TabsContent value="platform">
                    <AdminServicesClient />
                </TabsContent>
            </Tabs>
        </div>
    );
}
