import { Navbar } from '@/components/ui/Navbar/Navbar';
import { Footer } from '@/components/ui/Footer/Footer';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
