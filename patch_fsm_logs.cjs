const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const intentResult = await this.intentEngine.evaluate(context);',
  `const intentResult = await this.intentEngine.evaluate(context);
    console.log('[LOG] before handleIntent:', {
      currentSectionId: meta.currentSectionId,
      currentFieldId: meta.currentFieldId,
      intent: intentResult.intent,
      currentState: meta.currentFieldId,
      isMultiItem: currentSectionId ? (require('./sections/SectionRegistry').SECTION_REGISTRY[currentSectionId]?.isMultiItem) : false,
      returnToReview: meta.isReviewMode,
      nextField: undefined,
      nextSection: undefined,
      message: message
    });`
);

code = code.replace(
  'await this.handleIntent(intentResult, conversation, user, lang, cv, meta, message);',
  `await this.handleIntent(intentResult, conversation, user, lang, cv, meta, message);
    console.log('[LOG] after handleIntent:', {
      currentSectionId: meta.currentSectionId,
      currentFieldId: meta.currentFieldId,
      intent: intentResult.intent,
      currentState: meta.currentFieldId,
      isMultiItem: currentSectionId ? (require('./sections/SectionRegistry').SECTION_REGISTRY[currentSectionId]?.isMultiItem) : false,
      returnToReview: meta.isReviewMode,
      nextField: meta.currentFieldId, 
      nextSection: meta.currentSectionId,
    });`
);

code = code.replace(
  'private async advanceField(',
  `private async advanceField(
    section: any,
    conversation: any,
    user: any,
    lang: any,
    cv: any,
    meta: any,
    extractedData?: any,
    botReply?: string
  ) {
    console.log('[LOG] advanceField() called', { sectionId: section.id, currentFieldId: meta.currentFieldId });
    return this._advanceField(section, conversation, user, lang, cv, meta, extractedData, botReply);
  }
  private async _advanceField(`
);

code = code.replace(
  'private async completeSection(',
  `private async completeSection(
    section: any,
    conversation: any,
    user: any,
    lang: any,
    cv: any,
    meta: any,
    skipped: boolean = false
  ) {
    console.log('[LOG] completeSection/advanceSection() called', { sectionId: section.id });
    return this._completeSection(section, conversation, user, lang, cv, meta, skipped);
  }
  private async _completeSection(`
);

fs.writeFileSync(file, code);
