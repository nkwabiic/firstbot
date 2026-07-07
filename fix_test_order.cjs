const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf8');

const oldOrder = `    // Answer SKILLS
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
    await runTick('NO');`;

const newOrder = `    // Answer SKILLS
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { skills: 'TypeScript' } };
    await runTick('TypeScript');

    // Answer LANGUAGES (Order 7)
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageName: 'English' } };
    await runTick('English');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageLevel: 'Fluent' } };
    await runTick('Fluent');
    await runTick('NO');

    // Answer PROJECTS (Order 8)
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectName: 'Proj 1' } };
    await runTick('Proj 1');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectDescription: 'Did things' } };
    await runTick('Did things');
    await runTick('NO');

    // Answer CERTIFICATIONS (Order 9)
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certName: 'Cert 1' } };
    await runTick('Cert 1');
    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certYear: '2020' } };
    await runTick('2020');
    await runTick('NO');`;

code = code.replace(oldOrder, newOrder);
fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', code);
