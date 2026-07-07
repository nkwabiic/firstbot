import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');

// Fix 1: Need intent answer NO
content = content.replace(
    /await runTick\('NO'\);\n {4}assert.strictEqual\(meta.currentFieldId, 'institution'\);/,
    "mockProviderAI.responseData = { intent: 'answer', confidence: 99 };\n    await runTick('NO');\n    assert.strictEqual(meta.currentFieldId, 'institution');"
);

// Fix 2: 'startYear' instead of 'company'
content = content.replace(
    /assert.strictEqual\(meta.currentFieldId, 'company'\); \/\/ Next field/,
    "assert.strictEqual(meta.currentFieldId, 'startYear'); // Next field"
);

// Fix 3: confirmation flow company is startYear now because we resume from where we left off
content = content.replace(
    /mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Apple' }, requiresConfirmation: true };/,
    "mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' }, requiresConfirmation: true };"
);
content = content.replace(
    /await runTick\('Apple'\);/,
    "await runTick('2020');"
);
content = content.replace(
    /assert.strictEqual\(meta.pendingConfirmationData.company, 'Apple'\);/,
    "assert.strictEqual(meta.pendingConfirmationData.startYear, '2020');"
);
content = content.replace(
    /assert.strictEqual\(meta.currentFieldId, 'company'\); \/\/ Still here pending confirmation/,
    "assert.strictEqual(meta.currentFieldId, 'startYear'); // Still here pending confirmation"
);
content = content.replace(
    /assert.strictEqual\(meta.currentFieldId, 'location'\); \/\/ Advanced/,
    "assert.strictEqual(meta.currentFieldId, 'endYear'); // Advanced"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
