import { ValidationResult } from '../types.js';

export class Layer1Validation {
  public static isEmail(input: string): ValidationResult {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regex.test(input)) return { isValid: true, status: 'PASS' };
    return { isValid: false, status: 'FAIL', reason: 'Invalid email format' };
  }

  public static isPhone(input: string): ValidationResult {
    const regex = /^\+?[\d\s-]{7,15}$/;
    if (regex.test(input)) return { isValid: true, status: 'PASS' };
    return { isValid: false, status: 'FAIL', reason: 'Invalid phone format' };
  }

  public static isYear(input: string): ValidationResult {
    const regex = /^\d{4}$/;
    if (regex.test(input)) {
        const year = parseInt(input, 10);
        if (year >= 1900 && year <= 2100) return { isValid: true, status: 'PASS' };
    }
    return { isValid: false, status: 'FAIL', reason: 'Invalid year format' };
  }

  public static isNumber(input: string): ValidationResult {
     if (!isNaN(Number(input)) && input.trim() !== '') return { isValid: true, status: 'PASS' };
     return { isValid: false, status: 'FAIL', reason: 'Not a number' };
  }

  public static isURL(input: string): ValidationResult {
     try {
       new URL(input.startsWith('http') ? input : `https://${input}`);
       return { isValid: true, status: 'PASS' };
     } catch {
       return { isValid: false, status: 'FAIL', reason: 'Invalid URL format' };
     }
  }

  public static isNotEmpty(input: string): ValidationResult {
    if (input.trim().length > 0) return { isValid: true, status: 'PASS' };
    return { isValid: false, status: 'FAIL', reason: 'Input cannot be empty' };
  }
}
