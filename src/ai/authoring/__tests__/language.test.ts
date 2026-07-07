import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../../prompt/PromptBuilder.js';
import { ContextBuilder } from '../../context/ContextBuilder.js';
import { experienceEnhancementPromptModule } from '../../prompts/v1/experience-enhancement.prompt.js';
import { summaryGenerationPromptModule } from '../../prompts/v1/summary-generation.prompt.js';

describe('Authoring Language Consistency', () => {
  it('should inject Swahili into experience enhancement prompt', () => {
    const context = ContextBuilder.build({
      language: 'sw',
      conversationId: 'test',
      currentSection: 'REVIEW',
      currentState: 'AUTHORING',
      lastBotMessage: '',
      latestUserMessage: '',
      conversationHistory: [],
      cvSnapshot: {},
      completedSections: [],
      activeTemplate: 'modern',
      sessionMetadata: {}
    });

    const promptDef = PromptBuilder.build(experienceEnhancementPromptModule, context, { rawExperience: 'some' });
    expect(promptDef.systemInstruction).toContain('Language: sw');
  });

  it('should inject English into summary generation prompt', () => {
    const context = ContextBuilder.build({
      language: 'en',
      conversationId: 'test',
      currentSection: 'REVIEW',
      currentState: 'AUTHORING',
      lastBotMessage: '',
      latestUserMessage: '',
      conversationHistory: [],
      cvSnapshot: {},
      completedSections: [],
      activeTemplate: 'modern',
      sessionMetadata: {}
    });

    const promptDef = PromptBuilder.build(summaryGenerationPromptModule, context, { experience: 'some' });
    expect(promptDef.systemInstruction).toContain('Language: en');
  });
});
