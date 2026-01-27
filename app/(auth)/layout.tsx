import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgb(var(--background))',
            padding: '2rem 1rem'
        }}>
            <div className="container" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'rgb(var(--text-secondary))',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}>
                        <ArrowLeft size={16} />
                        Volver al inicio
                    </Link>
                </div>

                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingBottom: '4rem'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
