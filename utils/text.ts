/**
 * Text utility functions for string manipulation and normalization
 */

/**
 * Normalizes a string by removing accents and converting to lowercase
 * Useful for case-insensitive and accent-insensitive search/comparison
 *
 * @param text - The string to normalize
 * @returns The normalized string (lowercase, without accents)
 *
 * @example
 * normalize('José García') // returns 'jose garcia'
 * normalize('CAFÉ') // returns 'cafe'
 */
export function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
