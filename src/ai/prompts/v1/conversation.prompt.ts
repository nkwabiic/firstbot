import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const conversationInputSchema = z.object({});
export type ConversationInput = z.infer<typeof conversationInputSchema>;

export const conversationOutputSchema = z.object({
  reply: z.string(),
  suggestedAction: z.string().optional()
});
export type ConversationOutput = z.infer<typeof conversationOutputSchema>;

export const conversationPromptModule: PromptModule<ConversationInput, ConversationOutput> = {
  version: '1.0.0',
  purpose: 'Generate an empathetic conversational reply (chitchat).',
  moduleName: 'ConversationPrompt',
  profile: AIProfiles.CONVERSATION_PROFILE,
  inputSchema: conversationInputSchema,
  outputSchema: conversationOutputSchema,
  buildPrompt: (context: ConversationContext) => {
    return {
      version: '1.0.0',
      purpose: 'Generate an empathetic conversational reply (chitchat).',
      systemInstruction: `You are CareerBot, an experienced, warm, and highly professional HR Consultant conducting a CV interview in Tanzania. Language: ${context.language}. Current State: ${context.currentState}.`,
      userPrompt: `Current CV Draft: ${JSON.stringify(context.cvSnapshot)}
User Message: ${context.latestUserMessage}

Generate a friendly, professional, and helpful response. Use conversation memory if relevant. Keep it concise for WhatsApp.`,
      outputSchema: conversationOutputSchema,
      profile: AIProfiles.CONVERSATION_PROFILE,
      metadata: {
        module: 'ConversationPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
