import { describe, it, expect } from 'vitest';
import { summaryGenerationInputSchema, summaryGenerationOutputSchema } from '../../prompts/v1/summary-generation.prompt.js';
import { experienceEnhancementInputSchema, experienceEnhancementOutputSchema } from '../../prompts/v1/experience-enhancement.prompt.js';
import { sectionConsistencyInputSchema, sectionConsistencyOutputSchema } from '../../prompts/v1/section-consistency.prompt.js';

describe('Authoring Schemas Validation', () => {
  it('should validate summary generation input', () => {
    const input = { experience: 'some', skills: ['node'] };
    const result = summaryGenerationInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate summary generation output', () => {
    const output = { professionalSummary: 'A good summary.' };
    const result = summaryGenerationOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it('should fail on invalid summary generation output', () => {
    const output = { somethingElse: 'A good summary.' };
    const result = summaryGenerationOutputSchema.safeParse(output);
    expect(result.success).toBe(false);
  });

  it('should validate experience enhancement output', () => {
    const output = {
      enhancedExperience: [{ companyName: 'Acme', description: '• Built things' }]
    };
    const result = experienceEnhancementOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it('should validate section consistency output', () => {
    const output = {
      hasInconsistencies: true,
      inconsistencies: ['Dates overlap'],
      recommendations: ['Fix dates']
    };
    const result = sectionConsistencyOutputSchema.safeParse(output);
    expect(result.success).toBe(true);
  });
});
