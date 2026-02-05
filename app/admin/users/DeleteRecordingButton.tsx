'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { deleteRecording } from './actions';

interface DeleteRecordingButtonProps {
    recordingId: string;
    userId: string;
}

export default function DeleteRecordingButton({ recordingId, userId }: DeleteRecordingButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta grabación? Esta acción no se puede deshacer.')) {
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteRecording(recordingId, userId);

            if (!result.success) {
                alert(result.error || 'Error al eliminar la grabación');
            }
        } catch (error) {
            console.error('Error deleting recording:', error);
            alert('Error al eliminar la grabación');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
        >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </Button>
    );
}
