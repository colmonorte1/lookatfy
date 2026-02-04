/**
 * Currency formatting utilities for consistent money display across the application
 */

/**
 * Formats a monetary amount according to the specified currency
 *
 * @param amount - The amount to format (can be null or undefined)
 * @param currency - The currency code (COP, EUR, USD)
 * @returns Formatted currency string or '-' if amount is invalid
 *
 * @example
 * formatAmount(1000, 'USD') // returns '$1,000.00'
 * formatAmount(150000, 'COP') // returns '$150.000'
 * formatAmount(null, 'USD') // returns '-'
 */
export function formatAmount(amount: number | null | undefined, currency: string = 'USD'): string {
    if (!amount && amount !== 0) return '-';

    if (currency === 'COP') {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(amount);
    }

    if (currency === 'EUR') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}
