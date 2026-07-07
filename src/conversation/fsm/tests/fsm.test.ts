process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.NODE_ENV = 'test';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { FSMEngine } from '../FSMEngine.js';
import { Conversation, User, CV } from '@prisma/client';
import { AIPolicyEngine } from '../../../ai/policy/AIPolicyEngine.js';
import { AIProvider } from '../../../ai/policy/AIProvider.js';

class MockIntentProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public responseData: any = { intent: 'answer', confidence: 98, extractedData: { fullName: 'John Doe' }, reason: 'Clear' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  public async execute<TOutput>(promptDef: any, context: any): Promise<string> {
    if (promptDef.metadata.module === 'ValidationPrompt') {
       return JSON.stringify({ isValid: true });
    }
    return JSON.stringify(this.responseData);
  }
}

describe('FSMEngine', () => {
  let fsm: FSMEngine;
  let sentMessages: string[] = [];
  let meta: any = {};
  let mockProviderAI: MockIntentProvider;
  
  beforeEach(() => {
    sentMessages = [];
    meta = {};
    
    mockProviderAI = new MockIntentProvider();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AIPolicyEngine as any).instance = undefined;
    AIPolicyEngine.initialize(mockProviderAI);

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
      getActiveCVForUser: async () => ({ id: 'cv1', userId: 'user1' } as CV),
      createCV: async () => ({ id: 'cv1', userId: 'user1' } as CV)
    } as any;

    const mockPdfService = {
      generatePDF: async () => 'http://pdf.url'
    } as any;

    const mockAuthoringService = {
      enhanceCV: async () => ({ success: true, data: {} })
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
      await fsm.processMessage(user, conversation, message);
  };

  it('prompts for language selection when initialized with no language', async () => {
    await runTick('hello');
    assert.strictEqual(sentMessages.length, 1);
    assert.match(sentMessages[0], /choose your language/i);
    assert.strictEqual(meta.lang, undefined);
  });

  it('sets language and starts the first section on valid choice', async () => {
    await runTick('hello');
    assert.strictEqual(sentMessages.length, 1);
    assert.match(sentMessages[0], /choose your language/i);
    assert.strictEqual(meta.lang, undefined);

    sentMessages = [];

    mockProviderAI.responseData = { intent: 'answer', confidence: 100, extractedData: { lang: 'en' }, reason: 'English selected' };
    await runTick('2', { currentSectionId: 'LANGUAGE_SELECTION', currentFieldId: 'lang' });

    assert.strictEqual(meta.lang, 'en');
    assert.strictEqual(meta.currentSectionId, 'PERSONAL_INFO');
    assert.strictEqual(sentMessages.length, 3);
    assert.match(sentMessages[0], /Live Progress/);
    assert.match(sentMessages[1], /Let's begin by gathering your basic personal information/);
    assert.match(sentMessages[2], /May I have your full name/);
  });

  it('advances field on answer intent', async () => {
    mockProviderAI.responseData = { intent: 'answer', confidence: 98, extractedData: { fullName: 'John Doe' }, reason: 'Clear' };
    await runTick('John Doe', { currentSectionId: 'PERSONAL_INFO', currentFieldId: 'fullName' });
    
    // Should advance to next field (email)
    assert.strictEqual(meta.currentFieldId, 'email');
    assert.match(sentMessages[0], /Could you please share your professional email address/);
  });

  it('advances field on location answer', async () => {
    mockProviderAI.responseData = { 
        intent: 'answer', 
        confidence: 99, 
        extractedData: { location: 'Dar es Salaam Tanzania' }, 
        reason: 'Clear' 
    };
    await runTick('Dar es Salaam Tanzania', { currentSectionId: 'PERSONAL_INFO', currentFieldId: 'location' });
    
    // Should advance to next section (SUMMARY) because location is the last field in PERSONAL_INFO
    assert.strictEqual(meta.currentSectionId, 'SUMMARY');
  });

  it('handles help intent (interruption)', async () => {
    mockProviderAI.responseData = { intent: 'help', confidence: 99, reason: 'Clear', botReply: 'Sure, I can help you with your name.' };
    await runTick('help', { currentSectionId: 'PERSONAL_INFO', currentFieldId: 'fullName' });
    
    assert.strictEqual(meta.currentFieldId, 'fullName'); // stays in same state
    assert.match(sentMessages[0], /Sure, I can help/);
    assert.match(sentMessages[1], /May I have your full name/); // resumes exactly where it stopped
  });

  it('handles skip logic for required section', async () => {
    mockProviderAI.responseData = { intent: 'skip', confidence: 99, reason: 'Clear' };
    // Personal info is required.
    await runTick('skip', { currentSectionId: 'PERSONAL_INFO', currentFieldId: 'fullName' });
    
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP');
    // removed assert as message is now dynamically generated in AI/logic
  });

  it('handles skip logic for optional section', async () => {
    mockProviderAI.responseData = { intent: 'skip', confidence: 99, reason: 'Clear' };
    // Projects is optional.
    await runTick('skip', { currentSectionId: 'PROJECTS', currentFieldId: 'projectName' });
    
    assert.strictEqual(meta.skippedSections.includes('PROJECTS'), true);
    assert.strictEqual(meta.currentSectionId, 'CERTIFICATIONS'); // moved to next section
  });

  it('handles multi-field extraction skipping', async () => {
    // Intent engine extracts both company and title at once
    mockProviderAI.responseData = { 
       intent: 'answer', 
       confidence: 96, reason: 'Clear', 
       extractedData: { company: 'Vodacom', jobTitle: 'Network Engineer' } 
    };
    // Let's assume we are at company. Next field is jobTitle.
    await runTick('I worked at Vodacom as Network Engineer', { currentSectionId: 'EXPERIENCE', currentFieldId: 'company' });
    
    // Should it skip jobTitle automatically?
    // Wait, the FSMEngine logic we wrote just advances `currentFieldId` to the next one defined in the section array.
    // If we extracted `jobTitle` as well, the next time we enter FSMEngine it will still be at `jobTitle` because `advanceField` just does currentIndex + 1!
    assert.strictEqual(meta.currentFieldId, "startYear");
  });

  it('handles adaptive skip logic for no experience', async () => {
    mockProviderAI.responseData = { intent: 'skip', confidence: 99, reason: 'Clear' };
    
    await runTick('i have no experience', { currentSectionId: 'EXPERIENCE', currentFieldId: 'company' });
    
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP');
    
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, reason: 'Clear' };
    await runTick('yes i am sure', { currentSectionId: 'EXPERIENCE', currentFieldId: 'CONFIRM_SKIP' });
    
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');
  });


  it('handles edit intent properly (e.g. badili elimu)', async () => {
    mockProviderAI.responseData = { intent: 'edit', confidence: 99, extractedData: { sectionToEdit: 'EDUCATION' }, reason: 'Clear' };
    await runTick('badili elimu', { currentSectionId: 'EXPERIENCE', currentFieldId: 'company' });
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');
  });

  it('handles edit intent properly (e.g. phone sio hii)', async () => {
    mockProviderAI.responseData = { intent: 'edit', confidence: 99, extractedData: { sectionToEdit: 'phone' }, reason: 'Clear' };
    await runTick('phone sio hii', { currentSectionId: 'EXPERIENCE', currentFieldId: 'company' });
    assert.strictEqual(meta.currentSectionId, 'PERSONAL_INFO');
  });

  it('handles clarification in CONFIRM_SKIP properly (e.g. why is experience important)', async () => {
    mockProviderAI.responseData = { intent: 'clarification', confidence: 99, reason: 'Clear', botReply: 'Experience shows employers your real world skills.' };
    await runTick('why is experience important?', { currentSectionId: 'EXPERIENCE', currentFieldId: 'CONFIRM_SKIP' });
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP'); // Should remain
    assert.match(sentMessages[0], /Experience shows employers your real world skills/);
  });

  it('handles help in CONFIRM_SKIP properly (e.g. give me an example first)', async () => {
    mockProviderAI.responseData = { intent: 'help', confidence: 99, reason: 'Clear', botReply: 'An example would be working as a cashier.' };
    await runTick('give me an example first', { currentSectionId: 'EXPERIENCE', currentFieldId: 'CONFIRM_SKIP' });
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP'); // Should remain
    assert.match(sentMessages[0], /An example would be working as a cashier/);
  });

  it('handles unknown/clarification in CONFIRM_SKIP (e.g. sina uhakika)', async () => {
    mockProviderAI.responseData = { intent: 'unknown', confidence: 50, reason: 'Unclear', botReply: 'Tafadhali chagua Ndio au Hapana.' };
    await runTick('sina uhakika', { currentSectionId: 'EXPERIENCE', currentFieldId: 'CONFIRM_SKIP' });
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP'); // Should remain
    assert.match(sentMessages[0], /Tafadhali chagua Ndio au Hapana/);
  });

  it('handles edit command from any section', async () => {
    mockProviderAI.responseData = { intent: 'edit', confidence: 99, extractedData: { sectionToEdit: 'PERSONAL_INFO' }, reason: 'Clear' };
    
    await runTick('edit personal information', { currentSectionId: 'EDUCATION', currentFieldId: 'institution' });
    
    assert.strictEqual(meta.currentSectionId, 'PERSONAL_INFO');
  });

  it('runs the full location integration trace successfully', async () => {
    // Starting at WELCOME
    await runTick('hello', null); // Initial state
    assert.strictEqual(meta.currentSectionId, 'LANGUAGE_SELECTION');
    assert.strictEqual(meta.currentFieldId, 'lang');

    // Answer LANGUAGE_SELECTION
    mockProviderAI.responseData = { intent: 'answer', confidence: 100, extractedData: { lang: 'en' }, reason: 'English selected' };
    await runTick('English');
    assert.strictEqual(meta.currentSectionId, 'PERSONAL_INFO');
    assert.strictEqual(meta.currentFieldId, 'fullName');

    // Answer fullName
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { fullName: 'John Doe' }, reason: 'Clear' };
    await runTick('John Doe');
    assert.strictEqual(meta.currentFieldId, 'email');

    // Answer email
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'john@example.com' }, reason: 'Clear' };
    await runTick('john@example.com');
    assert.strictEqual(meta.currentFieldId, 'phone');

    // Answer phone
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { phone: '0712345678' }, reason: 'Clear' };
    await runTick('0712345678');
    assert.strictEqual(meta.currentFieldId, 'location');

    // Answer Location -> Advances to SUMMARY
    mockProviderAI.responseData = { 
        intent: 'answer', 
        confidence: 99, 
        extractedData: { location: 'Dar es Salaam Tanzania' }, 
        reason: 'Clear' 
    };
    await runTick('Dar es Salaam Tanzania');
    assert.strictEqual(meta.currentSectionId, 'SUMMARY');
    assert.strictEqual(meta.currentFieldId, 'professionalSummary');
  });

});
