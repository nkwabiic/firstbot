const fs = require('fs');
let code = fs.readFileSync('src/conversation/fsm/FSMEngine.ts', 'utf8');

// Update processMessage review check
code = code.replace(/if \(meta\.isReviewMode\) \{\s*await this\.handleReviewMode\(message, conversation, user, lang, cv, meta\);\s*return;\s*\}/, 
`if (meta.isReviewMode) {
      const handled = await this.handleReviewMode(message, conversation, user, lang, cv, meta);
      if (handled) return;
    }`);

// Update handleReviewMode signature and return values
code = code.replace(/private async handleReviewMode\([\s\S]*?\{/, 
`private async handleReviewMode(
    message: string,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV,
    meta: SessionMetadata
  ): Promise<boolean> {`);

code = code.replace(/if \(pdfUrl\) \{([\s\S]*?)\} else \{([\s\S]*?)\}/, 
`if (pdfUrl) {
$1
      } else {
$2
      }
      return true;`);

// Add return false at end of handleReviewMode
code = code.replace(/\} \/\/ getAcknowledgement/, `  return false;\n    }\n\n  private getAcknowledgement`);

fs.writeFileSync('src/conversation/fsm/FSMEngine.ts', code);
