const fs = require('fs');
let code = fs.readFileSync('FSMEngine.ts.orig', 'utf8');

// Fix 1: Auto-skip removal and strict field mapping
code = code.replace(/if \(extractedData\) \{\s*while \(currentIndex < section\.fields\.length - 1\) \{\s*const nextF = section\.fields\[currentIndex \+ 1\];\s*if \(extractedData\[nextF\.id\] !== undefined && extractedData\[nextF\.id\] !== null\) \{\s*currentIndex\+\+; \/\/ skip because it was just extracted!\s*\} else \{\s*break;\s*\}\s*\}\s*\}/, '');

// Fix 2: Validation of extracted data
code = code.replace(/const validation = this\.validateFieldLocally\(meta\.currentFieldId, message\);/, 
`let extractedVal = (intentResult.extractedData && intentResult.extractedData[meta.currentFieldId]) ? intentResult.extractedData[meta.currentFieldId] : message.trim();
          const validation = this.validateFieldLocally(meta.currentFieldId, extractedVal);`);
code = code.replace(/const finalVal = validation\.formattedValue \|\| message\.trim\(\);/, `const finalVal = validation.formattedValue || extractedVal;`);

// Fix 3: Set isReviewMode when starting REVIEW
code = code.replace(/if \(section\.id === 'REVIEW'\) \{/g, `if (section.id === 'REVIEW') {\n      meta.isReviewMode = true;`);

// Fix 4: Filter extractedData
code = code.replace(/\} else if \(intentResult\.extractedData\) \{\s*await this\.applyExtractedData\(intentResult\.extractedData, cv\);\s*\}/, `} else if (intentResult.extractedData && (meta.currentFieldId === 'DONE' || meta.currentFieldId === 'CONFIRM_SKIP' || meta.currentFieldId === 'ADD_ANOTHER')) {\n          await this.applyExtractedData(intentResult.extractedData, cv);\n      }`);

// Fix 5: sendMessageAndUpdateMeta helper
code = code.replace(/export class FSMEngine \{/, `export class FSMEngine {\n  private async sendMessageAndUpdateMeta(conversationId: string, phone: string, msg: string, meta: SessionMetadata) {\n    meta.lastBotMessage = msg;\n    await this.saveMeta(conversationId, meta);\n    await this.provider.sendMessage(phone, msg);\n  }`);

// Replace await this.provider.sendMessage calls where meta is in scope
code = code.replace(/meta\.lastBotMessage\s*=\s*([^;]+);\s*await this\.saveMeta\(conversation\.id,\s*meta\);\s*await this\.provider\.sendMessage\(user\.phone,\s*[^)]+\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);

// Replace other provider.sendMessage calls
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*(intentResult\.botReply)\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*(fallback)\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(\s*user\.phone,\s*(lang === 'sw'[^)]+)\s*\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $1, meta);`);

// Fix 6: Review Mode
code = code.replace(/if \(meta\.isReviewMode\) \{\s*await this\.handleReviewMode\(message, conversation, user, lang, cv, meta\);\s*return;\s*\}/, 
`if (meta.isReviewMode) {
      const handled = await this.handleReviewMode(message, conversation, user, lang, cv, meta);
      if (handled) return;
    }`);

code = code.replace(/private async handleReviewMode\([\s\S]*?\{/, 
`private async handleReviewMode(
    message: string,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV,
    meta: SessionMetadata
  ): Promise<boolean> {`);

code = code.replace(/if \(pdfUrl\) \{([\s\S]*?)\} else \{([\s\S]*?)\}/, 
`if (pdfUrl) {
$1
        for (const key in meta) delete (meta as any)[key];
        await this.convService.updateConversation(conversation.id, { currentState: 'COMPLETED', metadata: meta as any });
      } else {
$2
      }
      return true;`);

code = code.replace(/await this\.provider\.sendMessage\(\s*user\.phone,\s*'Error generating PDF\.'\s*\);\s*\}/, 
`await this.sendMessageAndUpdateMeta(conversation.id, user.phone, 'Error generating PDF.', meta);
      }
      return true;
    }
    return false;`);

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
