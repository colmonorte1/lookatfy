import React from 'react';
import styles from './Status.module.css';
import { Button } from '@/components/ui/Button/Button';

type BaseProps = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function Loading({ title = 'Cargando', description, children }: BaseProps) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <div className={styles.title}>{title}</div>
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
  );
}

type ErrorProps = BaseProps & {
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({ title = 'Ha ocurrido un error', description, onRetry, retryLabel = 'Reintentar', children }: ErrorProps) {
  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.title}>{title}</div>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.actions}>
        {onRetry && (
          <Button onClick={onRetry}>{retryLabel}</Button>
        )}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title = 'Sin resultados', description, children }: BaseProps) {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.title}>{title}</div>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.actions}>{children}</div>
    </div>
  );
}
