'use client';

import { TrendingUp, TrendingDown, HelpCircle, Users, Video, DollarSign, LayoutDashboard, AlertTriangle, Percent, Clock, Activity, ShoppingBag, Star, Calendar, type LucideIcon } from 'lucide-react';

// Icon mapping for serialization from Server Components
const iconMap: Record<string, LucideIcon> = {
    Users,
    Video,
    DollarSign,
    LayoutDashboard,
    AlertTriangle,
    Percent,
    Clock,
    Activity,
    ShoppingBag,
    Star,
    Calendar,
    TrendingUp,
    TrendingDown,
    HelpCircle
};

interface KPICardProps {
    title: string;
    value: string | number;
    change: number;
    icon: string; // Changed to string for serialization
    color: string;
    tooltip?: string;
    threshold?: {
        value: number;
        type: 'above' | 'below' | 'equal';
        message: string;
    };
    sparkline?: number[];
}

export default function KPICard({ title, value, change, icon, color, tooltip, threshold, sparkline }: KPICardProps) {
    const Icon = iconMap[icon] || Activity;
    const changeNum = typeof change === 'number' ? change : 0;
    const isPositive = changeNum > 0;
    const isNegative = changeNum < 0;
    const changeColor = isPositive ? 'rgb(var(--success))' : isNegative ? 'rgb(var(--error))' : 'rgb(var(--text-muted))';
    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : null;

    // Check if value breaches threshold (if provided)
    const checkThreshold = () => {
        if (!threshold) return false;
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return false;
        switch (threshold.type) {
            case 'above': return numValue > threshold.value;
            case 'below': return numValue < threshold.value;
            case 'equal': return numValue === threshold.value;
            default: return false;
        }
    };
    const hasWarning = checkThreshold();

    // Generate SVG sparkline path
    const generateSparklinePath = (data: number[]) => {
        if (!data || data.length === 0) return '';
        const width = 60;
        const height = 20;
        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;

        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    return (
        <div
            style={{
                background: 'rgb(var(--surface))',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                border: hasWarning ? '2px solid rgb(var(--warning))' : '1px solid rgb(var(--border))',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: tooltip ? 'help' : 'default'
            }}
            title={tooltip}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            {hasWarning && (
                <div
                    style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'rgb(var(--warning))',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                    title={threshold?.message}
                />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        background: `rgba(var(--${color}), 0.1)`,
                        color: `rgb(var(--${color}))`
                    }}
                >
                    <Icon size={24} />
                </div>
                {changeNum !== 0 && (
                    <span
                        style={{
                            fontSize: '0.875rem',
                            color: changeColor,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        {TrendIcon && <TrendIcon size={14} />}
                        {isPositive ? '+' : ''}{changeNum.toFixed(1)}%
                    </span>
                )}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem', color: 'rgb(var(--text-main))' }}>
                {value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {title}
                    {tooltip && <HelpCircle size={12} style={{ opacity: 0.5 }} />}
                </div>
                {sparkline && sparkline.length > 0 && (
                    <svg width="60" height="20" style={{ opacity: 0.6 }}>
                        <path
                            d={generateSparklinePath(sparkline)}
                            fill="none"
                            stroke={`rgb(var(--${color}))`}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>
        </div>
    );
}
