'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Ban, CheckCircle, Loader2 } from 'lucide-react';
import { toggleUserStatus } from './actions';

interface ToggleUserStatusButtonProps {
    userId: string;
    currentStatus: 'active' | 'suspended';
    userName?: string;
}

export default function ToggleUserStatusButton({ userId, currentStatus, userName }: ToggleUserStatusButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isSuspended = currentStatus === 'suspended';

    const handleToggle = async () => {
        const action = isSuspended ? 'activar' : 'suspender';
        const confirmMessage = `¿Estás seguro de que deseas ${action} a ${userName || 'este usuario'}?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await toggleUserStatus(userId, !isSuspended);

            if (!result.success) {
                alert(result.error || `Error al ${action} el usuario`);
            } else {
                // The page will be revalidated by the server action
                window.location.reload();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Error inesperado al cambiar el estado del usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
            style={{
                color: isSuspended ? 'rgb(var(--success))' : 'rgb(var(--warning))',
                gap: '0.25rem'
            }}
            title={isSuspended ? 'Activar usuario' : 'Suspender usuario'}
        >
            {isLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : isSuspended ? (
                <CheckCircle size={16} />
            ) : (
                <Ban size={16} />
            )}
        </Button>
    );
}
