import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const projectEnhancementInputSchema = z.object({
  rawProjects: z.any()
});
export type ProjectEnhancementInput = z.infer<typeof projectEnhancementInputSchema>;

export const projectEnhancementOutputSchema = z.object({
  enhancedProjects: z.array(z.object({
    projectName: z.string().optional(),
    projectDescription: z.string().optional()
  }))
});
export type ProjectEnhancementOutput = z.infer<typeof projectEnhancementOutputSchema>;

export const projectEnhancementPromptModule: PromptModule<ProjectEnhancementInput, ProjectEnhancementOutput> = {
  version: '1.0.0',
  purpose: 'Transform simple project descriptions into professional CV entries.',
  moduleName: 'ProjectEnhancementPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: projectEnhancementInputSchema,
  outputSchema: projectEnhancementOutputSchema,
  buildPrompt: (context: ConversationContext, input: ProjectEnhancementInput) => {
    return {
      version: '1.0.0',
      purpose: 'Transform simple project descriptions into professional CV entries.',
      systemInstruction: `You are an expert HR consultant. Language: ${context.language}.
Transform simple project descriptions into professional CV entries.
- Use bullet points.
- Focus on actions, technologies used, and outcomes WITHOUT fabricating numbers.
- Improve grammar and consistency.
- Return an array of enhanced project objects.`,
      userPrompt: `Raw Projects:\n${JSON.stringify(input.rawProjects, null, 2)}\n\nEnhance the project entries.`,
      outputSchema: projectEnhancementOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'ProjectEnhancementPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
