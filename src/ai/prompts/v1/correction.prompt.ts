import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const correctionInputSchema = z.object({});
export type CorrectionInput = z.infer<typeof correctionInputSchema>;

export const correctionOutputSchema = z.object({
  extractedData: z.record(z.any()),
  confidence: z.number().min(0).max(100),
  reason: z.string()
});
export type CorrectionOutput = z.infer<typeof correctionOutputSchema>;

export const correctionPromptModule: PromptModule<CorrectionInput, CorrectionOutput> = {
  version: '1.0.0',
  purpose: 'Extract the corrected data from a user correction message.',
  moduleName: 'CorrectionPrompt',
  profile: AIProfiles.INTENT_PROFILE,
  inputSchema: correctionInputSchema,
  outputSchema: correctionOutputSchema,
  buildPrompt: (context: ConversationContext) => {
    return {
      version: '1.0.0',
      purpose: 'Extract the corrected data from a user correction message.',
      systemInstruction: `You are CareerBot's data correction module. Language: ${context.language}. Current State: ${context.currentState}.`,
      userPrompt: `The user is correcting previous information.\nLatest User Message: ${context.latestUserMessage}\n\nExtract the corrected information as structured data. Provide a confidence score (0-100) and a brief reason.`,
      outputSchema: correctionOutputSchema,
      profile: AIProfiles.INTENT_PROFILE,
      metadata: {
        module: 'CorrectionPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
