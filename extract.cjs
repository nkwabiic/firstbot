const fs = require('fs');

const code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf-8');

function extractMethod(name) {
    const regex = new RegExp(`(public|private)\\s+async\\s+${name}\\s*\\(`, 'g');
    const match = regex.exec(code);
    if (!match) return `NOT FOUND: ${name}`;
    
    let startIndex = match.index;
    let braceCount = 0;
    let started = false;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') {
            braceCount++;
            started = true;
        } else if (code[i] === '}') {
            braceCount--;
        }
        
        if (started && braceCount === 0) {
            endIndex = i;
            break;
        }
    }
    
    return code.substring(startIndex, endIndex + 1);
}

const methods = [
    'processMessage',
    'handleIntent',
    'startSection',
    'advanceField',
    'completeSection',
    'sendCurrentPrompt',
    'handleReviewCompletion'
];

for (const m of methods) {
    console.log(`\n\n=== ${m} ===\n`);
    console.log(extractMethod(m));
}
