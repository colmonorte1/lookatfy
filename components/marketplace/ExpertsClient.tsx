"use client";

import React from 'react';
import { Expert } from '@/lib/data/experts';
import { ExpertCard } from './ExpertCard';
import { FilterBar } from './FilterBar';

export default function ExpertsClient({ items }: { items: Expert[] }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [category, setCategory] = React.useState('Todas');
    const [price, setPrice] = React.useState('Todos');
    const [page, setPage] = React.useState(1);
    const pageSize = 12;

    const categories = React.useMemo(() => {
        const set = new Set<string>();
        items.forEach(i => i.tags.forEach(t => set.add(t)));
        return ['Todas', ...Array.from(set)];
    }, [items]);

    const filtered = React.useMemo(() => {
        const term = searchTerm.toLowerCase();
        return items.filter(i => {
            const matchesTerm = i.name.toLowerCase().includes(term) || i.title.toLowerCase().includes(term);
            const matchesCategory = category === 'Todas' || i.tags.includes(category);
            const matchesPrice = price === 'Todos' || (price === 'low' ? (Number(i.price) || 0) < 30 : (Number(i.price) || 0) >= 30);
            return matchesTerm && matchesCategory && matchesPrice;
        });
    }, [items, searchTerm, category, price]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    React.useEffect(() => {
        setPage(1);
    }, [searchTerm, category, price]);

    return (
        <div>
            <FilterBar
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                category={category}
                onCategoryChange={setCategory}
                price={price}
                onPriceChange={setPrice}
                categories={categories}
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                {paged.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgb(var(--text-secondary))', padding: '3rem', border: '2px dashed rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>
                        No se encontraron expertos que coincidan con tu búsqueda.
                    </div>
                )}
                {paged.map((expert) => (
                    <ExpertCard key={expert.id} expert={expert} />
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--surface))',
                        color: 'rgb(var(--text-secondary))',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                >Anterior</button>
                <span style={{ color: 'rgb(var(--text-secondary))' }}>Página {currentPage} de {totalPages}</span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--surface))',
                        color: 'rgb(var(--text-secondary))',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
                    }}
                >Siguiente</button>
            </div>
        </div>
    );
}
