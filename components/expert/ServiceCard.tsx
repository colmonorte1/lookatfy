"use client";

import { Button } from '@/components/ui/Button/Button';
import { Edit2, Trash2, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Service {
    id: string;
    title: string;
    price: number;
    currency?: string;
    duration?: number;
    location?: string;
    description?: string;
    image_url?: string;
    type?: string;
    includes?: string[];
    not_includes?: string[];
    status?: string;
    category?: string;
}

interface ServiceCardProps {
    service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
    const router = useRouter();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const formatAmount = (cur: string | undefined, amount: number) => {
        const c = cur || 'USD'
        if (c === 'COP') {
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(amount));
        }
        if (c === 'EUR') {
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const handleToggleStatus = async () => {
        setIsTogglingStatus(true);
        try {
            const supabase = createClient();
            const currentStatus = service.status || 'active';
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

            const { error } = await supabase
                .from('services')
                .update({ status: newStatus })
                .eq('id', service.id);

            if (error) throw error;

            router.refresh();
        } catch (error) {
            console.error("Error toggling service status:", error);
            alert("No se pudo cambiar el estado del servicio.");
        } finally {
            setIsTogglingStatus(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const supabase = createClient();
            // Soft delete: update status to 'deleted'
            const { error } = await supabase
                .from('services')
                .update({ status: 'deleted' })
                .eq('id', service.id);

            if (error) throw error;

            setIsDeleteModalOpen(false);
            router.refresh(); // Refresh server components to remove the item from list
        } catch (error) {
            console.error("Error deleting service:", error);
            alert("No se pudo eliminar el servicio.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!confirm(`¿Duplicar "${service.title}"? Se creará una copia exacta del servicio.`)) return;

        setIsDuplicating(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert("Debes iniciar sesión para duplicar servicios.");
                return;
            }

            // Create a copy of the service with a new title
            const duplicatedService = {
                expert_id: user.id,
                title: `${service.title} (Copia)`,
                price: service.price,
                currency: service.currency,
                duration: service.duration,
                location: service.location,
                description: service.description,
                image_url: service.image_url,
                type: service.type,
                includes: service.includes,
                not_includes: service.not_includes,
                status: 'inactive', // Start as inactive so expert can review before activating
                category: service.category
            };

            const { error } = await supabase
                .from('services')
                .insert([duplicatedService]);

            if (error) throw error;

            alert("Servicio duplicado exitosamente. Se creó como 'Inactivo' para que puedas revisarlo.");
            router.refresh();
        } catch (error) {
            console.error("Error duplicating service:", error);
            alert("No se pudo duplicar el servicio.");
        } finally {
            setIsDuplicating(false);
        }
    };

    return (
        <>
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
            }}
                className="hover:shadow-lg hover:-translate-y-1"
            >
                {/* Image Section */}
                <div style={{ position: 'relative', height: '180px', width: '100%', background: 'rgb(var(--surface-hover))' }}>
                    {service.image_url ? (
                        <Image
                            src={service.image_url}
                            alt={service.title}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--text-muted))' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 200, opacity: 0.2 }}>IMG</span>
                        </div>
                    )}
                    <span style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        color: 'white', fontSize: '0.75rem', fontWeight: 600,
                        padding: '0.25rem 0.75rem', borderRadius: '1rem',
                        textTransform: 'capitalize'
                    }}>
                        {service.type || 'General'}
                    </span>
                    {/* Status Badge */}
                    <span style={{
                        position: 'absolute', top: '1rem', left: '1rem',
                        background: (service.status === 'inactive') ? 'rgba(var(--warning), 0.9)' : 'rgba(var(--success), 0.9)',
                        backdropFilter: 'blur(4px)',
                        color: 'white', fontSize: '0.7rem', fontWeight: 600,
                        padding: '0.25rem 0.6rem', borderRadius: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {(service.status === 'inactive') ? 'Inactivo' : 'Activo'}
                    </span>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4, margin: 0, paddingRight: '0.5rem' }}>
                            {service.title}
                        </h3>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'rgb(var(--primary))', whiteSpace: 'nowrap' }}>
                            {formatAmount(service.currency, service.price)}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={14} />
                            {service.duration ? `${service.duration} min` : 'N/A'}
                        </div>
                        {(service.location) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={14} />
                                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {service.location}
                                </span>
                            </div>
                        )}
                    </div>

                    <p style={{
                        fontSize: '0.875rem', color: 'rgb(var(--text-secondary))',
                        lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        marginBottom: '1rem'
                    }}>
                        {service.description || 'Sin descripción.'}
                    </p>

                    {/* Includes / Not Includes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                        {service.includes && service.includes.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <CheckCircle size={14} className="text-success" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ color: 'rgb(var(--text-secondary))' }}>
                                    Incluye: {service.includes.slice(0, 2).join(', ')}
                                    {service.includes.length > 2 && '...'}
                                </span>
                            </div>
                        )}
                        {service.not_includes && service.not_includes.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={14} className="text-muted" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ color: 'rgb(var(--text-muted))' }}>
                                    No incluye: {service.not_includes.slice(0, 2).join(', ')}
                                    {service.not_includes.length > 2 && '...'}
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Status Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgb(var(--background))', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {(service.status === 'inactive') ? 'Servicio Inactivo' : 'Servicio Activo'}
                            </span>
                            <button
                                onClick={handleToggleStatus}
                                disabled={isTogglingStatus}
                                style={{
                                    width: '44px', height: '24px',
                                    background: (service.status === 'inactive') ? 'rgb(var(--text-muted))' : 'rgb(var(--success))',
                                    borderRadius: '12px', position: 'relative', cursor: 'pointer',
                                    transition: 'background 0.2s', border: 'none', flexShrink: 0,
                                    opacity: isTogglingStatus ? 0.6 : 1
                                }}
                                title={(service.status === 'inactive') ? 'Activar servicio' : 'Desactivar servicio'}
                            >
                                <div style={{
                                    width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '2px',
                                    left: (service.status === 'inactive') ? '2px' : '22px',
                                    transition: 'left 0.2s'
                                }} />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link href={`/expert/services/${service.id}/edit`} style={{ flex: 1 }}>
                                <Button variant="outline" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Edit2 size={16} /> Editar
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                style={{ padding: '0 0.75rem' }}
                                onClick={handleDuplicate}
                                disabled={isDuplicating}
                                title="Duplicar servicio"
                            >
                                <Copy size={18} />
                            </Button>
                            <Button
                                variant="ghost"
                                style={{ color: 'rgb(var(--error))', padding: '0 0.75rem' }}
                                onClick={() => setIsDeleteModalOpen(true)}
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isDeleteModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '50%',
                                background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>¿Eliminar servicio?</h3>
                                <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                    Estás a punto de eliminar <strong>&ldquo;{service.title}&rdquo;</strong>.
                                    Esta acción hará que el servicio deje de ser visible para los clientes.
                                    <br /><br />
                                    <em style={{ fontSize: '0.85rem' }}>(Nota: Los datos no se borrarán de la base de datos, solo se archivarán)</em>
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button
                                variant="outline"
                                style={{ flex: 1 }}
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                style={{ flex: 1, background: 'rgb(var(--error))', color: 'white', borderColor: 'rgb(var(--error))' }}
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
