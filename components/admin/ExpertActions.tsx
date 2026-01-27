'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Ban, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { toggleExpertVerification, deleteExpert } from '@/app/admin/actions';

interface ExpertActionsProps {
    expertId: string;
    isVerified: boolean;
}

export function ExpertActions({ expertId, isVerified }: ExpertActionsProps) {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!confirm(`¿Estás seguro de que quieres ${isVerified ? 'suspender' : 'activar'} a este experto?`)) return;

        setLoading(true);
        const res = await toggleExpertVerification(expertId, isVerified);
        setLoading(false);

        if (!res.success) {
            alert('Error: ' + res.error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar a este experto? Esta acción no se puede deshacer y el usuario pasará a ser un cliente normal.')) return;

        setLoading(true);
        const res = await deleteExpert(expertId);
        setLoading(false);

        if (!res.success) {
            alert('Error: ' + res.error);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Link href={`/admin/experts/${expertId}`}>
                <Button
                    variant="ghost"
                    size="sm"
                    title="Ver Dashboard"
                >
                    <Eye size={16} />
                </Button>
            </Link>

            <Link href={`/admin/experts/${expertId}/edit`}>
                <Button variant="ghost" size="sm" title="Editar">
                    <Edit2 size={16} />
                </Button>
            </Link>

            <Button
                variant="ghost"
                size="sm"
                style={{ color: isVerified ? 'rgb(var(--warning))' : 'rgb(var(--success))' }}
                title={isVerified ? "Suspender" : "Activar"}
                onClick={handleToggle}
                disabled={loading}
            >
                {isVerified ? <Ban size={16} /> : <CheckCircle size={16} />}
            </Button>

            <Button
                variant="ghost"
                size="sm"
                style={{ color: 'rgb(var(--error))' }}
                title="Eliminar"
                onClick={handleDelete}
                disabled={loading}
            >
                <Trash2 size={16} />
            </Button>
        </div>
    );
}
