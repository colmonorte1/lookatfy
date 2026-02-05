'use client';

import React from 'react';

export interface BarChartData {
    label: string;
    value: number;
    color?: string;
}

interface BarChartProps {
    data: BarChartData[];
    title?: string;
    height?: number;
}

export default function BarChart({ data, title, height = 300 }: BarChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div style={{
            background: 'rgb(var(--surface))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem'
        }}>
            {title && (
                <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'rgb(var(--text-main))',
                    marginBottom: '1.5rem'
                }}>
                    {title}
                </h3>
            )}

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minHeight: `${height}px`
            }}>
                {data.map((item, index) => {
                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    const color = item.color || 'rgb(var(--primary))';

                    return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'rgb(var(--text-main))'
                                }}>
                                    {item.label}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'rgb(var(--text-main))'
                                    }}>
                                        {item.value}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'rgb(var(--text-muted))'
                                    }}>
                                        ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                                    </span>
                                </div>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '32px',
                                background: 'rgb(var(--surface-hover))',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <div style={{
                                    width: `${percentage}%`,
                                    height: '100%',
                                    background: color,
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'width 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '0.75rem',
                                    minWidth: percentage > 0 ? '40px' : '0'
                                }}>
                                    {percentage > 10 && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            color: 'white'
                                        }}>
                                            {item.value}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {data.length === 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'rgb(var(--text-muted))',
                        fontSize: '0.875rem'
                    }}>
                        No hay datos disponibles
                    </div>
                )}
            </div>
        </div>
    );
}
