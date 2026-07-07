const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf8');

// Replace manual meta manipulation with actual runTicks
// For EXPERIENCE
code = code.replace(
  "    // Fast forward through achievements to ADD_ANOTHER\n    meta.currentFieldId = 'achievements';\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { achievements: 'Did stuff' } };\n    await runTick('Did stuff');",
  "    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2020' } };\n    await runTick('2020');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: '2022' } };\n    await runTick('2022');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { achievements: 'Did stuff' } };\n    await runTick('Did stuff');"
);

// For EXPERIENCE (2nd item)
code = code.replace(
  "    meta.currentFieldId = 'achievements';\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { achievements: 'More stuff' } };\n    await runTick('More stuff');",
  "    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { jobTitle: 'Dev' } };\n    await runTick('Dev');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { startYear: '2022' } };\n    await runTick('2022');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { endYear: 'Present' } };\n    await runTick('Present');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { achievements: 'More stuff' } };\n    await runTick('More stuff');"
);

// For SKILLS to REFERENCES (The buggy part)
code = code.replace(
  "    // Fast forward through SKILLS, PROJECTS, CERTIFICATIONS, LANGUAGES, HOBBIES to REFERENCES\n    meta.currentSectionId = 'REFERENCES';\n    meta.currentFieldId = 'email';\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'ref@example.com' } };\n    await runTick('ref@example.com');\n    \n    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');",
  "    // Answer SKILLS\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { skills: 'TypeScript, Node.js' } };\n    await runTick('TypeScript, Node.js');\n\n    // Answer PROJECTS\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectName: 'Skip' } };\n    await runTick('Skip');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { projectDescription: 'Skip' } };\n    await runTick('Skip');\n    await runTick('NO'); // Don't add another project\n\n    // Answer CERTIFICATIONS\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certName: 'Skip' } };\n    await runTick('Skip');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { certYear: '2020' } };\n    await runTick('2020');\n    await runTick('NO'); // Don't add another cert\n\n    // Answer LANGUAGES\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageName: 'English' } };\n    await runTick('English');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { languageLevel: 'Fluent' } };\n    await runTick('Fluent');\n    await runTick('NO'); // Don't add another lang\n\n    // Answer HOBBIES\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { hobbies: 'Reading' } };\n    await runTick('Reading');\n\n    // Answer REFERENCES\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refName: 'John Ref' } };\n    await runTick('John Ref');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refCompany: 'Google' } };\n    await runTick('Google');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { refPhone: 'john@example.com' } };\n    await runTick('john@example.com');\n\n    assert.strictEqual(meta.currentFieldId, 'ADD_ANOTHER');"
);

// For EDIT (PERSONAL_INFO)
code = code.replace(
  "    // Finish editing\n    meta.currentFieldId = 'location';\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { location: 'New Location' } };\n    await runTick('New Location');\n    // Should return directly to REVIEW",
  "    // Go through all fields in edit mode\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { fullName: 'New Name' } };\n    await runTick('New Name');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { email: 'new@example.com' } };\n    await runTick('new@example.com');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { phone: '0712345678' } };\n    await runTick('0712345678');\n    mockProviderAI.responseData = { intent: 'answer', confidence: 99, extractedData: { location: 'New Location' } };\n    await runTick('New Location');\n    // Should return directly to REVIEW"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', code);
