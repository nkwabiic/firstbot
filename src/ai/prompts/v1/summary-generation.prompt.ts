import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const summaryGenerationInputSchema = z.object({
  jobTitle: z.string().optional(),
  education: z.any().optional(),
  experience: z.any().optional(),
  skills: z.any().optional(),
  projects: z.any().optional()
});
export type SummaryGenerationInput = z.infer<typeof summaryGenerationInputSchema>;

export const summaryGenerationOutputSchema = z.object({
  professionalSummary: z.string()
});
export type SummaryGenerationOutput = z.infer<typeof summaryGenerationOutputSchema>;

export const summaryGenerationPromptModule: PromptModule<SummaryGenerationInput, SummaryGenerationOutput> = {
  version: '1.0.0',
  purpose: 'Generate a professional summary from education, experience, skills, and projects.',
  moduleName: 'SummaryGenerationPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: summaryGenerationInputSchema,
  outputSchema: summaryGenerationOutputSchema,
  buildPrompt: (context: ConversationContext, input: SummaryGenerationInput) => {
    return {
      version: '1.0.0',
      purpose: 'Generate a professional summary from CV sections.',
      systemInstruction: `You are an expert HR consultant and CV writer. Language: ${context.language}.
Your task is to write a highly professional, ATS-friendly summary based on the provided CV sections.
Do NOT invent experience, exaggerate, or fabricate achievements.
Be concise, truthful, and achievement-oriented.
Naturally include relevant ATS keywords specifically tailored to the user's target role and industry without keyword stuffing.`,
      userPrompt: `Input Data:\n${JSON.stringify(input, null, 2)}\n\nGenerate the professional summary.`,
      outputSchema: summaryGenerationOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'SummaryGenerationPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
