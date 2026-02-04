/**
 * Phone number utilities for formatting and validation
 */

/**
 * Extracts only digits from a string, removing all non-numeric characters
 *
 * @param value - The string to process
 * @returns String containing only digits
 *
 * @example
 * onlyDigits('+57 300 123 4567') // returns '573001234567'
 * onlyDigits('CC-1234567') // returns '1234567'
 */
export function onlyDigits(value: string): string {
    return String(value || '').replace(/\D/g, '');
}

/**
 * Normalizes a Colombian phone number by ensuring it has the country code
 * - If starts with '57', returns as is
 * - If 10 digits, prepends '57'
 * - Otherwise returns as is
 *
 * @param phone - The phone number to normalize
 * @returns Normalized phone number with country code
 *
 * @example
 * normalizePhoneCOP('3001234567') // returns '573001234567'
 * normalizePhoneCOP('573001234567') // returns '573001234567'
 * normalizePhoneCOP('+57 300 123 4567') // returns '573001234567'
 */
export function normalizePhoneCOP(phone: string): string {
    const digits = onlyDigits(phone);

    if (digits.startsWith('57')) {
        return digits;
    }

    if (digits.length === 10) {
        return '57' + digits;
    }

    return digits;
}
