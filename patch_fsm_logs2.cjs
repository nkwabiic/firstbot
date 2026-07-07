const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'private async handleIntent(',
  `private async handleIntent(
    intentResult: any,
    conversation: any,
    user: any,
    lang: any,
    cv: any,
    meta: any,
    message: string
  ) {
    console.log('[LOG] handleIntent() called', { intent: intentResult.intent, message });
    return this._handleIntent(intentResult, conversation, user, lang, cv, meta, message);
  }
  private async _handleIntent(`
);

fs.writeFileSync(file, code);
