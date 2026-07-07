import { config } from 'dotenv';
config();
import { AIPolicyEngine } from './src/ai/policy/AIPolicyEngine.js';
import { GeminiProvider } from './src/ai/policy/GeminiProvider.js';
import { FSMEngine } from './src/conversation/fsm/FSMEngine.js';

async function runTest() {
  const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
  AIPolicyEngine.initialize(provider);
  const mockProvider = {
    sendMessage: async (phone: string, text: string) => {}
  };
  const mockConvService = {
    updateConversation: async (id: string, update: any) => {
      console.log('[MOCK DB] updateConversation', id, JSON.stringify(update));
    },
    getConversationById: async (id: string) => {
        return { metadata: metadata };
    }
  };
  let globalCv: any = { id: 'cv1', userId: 'u1', personalInfo: {}, experience: [], education: [] };
  const mockCvService = {
    getActiveCVForUser: async (userId: string) => globalCv,
    createCV: async (data: any) => globalCv,
    updateCV: async (id: string, data: any) => { globalCv = { ...globalCv, ...data }; }
  };
  const mockPdfService = {
    generatePDF: async (html: string, filename: string) => {
      return `https://fake-s3.com/${filename}`;
    }
  };
  const mockAuthoringService = {
    enhanceCV: async (cv: any, lang: string) => {
      return { success: true, data: cv };
    }
  };
  const mockCvPreviewService = {
    generateHtml: (user: any, cv: any) => {
      return `<html><body><h1>CV for ${user.id}</h1></body></html>`;
    }
  };
  const mockEventBus = { publish: () => {} };
  const engine = new FSMEngine(
    mockProvider as any, 
    mockConvService as any, 
    mockCvService as any, 
    mockPdfService as any, 
    mockAuthoringService as any, 
    mockCvPreviewService as any
  );
  
  let metadata: any = {
    currentSectionId: 'REFERENCES',
    currentFieldId: 'CONFIRM_SKIP',
    lang: 'en',
    template: 'modern',
    completedSections: [],
    returnToReview: true
  };
  
  (engine as any).eventBus = mockEventBus;
  const conversation = { id: 'c1', channel: 'whatsapp', metadata };
  const user = { id: 'u1', phone: '255123456789' };
  
  await engine.processMessage(user, conversation, 'Yes');
  
}
runTest().catch(console.error);
