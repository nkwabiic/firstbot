const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

// 1. Update signature
code = code.replace(
  "  private async sendCurrentPrompt(\n    section: SectionDefinition,\n    meta: SessionMetadata,\n    user: User,\n    lang: 'sw' | 'en',\n    botReply?: string\n  ) {",
  "  private async sendCurrentPrompt(\n    section: SectionDefinition,\n    conversation: Conversation,\n    meta: SessionMetadata,\n    user: User,\n    lang: 'sw' | 'en',\n    botReply?: string\n  ) {"
);

// 2. Update calls
code = code.replace(/await this\.sendCurrentPrompt\(section, meta, user, lang\);/g, 
  "await this.sendCurrentPrompt(section, conversation, meta, user, lang);");

code = code.replace(/await this\.sendCurrentPrompt\(section, meta, user, lang, botReply\);/g, 
  "await this.sendCurrentPrompt(section, conversation, meta, user, lang, botReply);");

// Wait, the double `meta.lastBotMessage = prompt;` is a bit ugly. Let's clean it up.
code = code.replace(/meta\.lastBotMessage = prompt;\s*meta\.lastBotMessage = prompt;/g, "meta.lastBotMessage = prompt;");

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
