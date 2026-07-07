const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Immediately before handleIntent() starts
code = code.replace(
  'await this.handleIntent(intentResult, conversation, user, lang, cv, meta, message);',
  `console.log('[DEBUG-1] Before handleIntent:', { currentSectionId: meta.currentSectionId, currentFieldId: meta.currentFieldId, message, intent: intentResult.intent });
    await this.handleIntent(intentResult, conversation, user, lang, cv, meta, message);`
);

// 2. At the beginning of the ADD_ANOTHER block
code = code.replace(
  'if (meta.currentFieldId === \'ADD_ANOTHER\') {',
  `if (meta.currentFieldId === 'ADD_ANOTHER') {
      console.log('[DEBUG-2] ADD_ANOTHER block start:', { currentFieldId: meta.currentFieldId, intent: intentResult.intent, rawUserMessage: message });`
);

// 3, 4, 5. Inside isYes: nextFieldIndex, nextFieldId, after saveMeta, before sendCurrentPrompt
code = code.replace(
  /if \(isYes\) \{\s*let nextFieldIndex = 0;\s*if \(section\.fields\.length > 1 && section\.fields\[0\]\.id\.startsWith\('has'\)\) \{\s*nextFieldIndex = 1;\s*\}\s*meta\.currentFieldId = section\.fields\[nextFieldIndex\]\.id;\s*await this\.saveMeta\(conversation\.id, meta\);\s*await this\.sendCurrentPrompt\(section, meta, user, lang\);\s*return;\s*\}/,
  `if (isYes) {
          let nextFieldIndex = 0;
          if (section.fields.length > 1 && section.fields[0].id.startsWith('has')) {
              nextFieldIndex = 1;
          }
          const nextFieldId = section.fields[nextFieldIndex].id;
          console.log('[DEBUG-3] Inside isYes:', { nextFieldIndex, nextFieldId });
          meta.currentFieldId = nextFieldId;
          await this.saveMeta(conversation.id, meta);
          console.log('[DEBUG-4] After saveMeta');
          console.log('[DEBUG-5] Before sendCurrentPrompt');
          await this.sendCurrentPrompt(section, meta, user, lang);
          return;
      }`
);

// 6 & 7. Inside sendCurrentPrompt()
code = code.replace(
  /private async sendCurrentPrompt\([\s\S]*?\) \{\s*const field = section\.fields\.find\(\(f\) => f\.id === meta\.currentFieldId\);\s*if \(field\) \{/,
  `private async sendCurrentPrompt(
    section: SectionDefinition,
    meta: SessionMetadata,
    user: User,
    lang: 'sw' | 'en',
    botReply?: string
  ) {
    const field = section.fields.find((f) => f.id === meta.currentFieldId);
    console.log('[DEBUG-6] Inside sendCurrentPrompt:', { currentFieldId: meta.currentFieldId, matchedFieldId: field?.id, promptText: field?.prompt[lang] });
    if (field) {`
);

code = code.replace(
  /await this\.provider\.sendMessage\(user\.phone, prompt\);\s*\}\s*\}/,
  `await this.provider.sendMessage(user.phone, prompt);
    } else {
      console.log('[DEBUG-7] FIELD NOT FOUND');
    }
  }`
);

fs.writeFileSync(file, code);
