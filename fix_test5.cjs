const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf8');

code = code.replace(
  "    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { confirm: 'Yes' } };\n    await runTick('Looks good');",
  "    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { confirm: 'Yes' } };\n    await runTick('Yes');"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', code);
