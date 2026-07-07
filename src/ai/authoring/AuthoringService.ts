import { AIPolicyEngine } from '../policy/AIPolicyEngine.js';
import { PromptBuilder } from '../prompt/PromptBuilder.js';
import { ContextBuilder } from '../context/ContextBuilder.js';
import { summaryGenerationPromptModule } from '../prompts/v1/summary-generation.prompt.js';
import { experienceEnhancementPromptModule } from '../prompts/v1/experience-enhancement.prompt.js';
import { projectEnhancementPromptModule } from '../prompts/v1/project-enhancement.prompt.js';
import { skillsOptimizationPromptModule } from '../prompts/v1/skills-optimization.prompt.js';
import { educationEnhancementPromptModule } from '../prompts/v1/education-enhancement.prompt.js';
import { sectionConsistencyPromptModule } from '../prompts/v1/section-consistency.prompt.js';
import { hrReviewPromptModule } from '../prompts/v1/hr-review.prompt.js';
import { CV } from '@prisma/client';

type CVData = Partial<CV> & Record<string, any>;

export class AuthoringService {
  private policyEngine = AIPolicyEngine.getInstance();

  private buildContext(language: 'en' | 'sw', cvData: CVData = {}) {
    return ContextBuilder.build({
      language,
      conversationId: 'authoring-service',
      currentSection: 'REVIEW',
      currentState: 'AUTHORING',
      lastBotMessage: '',
      latestUserMessage: '',
      conversationHistory: [],
      cvSnapshot: cvData as any,
      completedSections: [],
      activeTemplate: 'modern',
      sessionMetadata: {} as any
    });
  }

  private async safeTask(taskFn: () => Promise<any>) {
    try {
      return await taskFn();
    } catch (error) {
      return { success: false, data: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async generateSummary(data: CVData, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang, data);
    const promptDef = PromptBuilder.build(summaryGenerationPromptModule, context, {
      jobTitle: data.jobTitle || '',
      education: data.education || [],
      experience: data.experience || [],
      skills: data.skills || [],
      projects: data.projects || []
    });
    return this.policyEngine.execute(promptDef, context);
  }

  async enhanceExperience(rawExperience: any, jobTitle?: string | null, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang);
    const promptDef = PromptBuilder.build(experienceEnhancementPromptModule, context, { rawExperience, jobTitle: jobTitle || undefined });
    return this.policyEngine.execute(promptDef, context);
  }

  async enhanceProjects(rawProjects: any, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang);
    const promptDef = PromptBuilder.build(projectEnhancementPromptModule, context, { rawProjects });
    return this.policyEngine.execute(promptDef, context);
  }

  async optimizeSkills(rawSkills: any, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang);
    const promptDef = PromptBuilder.build(skillsOptimizationPromptModule, context, { rawSkills });
    return this.policyEngine.execute(promptDef, context);
  }

  async enhanceEducation(rawEducation: any, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang);
    const promptDef = PromptBuilder.build(educationEnhancementPromptModule, context, { rawEducation });
    return this.policyEngine.execute(promptDef, context);
  }

  async checkConsistency(cvData: CVData, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang, cvData);
    const promptDef = PromptBuilder.build(sectionConsistencyPromptModule, context, { cvData });
    return this.policyEngine.execute(promptDef, context);
  }

  async hrReview(cvData: CVData, lang: 'en' | 'sw' = 'en') {
    const context = this.buildContext(lang, cvData);
    const promptDef = PromptBuilder.build(hrReviewPromptModule, context, { cvData });
    return this.policyEngine.execute(promptDef, context);
  }

  async enhanceCV(cvData: CVData, lang: 'en' | 'sw' = 'en') {
    if (!cvData || Object.keys(cvData).length === 0) {
      return { success: false, data: cvData, reason: 'Empty input data' };
    }

    // Step 1: Run independent authoring tasks in parallel safely
    const [summaryRes, experienceRes, skillsRes, educationRes, projectsRes] = await Promise.all([
      this.safeTask(() => this.generateSummary(cvData, lang)),
      cvData.experience ? this.safeTask(() => this.enhanceExperience(cvData.experience, cvData.jobTitle, lang)) : Promise.resolve({ success: true, data: null }),
      cvData.skills ? this.safeTask(() => this.optimizeSkills(cvData.skills, lang)) : Promise.resolve({ success: true, data: null }),
      cvData.education ? this.safeTask(() => this.enhanceEducation(cvData.education, lang)) : Promise.resolve({ success: true, data: null }),
      cvData.projects ? this.safeTask(() => this.enhanceProjects(cvData.projects, lang)) : Promise.resolve({ success: true, data: null })
    ]);

    // Construct the partially enhanced CV
    const mergedData = {
      ...cvData,
      professionalSummary: summaryRes.data?.professionalSummary || cvData.professionalSummary,
      experience: experienceRes.data?.enhancedExperience || cvData.experience,
      skills: skillsRes.data?.optimizedSkills || cvData.skills,
      education: educationRes.data?.enhancedEducation || cvData.education,
      projects: projectsRes.data?.enhancedProjects || cvData.projects
    };

    // Step 2: Run review tasks in parallel on the enhanced CV
    const [consistencyRes, hrReviewRes] = await Promise.all([
      this.safeTask(() => this.checkConsistency(mergedData, lang)),
      this.safeTask(() => this.hrReview(mergedData, lang))
    ]);

    return {
      success: true,
      data: mergedData,
      consistency: consistencyRes.data,
      hrReview: hrReviewRes.data
    };
  }
}
