const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// We will inject logs into processMessage and handleIntent
code = code.replace(
  'const intentResult = await this.intentEngine.evaluate(context);',
  `const intentResult = await this.intentEngine.evaluate(context);
    console.log('[LOG] before handleIntent:', {
      currentSectionId: meta.currentSectionId,
      currentFieldId: meta.currentFieldId,
      intent: intentResult.intent,
      currentState: meta.currentFieldId,
      isMultiItem: SECTION_REGISTRY[meta.currentSectionId as any]?.isMultiItem,
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
      isMultiItem: SECTION_REGISTRY[meta.currentSectionId as any]?.isMultiItem,
      returnToReview: meta.isReviewMode,
      nextField: meta.currentFieldId, // just approximation
      nextSection: meta.currentSectionId,
    });`
);

fs.writeFileSync(file, code);
