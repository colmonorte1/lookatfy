import { Star } from 'lucide-react';
import styles from './ReviewsList.module.css';

interface Review {
    id: string;
    author: string;
    avatar?: string;
    rating: number;
    date: string;
    comment: string;
    serviceName?: string; // Optional context
}

interface ReviewsListProps {
    reviews: Review[];
    title?: string;
}

export const ReviewsList = ({ reviews, title = "Reseñas" }: ReviewsListProps) => {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{title} <span className={styles.count}>({reviews.length})</span></h3>

            <div className={styles.grid}>
                {reviews.map((review) => (
                    <div key={review.id} className={styles.card}>
                        <div className={styles.header}>
                            <div className={styles.authorInfo}>
                                <div className={styles.avatar}>
                                    {review.avatar ? (
                                        <img src={review.avatar} alt={review.author} />
                                    ) : (
                                        <div className={styles.initial}>{review.author.charAt(0)}</div>
                                    )}
                                </div>
                                <div>
                                    <div className={styles.authorName}>{review.author}</div>
                                    <div className={styles.date}>{review.date}</div>
                                </div>
                            </div>
                            <div className={styles.rating}>
                                <Star size={16} fill="rgb(var(--warning))" className={styles.starIcon} />
                                <span>{review.rating.toFixed(1)}</span>
                            </div>
                        </div>
                        {review.serviceName && (
                            <div className={styles.serviceContext}>
                                Servicio: {review.serviceName}
                            </div>
                        )}
                        <p className={styles.comment}>"{review.comment}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
