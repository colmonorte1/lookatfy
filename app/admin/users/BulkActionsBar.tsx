'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Ban, CheckCircle, Trash2, Loader2, X } from 'lucide-react';
import { bulkUserAction } from './actions';

interface BulkActionsBarProps {
    selectedUsers: string[];
    onClearSelection: () => void;
    onActionComplete: () => void;
}

export default function BulkActionsBar({
    selectedUsers,
    onClearSelection,
    onActionComplete
}: BulkActionsBarProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentAction, setCurrentAction] = useState<string>('');

    if (selectedUsers.length === 0) return null;

    const handleBulkAction = async (action: 'suspend' | 'activate' | 'delete') => {
        const actionNames = {
            suspend: 'suspender',
            activate: 'activar',
            delete: 'eliminar'
        };

        const confirmMessage = `¿Estás seguro de que deseas ${actionNames[action]} ${selectedUsers.length} usuario(s)?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        setIsProcessing(true);
        setCurrentAction(action);

        try {
            const result = await bulkUserAction(selectedUsers, action);

            if (!result.success) {
                alert(result.error || 'Error al procesar la acción');
            } else {
                alert(`Acción completada: ${result.processed} usuario(s) procesado(s)`);
                onClearSelection();
                onActionComplete();
                // Reload to show updated data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error in bulk action:', error);
            alert('Error inesperado al procesar la acción');
        } finally {
            setIsProcessing(false);
            setCurrentAction('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgb(var(--surface))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '400px'
        }}>
            <div style={{ flex: 1 }}>
                <span style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'rgb(var(--text-main))'
                }}>
                    {selectedUsers.length} usuario(s) seleccionado(s)
                </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    disabled={isProcessing}
                    style={{ gap: '0.5rem', color: 'rgb(var(--success))' }}
                    title="Activar seleccionados"
                >
                    {isProcessing && currentAction === 'activate' ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <CheckCircle size={16} />
                    )}
                    Activar
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('suspend')}
                    disabled={isProcessing}
                    style={{ gap: '0.5rem', color: 'rgb(var(--warning))' }}
                    title="Suspender seleccionados"
                >
                    {isProcessing && currentAction === 'suspend' ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Ban size={16} />
                    )}
                    Suspender
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    disabled={isProcessing}
                    style={{ gap: '0.5rem', color: 'rgb(var(--danger))' }}
                    title="Eliminar seleccionados"
                >
                    {isProcessing && currentAction === 'delete' ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Trash2 size={16} />
                    )}
                    Eliminar
                </Button>

                <div style={{
                    width: '1px',
                    height: '24px',
                    background: 'rgb(var(--border))',
                    margin: '0 0.25rem'
                }} />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    disabled={isProcessing}
                    title="Cancelar selección"
                >
                    <X size={16} />
                </Button>
            </div>
        </div>
    );
}
