const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

const oldAddAnother = `      // Handle "Add Another" for multi-item sections\n      if (meta.currentFieldId === 'ADD_ANOTHER') {\n        // If extracted data implies yes, or if user said yes\n        // For now, let's assume they said no unless intent says they want to add\n        // If intent is answer, and they provided data, maybe we loop.\n        // Simplification: if intent is answer, check if truthy\n        // Actually, if they say 'Yes', it's confirmation\n      }`;

const newAddAnother = `      // 3. ADD_ANOTHER LOOP FIX
      if (meta.currentFieldId === 'ADD_ANOTHER') {
        const ans = message.trim().toLowerCase();
        const isYes = ans === 'yes' || ans === 'ndio' || ans === 'y' || ans === 'ongeza' || ans.includes('add') || ans.includes('ndiyo');
        const isNo = ans === 'no' || ans === 'hapana' || ans === 'n' || ans.includes('continue') || ans.includes('endelea') || ans === 'sawa' || ans.includes('done');
        if (isYes) {
            meta.currentFieldId = section.fields[0].id;
            await this.saveMeta(conversation.id, meta);
            await this.sendCurrentPrompt(section, conversation, meta, user, lang);
            return;
        } else if (isNo) {
            await this.completeSection(section, conversation, user, lang, cv, meta, false);
            return;
        } else {
            const botReply = lang === 'sw' ? 'Tafadhali jibu Ndio (kuongeza) au Hapana (kumaliza).' : 'Please reply Yes (to add another) or No (to finish section).';
            meta.lastBotMessage = botReply;
            await this.saveMeta(conversation.id, meta);
            await this.provider.sendMessage(user.phone, botReply);
            return;
        }
      }`;

if (code.includes('Handle "Add Another" for multi-item sections')) {
    code = code.replace(oldAddAnother, newAddAnother);
    fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
    console.log("Patched ADD_ANOTHER!");
} else {
    console.log("Could not find the target text.");
}
