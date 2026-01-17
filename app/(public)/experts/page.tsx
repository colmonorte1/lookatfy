import { EXPERTS } from '@/lib/data/experts';
import { ExpertCard } from '@/components/marketplace/ExpertCard';
import { FilterBar } from '@/components/marketplace/FilterBar';

export default function ExpertsPage() {
    return (
        <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Encuentra tu Experto</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', maxWidth: '600px', margin: '0 auto' }}>
                    Conecta al instante mediante videollamada con profesionales verificados listos para ayudarte.
                </p>
            </header>

            <FilterBar />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {EXPERTS.map((expert) => (
                    <ExpertCard key={expert.id} expert={expert} />
                ))}
            </div>
        </main>
    );
}
