const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/console\.log\('\[DEBUG-1\] Before handleIntent:', \{[\s\S]*?\}\);\s*/, '');
code = code.replace(/console\.log\('\[DEBUG-2\] ADD_ANOTHER block start:', \{[\s\S]*?\}\);\s*/, '');
code = code.replace(/console\.log\('\[DEBUG-3\] Inside isYes:', \{[\s\S]*?\}\);\s*/, '');
code = code.replace(/console\.log\('\[DEBUG-4\] After saveMeta'\);\s*/, '');
code = code.replace(/console\.log\('\[DEBUG-5\] Before sendCurrentPrompt'\);\s*/, '');
code = code.replace(/console\.log\('\[DEBUG-6\] Inside sendCurrentPrompt:', \{[\s\S]*?\}\);\s*/, '');

code = code.replace(
  /\} else \{\s*console\.log\('\[DEBUG-7\] FIELD NOT FOUND'\);\s*\}/,
  '}'
);

fs.writeFileSync(file, code);
