"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Star, Video } from 'lucide-react';
import { Expert } from '@/lib/data/experts';
import styles from './ExpertCard.module.css';

interface ExpertCardProps {
    expert: Expert;
}

export const ExpertCard = ({ expert }: ExpertCardProps) => {
    return (
        <Link href={`/experts/${expert.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={expert.image}
                    alt={expert.name}
                    width={400}
                    height={400}
                    className={styles.image}
                />
                {expert.isOnline && (
                    <div className={styles.statusBadge}>
                        <span className={styles.onlineDot} />
                        Disponible
                    </div>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h3 className={styles.name}>{expert.name}</h3>
                    <div className={styles.rating}>
                        <Star size={14} fill="currentColor" stroke="none" className={styles.starIcon} />
                        <span>{expert.rating}</span>
                        <span className={styles.reviews}>({expert.reviews})</span>
                    </div>
                </div>

                <p className={styles.title}>{expert.title}</p>

                <div className={styles.tags}>
                    {expert.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                </div>

                {Array.isArray(expert.languages) && expert.languages.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <div className={styles.tags} aria-label="Idiomas">
                            {expert.languages.slice(0, 4).map((l, idx) => (
                                <span key={`${l.name}-${idx}`} className={styles.tag}>{l.name} · {l.level}</span>
                            ))}
                        </div>
                    </div>
                )}

                {Array.isArray(expert.skills) && expert.skills.length > 0 && (
                    <div style={{ marginTop: '0.25rem' }}>
                        <div className={styles.tags} aria-label="Skills">
                            {expert.skills.slice(0, 4).map((s, idx) => (
                                <span key={`${s.name}-${idx}`} className={styles.tag}>{s.name} · {s.level}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.footer}>
                    <div className={styles.price}>
                        <span className={styles.amount}>${expert.price}</span>
                        <span className={styles.unit}>/ hora</span>
                    </div>

                    <div className={styles.action}>
                        <Video size={18} />
                    </div>
                </div>
            </div>
        </Link>
    );
};
