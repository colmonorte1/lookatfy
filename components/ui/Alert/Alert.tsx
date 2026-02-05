import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
    type: 'error' | 'success' | 'warning' | 'info';
    message: string;
    title?: string;
}

export default function Alert({ type, message, title }: AlertProps) {
    const icons = {
        error: AlertCircle,
        success: CheckCircle,
        warning: AlertTriangle,
        info: Info
    };

    const colors = {
        error: 'var(--error)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        info: 'var(--primary)'
    };

    const Icon = icons[type];
    const color = colors[type];

    return (
        <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: `rgba(${color}, 0.1)`,
            border: `1px solid rgb(${color})`,
            color: `rgb(${color})`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
        }}>
            <Icon size={20} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div style={{ flex: 1 }}>
                {title && (
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{title}</div>
                )}
                <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{message}</div>
            </div>
        </div>
    );
}
