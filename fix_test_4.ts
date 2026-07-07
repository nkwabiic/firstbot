import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');

// I'll add some logs in the test
content = content.replace(
    /await runTick\('YES'\);\n {4}assert.strictEqual\(meta.currentSectionId, 'SKILLS'\);/,
    "await runTick('YES');\n    console.log('AFTER YES ->', meta.currentSectionId);\n    assert.strictEqual(meta.currentSectionId, 'SKILLS');"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
