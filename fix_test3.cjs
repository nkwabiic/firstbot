const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf8');

const regex = /\/\/ 4\. Work Experience Flow.*?(\/\/ 5\. Help Flow)/s;

const newCode = `// 4. Work Experience Flow
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Google' } };
    await runTick('Google');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Dev' } };
    await runTick('Dev');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' } };
    await runTick('2020');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: '2022' } };
    await runTick('2022');
    
    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');

    // Answer YES to add another
    await runTick('YES');
    assert.strictEqual(meta.currentFieldId, 'company'); // restarted section fields
    
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Facebook' } };
    await runTick('Facebook');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Dev' } };
    await runTick('Dev');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2022' } };
    await runTick('2022');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: 'Present' } };
    await runTick('Present');
    
    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');

    // Answer NO to finish experience
    await runTick('NO');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    $1`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', code);
