const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');
code = code.replace(/await this\.sendMessageAndUpdateMeta\(conversation\.id, user\.phone, 'Error generating PDF\.', meta\);\s*\}\s*\}/, 
`await this.sendMessageAndUpdateMeta(conversation.id, user.phone, 'Error generating PDF.', meta);
      }
      return true;
    }
    return false;
  }`);
fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
