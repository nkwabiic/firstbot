import { IntentResult } from './types.js';
import { ConversationContext } from '../context/types.js';
import { PromptBuilder } from '../prompt/PromptBuilder.js';
import { AIPolicyEngine } from '../policy/AIPolicyEngine.js';
import { intentPromptModule } from '../prompts/v1/intent.prompt.js';
import { validationPromptModule } from '../prompts/v1/validation.prompt.js';
import { ConversationEventBus } from '../../conversation/events/event-bus.js';
import { ConversationEventType } from '../../conversation/events/event-types.js';
import { logger } from '../../utils/logger.js';

export class IntentEngine {
  private policyEngine: AIPolicyEngine;
  private eventBus: ConversationEventBus;

  constructor() {
    this.policyEngine = AIPolicyEngine.getInstance();
    this.eventBus = ConversationEventBus.getInstance();
  }

  public async evaluate(context: ConversationContext): Promise<IntentResult> {
    this.eventBus.publish({
      event: ConversationEventType.AIRequested,
      timestamp: new Date().toISOString(),
      conversationId: context.conversationId,
      userId: 'system',
      state: context.currentState,
      section: context.currentSection
    });

    try {
      const promptDef = PromptBuilder.build(intentPromptModule, context, {});
      const aiResult = await this.policyEngine.execute(promptDef, context);
      
      if (!aiResult.success || !aiResult.data) {
        this.eventBus.publish({
          event: ConversationEventType.AIRejected,
          timestamp: new Date().toISOString(),
          conversationId: context.conversationId,
          userId: 'system',
          metadata: { error: aiResult.error }
        });

        return {
          intent: 'unknown',
          confidence: 0,
          requiresConfirmation: false,
          reason: aiResult.error
        };
      }

      const { intent, confidence, extractedData, botReply, reason } = aiResult.data;

      let finalIntent = intent;
      let finalConfidence = confidence;
      const finalExtractedData = extractedData;
      let finalBotReply = botReply;

      if (finalIntent === 'answer' && finalExtractedData && Object.keys(finalExtractedData).length > 0) {
        for (const [key, value] of Object.entries(finalExtractedData)) {
          // Skip semantic validation for basic personal details
          if (['fullName', 'email', 'phone', 'location', 'lang'].includes(key)) {
            continue;
          }

          const valPromptDef = PromptBuilder.build(validationPromptModule, context, {
            fieldName: key,
            fieldValue: String(value)
          });
          const valResult = await this.policyEngine.execute(valPromptDef, context);
          
          if (valResult.success && valResult.data && !valResult.data.isValid) {
             finalIntent = 'unknown'; 
             finalConfidence = 0;
             finalBotReply = valResult.data.reason || 'Invalid input detected.';
             this.eventBus.publish({
                event: ConversationEventType.ValidationFailed,
                timestamp: new Date().toISOString(),
                conversationId: context.conversationId,
                userId: 'system',
                metadata: { fieldName: key, fieldValue: value, reason: valResult.data.reason }
             });
             break;
          }
        }
      }

      let requiresConfirmation = false;
      if (finalConfidence >= 95) {
        requiresConfirmation = false;
      } else if (finalConfidence >= 80) {
        requiresConfirmation = true;
      } else if (finalConfidence >= 60) {
        finalIntent = 'clarification';
        requiresConfirmation = false;
      } else {
        finalIntent = 'unknown';
        requiresConfirmation = false;
      }

      this.publishIntentEvents(finalIntent, context);

      const intentResult: IntentResult = {
        intent: finalIntent as IntentResult['intent'],
        confidence: finalConfidence,
        requiresConfirmation,
        botReply: finalBotReply,
        extractedData: finalExtractedData,
        reason
      };

      this.eventBus.publish({
        event: ConversationEventType.AISucceeded,
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId,
        userId: 'system',
        metadata: { intent: finalIntent, confidence: finalConfidence }
      });

      return intentResult;

    } catch (error) {
      logger.error(`[IntentEngine] Error evaluating intent: ${error instanceof Error ? error.message : String(error)}`);
      this.eventBus.publish({
        event: ConversationEventType.AIRejected,
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId,
        userId: 'system',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });

      return {
        intent: 'unknown',
        confidence: 0,
        requiresConfirmation: false,
        reason: 'Internal evaluation error'
      };
    }
  }

  private publishIntentEvents(intent: string, context: ConversationContext) {
    this.eventBus.publish({
        event: ConversationEventType.IntentDetected,
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId,
        userId: 'system',
        metadata: { detectedIntent: intent }
    });

    if (intent === 'clarification') {
      this.eventBus.publish({
        event: ConversationEventType.ClarificationRequested,
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId,
        userId: 'system'
      });
    } else if (intent === 'correction') {
      this.eventBus.publish({
        event: ConversationEventType.CorrectionDetected,
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId,
        userId: 'system'
      });
    } else if (intent === 'unknown') {
      this.eventBus.publish({
        event: ConversationEventType.UnknownIntent,
        timestamp: new Date().toISOString(),
        conversationId: context.conversationId,
        userId: 'system'
      });
    }
  }
}
