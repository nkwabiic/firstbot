const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf8');

const regex = /\/\/ 4\. Work Experience Flow.*?(\/\/ 9\. Review Mode)/s;

const newCode = `// 4. Work Experience Flow
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { hasExperience: 'Yes' } };
    await runTick('Yes');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { company: 'Google' } };
    await runTick('Google');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Dev' } };
    await runTick('Dev');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' } };
    await runTick('2020');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: '2022' } };
    await runTick('2022');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { achievements: 'Did stuff' } };
    await runTick('Did stuff');
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
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { achievements: 'More stuff' } };
    await runTick('More stuff');
    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');

    // Answer NO to finish experience
    await runTick('NO');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    // 5. Help Flow
    mockProviderAI.responseData = { intent: 'help', confidence: 99, botReply: 'I can help.' };
    await runTick('help me');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    // 6. Clarification Flow
    mockProviderAI.responseData = { intent: 'clarification', confidence: 99, botReply: 'I clarify.' };
    await runTick('what?');
    assert.strictEqual(meta.currentSectionId, 'EDUCATION');

    // 8. Skip flow with resume and then skip
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP');

    // Answer NO to confirm skip -> should resume
    mockProviderAI.responseData = { intent: 'answer', confidence: 99 };
    await runTick('NO');
    assert.strictEqual(meta.currentFieldId, 'hasEducation');

    // Skip again
    mockProviderAI.responseData = { intent: 'skip', confidence: 99 };
    await runTick('skip');
    assert.strictEqual(meta.currentFieldId, 'CONFIRM_SKIP');

    // Answer YES to confirm skip -> should advance
    mockProviderAI.responseData = { intent: 'answer', confidence: 99 };
    await runTick('YES');
    assert.strictEqual(meta.currentSectionId, 'SKILLS');

    // Answer SKILLS
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { skills: 'TypeScript' } };
    await runTick('TypeScript');

    // Answer PROJECTS
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectName: 'Proj 1' } };
    await runTick('Proj 1');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectDescription: 'Did things' } };
    await runTick('Did things');
    await runTick('NO');

    // Answer CERTIFICATIONS
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certName: 'Cert 1' } };
    await runTick('Cert 1');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certYear: '2020' } };
    await runTick('2020');
    await runTick('NO');

    // Answer LANGUAGES
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageName: 'English' } };
    await runTick('English');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageLevel: 'Fluent' } };
    await runTick('Fluent');
    await runTick('NO');

    // Answer HOBBIES
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { hobbies: 'Reading' } };
    await runTick('Reading');

    // Answer REFERENCES
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refName: 'John Ref' } };
    await runTick('John Ref');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refCompany: 'Google' } };
    await runTick('Google');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refPhone: 'john@example.com' } };
    await runTick('john@example.com');
    await runTick('NO');

    $1`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', code);
