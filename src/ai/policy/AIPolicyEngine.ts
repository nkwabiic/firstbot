import { AIPolicyResult } from './types.js';
import { AICache } from '../cache/AICache.js';
import { logger } from '../../utils/logger.js';
import { AIProvider } from './AIProvider.js';
import { PromptDefinition } from '../prompts/v1/types.js';
import { ConversationContext } from '../context/types.js';

export class AIPolicyEngine {
  private static instance: AIPolicyEngine;
  private provider: AIProvider;

  private constructor(provider: AIProvider) {
    this.provider = provider;
  }

  public static initialize(provider: AIProvider): AIPolicyEngine {
    if (!AIPolicyEngine.instance) {
      AIPolicyEngine.instance = new AIPolicyEngine(provider);
    }
    return AIPolicyEngine.instance;
  }

  public static getInstance(): AIPolicyEngine {
    if (!AIPolicyEngine.instance) {
      throw new Error('AIPolicyEngine must be initialized with a provider first.');
    }
    return AIPolicyEngine.instance;
  }

  public async execute<T>(
    promptDef: PromptDefinition<T>,
    context: ConversationContext
  ): Promise<AIPolicyResult<T>> {
    const { profile, outputSchema } = promptDef;
    
    // 1. Generate Cache Key using SHA-256 hash logic
    const cacheKey = AICache.generateHashKey(promptDef, context);
    
    // 2. Check Cache
    const cached = AICache.get<T>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        modelUsed: profile.model,
        latencyMs: 0,
        cached: true,
        retries: 0
      };
    }

    const startTime = Date.now();
    let currentAttempt = 0;
    let lastError: Error | null = null;
    let currentModel = profile.model;

    // 3. Retry Loop & Model Fallback
    while (currentAttempt <= profile.maxRetries) {
      try {
        currentAttempt++;
        logger.info(`[AIPolicyEngine] Attempt ${currentAttempt} using model ${currentModel}`);
        
        // Use a temporary prompt definition if falling back model
        const execPromptDef = currentModel === profile.model 
           ? promptDef 
           : { ...promptDef, profile: { ...profile, model: currentModel } };

        const responseText = await this.provider.execute(execPromptDef, context);
        
        const parsed = this.parseResponse(responseText, profile.responseMimeType);
        const validationResult = outputSchema.safeParse(parsed);
        
        if (!validationResult.success) {
          throw new Error(`Schema validation failed: ${validationResult.error.message}`);
        }

        const data = validationResult.data;

        // 4. Set Cache
        AICache.set(cacheKey, data);

        return {
          success: true,
          data,
          modelUsed: currentModel,
          latencyMs: Date.now() - startTime,
          cached: false,
          retries: currentAttempt - 1
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`[AIPolicyEngine] Error on attempt ${currentAttempt}: ${lastError.message}`);
        
        const isTransient = this.isTransientError(lastError.message);
        
        if (!isTransient && !profile.fallbackModel) {
            break; // Don't retry non-transient errors unless we have a fallback model
        }

        if (currentAttempt > profile.maxRetries && profile.fallbackModel && currentModel === profile.model) {
            // Switch to fallback model for one last try
            currentModel = profile.fallbackModel;
            currentAttempt = profile.maxRetries; // Reset to allow one try with fallback
            logger.info(`[AIPolicyEngine] Switching to fallback model: ${currentModel}`);
            continue;
        }

        if (currentAttempt <= profile.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * currentAttempt)); // Exponential backoff
        }
      }
    }

    // 5. Return Failure
    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred during AI execution',
      modelUsed: currentModel,
      latencyMs: Date.now() - startTime,
      cached: false,
      retries: currentAttempt - 1
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseResponse(text: string, mimeType: string): any {
    if (mimeType !== 'application/json') {
      return text;
    }
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(json)?\n?/i, '').replace(/\n?```$/i, '');
    }
    return JSON.parse(jsonStr);
  }

  private isTransientError(errorMessage: string): boolean {
    const lowerError = errorMessage.toLowerCase();
    return lowerError.includes('timeout') ||
           lowerError.includes('network') ||
           lowerError.includes('500') ||
           lowerError.includes('502') ||
           lowerError.includes('503') ||
           lowerError.includes('504') ||
           lowerError.includes('429') ||
           lowerError.includes('json') ||
           lowerError.includes('schema') ||
           lowerError.includes('syntax') ||
           lowerError.includes('validation');
  }
}
