
import { createClient } from '@/utils/supabase/server';
import { Star, MessageSquare, User, CheckCircle } from 'lucide-react';

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const currentTab = tab || 'users_rating_experts'; // 'users_rating_experts' or 'experts_rating_users'
    const supabase = await createClient();

    // Determine filter based on tab
    // If 'users_rating_experts': We want reviews where subject is an expert (role = 'expert')
    // If 'experts_rating_users': We want reviews where subject is a client (role = 'client')

    // We need to join subject!subject_id to filter by role

    const targetRole = currentTab === 'users_rating_experts' ? 'expert' : 'client';

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            *,
            reviewer:profiles!reviewer_id ( full_name, role, email ),
            subject:profiles!subject_id ( full_name, role, email ),
            booking:bookings!booking_id (
                service:services ( title )
            )
        `)
        .order('created_at', { ascending: false });
    // Note: Filtering by joined column usually requires !inner join or client side filter if RLS allows
    // .eq('subject.role', targetRole) // Supabase JS doesn't support dot notation for filtering joined columns easily without inner join

    // Let's do client-side filtering for simplicity if volume is low, or Inner Join.
    // Inner join syntax: subject:profiles!subject_id!inner(role)

    const { data: filteredReviewsRaw } = await supabase
        .from('reviews')
        .select(`
            *,
            reviewer:profiles!reviewer_id ( full_name, role, email ),
            subject:profiles!subject_id!inner ( full_name, role, email ),
            booking:bookings!booking_id (
                service:services ( title )
            )
        `)
        .eq('subject.role', targetRole)
        .order('created_at', { ascending: false });

    // If syntax fails, I will fallback to fetching all and filtering in JS
    // The explicit inner join string syntax above is tricky in some versions.
    // Let's fetch all and filter JS for safety in this environment.

    type ReviewRow = {
        id: string;
        created_at: string;
        rating: number;
        comment?: string | null;
        reviewer?: { full_name?: string | null; role?: string | null; email?: string | null } | null;
        subject?: { full_name?: string | null; role?: string | null; email?: string | null } | null;
        booking?: { service?: { title?: string | null } | null } | null;
    };
    const allReviews: ReviewRow[] = (reviews || []) as ReviewRow[];
    const filteredReviews: ReviewRow[] = allReviews.filter((r) => r.subject?.role === targetRole);

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Reseñas y Calificaciones</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgb(var(--border))', marginBottom: '2rem' }}>
                <a
                    href="/admin/reviews?tab=users_rating_experts"
                    style={{
                        padding: '1rem',
                        borderBottom: currentTab === 'users_rating_experts' ? '2px solid rgb(var(--primary))' : 'none',
                        fontWeight: currentTab === 'users_rating_experts' ? 600 : 400,
                        color: currentTab === 'users_rating_experts' ? 'rgb(var(--primary))' : 'rgb(var(--text-secondary))',
                        cursor: 'pointer'
                    }}
                >
                    Usuarios calificando Expertos
                </a>
                <a
                    href="/admin/reviews?tab=experts_rating_users"
                    style={{
                        padding: '1rem',
                        borderBottom: currentTab === 'experts_rating_users' ? '2px solid rgb(var(--primary))' : 'none',
                        fontWeight: currentTab === 'experts_rating_users' ? 600 : 400,
                        color: currentTab === 'experts_rating_users' ? 'rgb(var(--primary))' : 'rgb(var(--text-secondary))',
                        cursor: 'pointer'
                    }}
                >
                    Expertos calificando Usuarios
                </a>
            </div>

            <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', color: 'rgb(var(--text-secondary))' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Fecha</th>
                            <th style={{ padding: '1rem' }}>Evaluador</th>
                            <th style={{ padding: '1rem' }}>Evaluado</th>
                            <th style={{ padding: '1rem' }}>Calif.</th>
                            <th style={{ padding: '1rem' }}>Comentario</th>
                            <th style={{ padding: '1rem' }}>Servicio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReviews.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                    No hay reseñas en esta categoría.
                                </td>
                            </tr>
                        ) : (
                            filteredReviews.map((review) => (
                                <tr key={review.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{review.reviewer?.full_name || 'Anónimo'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{review.reviewer?.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500 }}>{review.subject?.full_name || 'Desconocido'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{review.subject?.email}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#FFD700', fontWeight: 600 }}>
                                            <Star size={16} fill="#FFD700" /> {review.rating}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <MessageSquare size={16} style={{ flexShrink: 0, marginTop: '0.2rem', color: 'rgb(var(--text-muted))' }} />
                                            <span style={{ color: 'rgb(var(--text-secondary))' }}>{review.comment || 'Sin comentario'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {review.booking?.service?.title || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
