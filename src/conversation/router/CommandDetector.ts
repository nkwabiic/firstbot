export enum CommandIntent {
  SKIP = 'SKIP',
  BACK = 'BACK',
  CANCEL = 'CANCEL',
  RESTART = 'RESTART',
  HELP = 'HELP',
  EDIT = 'EDIT',
  CONTINUE = 'CONTINUE',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  REVIEW = 'REVIEW',
  SHOW_CV = 'SHOW_CV',
  CHANGE_LANGUAGE_EN = 'CHANGE_LANGUAGE_EN',
  CHANGE_LANGUAGE_SW = 'CHANGE_LANGUAGE_SW',
  YES = 'YES',
  NO = 'NO'
}

export interface CommandDefinition {
  intent: CommandIntent;
  keywords: string[];
}

export class CommandDetector {
  private static registry: CommandDefinition[] = [
    { intent: CommandIntent.SKIP, keywords: ['skip', 'ruka', 'pitisha', 'none', 'n/a', 'not applicable'] },
    { intent: CommandIntent.BACK, keywords: ['back', 'nyuma', 'rudi'] },
    { intent: CommandIntent.CANCEL, keywords: ['cancel', 'ghairi', 'sitisha', '0'] },
    { intent: CommandIntent.RESTART, keywords: ['start over', 'anza upya', 'restart'] },
    { intent: CommandIntent.HELP, keywords: ['help', 'msaada', 'sijaelewa'] },
    { intent: CommandIntent.EDIT, keywords: ['edit', 'badili', 'rekebisha', 'change'] },
    { intent: CommandIntent.CONTINUE, keywords: ['continue', 'endelea', 'next'] },
    { intent: CommandIntent.PAUSE, keywords: ['pause', 'pumzika', 'simamisha'] },
    { intent: CommandIntent.RESUME, keywords: ['resume', 'endelea tena'] },
    { intent: CommandIntent.REVIEW, keywords: ['review', 'hakiki'] },
    { intent: CommandIntent.SHOW_CV, keywords: ['show cv', 'onyesha cv', 'preview'] },
    { intent: CommandIntent.CHANGE_LANGUAGE_EN, keywords: ['english', 'switch to english', 'change language to english'] },
    { intent: CommandIntent.CHANGE_LANGUAGE_SW, keywords: ['kiswahili', 'swahili', 'badili lugha', 'switch to swahili', 'switch to kiswahili'] },
    { intent: CommandIntent.YES, keywords: ['yes', 'ndio', 'ndiyo', '1'] },
    { intent: CommandIntent.NO, keywords: ['no', 'hapana', 'la', '2'] },
  ];

  public static detect(lowercaseInput: string): CommandIntent | null {
    const trimmed = lowercaseInput.trim().replace(/[.!/]/g, '');
    for (const def of this.registry) {
       if (def.keywords.includes(trimmed)) return def.intent;
    }
    return null;
  }
}
