import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export default function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    color = 'primary'
}: StatsCardProps) {
    const colorMap = {
        primary: 'rgb(var(--primary))',
        success: 'rgb(var(--success))',
        warning: 'rgb(var(--warning))',
        danger: 'rgb(var(--danger))',
        info: 'rgb(var(--info))'
    };

    const bgColorMap = {
        primary: 'rgba(var(--primary), 0.1)',
        success: 'rgba(var(--success), 0.1)',
        warning: 'rgba(var(--warning), 0.1)',
        danger: 'rgba(var(--danger), 0.1)',
        info: 'rgba(var(--info), 0.1)'
    };

    return (
        <div style={{
            background: 'rgb(var(--surface))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'all 0.2s ease',
            cursor: 'default'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'rgb(var(--text-secondary))',
                        marginBottom: '0.5rem',
                        fontWeight: 500
                    }}>
                        {title}
                    </p>
                    <h3 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'rgb(var(--text-main))',
                        lineHeight: 1
                    }}>
                        {value}
                    </h3>
                    {subtitle && (
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'rgb(var(--text-muted))',
                            marginTop: '0.5rem'
                        }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: bgColorMap[color],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon size={24} style={{ color: colorMap[color] }} />
                </div>
            </div>

            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: trend.isPositive ? 'rgb(var(--success))' : 'rgb(var(--danger))'
                    }}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'rgb(var(--text-muted))'
                    }}>
                        vs. mes anterior
                    </span>
                </div>
            )}
        </div>
    );
}
