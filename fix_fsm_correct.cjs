const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// First, clean up the previous injected block if it exists
code = code.replace(
  /\s*if \(meta\.currentFieldId === 'ADD_ANOTHER'\) \{\s*const ans = message\.trim\(\)\.toLowerCase\(\);\s*const isYes = [^;]+;\s*const isNo = [^;]+;\s*if \(isYes\) \{[\s\S]*?return;\s*\}\s*\}\s*/g,
  ''
);

// We will insert the ADD_ANOTHER logic at the beginning of _handleIntent (right after CONFIRM_SKIP)
const addAnotherLogic = `
    if (meta.currentFieldId === 'ADD_ANOTHER') {
      const ans = message.trim().toLowerCase();
      const isYes = ans === 'yes' || ans === 'ndio' || ans === 'y' || ans === 'ongeza' || ans.includes('add') || ans.includes('ndiyo');
      const isNo = ans === 'no' || ans === 'hapana' || ans === 'n' || ans.includes('continue') || ans.includes('endelea') || ans === 'sawa' || ans.includes('done');
      if (isYes) {
          let nextFieldIndex = 0;
          if (section.fields.length > 1 && section.fields[0].id.startsWith('has')) {
              nextFieldIndex = 1;
          }
          meta.currentFieldId = section.fields[nextFieldIndex].id;
          await this.saveMeta(conversation.id, meta);
          await this.sendCurrentPrompt(section, meta, user, lang);
          return;
      } else if (isNo) {
          await this.completeSection(section, conversation, user, lang, cv, meta, false);
          return;
      } else {
          // If the AI says it's a confirmation, let's treat it as a YES (e.g. "Yes I would like to add another")
          if (intentResult.intent === 'confirmation') {
              let nextFieldIndex = 0;
              if (section.fields.length > 1 && section.fields[0].id.startsWith('has')) {
                  nextFieldIndex = 1;
              }
              meta.currentFieldId = section.fields[nextFieldIndex].id;
              await this.saveMeta(conversation.id, meta);
              await this.sendCurrentPrompt(section, meta, user, lang);
              return;
          }
          const botReply = lang === 'sw' ? 'Tafadhali jibu Ndio (kuongeza) au Hapana (kumaliza).' : 'Please reply Yes (to add another) or No (to finish section).';
          await this.sendMessageAndUpdateMeta(conversation.id, user.phone, botReply, meta);
          return;
      }
    }
`;

// Insert it right after the CONFIRM_SKIP block ends
// We know CONFIRM_SKIP ends with:
//         }
//       }
//       return;
//     }
//     if (intentResult.intent === 'confirmation') {

code = code.replace(
  '    if (intentResult.intent === \'confirmation\') {',
  addAnotherLogic + '\n    if (intentResult.intent === \'confirmation\') {'
);

fs.writeFileSync(file, code);
