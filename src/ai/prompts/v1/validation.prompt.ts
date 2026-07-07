import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const validationInputSchema = z.object({
  fieldName: z.string(),
  fieldValue: z.string()
});
export type ValidationInput = z.infer<typeof validationInputSchema>;

export const validationOutputSchema = z.object({
  isValid: z.boolean(),
  reason: z.string().optional(),
  correctedValue: z.string().optional()
});
export type ValidationOutput = z.infer<typeof validationOutputSchema>;

export const validationPromptModule: PromptModule<ValidationInput, ValidationOutput> = {
  version: '1.0.0',
  purpose: 'Perform semantic validation on complex user inputs (Layer 3 validation).',
  moduleName: 'ValidationPrompt',
  profile: AIProfiles.VALIDATION_PROFILE,
  inputSchema: validationInputSchema,
  outputSchema: validationOutputSchema,
  buildPrompt: (context: ConversationContext, input: ValidationInput) => {
    return {
      version: '1.0.0',
      purpose: 'Perform semantic validation on complex user inputs (Layer 3 validation).',
      systemInstruction: `You are validating user input for a CV. Language: ${context.language}. Current State: ${context.currentState}. 
If the field is "location", "fullName", or similar basic personal fields, they are highly flexible. Any non-empty input containing letters/spaces (e.g. "Dar es Salaam, Tanzania", "Mbeya", "John Doe") is perfectly valid. Do NOT reject them.`,
      userPrompt: `Field: ${input.fieldName}\nInput Value: ${input.fieldValue}\n\nAnalyze if this is a logically valid entry for the given field in a professional CV. \nIf invalid, provide a highly professional, conversational reason in ${context.language}. \nYou must never just say "Invalid input". Instead, your response MUST include:\n1. What is wrong.\n2. Why it is needed.\n3. One clear example of what is expected.\n4. A natural polite request to try again.\nKeep it concise and suitable for a WhatsApp chat.`,
      outputSchema: validationOutputSchema,
      profile: AIProfiles.VALIDATION_PROFILE,
      metadata: {
        module: 'ValidationPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
