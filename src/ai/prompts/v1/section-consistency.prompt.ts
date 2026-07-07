import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const sectionConsistencyInputSchema = z.object({
  cvData: z.any()
});
export type SectionConsistencyInput = z.infer<typeof sectionConsistencyInputSchema>;

export const sectionConsistencyOutputSchema = z.object({
  hasInconsistencies: z.boolean(),
  inconsistencies: z.array(z.string()),
  recommendations: z.array(z.string())
});
export type SectionConsistencyOutput = z.infer<typeof sectionConsistencyOutputSchema>;

export const sectionConsistencyPromptModule: PromptModule<SectionConsistencyInput, SectionConsistencyOutput> = {
  version: '1.0.0',
  purpose: 'Verify job dates, education dates, duplicate skills, tense, formatting, and capitalization.',
  moduleName: 'SectionConsistencyPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: sectionConsistencyInputSchema,
  outputSchema: sectionConsistencyOutputSchema,
  buildPrompt: (context: ConversationContext, input: SectionConsistencyInput) => {
    return {
      version: '1.0.0',
      purpose: 'Verify section consistency across the CV.',
      systemInstruction: `You are an expert HR consultant and quality assurance reviewer. Language: ${context.language}.
Before generating the final CV, verify the consistency of the data:
- Check if job dates and education dates are logical.
- Ensure there are no duplicated skills.
- Verify consistent tense, formatting, and capitalization.
If inconsistencies exist, return structured recommendations instead of changing user data silently.`,
      userPrompt: `CV Data:\n${JSON.stringify(input.cvData, null, 2)}\n\nCheck for inconsistencies.`,
      outputSchema: sectionConsistencyOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'SectionConsistencyPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
