import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const hrReviewInputSchema = z.object({
  cvData: z.any()
});
export type HrReviewInput = z.infer<typeof hrReviewInputSchema>;

export const hrReviewOutputSchema = z.object({
  evaluations: z.array(z.string()),
  recommendations: z.array(z.string()),
  readinessLevel: z.enum(['Low', 'Medium', 'High']),
  overallFeedback: z.string()
});
export type HrReviewOutput = z.infer<typeof hrReviewOutputSchema>;

export const hrReviewPromptModule: PromptModule<HrReviewInput, HrReviewOutput> = {
  version: '1.0.0',
  purpose: 'Final HR review of the generated CV.',
  moduleName: 'HrReviewPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: hrReviewInputSchema,
  outputSchema: hrReviewOutputSchema,
  buildPrompt: (context: ConversationContext, input: HrReviewInput) => {
    return {
      version: '1.0.0',
      purpose: 'Final HR review of the generated CV.',
      systemInstruction: `You are an expert HR consultant and recruiter. Language: ${context.language}.
Your task is to conduct a final review of the generated CV data.
Evaluate the Professional Summary, Experience, Education, Projects, Skills, and completeness.
Check for consistency (dates, duplicates, tense).
Provide structured feedback, recommendations, and an overall readiness level.`,
      userPrompt: `CV Data:\n${JSON.stringify(input.cvData, null, 2)}\n\nPerform the final HR review.`,
      outputSchema: hrReviewOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'HrReviewPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
