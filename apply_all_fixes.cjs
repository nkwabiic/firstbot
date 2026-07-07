const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

// 1. Add sendMessageAndUpdateMeta
code = code.replace(/export class FSMEngine \{/, `export class FSMEngine {\n  private async sendMessageAndUpdateMeta(conversationId: string, phone: string, msg: string, meta: SessionMetadata) {\n    meta.lastBotMessage = msg;\n    await this.saveMeta(conversationId, meta);\n    await this.provider.sendMessage(phone, msg);\n  }`);

// Replace all occurrences of provider.sendMessage where meta is in scope
code = code.replace(/meta\.lastBotMessage\s*=\s*([^;]+);\s*await this\.saveMeta\(conversation\.id,\s*meta\);\s*await this\.provider\.sendMessage\(user\.phone,\s*([^)]+)\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, $2, meta);`);

// 2. processMessage: handleReviewMode early return
code = code.replace(/if \(meta\.isReviewMode\) \{\s*await this\.handleReviewMode\(message, conversation, user, lang, cv, meta\);\s*return;\s*\}/, 
`if (meta.isReviewMode) {
      const handled = await this.handleReviewMode(message, conversation, user, lang, cv, meta);
      if (handled) return;
    }`);

// 3. handleIntent validation & ADD_ANOTHER fix
const intentAnswerBlock = 
`      if (meta.currentFieldId && meta.currentFieldId !== 'ADD_ANOTHER' && meta.currentFieldId !== 'CONFIRM_SKIP' && meta.currentFieldId !== 'DONE') {
          let extractedVal = (intentResult.extractedData && intentResult.extractedData[meta.currentFieldId]) !== undefined ? intentResult.extractedData[meta.currentFieldId] : message.trim();
          const validation = this.validateFieldLocally(meta.currentFieldId, String(extractedVal));
          if (!validation.isValid) {
              const errMsg = lang === 'sw' ? validation.errorSw : validation.errorEn;
              const field = section.fields.find(f => f.id === meta.currentFieldId);
              const prompt = errMsg + '\\n\\n' + (field ? field.prompt[lang] : '');
              await this.sendMessageAndUpdateMeta(conversation.id, user.phone, prompt, meta);
              return;
          }
          
          const finalVal = validation.formattedValue || extractedVal;
          if (!intentResult.extractedData) intentResult.extractedData = {};
          
          // STRICT MAPPING
          intentResult.extractedData = { [meta.currentFieldId]: finalVal };
          await this.applyExtractedData(intentResult.extractedData, cv);
          
          // BOOLEAN SKIP LOGIC
          if ((meta.currentFieldId === 'hasExperience' || meta.currentFieldId === 'hasEducation') && finalVal === 'No') {
              await this.completeSection(section, conversation, user, lang, cv, meta, true);
              return;
          }
      } else if (intentResult.extractedData && (meta.currentFieldId === 'DONE' || meta.currentFieldId === 'CONFIRM_SKIP' || meta.currentFieldId === 'ADD_ANOTHER')) {
          await this.applyExtractedData(intentResult.extractedData, cv);
      }

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
            await this.sendMessageAndUpdateMeta(conversation.id, user.phone, botReply, meta);
            return;
        }
      }`;

code = code.replace(/if \(intentResult\.extractedData\) \{\s*await this\.applyExtractedData\(intentResult\.extractedData, cv\);\s*\}\s*\/\/\s*Handle "Add Another" for multi-item sections\s*if \(meta\.currentFieldId === 'ADD_ANOTHER'\) \{\s*\/\/ If extracted data implies yes[\s\S]*?\/\/ Actually, if they say 'Yes', it's confirmation\s*\}/, intentAnswerBlock);

// 4. Edit flow sets isReviewMode correctly when switching sections
// Find edit intent logic
code = code.replace(/this\.eventBus\.publish\(\{[\s\S]*?event: ConversationEventType\.EditStarted,[\s\S]*?\}\);\s*await this\.startSection\(targetSection\.id, conversation, user, lang, cv\);/g, 
`this.eventBus.publish({
            event: ConversationEventType.EditStarted,
            timestamp: new Date().toISOString(),
            conversationId: conversation.id,
            userId: user.id,
            section: targetSection.id,
          });
          if (meta.currentSectionId !== 'REVIEW' && !meta.isReviewMode) {
            meta.returnToReview = false;
          } else {
            meta.isReviewMode = false;
            meta.returnToReview = true;
          }
          await this.startSection(targetSection.id, conversation, user, lang, cv);`);

// 5. startSection sets isReviewMode
code = code.replace(/meta\.currentSectionId = sectionId;/g, 
`if (section.id === 'REVIEW') {
      meta.isReviewMode = true;
    }
    meta.currentSectionId = sectionId;`);

// 6. Remove auto-skip
code = code.replace(/if \(extractedData\) \{\s*while \(currentIndex < section\.fields\.length - 1\) \{\s*const nextF = section\.fields\[currentIndex \+ 1\];\s*if \(extractedData\[nextF\.id\] !== undefined && extractedData\[nextF\.id\] !== null\) \{\s*currentIndex\+\+; \/\/ skip because it was just extracted!\s*\} else \{\s*break;\s*\}\s*\}\s*\}/, '');

// 7. handleReviewMode
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

// 8. Other generic sends
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*intro\);/, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, intro, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*prompt\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, prompt, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*endMsg\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, endMsg, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*warnMsg\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, warnMsg, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*reply\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, reply, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*confirmMsg\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, confirmMsg, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*botReply\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, botReply, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*fallback\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, fallback, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*msg\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, msg, meta);`);
code = code.replace(/await this\.provider\.sendMessage\(user\.phone,\s*reward\);/g, `await this.sendMessageAndUpdateMeta(conversation.id, user.phone, reward, meta);`);

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
