
import { ValidationResult } from './types';

export class TokenValidator {
  private static readonly TOKEN_FORMAT_REGEX = /^pk\./;

  static validateToken(token: string): ValidationResult {
    if (!token) return { isValid: false, error: 'Token is required' };
    if (!this.TOKEN_FORMAT_REGEX.test(token)) {
      return { isValid: false, error: "Token must start with 'pk.'" };
    }
    if (token.length < 50) {
      return { isValid: false, error: 'Token is too short' };
    }
    if (token.length > 500) {
      return { isValid: false, error: 'Token is too long' };
    }
    return { isValid: true };
  }

  static encryptToken(token: string): string {
    return btoa(token);
  }

  static decryptToken(encryptedToken: string): string {
    return atob(encryptedToken);
  }
}
