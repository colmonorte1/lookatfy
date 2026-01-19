import { Navbar } from '@/components/ui/Navbar/Navbar';
import { Footer } from '@/components/ui/Footer/Footer';
import { createClient } from '@/utils/supabase/server';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile = null;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = { ...profile, email: user.email };
    }

    return (
        <>
            <Navbar user={userProfile} />
            {children}
            <Footer />
        </>
    );
}
