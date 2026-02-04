"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Search, Filter, X } from 'lucide-react';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [range, setRange] = useState(searchParams.get('range') || '');
    const [reporter, setReporter] = useState(searchParams.get('reporter') || '');

    const updateURL = useCallback((params: Record<string, string>) => {
        const current = new URLSearchParams(searchParams.toString());

        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                current.set(key, value);
            } else {
                current.delete(key);
            }
        });

        // Reset to page 1 when filters change
        current.delete('page');

        router.push(`/admin/disputes?${current.toString()}`);
    }, [router, searchParams]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (searchParams.get('search') || '')) {
                updateURL({ search });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search, searchParams, updateURL]);

    const handleStatusChange = (value: string) => {
        setStatus(value);
        updateURL({ status: value });
    };

    const handleRangeChange = (value: string) => {
        setRange(value);
        updateURL({ range: value });
    };

    const handleReporterChange = (value: string) => {
        setReporter(value);
        updateURL({ reporter: value });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setRange('');
        setReporter('');
        router.push('/admin/disputes');
    };

    const hasFilters = search || status || range || reporter;

    return (
        <div style={{
            background: 'rgb(var(--surface))',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgb(var(--border))',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center'
            }}>
                {/* Search Input */}
                <div style={{
                    position: 'relative',
                    flex: '1 1 250px',
                    minWidth: '200px'
                }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'rgb(var(--text-muted))'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Buscar por razón, descripción o ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                            border: '1px solid rgb(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgb(var(--background))',
                            color: 'rgb(var(--text-main))',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} style={{ color: 'rgb(var(--text-muted))' }} />
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        style={{
                            padding: '0.625rem 0.75rem',
                            border: '1px solid rgb(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgb(var(--background))',
                            color: 'rgb(var(--text-main))',
                            fontSize: '0.875rem',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">Todos los estados</option>
                        <option value="open">Abiertas</option>
                        <option value="under_review">En revisión</option>
                        <option value="resolved_refunded">Reembolsadas</option>
                        <option value="resolved_dismissed">Desestimadas</option>
                    </select>
                </div>

                {/* Reporter Type Filter */}
                <select
                    value={reporter}
                    onChange={(e) => handleReporterChange(e.target.value)}
                    style={{
                        padding: '0.625rem 0.75rem',
                        border: '1px solid rgb(var(--border))',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgb(var(--background))',
                        color: 'rgb(var(--text-main))',
                        fontSize: '0.875rem',
                        minWidth: '140px'
                    }}
                >
                    <option value="">Reportado por</option>
                    <option value="client">Cliente</option>
                    <option value="expert">Experto</option>
                </select>

                {/* Date Range Filter */}
                <select
                    value={range}
                    onChange={(e) => handleRangeChange(e.target.value)}
                    style={{
                        padding: '0.625rem 0.75rem',
                        border: '1px solid rgb(var(--border))',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgb(var(--background))',
                        color: 'rgb(var(--text-main))',
                        fontSize: '0.875rem',
                        minWidth: '140px'
                    }}
                >
                    <option value="">Todo el tiempo</option>
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                    <option value="365">Último año</option>
                </select>

                {/* Clear Filters */}
                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        style={{ gap: '0.25rem' }}
                    >
                        <X size={16} />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    );
}
