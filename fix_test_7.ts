import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');

// Fix the confidence so requiresConfirmation triggers
content = content.replace(
    /mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' }, requiresConfirmation: true };/,
    "mockProviderAI.responseData = { intent: 'answer', confidence: 85, extractedData: { startYear: '2020' } };"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
