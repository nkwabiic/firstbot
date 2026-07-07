import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthoringService } from '../AuthoringService.js';
import { AIPolicyEngine } from '../../policy/AIPolicyEngine.js';

// Mock AIPolicyEngine
vi.mock('../../policy/AIPolicyEngine.js', () => {
  return {
    AIPolicyEngine: {
      getInstance: vi.fn().mockReturnValue({
        execute: vi.fn()
      }),
      initialize: vi.fn()
    }
  };
});

describe('AuthoringService', () => {
  let authoringService: AuthoringService;
  let mockExecute: any;

  beforeEach(() => {
    vi.clearAllMocks();
    authoringService = new AuthoringService();
    mockExecute = AIPolicyEngine.getInstance().execute;
  });

  it('should generate professional summary', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      data: { professionalSummary: 'Experienced developer.' },
      latencyMs: 100,
      modelUsed: 'gemini-1.5-flash'
    });

    const result = await authoringService.generateSummary({ experience: 'worked as developer' });
    
    expect(result.success).toBe(true);
    expect(result.data?.professionalSummary).toBe('Experienced developer.');
    expect(mockExecute).toHaveBeenCalledTimes(1);
    const callArgs = mockExecute.mock.calls[0][0];
    expect(callArgs.metadata.module).toBe('SummaryGenerationPrompt');
  });

  it('should enhance experience', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      data: { enhancedExperience: [{ companyName: 'Acme', description: '• Did things' }] },
      latencyMs: 100,
      modelUsed: 'gemini-1.5-flash'
    });

    const result = await authoringService.enhanceExperience([{ companyName: 'Acme', description: 'Did things' }]);
    
    expect(result.success).toBe(true);
    expect(result.data?.enhancedExperience[0].companyName).toBe('Acme');
    expect(mockExecute).toHaveBeenCalledTimes(1);
    const callArgs = mockExecute.mock.calls[0][0];
    expect(callArgs.metadata.module).toBe('ExperienceEnhancementPrompt');
  });

  it('should enhance projects', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      data: { enhancedProjects: [{ projectName: 'System', projectDescription: '• Built system' }] },
      latencyMs: 100,
      modelUsed: 'gemini-1.5-flash'
    });

    const result = await authoringService.enhanceProjects([{ projectName: 'System', projectDescription: 'Built system' }]);
    
    expect(result.success).toBe(true);
    expect(result.data?.enhancedProjects[0].projectName).toBe('System');
  });

  it('should optimize skills', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      data: { optimizedSkills: ['Microsoft Word', 'Microsoft Excel'] },
      latencyMs: 100,
      modelUsed: 'gemini-1.5-flash'
    });

    const result = await authoringService.optimizeSkills(['word', 'excel', 'word']);
    
    expect(result.success).toBe(true);
    expect(result.data?.optimizedSkills).toEqual(['Microsoft Word', 'Microsoft Excel']);
  });

  it('should check section consistency', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      data: { hasInconsistencies: true, inconsistencies: ['Dates overlap'], recommendations: ['Fix dates'] },
      latencyMs: 100,
      modelUsed: 'gemini-1.5-flash'
    });

    const result = await authoringService.checkConsistency({});
    
    expect(result.success).toBe(true);
    expect(result.data?.hasInconsistencies).toBe(true);
  });

  it('should perform HR review', async () => {
    mockExecute.mockResolvedValue({
      success: true,
      data: { readinessLevel: 'High', overallFeedback: 'Looks good' },
      latencyMs: 100,
      modelUsed: 'gemini-1.5-flash'
    });

    const result = await authoringService.hrReview({});
    
    expect(result.success).toBe(true);
    expect(result.data?.readinessLevel).toBe('High');
  });
});
