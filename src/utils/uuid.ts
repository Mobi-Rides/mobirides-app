/**
 * UUID generation utility functions
 */

/**
 * Generates a random UUID using the Web Crypto API
 * @returns A randomly generated UUID string
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (secure contexts)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts (HTTP) or older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}