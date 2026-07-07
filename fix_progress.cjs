const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

code = code.replace(
  "  private async showProgress(\n    section: SectionDefinition,\n    meta: SessionMetadata,\n    user: User,\n    lang: 'sw' | 'en'\n  ) {",
  "  private async showProgress(\n    section: SectionDefinition,\n    conversation: Conversation,\n    meta: SessionMetadata,\n    user: User,\n    lang: 'sw' | 'en'\n  ) {"
);

code = code.replace(/await this\.showProgress\(section, meta, user, lang\);/g, 
  "await this.showProgress(section, conversation, meta, user, lang);");

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
