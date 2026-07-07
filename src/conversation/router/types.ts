import { CommandIntent } from './CommandDetector.js';

export interface ValidationResult {
  isValid: boolean;
  status: 'PASS' | 'FAIL' | 'WARNING';
  reason?: string;
}

export interface RouterResult {
  handled: boolean;
  route: 'FSM' | 'COMMAND' | 'VALIDATION' | 'HELP' | 'AI' | 'LANGUAGE';
  intent?: string; // High level intent (e.g., from command)
  confidence: number;
  language: 'sw' | 'en';
  command?: CommandIntent;
  normalizedInput: NormalizedInput;
  validationResult?: ValidationResult;
  requiresAI: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedInput {
  original: string;
  normalized: string;
  lowercase: string;
}
