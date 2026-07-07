import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const experienceEnhancementInputSchema = z.object({
  jobTitle: z.string().optional(),
  rawExperience: z.any()
});
export type ExperienceEnhancementInput = z.infer<typeof experienceEnhancementInputSchema>;

export const experienceEnhancementOutputSchema = z.object({
  enhancedExperience: z.array(z.object({
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional()
  }))
});
export type ExperienceEnhancementOutput = z.infer<typeof experienceEnhancementOutputSchema>;

export const experienceEnhancementPromptModule: PromptModule<ExperienceEnhancementInput, ExperienceEnhancementOutput> = {
  version: '1.0.0',
  purpose: 'Convert raw experience answers into recruiter-quality bullet points and achievements.',
  moduleName: 'ExperienceEnhancementPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: experienceEnhancementInputSchema,
  outputSchema: experienceEnhancementOutputSchema,
  buildPrompt: (context: ConversationContext, input: ExperienceEnhancementInput) => {
    return {
      version: '1.0.0',
      purpose: 'Enhance experience descriptions with measurable achievements.',
      systemInstruction: `You are an expert HR consultant and CV writer. Language: ${context.language}.
Your task is to rewrite experience entries into professional, recruiter-quality bullet points.
- Rewrite responsibilities into measurable achievements where appropriate WITHOUT inventing facts or fabricating numbers.
- Improve grammar, punctuation, and consistency without changing the meaning.
- Naturally include relevant ATS keywords specifically tailored to the user's target role and industry without keyword stuffing.
- Return an array of enhanced experience objects. The "description" field should contain the enhanced bullet points.`,
      userPrompt: `Raw Experience:\n${JSON.stringify(input.rawExperience, null, 2)}\n\nEnhance the experience entries.`,
      outputSchema: experienceEnhancementOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'ExperienceEnhancementPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
