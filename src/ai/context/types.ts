export interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export interface ConversationContext {
  language: 'sw' | 'en';
  conversationId: string;
  currentSection: string;
  currentState: string;
  previousState?: string;
  lastBotMessage: string;
  latestUserMessage: string;
  conversationHistory: ConversationMessage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cvSnapshot: Record<string, any>;
  completedSections: string[];
  activeTemplate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessionMetadata: Record<string, any>;
  timestamp: string;
  lastAIDecision?: string;
  validationHistory?: string[];
  expectedField?: string;
  expectedFieldType?: string;
  currentQuestion?: string;
  fieldDescription?: string;
  validationHints?: string;
}

export type ContextBuilderParams = Omit<ConversationContext, 'timestamp'>;
