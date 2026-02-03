'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Plus, Search, TrendingUp, Clock, DollarSign, Filter, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ServiceCard from '@/components/expert/ServiceCard';
import { useState, useEffect } from 'react';

interface Service {
    id: string;
    title: string;
    price: number;
    duration?: number;
    location?: string;
    description?: string;
    image_url?: string;
    type?: string;
    includes?: string[];
    not_includes?: string[];
    status?: string;
    category?: string;
    currency?: string;
    created_at?: string;
}

export default function ExpertServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('recent');
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [services, searchTerm, filterStatus, filterCategory, sortBy]);

    const fetchServices = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('expert_id', user.id)
                .neq('status', 'deleted');

            if (data) {
                setServices(data as Service[]);
                // Extract unique categories
                const uniqueCategories = Array.from(new Set(data.map(s => s.category).filter(Boolean))) as string[];
                setCategories(uniqueCategories);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFiltersAndSort = () => {
        let result = [...services];

        // Apply search filter
        if (searchTerm) {
            result = result.filter(service =>
                service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            result = result.filter(service => (service.status || 'active') === filterStatus);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            result = result.filter(service => service.category === filterCategory);
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'duration-asc':
                result.sort((a, b) => (a.duration || 0) - (b.duration || 0));
                break;
            case 'duration-desc':
                result.sort((a, b) => (b.duration || 0) - (a.duration || 0));
                break;
            case 'name':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'recent':
            default:
                result.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                });
                break;
        }

        setFilteredServices(result);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterCategory('all');
        setSortBy('recent');
    };

    // Calculate KPIs
    const activeServices = services.filter(s => (s.status || 'active') === 'active');
    const inactiveServices = services.filter(s => s.status === 'inactive');
    const avgPrice = activeServices.length > 0
        ? activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length
        : 0;
    const avgDuration = activeServices.length > 0
        ? activeServices.reduce((sum, s) => sum + (s.duration || 0), 0) / activeServices.length
        : 0;

    const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || sortBy !== 'recent';

    if (isLoading) {
        return <div style={{ padding: '2rem' }}>Cargando servicios...</div>;
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Mis Servicios</h1>
                <Link href="/expert/services/new">
                    <Button style={{ gap: '0.5rem' }}>
                        <Plus size={18} />
                        Nuevo Servicio
                    </Button>
                </Link>
            </div>

            {/* KPIs Dashboard */}
            {services.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Total Servicios
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {services.length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                            {activeServices.length} activos · {inactiveServices.length} inactivos
                        </div>
                    </div>

                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Precio Promedio
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--success))' }}>
                            ${avgPrice.toFixed(0)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                            De servicios activos
                        </div>
                    </div>

                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Duración Promedio
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                            {Math.round(avgDuration)} min
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                            Por sesión
                        </div>
                    </div>

                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Categorías
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--primary))' }}>
                            {categories.length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                            Diferentes tipos
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            {services.length > 0 && (
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    marginBottom: '2rem'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Search Bar */}
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--text-muted))' }} />
                            <input
                                type="text"
                                placeholder="Buscar servicios por nombre o descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    border: '1px solid rgb(var(--border))',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgb(var(--background))',
                                    fontFamily: 'inherit',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>

                        {/* Filters Row */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    border: '1px solid rgb(var(--border))',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgb(var(--background))',
                                    fontFamily: 'inherit',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="all">Todos los estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>

                            {categories.length > 0 && (
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        border: '1px solid rgb(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgb(var(--background))',
                                        fontFamily: 'inherit',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="all">Todas las categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            )}

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    border: '1px solid rgb(var(--border))',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgb(var(--background))',
                                    fontFamily: 'inherit',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="recent">Más recientes</option>
                                <option value="name">Nombre (A-Z)</option>
                                <option value="price-asc">Precio (menor a mayor)</option>
                                <option value="price-desc">Precio (mayor a menor)</option>
                                <option value="duration-asc">Duración (menor a mayor)</option>
                                <option value="duration-desc">Duración (mayor a menor)</option>
                            </select>

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    onClick={clearFilters}
                                    style={{ gap: '0.5rem', fontSize: '0.875rem' }}
                                >
                                    <X size={16} />
                                    Limpiar filtros
                                </Button>
                            )}

                            <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                Mostrando {filteredServices.length} de {services.length} servicios
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                ))}

                {services.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'rgb(var(--text-muted))', border: '2px dashed rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>No tienes servicios activos.</p>
                        <Link href="/expert/services/new">
                            <Button size="lg" style={{ gap: '0.5rem' }}>
                                <Plus size={20} />
                                Crear mi primer servicio
                            </Button>
                        </Link>
                    </div>
                )}

                {services.length > 0 && filteredServices.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                        <p style={{ marginBottom: '1rem' }}>No se encontraron servicios con los filtros aplicados.</p>
                        <Button variant="outline" onClick={clearFilters}>
                            Limpiar filtros
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
