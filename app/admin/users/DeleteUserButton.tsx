'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteUser } from './actions';

interface DeleteUserButtonProps {
    userId: string;
    userName?: string;
}

export default function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        const confirmMessage = `¿Estás seguro de que deseas ELIMINAR a ${userName || 'este usuario'}?\n\nEsta acción marcará al usuario como eliminado (soft delete).`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await deleteUser(userId);

            if (!result.success) {
                alert(result.error || 'Error al eliminar el usuario');
            } else {
                alert('Usuario eliminado exitosamente');
                // Reload to show updated data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error inesperado al eliminar el usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            style={{
                color: 'rgb(var(--danger))',
                gap: '0.25rem'
            }}
            title="Eliminar usuario"
        >
            {isLoading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
                <Trash2 size={16} />
            )}
        </Button>
    );
}
