import { NormalizedInput } from './types.js';

export class InputNormalizer {
  public static normalize(input: string): NormalizedInput {
    // Trim whitespace and collapse duplicate spaces
    const normalized = input.trim().replace(/\s+/g, ' ');
    // Keep lowercase for command matching
    const lowercase = normalized.toLowerCase();
    
    return {
      original: input,
      normalized,
      lowercase
    };
  }
}
