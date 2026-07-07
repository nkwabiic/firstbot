const fs = require('fs');
const file = './src/conversation/fsm/FSMEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(section\.id === 'REVIEW'\) \{\s*intro \+= '\\n\\n' \+ \(await this\.buildReviewText\(cv, meta, lang\)\);\s*\}/,
  `if (section.id === 'REVIEW') {
      meta.isReviewMode = true;
      intro += '\\n\\n' + (await this.buildReviewText(cv, meta, lang));
    }`
);

fs.writeFileSync(file, code);
