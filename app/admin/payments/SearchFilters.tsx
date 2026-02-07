'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Search, X, Filter, Calendar } from 'lucide-react';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [dateRange, setDateRange] = useState(searchParams.get('range') || 'all');
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
        if (dateRange && dateRange !== 'all') params.set('range', dateRange);

        const query = params.toString();
        router.push(`/admin/payments${query ? '?' + query : ''}`);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setDateRange('all');
        router.push('/admin/payments');
    };

    const hasActiveFilters = search ||
        (status && status !== 'all') ||
        (dateRange && dateRange !== 'all');

    const activeFilterCount = [
        search,
        status !== 'all',
        dateRange !== 'all'
    ].filter(Boolean).length;

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgb(var(--text-muted))'
                    }} />
                    <input
                        type="text"
                        placeholder="Buscar por ID, usuario o experto..."
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
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                    <option value="disputed">En disputa</option>
                </select>

                <select
                    value={dateRange}
                    onChange={(e) => {
                        setDateRange(e.target.value);
                        setTimeout(() => applyFilters(), 100);
                    }}
                    aria-label="Filtrar por fecha"
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
                    <option value="all">Todo el tiempo</option>
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                    <option value="365">Último año</option>
                </select>

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
        </div>
    );
}
