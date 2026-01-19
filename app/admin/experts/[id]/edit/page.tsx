import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ProfileForm from '@/app/expert/profile/ProfileForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AdminEditExpertPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Expert and Profile
    const { data: expert, error } = await supabase
        .from('experts')
        .select(`
            *,
            profiles (
                id,
                full_name,
                first_name,
                last_name,
                email,
                avatar_url,
                role
            )
        `)
        .eq('id', id)
        .single();

    if (error || !expert) {
        notFound();
    }

    const profile = expert.profiles;

    // Construct the user object expected by ProfileForm
    // ProfileForm expects: user.id, user.avatar_url, user.first_name, user.last_name, user.email
    // It mocks auth.user structure somewhat
    const userProp = {
        id: profile.id,
        email: profile.email,
        avatar_url: profile.avatar_url,
        first_name: profile.first_name,
        last_name: profile.last_name,
        user_metadata: {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/experts" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al listado
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Editar Experto: {profile.full_name}</h1>
            </div>

            <ProfileForm user={userProp} expert={expert} />
        </div>
    );
}
