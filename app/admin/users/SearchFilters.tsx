'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Search, X, Filter } from 'lucide-react';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [role, setRole] = useState(searchParams.get('role') || 'all');
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const applyFilters = () => {
        const params = new URLSearchParams();

        if (search) params.set('search', search);
        if (role && role !== 'all') params.set('role', role);

        const query = params.toString();
        router.push(`/admin/users${query ? '?' + query : ''}`);
    };

    const clearFilters = () => {
        setSearch('');
        setRole('all');
        router.push('/admin/users');
    };

    const hasActiveFilters = search || (role && role !== 'all');

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
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 1rem 0.625rem 2.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            background: 'rgb(var(--surface))',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ gap: '0.5rem' }}
                >
                    <Filter size={16} />
                    Filtros
                    {hasActiveFilters && (
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
                            {[search, role !== 'all'].filter(Boolean).length}
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                                Rol
                            </label>
                            <select
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                    setTimeout(() => applyFilters(), 100);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--background))',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="all">Todos los roles</option>
                                <option value="client">Cliente</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
