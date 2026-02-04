'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Search, X, Filter } from 'lucide-react';

interface SearchFiltersProps {
    categories: string[];
}

export default function SearchFilters({ categories }: SearchFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [category, setCategory] = useState(searchParams.get('category') || 'all');
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const applyFilters = () => {
        const params = new URLSearchParams();

        if (search) params.set('search', search);
        if (status && status !== 'all') params.set('status', status);
        if (category && category !== 'all') params.set('category', category);
        if (type && type !== 'all') params.set('type', type);

        const query = params.toString();
        router.push(`/admin/services${query ? '?' + query : ''}`);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setCategory('all');
        setType('all');
        router.push('/admin/services');
    };

    const hasActiveFilters = search ||
        (status && status !== 'all') ||
        (category && category !== 'all') ||
        (type && type !== 'all');

    const activeFilterCount = [
        search,
        status !== 'all',
        category !== 'all',
        type !== 'all'
    ].filter(Boolean).length;

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgb(var(--text-muted))'
                    }} />
                    <input
                        type="text"
                        placeholder="Buscar por título o experto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 1rem 0.625rem 2.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            background: 'rgb(var(--surface))',
                            fontSize: '0.875rem',
                            color: 'rgb(var(--text-main))'
                        }}
                    />
                </div>

                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        setTimeout(() => applyFilters(), 100);
                    }}
                    aria-label="Filtrar por estado"
                    style={{
                        padding: '0.625rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--surface))',
                        fontSize: '0.875rem',
                        color: 'rgb(var(--text-main))',
                        minWidth: '150px'
                    }}
                >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activo</option>
                    <option value="review">En Revisión</option>
                    <option value="draft">Borrador</option>
                </select>

                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ gap: '0.5rem' }}
                >
                    <Filter size={16} />
                    Más filtros
                    {activeFilterCount > 1 && (
                        <span style={{
                            background: 'rgb(var(--primary))',
                            color: 'white',
                            borderRadius: '50%',
                            width: '1.25rem',
                            height: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            {activeFilterCount}
                        </span>
                    )}
                </Button>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        onClick={clearFilters}
                        style={{ gap: '0.5rem', color: 'rgb(var(--text-muted))' }}
                    >
                        <X size={16} />
                        Limpiar
                    </Button>
                )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                                Categoría
                            </label>
                            <select
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setTimeout(() => applyFilters(), 100);
                                }}
                                aria-label="Filtrar por categoría"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--background))',
                                    fontSize: '0.875rem',
                                    color: 'rgb(var(--text-main))'
                                }}
                            >
                                <option value="all">Todas las categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                                Modalidad
                            </label>
                            <select
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    setTimeout(() => applyFilters(), 100);
                                }}
                                aria-label="Filtrar por modalidad"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--background))',
                                    fontSize: '0.875rem',
                                    color: 'rgb(var(--text-main))'
                                }}
                            >
                                <option value="all">Todas las modalidades</option>
                                <option value="Virtual">Virtual</option>
                                <option value="Presencial">Presencial</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
