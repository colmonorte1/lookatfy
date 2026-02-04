'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input/Input';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [verified, setVerified] = useState(searchParams.get('verified') || 'all');

    // Debounce search with 500ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Apply filters immediately when verified changes
    useEffect(() => {
        applyFilters();
    }, [verified]);

    const applyFilters = () => {
        const params = new URLSearchParams();

        if (search) {
            params.set('search', search);
        }

        if (verified && verified !== 'all') {
            params.set('verified', verified);
        }

        const queryString = params.toString();
        router.push(`/admin/experts${queryString ? '?' + queryString : ''}`);
    };

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
        }}>
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '250px' }}>
                <Input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search size={18} />}
                />
            </div>

            {/* Verified Filter */}
            <div style={{ minWidth: '200px' }}>
                <select
                    value={verified}
                    onChange={(e) => setVerified(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--surface))',
                        color: 'rgb(var(--text-main))',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">Todos los estados</option>
                    <option value="verified">Verificados</option>
                    <option value="pending">Pendientes</option>
                </select>
            </div>
        </div>
    );
}
