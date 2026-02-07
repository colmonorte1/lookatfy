'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Search, Filter, X } from 'lucide-react';

export const SearchFilters = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'all');
    const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

    const handleApplyFilters = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (status !== 'all') params.set('status', status);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);

        router.push(`/admin/sessions?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setDateFrom('');
        setDateTo('');
        router.push('/admin/sessions');
    };

    const hasActiveFilters = search || status !== 'all' || dateFrom || dateTo;

    return (
        <div style={{
            background: 'rgb(var(--surface))',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '2rem',
            border: '1px solid rgb(var(--border))'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Filter size={20} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Filtros de Búsqueda</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Search Input */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgb(var(--text-secondary))' }}>
                        Buscar
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cliente, experto, servicio, ID..."
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border))',
                                background: 'rgb(var(--background))',
                                fontSize: '0.9rem'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        />
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'rgb(var(--text-muted))'
                            }}
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgb(var(--text-secondary))' }}>
                        Estado
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            background: 'rgb(var(--background))',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="confirmed">Confirmadas</option>
                        <option value="completed">Completadas</option>
                        <option value="cancelled">Canceladas</option>
                    </select>
                </div>

                {/* Date From */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgb(var(--text-secondary))' }}>
                        Desde
                    </label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            background: 'rgb(var(--background))',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                {/* Date To */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'rgb(var(--text-secondary))' }}>
                        Hasta
                    </label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            background: 'rgb(var(--background))',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearFilters}
                    >
                        <X size={16} /> Limpiar
                    </Button>
                )}
                <Button
                    size="sm"
                    onClick={handleApplyFilters}
                >
                    <Filter size={16} /> Aplicar Filtros
                </Button>
            </div>
        </div>
    );
};
