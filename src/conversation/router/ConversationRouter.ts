import { RouterResult, ValidationResult } from './types.js';
import { InputNormalizer } from './InputNormalizer.js';
import { LanguageDetector } from './LanguageDetector.js';
import { CommandDetector } from './CommandDetector.js';
import { ConversationEventBus } from '../events/event-bus.js';
import { ConversationEventType } from '../events/event-types.js';
import { logger } from '../../utils/logger.js';
import { ConversationState } from '../fsm/states.js';
import { Layer1Validation } from './validation/Layer1.js';
import { Layer2Validation } from './validation/Layer2.js';

export class ConversationRouter {
  private static instance: ConversationRouter;
  private eventBus: ConversationEventBus;

  private constructor() {
    this.eventBus = ConversationEventBus.getInstance();
  }

  public static getInstance(): ConversationRouter {
    if (!ConversationRouter.instance) {
      ConversationRouter.instance = new ConversationRouter();
    }
    return ConversationRouter.instance;
  }

  private validateStateInput(state: ConversationState, input: string): ValidationResult | null {
    // Only apply validation to non-commands and non-skip inputs
    if (CommandDetector.detect(input.toLowerCase())) return null;

    switch (state) {
      case ConversationState.REGISTER_EMAIL:
      case ConversationState.REF_EMAIL:
        return Layer1Validation.isEmail(input);
      case ConversationState.REF_PHONE:
        return Layer1Validation.isPhone(input);
      case ConversationState.EXP_START_YEAR:
      case ConversationState.EXP_END_YEAR:
      case ConversationState.EDU_START_YEAR:
      case ConversationState.EDU_GRAD_YEAR: {
        const isYr = Layer1Validation.isYear(input);
        if (!isYr.isValid) return isYr;
        const year = parseInt(input, 10);
        if (state === ConversationState.EDU_GRAD_YEAR) {
           return Layer2Validation.validateGraduationYear(year);
        } else if (state === ConversationState.EXP_START_YEAR) {
           return Layer2Validation.validateYears(year);
        } else if (state === ConversationState.EXP_END_YEAR) {
           return Layer2Validation.validateYears(year, year); // Ensure not in future
        }
        return isYr;
      }
      case ConversationState.EXP_START_MONTH:
      case ConversationState.EXP_END_MONTH:
        return Layer2Validation.validateMonth(input);
      default:
        // By default, just ensure it's not empty if we are in a state that requires input
        // except WELCOME, HOME, etc.
        if (state !== ConversationState.WELCOME && state !== ConversationState.HOME && state !== ConversationState.EXPIRED_PROMPT && state !== ConversationState.EDIT_SECTION_SELECT) {
           return Layer1Validation.isNotEmpty(input);
        }
        return null;
    }
  }

  /**
   * Main entry point for the router.
   * Processes the message through the pipeline and decides the route.
   */
  public route(message: string, currentLang: 'sw' | 'en', currentState: ConversationState, conversationId: string): RouterResult {
    // 1. Normalize Input
    const normalized = InputNormalizer.normalize(message);

    // 2. Command Detection
    const command = CommandDetector.detect(normalized.lowercase);

    // 3. Language Detection (Priority-based)
    const langDetection = LanguageDetector.detectLanguage(normalized.original, currentLang, command);
    const language = langDetection.language;

    if (langDetection.reason === 'explicit_command' || (langDetection.confidence > 0.7 && language !== currentLang)) {
       this.eventBus.publish({
         event: ConversationEventType.LanguageDetected,
         timestamp: new Date().toISOString(),
         conversationId,
         userId: 'system',
         metadata: { detectedLanguage: language, confidence: langDetection.confidence, reason: langDetection.reason }
       });
    }

    if (langDetection.reason === 'explicit_command') {
        logger.info(`[Router] language=${language} command=CHANGE_LANGUAGE route=LANGUAGE`);
        return {
          handled: true,
          route: 'LANGUAGE',
          intent: 'change_language',
          confidence: 1.0,
          language,
          command: command || undefined,
          normalizedInput: normalized,
          requiresAI: false,
          reason: 'Explicit language change command'
        };
    }

    if (command) {
      this.eventBus.publish({
        event: ConversationEventType.CommandDetected,
        timestamp: new Date().toISOString(),
        conversationId,
        userId: 'system',
        metadata: { command }
      });
      
      logger.info(`[Router] language=${language} command=${command} route=COMMAND`);
      
      return {
        handled: true,
        route: 'COMMAND',
        intent: command,
        confidence: 1.0,
        language,
        command,
        normalizedInput: normalized,
        requiresAI: false,
        reason: 'Detected specific command'
      };
    }

    // 4. Layer 1 & 2 Validation
    const validationResult = this.validateStateInput(currentState, normalized.normalized);
    if (validationResult && validationResult.status !== 'PASS') {
      this.eventBus.publish({
        event: ConversationEventType.ValidationFailed,
        timestamp: new Date().toISOString(),
        conversationId,
        userId: 'system',
        metadata: { state: currentState, reason: validationResult.reason }
      });
      
      logger.info(`[Router] language=${language} command=None validation=FAIL route=VALIDATION`);
      
      return {
        handled: true,
        route: 'VALIDATION',
        intent: 'answer',
        confidence: 1.0,
        language,
        normalizedInput: normalized,
        validationResult,
        requiresAI: false,
        reason: 'Failed deterministic validation'
      };
    }

    // 5. AI Decision Gate
    let requiresAI = false;
    let aiReason = '';
    
    if (normalized.original.endsWith('?')) {
       requiresAI = true;
       aiReason = 'question';
    } else if (normalized.normalized.split(' ').length > 10) {
       requiresAI = true;
       aiReason = 'multi-field answer or free text';
    } else if (currentState === ConversationState.CV_SUMMARY || currentState === ConversationState.EXP_RESPONSIBILITIES || currentState === ConversationState.EXP_ACHIEVEMENTS) {
       requiresAI = true;
       aiReason = 'semantic validation required for free text fields';
    }

    if (requiresAI) {
      this.eventBus.publish({
         event: ConversationEventType.AIRequested,
         timestamp: new Date().toISOString(),
         conversationId,
         userId: 'system',
         metadata: { reason: aiReason }
      });
      logger.info(`[Router] language=${language} command=None validation=PASS AI=true route=AI reason="${aiReason}"`);
      return {
        handled: true,
        route: 'AI',
        intent: 'unclassified',
        confidence: 0.0,
        language,
        normalizedInput: normalized,
        validationResult: validationResult || undefined,
        requiresAI,
        reason: aiReason
      };
    }

    logger.info(`[Router] language=${language} command=None validation=PASS AI=false route=FSM`);

    // 6. Default route is FSM
    return {
      handled: true,
      route: 'FSM',
      intent: 'answer',
      confidence: 1.0,
      language,
      normalizedInput: normalized,
      validationResult: validationResult || undefined,
      requiresAI: false,
      reason: 'Standard answer'
    };
  }
}
