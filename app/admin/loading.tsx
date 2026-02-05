export default function AdminDashboardLoading() {
    return (
        <div>
            <div style={{
                height: '2rem',
                width: '200px',
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                animation: 'pulse 1.5s ease-in-out infinite'
            }} />

            {/* KPI Cards Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {Array.from({ length: 11 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            background: 'rgb(var(--surface))',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1px solid rgb(var(--border))'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '0.75rem',
                                background: 'rgb(var(--background))',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                            <div style={{
                                width: '60px',
                                height: '20px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgb(var(--background))',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }} />
                        </div>
                        <div style={{
                            width: '120px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgb(var(--background))',
                            marginBottom: '0.5rem',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                        <div style={{
                            width: '150px',
                            height: '16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgb(var(--background))',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                padding: '1rem'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'rgb(var(--background))',
                                border: '1px solid rgb(var(--border))',
                                borderRadius: 'var(--radius-md)',
                                padding: '1rem',
                                height: '300px',
                                animation: 'pulse 1.5s ease-in-out infinite'
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
}
