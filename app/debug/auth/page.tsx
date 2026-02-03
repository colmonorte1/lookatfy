import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DebugAuthPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>🔍 Debug de Autenticación</h1>
                <div style={{
                    background: 'rgba(var(--warning), 0.1)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--warning))'
                }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>❌ No hay sesión activa</h2>
                    <p style={{ marginBottom: '1rem' }}>No estás autenticado. Por favor, inicia sesión primero.</p>
                    <a href="/login" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>
                        → Ir a Login
                    </a>
                </div>
            </div>
        );
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>🔍 Debug de Autenticación</h1>

            {/* User Auth Info */}
            <div style={{
                background: 'rgb(var(--surface))',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                marginBottom: '1.5rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'rgb(var(--primary))' }}>
                    👤 Información de Autenticación (Supabase Auth)
                </h2>
                <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✅ Sí' : '❌ No'}</p>
                    <p><strong>Created At:</strong> {new Date(user.created_at || '').toLocaleString('es-ES')}</p>
                    <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : 'N/A'}</p>
                    <p><strong>Role (metadata):</strong> {user.user_metadata?.role || 'N/A'}</p>
                </div>
            </div>

            {/* Profile Info */}
            <div style={{
                background: 'rgb(var(--surface))',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                marginBottom: '1.5rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'rgb(var(--primary))' }}>
                    📋 Información de Perfil (Tabla profiles)
                </h2>
                {profileError ? (
                    <div style={{ background: 'rgba(var(--error), 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ color: 'rgb(var(--error))' }}>❌ Error al obtener perfil: {profileError.message}</p>
                    </div>
                ) : profile ? (
                    <div style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        <p><strong>ID:</strong> {profile.id}</p>
                        <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
                        <p><strong>Nombre:</strong> {profile.full_name || 'N/A'}</p>
                        <p>
                            <strong>Rol:</strong>{' '}
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                background: profile.role === 'admin' ? 'rgba(var(--primary), 0.2)' :
                                           profile.role === 'expert' ? 'rgba(var(--success), 0.2)' :
                                           'rgba(var(--text-muted), 0.2)',
                                color: profile.role === 'admin' ? 'rgb(var(--primary))' :
                                       profile.role === 'expert' ? 'rgb(var(--success))' :
                                       'rgb(var(--text-main))',
                                fontWeight: 600
                            }}>
                                {profile.role || 'null'}
                            </span>
                        </p>
                        <p><strong>Estado:</strong> {profile.status || 'N/A'}</p>
                        <p><strong>Ciudad:</strong> {profile.city || 'N/A'}</p>
                        <p><strong>País:</strong> {profile.country || 'N/A'}</p>
                        {profile.updated_at && (
                            <p><strong>Actualizado:</strong> {new Date(profile.updated_at).toLocaleString('es-ES')}</p>
                        )}
                        {profile.deleted_at && (
                            <p style={{ color: 'rgb(var(--danger))' }}>
                                <strong>⚠️ Eliminado:</strong> {new Date(profile.deleted_at).toLocaleString('es-ES')}
                            </p>
                        )}
                    </div>
                ) : (
                    <p style={{ color: 'rgb(var(--text-muted))' }}>No se encontró información de perfil</p>
                )}
            </div>

            {/* Redirection Logic */}
            <div style={{
                background: profile?.role === 'admin' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${profile?.role === 'admin' ? 'rgb(var(--success))' : 'rgb(var(--warning))'}`,
                marginBottom: '1.5rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>🎯 Lógica de Redirección</h2>
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>
                        <strong>Rol detectado:</strong> {profile?.role || user.user_metadata?.role || 'client'}
                    </p>
                    <p style={{ marginBottom: '0.5rem' }}>
                        <strong>Debería redirigir a:</strong>{' '}
                        {profile?.role === 'admin' ? '/admin' :
                         profile?.role === 'expert' ? '/expert' :
                         '/user'}
                    </p>
                </div>

                {profile?.role !== 'admin' && (
                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '1rem'
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'rgb(var(--warning))' }}>
                            ⚠️ Tu cuenta NO tiene rol de administrador
                        </h3>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'rgb(var(--text-secondary))' }}>
                            Para acceder al panel de administrador, necesitas que tu rol sea 'admin'.
                        </p>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            Solución:
                        </h4>
                        <ol style={{ fontSize: '0.875rem', paddingLeft: '1.5rem', color: 'rgb(var(--text-secondary))' }}>
                            <li>Ve a Supabase Dashboard → SQL Editor</li>
                            <li>Ejecuta este comando:
                                <pre style={{
                                    background: 'rgb(var(--surface))',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: '0.5rem',
                                    overflow: 'auto'
                                }}>
                                    {`UPDATE profiles SET role = 'admin' WHERE email = '${user.email}';`}
                                </pre>
                            </li>
                            <li>Cierra sesión completamente (cierra todas las pestañas)</li>
                            <li>Vuelve a iniciar sesión</li>
                        </ol>
                    </div>
                )}

                {profile?.role === 'admin' && (
                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '1rem'
                    }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'rgb(var(--success))' }}>
                            ✅ Tu cuenta tiene rol de administrador
                        </h3>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'rgb(var(--text-secondary))' }}>
                            Deberías poder acceder al panel de administrador.
                        </p>
                        <a
                            href="/admin"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                background: 'rgb(var(--primary))',
                                color: 'white',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Ir al Panel de Administrador →
                        </a>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <a href="/" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>← Volver al inicio</a>
                <span style={{ color: 'rgb(var(--border))' }}>|</span>
                <a href="/login" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>Cerrar sesión</a>
            </div>
        </div>
    );
}
