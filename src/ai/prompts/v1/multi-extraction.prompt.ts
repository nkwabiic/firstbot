import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const multiExtractionInputSchema = z.object({});
export type MultiExtractionInput = z.infer<typeof multiExtractionInputSchema>;

export const multiExtractionOutputSchema = z.object({
  extractedData: z.record(z.any()),
  confidence: z.number().min(0).max(100)
});
export type MultiExtractionOutput = z.infer<typeof multiExtractionOutputSchema>;

export const multiExtractionPromptModule: PromptModule<MultiExtractionInput, MultiExtractionOutput> = {
  version: '1.0.0',
  purpose: 'Extract multiple fields of information from a single user message.',
  moduleName: 'MultiExtractionPrompt',
  profile: AIProfiles.SUMMARY_PROFILE, // using summary for better extraction logic
  inputSchema: multiExtractionInputSchema,
  outputSchema: multiExtractionOutputSchema,
  buildPrompt: (context: ConversationContext) => {
    return {
      version: '1.0.0',
      purpose: 'Extract multiple fields of information from a single user message.',
      systemInstruction: `You are CareerBot's data extraction module. Language: ${context.language}. Current State: ${context.currentState}.`,
      userPrompt: `Extract as many structured data fields as possible from the latest user message based on the context.\nLast Bot Message: ${context.lastBotMessage}\nLatest User Message: ${context.latestUserMessage}\n\nReturn the extracted data and a confidence score (0-100).`,
      outputSchema: multiExtractionOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'MultiExtractionPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
