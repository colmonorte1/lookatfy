'use client';

import { AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import styles from './ProfileCompletionAlert.module.css';

interface ProfileCompletionAlertProps {
  percentage: number;
  missingFields: string[];
  profileUrl: string;
  userType: 'user' | 'expert';
}

export default function ProfileCompletionAlert({
  percentage,
  missingFields,
  profileUrl,
  userType
}: ProfileCompletionAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if profile is complete or user dismissed it
  if (percentage === 100 || isDismissed) {
    return null;
  }

  const isLowCompletion = percentage < 50;
  const isMediumCompletion = percentage >= 50 && percentage < 80;

  // Determine colors based on status
  // We use CSS variables directly for consistency with the theme
  const getStatusColor = () => {
    if (isLowCompletion) return 'rgb(var(--error))';
    if (isMediumCompletion) return 'rgb(var(--warning))';
    return 'rgb(var(--primary))';
  };

  const statusColor = getStatusColor();

  // Create background with opacity
  const statusBg = isLowCompletion
    ? 'rgba(var(--error), 0.1)'
    : isMediumCompletion
      ? 'rgba(var(--warning), 0.1)'
      : 'rgba(var(--primary), 0.1)';

  return (
    <div className={styles.container}>
      {/* Close button */}
      <button
        onClick={() => setIsDismissed(true)}
        className={styles.closeButton}
        title="Cerrar aviso"
      >
        <X size={18} />
      </button>

      {/* Icon */}
      <div
        className={styles.iconWrapper}
        style={{
          background: statusBg,
          color: statusColor
        }}
      >
        {percentage === 100 ? (
          <CheckCircle size={28} />
        ) : (
          <AlertCircle size={28} />
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>
          {percentage === 100
            ? '¡Perfil completo!'
            : userType === 'expert'
              ? 'Completa tu perfil de experto'
              : 'Completa tu perfil'}
        </h3>

        <p className={styles.description}>
          {percentage === 100
            ? 'Tu perfil está completo y listo para que otros usuarios lo vean.'
            : userType === 'expert'
              ? 'Un perfil completo aumenta tu visibilidad y genera más confianza con los clientes potenciales.'
              : 'Completa tu información personal para mejorar tu experiencia en la plataforma.'}
        </p>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              Progreso de completitud
            </span>
            <span
              className={styles.progressValue}
              style={{ color: statusColor }}
            >
              {percentage}%
            </span>
          </div>

          <div className={styles.track}>
            <div
              className={styles.bar}
              style={{
                width: `${percentage}%`,
                background: statusColor
              }}
            />
          </div>
        </div>

        {/* Missing Fields */}
        {missingFields.length > 0 && (
          <div className={styles.missingFields}>
            <p className={styles.missingLabel}>
              Campos sugeridos:
            </p>
            <div className={styles.fieldsList}>
              {missingFields.slice(0, 4).map((field, index) => (
                <span key={index} className={styles.chip}>
                  {field}
                </span>
              ))}
              {missingFields.length > 4 && (
                <span className={styles.moreChip}>
                  +{missingFields.length - 4} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className={styles.actions}>
          <Link href={profileUrl}>
            <Button
              variant={isLowCompletion ? 'primary' : 'default'}  // Use default (usually primary in many systems) or primary
              size="sm"
            >
              {percentage === 100 ? 'Ver mi perfil' : 'Completar ahora'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
