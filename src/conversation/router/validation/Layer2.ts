import { ValidationResult } from '../types.js';

export class Layer2Validation {
  public static validateYears(startYear: number, endYear?: number): ValidationResult {
    const currentYear = new Date().getFullYear();
    if (startYear > currentYear) {
      return { isValid: false, status: 'FAIL', reason: 'Start year cannot be in the future' };
    }
    if (endYear !== undefined) {
      if (endYear < startYear) {
        return { isValid: false, status: 'FAIL', reason: 'End year cannot be before start year' };
      }
      if (endYear > currentYear) {
        return { isValid: false, status: 'FAIL', reason: 'End year cannot be in the future' };
      }
    }
    return { isValid: true, status: 'PASS' };
  }

  public static validateGraduationYear(gradYear: number, birthYear?: number): ValidationResult {
     const currentYear = new Date().getFullYear();
     // Allowing graduation year slightly in future (e.g. up to 5 years) for ongoing studies
     if (gradYear > currentYear + 5) {
        return { isValid: false, status: 'FAIL', reason: 'Graduation year is too far in the future' };
     }
     if (gradYear < 1950) {
        return { isValid: false, status: 'FAIL', reason: 'Graduation year is too far in the past' };
     }
     if (birthYear !== undefined && gradYear <= birthYear + 15) {
        return { isValid: false, status: 'FAIL', reason: 'Graduation year is not logically possible compared to birth year' };
     }
     return { isValid: true, status: 'PASS' };
  }
  
  public static validateMonth(month: string): ValidationResult {
     const m = parseInt(month, 10);
     if (!isNaN(m) && m >= 1 && m <= 12) return { isValid: true, status: 'PASS' };
     
     const stringMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
     if (stringMonths.some(sm => month.toLowerCase().startsWith(sm))) {
         return { isValid: true, status: 'PASS' };
     }

     return { isValid: false, status: 'FAIL', reason: 'Invalid month' };
  }
}
