const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

code = code.replace(
  "        meta.lastBotMessage = doneMsg;\n    await this.saveMeta(conversation.id, meta);\n    await this.provider.sendMessage(user.phone, doneMsg);",
  "        await this.provider.sendMessage(user.phone, doneMsg);"
);

code = code.replace(
  "        meta.lastBotMessage = intentResult.botReply;\n    await this.saveMeta(conversation.id, meta);\n    await this.provider.sendMessage(user.phone, intentResult.botReply);",
  "        meta.lastBotMessage = intentResult.botReply;\n    await this.saveMeta(conversation.id, meta);\n    await this.provider.sendMessage(user.phone, intentResult.botReply);"
);

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
