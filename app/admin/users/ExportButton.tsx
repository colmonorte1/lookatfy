'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Download, Loader2 } from 'lucide-react';
import { exportUsersToCSV } from './actions';

export default function ExportButton() {
    const [isExporting, setIsExporting] = useState(false);
    const searchParams = useSearchParams();

    const handleExport = async () => {
        setIsExporting(true);

        try {
            // Get current filters from URL
            const filters = {
                search: searchParams.get('search') || undefined,
                role: searchParams.get('role') || undefined
            };

            // Call server action to get CSV data
            const result = await exportUsersToCSV(filters);

            if (!result.success || !result.data) {
                alert(result.error || 'Error al exportar los datos');
                return;
            }

            // Create a blob and download the CSV file
            const blob = new Blob(['\uFEFF' + result.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with current date
            const date = new Date().toISOString().split('T')[0];
            const filterSuffix = filters.search || filters.role ? '_filtrado' : '';
            link.download = `usuarios_lookatfy_${date}${filterSuffix}.csv`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting users:', error);
            alert('Error inesperado al exportar los datos');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            style={{ gap: '0.5rem' }}
            title="Exportar usuarios a CSV"
        >
            {isExporting ? (
                <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Exportando...
                </>
            ) : (
                <>
                    <Download size={18} />
                    Exportar CSV
                </>
            )}
        </Button>
    );
}
