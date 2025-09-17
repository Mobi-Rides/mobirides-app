/**
 * UUID generation utility functions
 */

/**
 * Generates a random UUID using the Web Crypto API
 * @returns A randomly generated UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}