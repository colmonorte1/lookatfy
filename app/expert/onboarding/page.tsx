import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import OnboardingClient from './OnboardingClient';

export default async function ExpertOnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Datos del perfil y estado actual del experto
    const [
        { data: profile },
        { data: expert },
        { count: servicesCount },
        { count: availabilityCount },
    ] = await Promise.all([
        supabase.from('profiles').select('full_name, first_name').eq('id', user.id).single(),
        supabase.from('experts').select('title, bio, complete_setup').eq('id', user.id).single(),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('expert_id', user.id).eq('status', 'active'),
        supabase.from('expert_availability').select('*', { count: 'exact', head: true }).eq('expert_id', user.id).eq('is_active', true),
    ]);

    // Si ya completó el setup, redirigir al dashboard
    if (expert?.complete_setup) redirect('/expert');

    const expertName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Experto';

    // Evaluar estado de cada paso
    const hasProfile = !!(expert?.title?.trim() && expert?.bio && expert.bio.length >= 50);
    const hasService = (servicesCount ?? 0) > 0;
    const hasAvailability = (availabilityCount ?? 0) > 0;

    const steps = [
        {
            id: 1,
            title: 'Completa tu perfil profesional',
            description: 'Agrega tu título, biografía, zona horaria e idiomas para generar confianza.',
            completed: hasProfile,
            href: '/expert/profile',
            cta: 'Completar perfil',
        },
        {
            id: 2,
            title: 'Crea tu primer servicio',
            description: 'Define qué ofreces, el precio y la duración de tus sesiones.',
            completed: hasService,
            href: '/expert/services/new',
            cta: 'Crear servicio',
        },
        {
            id: 3,
            title: 'Configura tu disponibilidad',
            description: 'Establece los días y horarios en los que puedes atender clientes.',
            completed: hasAvailability,
            href: '/expert/schedule',
            cta: 'Configurar horario',
        },
    ];

    return (
        <OnboardingClient
            steps={steps}
            expertName={expertName}
        />
    );
}
