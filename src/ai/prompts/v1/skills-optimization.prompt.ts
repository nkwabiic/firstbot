import { z } from 'zod';
import { PromptModule } from './types.js';
import { ConversationContext } from '../../context/types.js';
import { AIProfiles } from '../../policy/types.js';

export const skillsOptimizationInputSchema = z.object({
  rawSkills: z.any()
});
export type SkillsOptimizationInput = z.infer<typeof skillsOptimizationInputSchema>;

export const skillsOptimizationOutputSchema = z.object({
  optimizedSkills: z.array(z.string())
});
export type SkillsOptimizationOutput = z.infer<typeof skillsOptimizationOutputSchema>;

export const skillsOptimizationPromptModule: PromptModule<SkillsOptimizationInput, SkillsOptimizationOutput> = {
  version: '1.0.0',
  purpose: 'Normalize skills, remove duplicates, and group related skills.',
  moduleName: 'SkillsOptimizationPrompt',
  profile: AIProfiles.SUMMARY_PROFILE,
  inputSchema: skillsOptimizationInputSchema,
  outputSchema: skillsOptimizationOutputSchema,
  buildPrompt: (context: ConversationContext, input: SkillsOptimizationInput) => {
    return {
      version: '1.0.0',
      purpose: 'Normalize skills, remove duplicates, and group related skills.',
      systemInstruction: `You are an expert HR consultant. Language: ${context.language}.
Your task is to normalize skills from the user.
- Capitalize properly (e.g. 'excel' -> 'Microsoft Excel', 'word' -> 'Microsoft Word').
- Remove duplicates.
- Combine overlapping concepts professionally.
- Provide ATS-friendly names for the skills.
- Return an array of strings representing the normalized skills.`,
      userPrompt: `Raw Skills:\n${JSON.stringify(input.rawSkills, null, 2)}\n\nOptimize the skills list.`,
      outputSchema: skillsOptimizationOutputSchema,
      profile: AIProfiles.SUMMARY_PROFILE,
      metadata: {
        module: 'SkillsOptimizationPrompt',
        promptVersion: '1.0.0'
      }
    };
  }
};
