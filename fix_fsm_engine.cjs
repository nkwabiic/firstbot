const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

const regex = /private async advanceField\\(section: SectionDefinition, conversation: Conversation, user: User, lang: 'sw'\\|'en', cv: CV, meta: SessionMetadata\\) \\{[\\s\\S]*?currentIndex \\+ 1\\];\\n         meta\\.currentFieldId = nextField\\.id;\\n         await this\\.saveMeta\\(conversation\\.id, meta\\);\\n         await this\\.sendCurrentPrompt\\(section, meta, user, lang\\);\\n     \\}/;

const replacement = `private async advanceField(section: SectionDefinition, conversation: Conversation, user: User, lang: 'sw'|'en', cv: CV, meta: SessionMetadata) {
     const currentIndex = section.fields.findIndex(f => f.id === meta.currentFieldId);
     if (currentIndex === -1 || currentIndex === section.fields.length - 1) {
         if (section.isMultiItem && meta.currentFieldId !== 'ADD_ANOTHER') {
            meta.currentFieldId = 'ADD_ANOTHER';
            await this.saveMeta(conversation.id, meta);
            const prompt = lang === 'sw' ? 'Je, ungependa kuongeza nyingine? (Ndio/Hapana)' : 'Would you like to add another? (Yes/No)';
            await this.provider.sendMessage(user.phone, prompt);
            return;
         }
         await this.completeSection(section, conversation, user, lang, cv, meta, false);
     } else {
         // Auto-skip fields that are already provided
         let nextIndex = currentIndex + 1;
         let nextField = section.fields[nextIndex];
         
         // For tests, we use meta.pendingConfirmationData if it was applied, or intentResult.extractedData
         // But intentResult is not passed to advanceField.
         // Actually, if we apply it to CV, we can check CV.
         // But CV update is mocked in tests. So let's pass extractedData to advanceField!
         // Wait, the FSM Engine can just check if nextField.id exists in the last extraction!
         meta.currentFieldId = nextField.id;
         await this.saveMeta(conversation.id, meta);
         await this.sendCurrentPrompt(section, meta, user, lang);
     }`;

// Wait, passing extractedData to advanceField is better.
// Let's modify `handleIntent` to pass `intentResult.extractedData` to `advanceField` and use it.
