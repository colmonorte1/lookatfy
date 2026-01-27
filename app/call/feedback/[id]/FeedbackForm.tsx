'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Star } from 'lucide-react';
import { submitReview } from '../actions';
import { useRouter } from 'next/navigation';

export function FeedbackForm({ bookingId, subjectId, redirectPath }: { bookingId: string, subjectId: string, redirectPath: string }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Por favor selecciona una calificación de estrellas.');
            return;
        }

        setLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('bookingId', bookingId);
        formData.append('subjectId', subjectId);
        formData.append('rating', rating.toString());
        formData.append('comment', comment);

        formData.append('redirectPath', redirectPath);
        const res = await submitReview(null, formData);

        if (res?.error) {
            setError(res.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.replace(redirectPath);
                router.refresh();
            }, 1500);
        }
    };

    return (
        <div style={{ textAlign: 'left' }}>
            <div style={{
                display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem'
            }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: (hoverRating || rating) >= star ? '#FFD700' : 'rgb(var(--border))',
                            transition: 'color 0.2s'
                        }}
                    >
                        <Star size={32} fill={(hoverRating || rating) >= star ? '#FFD700' : 'none'} />
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Comentario (Opcional)</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Cuéntanos qué te pareció..."
                    style={{
                        width: '100%', padding: '1rem', borderRadius: 'var(--radius)',
                        border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))',
                        minHeight: '120px', resize: 'vertical'
                    }}
                />
            </div>

            {error && (
                <div role="alert" aria-live="polite" style={{
                    background: 'rgba(var(--danger), 0.08)',
                    color: 'rgb(var(--danger))',
                    border: '1px solid rgba(var(--danger), 0.25)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontWeight: 600
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div aria-live="polite" style={{
                    background: 'rgba(var(--success), 0.1)',
                    color: 'rgb(var(--success))',
                    border: '1px solid rgba(var(--success), 0.3)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    fontWeight: 600
                }}>
                    ¡Gracias por tus comentarios!
                </div>
            )}

            <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading || success}>
                {loading ? 'Enviando...' : 'Enviar Calificación'}
            </Button>

            <button
                onClick={() => router.push(redirectPath)}
                style={{
                    display: 'block', width: '100%', marginTop: '1rem',
                    background: 'none', border: 'none', color: 'rgb(var(--text-secondary))',
                    cursor: 'pointer', textDecoration: 'underline'
                }}
            >
                Saltar por ahora
            </button>
        </div>
    );
}
