const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

// Fix 1: Validate extracted value if present, else message
code = code.replace(/const validation = this\.validateFieldLocally\(meta\.currentFieldId, message\);/g, 
`let extractedVal = (intentResult.extractedData && intentResult.extractedData[meta.currentFieldId]) ? intentResult.extractedData[meta.currentFieldId] : message.trim();
          const validation = this.validateFieldLocally(meta.currentFieldId, extractedVal);`);

// Wait, the above will pass `extractedVal` which is a string. `validateFieldLocally` expects a string.
// Then we need to replace `message.trim()` later in that block:
code = code.replace(/const finalVal = validation\.formattedValue || message\.trim\(\);/g, `const finalVal = validation.formattedValue || extractedVal;`);

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
