const fs = require('fs');
let code = fs.readFileSync('patch_fsm.ts', 'utf8');

const regex = /await this\.provider\.sendMessage\(user\.phone,\s*([a-zA-Z0-9_]+)\);/g;
code = code.replace(regex, (match, p1) => {
    return `meta.lastBotMessage = ${p1};\n    await this.saveMeta(conversation.id, meta);\n    ${match}`;
});

// For `doneMsg`, the meta was `_meta` in that function. Let's fix it.
// Also, `sendCurrentPrompt` already does it, so we don't need to double save there.
code = code.replace(/meta\.lastBotMessage = prompt;\n\s*await this\.saveMeta\(conversation\.id, meta\);\n\s*meta\.lastBotMessage = prompt;\n\s*await this\.saveMeta\(conversation\.id, meta\);\n\s*await this\.provider\.sendMessage\(user\.phone, prompt\);/g, 
  "meta.lastBotMessage = prompt;\n    await this.saveMeta(conversation.id, meta);\n    await this.provider.sendMessage(user.phone, prompt);");

// And `_meta` case
code = code.replace(/meta\.lastBotMessage = waitMsg;\n\s*await this\.saveMeta\(conversation\.id, meta\);/g, 
  "_meta.lastBotMessage = waitMsg;\n    await this.saveMeta(conversation.id, _meta);");
code = code.replace(/meta\.lastBotMessage = errMsg;\n\s*await this\.saveMeta\(conversation\.id, meta\);/g, 
  "_meta.lastBotMessage = errMsg;\n    await this.saveMeta(conversation.id, _meta);");

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
