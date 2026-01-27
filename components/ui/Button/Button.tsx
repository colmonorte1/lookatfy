import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, fullWidth = false, children, ...props }, ref) => {

        const rootClassName = `
      ${styles.button} 
      ${styles[variant]} 
      ${styles[size]} 
      ${fullWidth ? styles.fullWidth : ''}
      ${className}
    `;

        return (
            <button
                ref={ref}
                className={rootClassName}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <span className={styles.spinner} />}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
