import { CommandIntent } from './CommandDetector.js';

export interface LanguageDetectionResult {
  language: 'en' | 'sw';
  confidence: number;
  reason: string;
}

export class LanguageDetector {
  private static swahiliKeywords = new Set([
    'habari', 'asante', 'ndio', 'ndiyo', 'hapana', 'sawa', 'jina', 'kazi',
    'shule', 'chuo', 'elimu', 'ruka', 'nyuma', 'msaada', 'badili', 'rekebisha',
    'sitaki', 'nataka', 'mimi', 'wewe', 'yeye', 'sijaelewa', 'endelea', 'ghairi'
  ]);

  private static englishKeywords = new Set([
    'hello', 'hi', 'thanks', 'yes', 'no', 'okay', 'ok', 'name', 'job',
    'school', 'university', 'education', 'skip', 'back', 'help', 'edit',
    'change', 'understand', 'i', 'you', 'he', 'she', 'none', 'n/a', 'continue', 'cancel'
  ]);

  public static detectLanguage(
    text: string, 
    currentSessionLang: 'en' | 'sw',
    detectedCommand?: CommandIntent | null
  ): LanguageDetectionResult {
    // Priority 1: Explicit language switch command
    if (detectedCommand === CommandIntent.CHANGE_LANGUAGE_EN) {
      return { language: 'en', confidence: 1.0, reason: 'explicit_command' };
    }
    if (detectedCommand === CommandIntent.CHANGE_LANGUAGE_SW) {
      return { language: 'sw', confidence: 1.0, reason: 'explicit_command' };
    }

    // Priority 4: Local heuristic detector
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    let swCount = 0;
    let enCount = 0;

    for (const word of words) {
      if (this.swahiliKeywords.has(word)) swCount++;
      if (this.englishKeywords.has(word)) enCount++;
    }
    
    const totalMatched = swCount + enCount;

    // Only switch language if we are highly confident (e.g. > 70% of matched words and at least some match)
    if (totalMatched > 0) {
      const swRatio = swCount / totalMatched;
      const enRatio = enCount / totalMatched;

      if (swRatio > 0.7) {
        return { language: 'sw', confidence: swRatio, reason: 'heuristic' };
      }
      if (enRatio > 0.7) {
        return { language: 'en', confidence: enRatio, reason: 'heuristic' };
      }
    }

    // Priority 2 & 3: Existing session language / Previous context
    // Priority 5: AI fallback (deferred to Intent Engine later if needed, but for now we default to session)
    return { language: currentSessionLang, confidence: 1.0, reason: 'session_persistence' };
  }
}
