const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

// Fix 1: Auto-skip removal and strict field mapping
code = code.replace(/if \(extractedData\) \{\s*while \(currentIndex < section\.fields\.length - 1\) \{[\s\S]*?\}\s*\}/, '');

// Fix 2: Helper for sendMessageAndUpdateMeta
code = code.replace(/export class FSMEngine \{/, `export class FSMEngine {\n  private async sendMessageAndUpdateMeta(conversationId: string, phone: string, msg: string, meta: SessionMetadata) {\n    meta.lastBotMessage = msg;\n    await this.saveMeta(conversationId, meta);\n    await this.provider.sendMessage(phone, msg);\n  }`);

// Replace all this.provider.sendMessage with the helper
code = code.replace(/meta\.lastBotMessage\s*=\s*[^;]+;\s*await this\.saveMeta\(conversation\.id,\s*meta\);\s*await this\.provider\.sendMessage\(user\.phone,\s*[^)]+\);/g, (match) => {
    // extract msg
    const msgMatch = match.match(/await this\.provider\.sendMessage\(user\.phone,\s*([^)]+)\);/);
    if (msgMatch) {
        return `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, ${msgMatch[1]}, meta);`;
    }
    return match;
});

// Also replace standalone sendMessages
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*(intentResult\.botReply)\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*(fallback)\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(\s*user\.phone,\s*(lang === 'sw'[^)]+)\s*\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);

// Fix 3: Set isReviewMode when starting REVIEW
code = code.replace(/if \(section\.id === 'REVIEW'\) \{/g, `if (section.id === 'REVIEW') {\n      meta.isReviewMode = true;`);

// Fix 4: Session Reset after PDF
code = code.replace(/if \(pdfUrl\) \{([\s\S]*?)\} else \{/, `if (pdfUrl) {\n        await this.sendMessageAndUpdateMeta(conversation.id, user.phone, lang === 'sw' ? \`Asante kwa kutumia CareerBot! CV yako ipo tayari: \${pdfUrl}\` : \`Thank you for using CareerBot! Your CV is ready: \${pdfUrl}\`, meta);\n        for (const key in meta) delete (meta as any)[key];\n        await this.convService.updateConversation(conversation.id, { currentState: 'COMPLETED', metadata: meta as any });\n      } else {`);

// Fix 5: Filter extractedData strictly
code = code.replace(/intentResult\.extractedData = \{ \[meta\.currentFieldId\]: finalVal \};/g, `intentResult.extractedData = { [meta.currentFieldId]: finalVal };`); // already there!
// Actually we need to make sure we don't apply extra fields if meta.currentFieldId is NOT DONE or CONFIRM_SKIP.
code = code.replace(/\} else if \(intentResult\.extractedData\) \{\s*await this\.applyExtractedData\(intentResult\.extractedData, cv\);\s*\}/, `} else if (intentResult.extractedData && (meta.currentFieldId === 'DONE' || meta.currentFieldId === 'CONFIRM_SKIP' || meta.currentFieldId === 'ADD_ANOTHER')) {\n          await this.applyExtractedData(intentResult.extractedData, cv);\n      }`);

// Fix 6: Review summary only uses metadata. (Already true!)
// Actually wait. `meta.completedSections` is appended when `completeSection` is called.
// BUT `meta.completedSections` must be UNIQUE. `if (!meta.completedSections.includes(section.id)) meta.completedSections.push(section.id);`
// Is it possible a section is marked completed when it's NOT?
// In `completeSection`, we add it to `completedSections`. So it IS from metadata.

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
