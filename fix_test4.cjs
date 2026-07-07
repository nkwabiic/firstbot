const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf8');

code = code.replace(
  "    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { hasExperience: 'Yes' } };\n    await runTick('Yes');\n",
  ""
);

// Also remove hasEducation if I put it there
code = code.replace(
  "    assert.strictEqual(meta.currentFieldId, 'hasEducation');",
  "    assert.strictEqual(meta.currentFieldId, 'institution');"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', code);
