const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /require\('\.\/sections\/SectionRegistry'\)\.SECTION_REGISTRY/g,
  'SECTION_REGISTRY'
);

fs.writeFileSync(file, code);
