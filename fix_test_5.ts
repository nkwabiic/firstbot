import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');

// I'll add some logs in the test
content = content.replace(
    /console.log\('AFTER YES ->', meta.currentSectionId\);/,
    "console.log('AFTER YES ->', meta.currentSectionId, publishedEvents);"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
