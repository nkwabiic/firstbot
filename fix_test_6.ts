import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');

// Just inject the mock directly before the second YES
content = content.replace(
    /await runTick\('YES'\);\n {4}console.log\('AFTER YES ->', meta.currentSectionId, publishedEvents\);/,
    "mockProviderAI.responseData = { intent: 'answer', confidence: 99 };\n    await runTick('YES');\n    console.log('AFTER YES ->', meta.currentSectionId, publishedEvents);"
);

// Fix the undefined confirmation data in test 2
content = content.replace(
    /assert.strictEqual\(meta.pendingConfirmationData.startYear, '2020'\);/,
    "assert.strictEqual(meta.pendingConfirmationData?.startYear, '2020');"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
