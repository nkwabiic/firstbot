import { config } from 'dotenv';
config();

import { AIPolicyEngine } from './src/ai/policy/AIPolicyEngine';
import { GeminiProvider } from './src/ai/policy/GeminiProvider';
import { FSMEngine } from './src/conversation/fsm/FSMEngine';

async function runTest() {
  const provider = new GeminiProvider(process.env.GEMINI_API_KEY!);
  AIPolicyEngine.initialize(provider);

  const mockProvider = {
    sendMessage: async (phone: string, text: string) => {
      console.log(`[BOT -> ${phone}]: ${text}`);
    }
  };

  const mockConvService = {
    updateMetadata: async (id: string, meta: any) => {
      // do nothing
    }
  };

  let globalCv: any = { id: 'cv1', userId: 'u1', personalInfo: {}, experience: [], education: [] };
  const mockCvService = {
    getActiveCVForUser: async (userId: string) => globalCv,
    createCV: async (data: any) => globalCv,
    updateCV: async (id: string, data: any) => { globalCv = { ...globalCv, ...data }; }
  };

  const mockEventBus = { publish: () => {} };
  
  // Inject mock event bus somehow? Wait, FSMEngine doesn't take eventBus in constructor.
  // It has private eventBus = new ConversationEventBus();
  
  const engine = new FSMEngine(
    mockProvider as any, 
    mockConvService as any, 
    mockCvService as any, 
    null as any, 
    null as any, 
    null as any
  );
  
  // Override saveMeta and getMeta for simplicity in test
  let metadata: any = {
    currentSectionId: 'EXPERIENCE',
    currentFieldId: 'ADD_ANOTHER',
    lang: 'en',
    lastBotMessage: 'Would you like to add another?',
    template: 'modern',
    completedSections: []
  };

  (engine as any).saveMeta = async (id: string, meta: any) => {
    metadata = meta;
  };
  (engine as any).getMeta = async () => metadata;
  
  (engine as any).eventBus = mockEventBus;

  const conversation = { id: 'c1', channel: 'whatsapp', metadata };
  const user = { id: 'u1', phone: '255123456789' };

  console.log('[USER]: Yes I would like to add another');
  await engine.processMessage(user, conversation, 'Yes I would like to add another');
  
  console.log('Final metadata:', metadata);
}
runTest().catch(console.error);
