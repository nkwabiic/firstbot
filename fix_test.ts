import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');
content = `process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
process.env.NODE_ENV = 'test';
` + content;
content = content.replace(/'SECTION_STARTED'/g, 'ConversationEventType.SectionStarted');
content = content.replace(/'SECTION_COMPLETED'/g, 'ConversationEventType.SectionCompleted');
content = content.replace(/'CONVERSATION_PAUSED'/g, 'ConversationEventType.ConversationPaused');
content = content.replace(/'CONVERSATION_RESUMED'/g, 'ConversationEventType.ConversationResumed');
content = content.replace(/'SECTION_SKIPPED'/g, 'ConversationEventType.SectionSkipped');
content = content.replace(/'EDIT_STARTED'/g, 'ConversationEventType.EditStarted');
content = content.replace(/'REVIEW_COMPLETED'/g, 'ConversationEventType.ReviewCompleted');
content = content.replace(/'PDF_GENERATED'/g, 'ConversationEventType.PDFGenerated');

content = content.replace(/import \{ ConversationEventBus \} from '..\/..\/events\/event-bus.js';/, 
  "import { ConversationEventBus } from '../../events/event-bus.js';\nimport { ConversationEventType } from '../../events/event-types.js';");

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
