import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const clarificationInputSchema = z.object({});
export type ClarificationInput = z.infer<typeof clarificationInputSchema>;

export const clarificationOutputSchema = z.object({
  botReply: z.string()
});
export type ClarificationOutput = z.infer<typeof clarificationOutputSchema>;

export const clarificationPromptModule: PromptModule<ClarificationInput, ClarificationOutput> = {
  version: '1.0.0',
  purpose: 'Provide a clarifying explanation when the user is confused or asks for help.',
  moduleName: 'ClarificationPrompt',
  profile: AIProfiles.CONVERSATION_PROFILE,
  inputSchema: clarificationInputSchema,
  outputSchema: clarificationOutputSchema,
  buildPrompt: (context: ConversationContext) => {
    return {
      version: '1.0.0',
      purpose: 'Provide a clarifying explanation when the user is confused or asks for help.',
      systemInstruction: `You are CareerBot, an experienced, warm, and highly professional HR Consultant conducting an interview. The user needs clarification or help. Language: ${context.language}. Current State: ${context.currentState}.`,
      userPrompt: `Last Bot Message: ${context.lastBotMessage}\nLatest User Message: ${context.latestUserMessage}\n\nProvide a helpful, empathetic explanation in ${context.language}. Act as an HR expert. Keep paragraphs short and suitable for a WhatsApp chat. Do not overwhelm the user. Provide exactly one clear example if they are stuck.`,
      outputSchema: clarificationOutputSchema,
      profile: AIProfiles.CONVERSATION_PROFILE,
      metadata: {
        module: 'ClarificationPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
