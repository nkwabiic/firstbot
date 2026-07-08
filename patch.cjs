const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');
const search = `    const field = section.fields.find((f) => f.id === meta.currentFieldId);\n    if (field) {\n      let prompt = field.prompt[lang];\n      if (botReply) {\n        prompt = \`\${botReply.trim()}\\n\\n\${prompt}\`;\n      }\n      meta.lastBotMessage = prompt;\n      await this.provider.sendMessage(user.phone, prompt);\n    }`;
const replace = `    const field = section.fields.find((f) => f.id === meta.currentFieldId);\n    if (field) {\n      let prompt = field.prompt[lang];\n      if (botReply) {\n        prompt = \`\${botReply.trim()}\\n\\n\${prompt}\`;\n      }\n      meta.lastBotMessage = prompt;\n      await this.provider.sendMessage(user.phone, prompt);\n    } else {\n      logger.warn(\`[FSM] sendCurrentPrompt called but field \${meta.currentFieldId} not found in section \${section.id}\`);\n      if (botReply) {\n        await this.provider.sendMessage(user.phone, botReply);\n      }\n    }`;
if (code.includes(search)) {
  fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code.replace(search, replace));
  console.log("Patched successfully");
} else {
  console.log("Search string not found!");
}
