import { createHash } from 'crypto';
import { logger } from '../../utils/logger.js';
import { PromptDefinition } from '../prompts/v1/types.js';
import { ConversationContext } from '../context/types.js';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class AICache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static store = new Map<string, CacheEntry<any>>();
  private static DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static generateHashKey(promptDef: PromptDefinition<any>, context: ConversationContext): string {
    const cvHash = this.createStringHash(JSON.stringify(context.cvSnapshot));
    const payload = `${promptDef.version}:${promptDef.profile.model}:${promptDef.systemInstruction}:${promptDef.userPrompt}:${context.language}:${context.currentState}:${cvHash}`;
    
    return createHash('sha256').update(payload).digest('hex');
  }

  private static createStringHash(str: string): string {
    return createHash('sha256').update(str).digest('hex');
  }

  public static get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    logger.debug(`[AICache] Hit for key: ${key}`);
    return entry.value;
  }

  public static set<T>(key: string, value: T, ttlMs = this.DEFAULT_TTL_MS): void {
    logger.debug(`[AICache] Set for key: ${key}`);
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }
  
  public static clear(): void {
    this.store.clear();
  }
}
