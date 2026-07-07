export interface IntentResult {
  intent: 'answer' | 'clarification' | 'help' | 'greeting' | 'correction' | 'confirmation' | 'skip' | 'back' | 'cancel' | 'edit' | 'unknown';
  confidence: number;
  requiresConfirmation: boolean;
  botReply?: string;
  extractedData?: Record<string, unknown>;
  reason?: string;
}
