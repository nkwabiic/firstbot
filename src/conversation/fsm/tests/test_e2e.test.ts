process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.NODE_ENV = 'test';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FSMEngine } from '../FSMEngine.js';
import { logger } from '../../../utils/logger.js';
logger.level = 'silent';
import { User, CV } from '@prisma/client';
import { AIPolicyEngine } from '../../../ai/policy/AIPolicyEngine.js';
import { AIProvider } from '../../../ai/policy/AIProvider.js';
import { AICache } from '../../../ai/cache/AICache.js';
import { ConversationEventBus } from '../../events/event-bus.js';
import { ConversationEventType } from '../../events/event-types.js';

class MockIntentProvider implements AIProvider {
  public responseData: any = { intent: 'answer', confidence: 98, extractedData: { fullName: 'John Doe' }, reason: 'Clear' };
  public async execute<TOutput>(promptDef: any, context: any): Promise<string> {
    if (promptDef.metadata.module === 'ValidationPrompt') {
       return JSON.stringify({ isValid: true });
    }
    return JSON.stringify(this.responseData);
  }
}

describe('FSMEngine Strict E2E Tests', () => {
  let fsm: FSMEngine;
  let sentMessages: string[] = [];
  let meta: any = {};
  let mockProviderAI: MockIntentProvider;
  let publishedEvents: any[] = [];
  let cvData: any = { id: 'cv1', userId: 'user1' };
  let mockProvider: any;

  beforeEach(() => {
    sentMessages = [];
    meta = {} as any;
    publishedEvents = [];
    cvData = { id: 'cv1', userId: 'user1' };

    mockProviderAI = new MockIntentProvider();
    (AIPolicyEngine as any).instance = undefined;
    AIPolicyEngine.initialize(mockProviderAI);
    (AICache as any).clear();

    const eventBus = ConversationEventBus.getInstance();
    eventBus.publish = async (event: any) => {
        publishedEvents.push(event);
    };

    mockProvider = {
      sendMessage: async (phone: string, msg: string) => { sentMessages.push(msg); },
      sendInteractiveMessage: async () => {},
      sendDocument: async () => {}
    } as any;
    
    const mockConvService = {
      updateConversation: async (id: string, data: any) => {
          if (data.metadata) meta = data.metadata;
          if (data.currentState === 'COMPLETED') meta = {} as any; // Handle clear on completion
      }
    } as any;
    
    const mockCvService = {
      getActiveCVForUser: async () => cvData,
      createCV: async () => cvData,
      updateCV: async (id: string, data: any) => {
          cvData = { ...cvData, ...data };
      }
    } as any;

    const mockPdfService = {
      generatePDF: async () => 'http://pdf.url'
    } as any;

    const mockAuthoringService = {
      enhanceCV: async () => ({ success: true, data: cvData })
    } as any;

    const mockCvPreviewService = {
      generateHtml: () => '<html>Mock HTML</html>'
    } as any;

    fsm = new FSMEngine(mockProvider, mockConvService, mockCvService, mockPdfService, mockAuthoringService, mockCvPreviewService);
  });

  const runTick = async (message: string) => {
      const user = { id: 'user1', phone: '123' } as User;
      const conversation = { id: 'conv1', metadata: meta } as any;
      console.log(`\n[USER]: ${message}`);
      const origLen = sentMessages.length;
      await fsm.processMessage(user, conversation, message);
      for (let i = origLen; i < sentMessages.length; i++) {
          console.log(`[BOT]: ${sentMessages[i].replace(/\n/g, ' ')}`);
      }
  };

  it('runs strict scenarios', async () => {
    // 1. Initial Start
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { lang: 'en' } };
    await runTick('hello');
    assert.strictEqual(meta['currentSectionId'], 'LANGUAGE_SELECTION');
    
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { lang: 'en' } };
    await runTick('english');
    assert.strictEqual(meta['currentSectionId'], 'PERSONAL_INFO');

    // 2. Fill Personal Info
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { fullName: 'John Doe' } };
    await runTick('John Doe');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'john@example.com' } };
    await runTick('john@example.com');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { phone: '0712345678' } };
    await runTick('0712345678');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { location: 'Tanzania' } };
    await runTick('Tanzania');

    // 3. Fill Summary
    assert.strictEqual(meta['currentSectionId'], 'SUMMARY');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { professionalSummary: 'Great dev' } };
    await runTick('Great dev');

    // 4. Experience Section - Boolean validation
    assert.strictEqual(meta['currentSectionId'], 'EXPERIENCE');
    assert.strictEqual(meta['currentFieldId'], 'hasExperience');
    
    // Bot: Do you have work experience? (Yes/No)
    // User: Google
    // Expected: FSM rejects input. Remains on hasExperience.
    // The intent might extract google, but validation should reject.
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { hasExperience: 'Google' } };
    await runTick('Google');
    assert.strictEqual(meta['currentFieldId'], 'hasExperience'); // Should still be here

    // Now give correct answer Yes
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: {} }; // extractedData empty to test trim OR just hasExperience: Yes
    await runTick('Yes');
    assert.strictEqual(meta['currentFieldId'], 'company');

    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Google' } };
    await runTick('Google');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Engineer' } };
    await runTick('Engineer');

    // 5. Year validation
    // User: Engineer
    // Expected: Reject. Stay on startYear.
    assert.strictEqual(meta['currentFieldId'], 'startYear');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: 'Engineer' } };
    await runTick('Engineer');
    assert.strictEqual(meta['currentFieldId'], 'startYear'); // Should still be here

    // Provide valid year
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' } };
    await runTick('2020');
    assert.strictEqual(meta['currentFieldId'], 'endYear');

    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: 'Present' } };
    await runTick('Present');

    assert.strictEqual(meta['currentFieldId'], 'ADD_ANOTHER');
    await runTick('NO');

    // 6. Education Section (just skip to save time)
    assert.strictEqual(meta['currentSectionId'], 'EDUCATION');
    assert.strictEqual(meta['currentFieldId'], 'hasEducation');
    await runTick('No'); // Boolean validation test 2

    // 7. Skills mapping
    // Fill Skills
    assert.strictEqual(meta['currentSectionId'], 'SKILLS');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { skills: 'TypeScript, React' } };
    await runTick('TypeScript, React');

    // Skip Languages, Projects, Certifications, Hobbies
    assert.strictEqual(meta['currentSectionId'], 'LANGUAGES');
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99 };
    await runTick('Yes'); // Confirm Skip

    assert.strictEqual(meta['currentSectionId'], 'PROJECTS');
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');

    assert.strictEqual(meta['currentSectionId'], 'CERTIFICATIONS');
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');

    assert.strictEqual(meta['currentSectionId'], 'HOBBIES');
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');

    // 8. Confirm References are NOT entered automatically.
    // Ensure we actually get prompted for References and they aren't skipped.
    assert.strictEqual(meta['currentSectionId'], 'REFERENCES');
    assert.strictEqual(meta['currentFieldId'], 'refName');
    
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refName: 'Jane Doe' } };
    await runTick('Jane Doe');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refCompany: 'Apple' } };
    await runTick('Apple');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refPhone: 'jane@example.com' } };
    await runTick('jane@example.com');
    await runTick('NO'); // No another reference

    // 9. Review Mode
    assert.strictEqual(meta['currentSectionId'], 'REVIEW');
    
    // 10. Edit flow
    // Edit Personal Info.
    mockProviderAI.responseData = { intent: 'edit', confidence: 99, extractedData: { sectionToEdit: 'PERSONAL_INFO' } };
    await runTick('edit personal info');
    
    assert.strictEqual(meta['currentSectionId'], 'PERSONAL_INFO');
    assert.strictEqual(meta['returnToReview'], true);

    // Complete every field.
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { fullName: 'Bob Smith' } };
    await runTick('Bob Smith');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'bob@example.com' } };
    await runTick('bob@example.com');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { phone: '111222333' } };
    await runTick('111222333');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { location: 'Nairobi' } };
    await runTick('Nairobi');

    // Return to Review.
    assert.strictEqual(meta['currentSectionId'], 'REVIEW');
    assert.strictEqual(meta['returnToReview'], false);

    // Generate PDF.
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: {} };
    await runTick('Yes'); // Confirm Review

    assert.strictEqual(cvData.pdfUrl, 'http://pdf.url');
    assert.deepStrictEqual(Object.keys(meta).length, 0);

    // Immediately send: hello
    // Expected: Welcome, Language, Personal Info
    // Not old state.
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { lang: 'en' } };
    await runTick('hello');
    
    // If it restarted properly, we should be at WELCOME -> LANGUAGE_SELECTION
    assert.strictEqual(meta['currentSectionId'], 'LANGUAGE_SELECTION');
    
    console.log("ALL SCENARIOS PASSED!");
  });
});
