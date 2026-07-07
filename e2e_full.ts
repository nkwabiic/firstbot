import { AIPolicyEngine } from './src/ai/policy/AIPolicyEngine';
import { GeminiProvider } from './src/ai/policy/GeminiProvider';

const provider = new GeminiProvider('fake-key');
AIPolicyEngine.initialize(provider);
import { FSMEngine } from './src/conversation/fsm/FSMEngine';
import { Conversation, User, CV, SessionMetadata } from './src/conversation/fsm/types';
import { ConversationEventBus } from './src/conversation/events/event-bus';

async function runE2E() {
  const eventBus = new ConversationEventBus();
  const engine = new FSMEngine(eventBus);
  
  const user: User = { id: 'u1', phone: '255123456789' };
  const conversation: Conversation = { id: 'c1', channel: 'whatsapp', metadata: {} };
  const cv: CV = { id: 'cv1', userId: user.id };
  let metadata: SessionMetadata | undefined = undefined;
  
  let currentBotMessage = '';

  eventBus.subscribe(event => {
    if (event.event === 'ConversationPaused' || event.event === 'ConversationResumed') return;
  });

  // Since we don't have the actual DB, we mock getMeta and saveMeta:
  (engine as any).getMeta = async () => metadata;
  (engine as any).saveMeta = async (id: string, meta: SessionMetadata) => {
    metadata = meta;
  };

  async function sendMessage(msg: string) {
    console.log(`\n\n[USER]: ${msg}`);
    const botMessages: string[] = [];
    (engine as any).sendWhatsAppMessage = async (to: string, body: string) => {
      botMessages.push(body);
    };
    (engine as any).sendInteractiveMessage = async (to: string, header: string, body: string, buttons: any[]) => {
       botMessages.push(body);
    };

    await engine.processMessage(msg, conversation, user, cv);
    
    botMessages.forEach(m => console.log(`[BOT]: ${m}`));
    
    console.log('\n--- METADATA STATE ---');
    console.log(`currentSectionId: ${metadata?.currentSectionId}`);
    console.log(`currentFieldId: ${metadata?.currentFieldId}`);
    console.log(`completedSections: ${metadata?.completedSections?.join(',')}`);
    console.log(`skippedSections: ${metadata?.skippedSections?.join(',')}`);
    console.log(`pendingConfirmationData: ${JSON.stringify(metadata?.pendingConfirmationData)}`);
    console.log(`returnToReview: ${metadata?.returnToReview}`);
    console.log(`lastBotMessage: ${metadata?.lastBotMessage}`);
    console.log('----------------------');
  }

  await sendMessage('Hi');
  await sendMessage('English');
  await sendMessage('John Doe');
  await sendMessage('Software Engineer');
  await sendMessage('john.doe@example.com');
  await sendMessage('0712345678');
  await sendMessage('P.O.Box 123, Dar es Salaam');
  await sendMessage('Dar es Salaam');
  await sendMessage('A hard working engineer.');
  
  // Experience
  await sendMessage('Yes, I have experience');
  await sendMessage('Tech Corp');
  await sendMessage('Developer');
  await sendMessage('2020');
  await sendMessage('2022');
  await sendMessage('Wrote code');
  await sendMessage('No more experience');

  // Education
  await sendMessage('Yes, I have education');
  await sendMessage('UDSM');
  await sendMessage('BSc Computer Science');
  await sendMessage('2016');
  await sendMessage('2020');
  await sendMessage('No more education');

  // References
  await sendMessage('Yes, I have references');
  await sendMessage('Jane Doe');
  await sendMessage('Tech Corp');
  await sendMessage('0711122233');
  await sendMessage('jane.doe@example.com');
  await sendMessage('No more references');
}

runE2E().catch(console.error);
