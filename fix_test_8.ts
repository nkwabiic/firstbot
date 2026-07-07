import fs from 'fs';
let content = fs.readFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', 'utf-8');

// Silence the logger in the test
content = content.replace(
    /import \{ FSMEngine \} from '\.\.\/FSMEngine\.js';/,
    "import { FSMEngine } from '../FSMEngine.js';\nimport { logger } from '../../../utils/logger.js';\nlogger.level = 'silent';"
);

fs.writeFileSync('src/conversation/fsm/tests/fsm-integration.test.ts', content);
