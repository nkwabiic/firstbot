import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const educationEnhancementInputSchema = z.object({
  rawEducation: z.any()
});
export type EducationEnhancementInput = z.infer<typeof educationEnhancementInputSchema>;

export const educationEnhancementOutputSchema = z.object({
  enhancedEducation: z.array(z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    year: z.string().optional()
  }))
});
export type EducationEnhancementOutput = z.infer<typeof educationEnhancementOutputSchema>;

export const educationEnhancementPromptModule: PromptModule<EducationEnhancementInput, EducationEnhancementOutput> = {
  version: '1.0.0',
  purpose: 'Rewrite education professionally.',
  moduleName: 'EducationEnhancementPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: educationEnhancementInputSchema,
  outputSchema: educationEnhancementOutputSchema,
  buildPrompt: (context: ConversationContext, input: EducationEnhancementInput) => {
    return {
      version: '1.0.0',
      purpose: 'Rewrite education professionally.',
      systemInstruction: `You are an expert HR consultant. Language: ${context.language}.
Your task is to rewrite education entries professionally.
- Expand degree names where obvious (e.g. "Bachelor of Computer Science" -> "Bachelor of Science in Computer Science").
- Format years appropriately (e.g., "Graduated: 2023").
- Improve grammar and consistency.
- Return an array of enhanced education objects.`,
      userPrompt: `Raw Education:\n${JSON.stringify(input.rawEducation, null, 2)}\n\nEnhance the education entries.`,
      outputSchema: educationEnhancementOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'EducationEnhancementPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
