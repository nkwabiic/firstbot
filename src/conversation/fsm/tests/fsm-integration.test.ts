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

describe('FSMEngine Full Integration', () => {
  let fsm: FSMEngine;
  let sentMessages: string[] = [];
  let meta: any = {};
  let mockProviderAI: MockIntentProvider;
  let publishedEvents: any[] = [];
  let cvData: any = { id: 'cv1', userId: 'user1' };

  beforeEach(() => {
    sentMessages = [];
    meta = {};
    publishedEvents = [];
    cvData = { id: 'cv1', userId: 'user1' };
    
    mockProviderAI = new MockIntentProvider();
    (AIPolicyEngine as any).instance = undefined;
    AIPolicyEngine.initialize(mockProviderAI);
    // clear AICache to prevent cross-test contamination
    (AICache as any).clear();

    // Mock Event Bus
    const eventBus = ConversationEventBus.getInstance();
    eventBus.publish = async (event: any) => {
        publishedEvents.push(event);
    };

    const mockProvider = {
      sendMessage: async (phone: string, msg: string) => { sentMessages.push(msg); },
      sendInteractiveMessage: async () => {},
      sendDocument: async () => {}
    } as any;
    
    const mockConvService = {
      updateConversation: async (id: string, data: any) => {
          if (data.metadata) meta = data.metadata;
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

  const runTick = async (message: string, currentMeta: any = undefined) => {
      const user = { id: 'user1', phone: '123' } as User;
      if (currentMeta !== undefined) {
          const finalMeta = currentMeta !== null ? { lang: 'en', ...currentMeta } : {};
          meta = finalMeta;
      }
      const conversation = { id: 'conv1', metadata: meta } as any;
      console.log(`\n[USER]: ${message}`);
      const origLen = sentMessages.length;
      await fsm.processMessage(user, conversation, message);
      for (let i = origLen; i < sentMessages.length; i++) console.log(`[BOT]: ${sentMessages[i]}`);
      printState();
  };

  const printState = () => {
     console.log('--- METADATA STATE ---');
     console.log(`currentSectionId: ${meta.currentSectionId}`);
     console.log(`currentFieldId: ${meta.currentFieldId}`);
     console.log(`completedSections: ${meta.completedSections}`);
     console.log(`skippedSections: ${meta.skippedSections}`);
     console.log(`returnToReview: ${meta.returnToReview}`);
     console.log(`pendingConfirmationData: ${JSON.stringify(meta.pendingConfirmationData)}`);
     console.log(`lastBotMessage: ${meta.lastBotMessage}`);
     console.log(`lang: ${meta.lang}`);
     console.log('----------------------');
  }

  it('verifies the full flow: startup, all sections, review, edit, and pdf generation', async () => {
    // 1. Startup Flow
    await runTick('hello', null);
    assert.strictEqual(meta.currentSectionId, 'LANGUAGE_SELECTION');
    assert.strictEqual(meta.currentFieldId, 'lang');
    assert.ok(publishedEvents.find(e => e.event === ConversationEventType.SectionStarted && e.section === 'LANGUAGE_SELECTION'));

    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { lang: 'en' } };
    await runTick('English');
    assert.strictEqual(meta.currentSectionId, 'PERSONAL_INFO');
    assert.strictEqual(meta.currentFieldId, 'fullName');

    // 2. Personal Info Flow
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { fullName: 'John Doe' } };
    await runTick('John Doe');
    assert.strictEqual(meta.currentFieldId, 'email');

    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'test@example.com' } };
    await runTick('test@example.com');
    assert.strictEqual(meta.currentFieldId, 'phone');

    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { phone: '123456789' } };
    await runTick('123456789');
    assert.strictEqual(meta.currentFieldId, 'location');

    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { location: 'Tanzania' } };
    await runTick('Tanzania');
    assert.strictEqual(meta.currentSectionId, 'SUMMARY'); // moved to SUMMARY
    assert.ok(publishedEvents.find(e => e.event === ConversationEventType.SectionCompleted && e.section === 'PERSONAL_INFO'));

    // 3. Summary Flow
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { professionalSummary: 'Software Engineer' } };
    await runTick('Software Engineer');
    assert.strictEqual(meta.currentSectionId, 'EXPERIENCE'); // moved to EXPERIENCE

    // 4. Work Experience Flow
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Google' } };
    await runTick('Google');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Dev' } };
    await runTick('Dev');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' } };
    await runTick('2020');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: '2022' } };
    await runTick('2022');
    
    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');

    // Answer YES to add another
    await runTick('YES');
    assert.strictEqual(meta.currentFieldId, 'company'); // restarted section fields
    
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Facebook' } };
    await runTick('Facebook');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Dev' } };
    await runTick('Dev');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2022' } };
    await runTick('2022');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: 'Present' } };
    await runTick('Present');
    
    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');

    // Answer NO to finish experience
    await runTick('NO');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    // 5. Help Flow
    mockProviderAI.responseData = { intent: 'help', confidence: 99, botReply: 'I can help.' };
    await runTick('help me');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    // 6. Clarification Flow
    mockProviderAI.responseData = { intent: 'clarification', confidence: 99, botReply: 'I clarify.' };
    await runTick('what?');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    // 8. Skip flow with resume and then skip
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP');

    // Answer NO to confirm skip -> should resume
    mockProviderAI.responseData = { intent: 'answer', confidence: 99 };
    await runTick('NO');
    assert.strictEqual(meta.currentFieldId, 'institution');

    // Skip again
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP');

    // Answer YES to confirm skip -> should advance
    mockProviderAI.responseData = { intent: 'answer', confidence: 99 };
    await runTick('YES');
    assert.strictEqual(meta.currentSectionId, 'SKILLS');

    // Answer SKILLS
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { skills: 'TypeScript' } };
    await runTick('TypeScript');

    // Answer LANGUAGES (Order 7)
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageName: 'English' } };
    await runTick('English');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageLevel: 'Fluent' } };
    await runTick('Fluent');
    await runTick('NO');

    // Answer PROJECTS (Order 8)
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectName: 'Proj 1' } };
    await runTick('Proj 1');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectDescription: 'Did things' } };
    await runTick('Did things');
    await runTick('NO');

    // Answer CERTIFICATIONS (Order 9)
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certName: 'Cert 1' } };
    await runTick('Cert 1');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certYear: '2020' } };
    await runTick('2020');
    await runTick('NO');

    // Answer HOBBIES
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { hobbies: 'Reading' } };
    await runTick('Reading');

    // Answer REFERENCES
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refName: 'John Ref' } };
    await runTick('John Ref');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refCompany: 'Google' } };
    await runTick('Google');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refPhone: 'john@example.com' } };
    await runTick('john@example.com');
    await runTick('NO');

    // 9. Review Mode
    assert.strictEqual(meta.currentSectionId, 'REVIEW');
    assert.strictEqual(meta.currentFieldId, 'DONE');

    // 10. Edit Flow
    mockProviderAI.responseData = { intent: 'edit', confidence: 99, extractedData: { sectionToEdit: 'PERSONAL_INFO' } };
    await runTick('edit personal info');
    assert.strictEqual(meta.currentSectionId, 'PERSONAL_INFO');
    assert.strictEqual(meta.returnToReview, true);
    assert.ok(publishedEvents.find(e => e.event === ConversationEventType.EditStarted));

    // Go through all fields in edit mode
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { fullName: 'New Name' } };
    await runTick('New Name');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'new@example.com' } };
    await runTick('new@example.com');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { phone: '0712345678' } };
    await runTick('0712345678');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { location: 'New Location' } };
    await runTick('New Location');
    // Should return directly to REVIEW
    assert.strictEqual(meta.currentSectionId, 'REVIEW');
    assert.strictEqual(meta.returnToReview, false);

    // 11. PDF Generation (finish review)
    await runTick('yes');
    assert.ok(publishedEvents.find(e => e.event === ConversationEventType.ReviewCompleted));
    assert.ok(publishedEvents.find(e => e.event === ConversationEventType.PDFGenerated));
    assert.strictEqual(cvData.pdfUrl, 'http://pdf.url');

    printState();
  });

  it('verifies confirmation flow and restart recovery', async () => {
     // 1. Restart Recovery
     // We start by passing a saved metadata state directly
     const savedState = {
         currentSectionId: 'EXPERIENCE',
         currentFieldId: 'jobTitle',
         lang: 'en'
     };
     await runTick('hello', savedState);
     // It should process "hello" based on EXPERIENCE/jobTitle context
     // Since 'hello' isn't a good answer, let's say it gives an unknown or help
     // Wait, let's just supply an answer
     mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Engineer' } };
     await runTick('Engineer', savedState);
     assert.strictEqual(meta.currentFieldId, 'startYear'); // Next field

     // 2. Confirmation Flow
     mockProviderAI.responseData = { intent: 'answer', confidence: 85, extractedData: { startYear: '2020' } };
     await runTick('2020');
     assert.strictEqual(meta.pendingConfirmationData?.startYear, '2020');
     assert.strictEqual(meta.currentFieldId, 'startYear'); // Still here pending confirmation

     // Answer YES to confirm
     mockProviderAI.responseData = { intent: 'confirmation', confidence: 99, extractedData: { confirmed: true } };
     await runTick('yes');
     assert.strictEqual(meta.pendingConfirmationData, undefined);
     assert.strictEqual(meta.currentFieldId, 'endYear'); // Advanced
  });
});
