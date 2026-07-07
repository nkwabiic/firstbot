
export interface AIProfile {
  name: string;
  model: string;
  fallbackModel?: string;
  timeoutMs: number;
  maxRetries: number;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  responseMimeType: 'text/plain' | 'application/json';
}

export const AIProfiles: Record<string, AIProfile> = {
  INTENT_PROFILE: {
    name: 'INTENT_PROFILE',
    model: 'gemini-2.5-flash',
    timeoutMs: 10000,
    maxRetries: 2,
    temperature: 0.1,
    topP: 0.8,
    maxOutputTokens: 256,
    responseMimeType: 'application/json'
  },
  VALIDATION_PROFILE: {
    name: 'VALIDATION_PROFILE',
    model: 'gemini-2.5-flash',
    timeoutMs: 15000,
    maxRetries: 2,
    temperature: 0.1,
    topP: 0.8,
    maxOutputTokens: 512,
    responseMimeType: 'application/json'
  },
  SUMMARY_PROFILE: {
    name: 'SUMMARY_PROFILE',
    model: 'gemini-2.5-flash',
    timeoutMs: 30000,
    maxRetries: 3,
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json'
  },
  CONVERSATION_PROFILE: {
    name: 'CONVERSATION_PROFILE',
    model: 'gemini-2.5-flash',
    timeoutMs: 15000,
    maxRetries: 2,
    temperature: 0.7,
    topP: 0.9,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json'
  }
};

export interface AIPolicyResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed: string;
  latencyMs: number;
  cached: boolean;
  retries: number;
}
