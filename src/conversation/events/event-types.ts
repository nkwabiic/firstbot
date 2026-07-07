export enum ConversationEventType {
  ProgressUpdated = 'ProgressUpdated',
  EditCompleted = 'EditCompleted',
  EditStarted = 'EditStarted',
  ReviewCompleted = 'ReviewCompleted',
  ReviewStarted = 'ReviewStarted',
  UnknownIntent = 'UnknownIntent',
  CorrectionDetected = 'CorrectionDetected',
  IntentDetected = 'IntentDetected',
  AIRejected = 'AIRejected',
  ConversationStarted = 'ConversationStarted',
  ConversationResumed = 'ConversationResumed',
  ConversationPaused = 'ConversationPaused',
  ConversationCompleted = 'ConversationCompleted',
  LanguageDetected = 'LanguageDetected',
  LanguageChanged = 'LanguageChanged',
  CommandDetected = 'CommandDetected',
  ClarificationRequested = 'ClarificationRequested',
  CorrectionRequested = 'CorrectionRequested',
  ValidationPassed = 'ValidationPassed',
  ValidationFailed = 'ValidationFailed',
  SectionStarted = 'SectionStarted',
  SectionCompleted = 'SectionCompleted',
  SectionSkipped = 'SectionSkipped',
  AIRequested = 'AIRequested',
  AISucceeded = 'AISucceeded',
  AIFailed = 'AIFailed',
  AIFallbackTriggered = 'AIFallbackTriggered',
  PreviewGenerated = 'PreviewGenerated',
  PDFGenerated = 'PDFGenerated',
  CVSaved = 'CVSaved',
  CVUpdated = 'CVUpdated',
  ReferenceCompleted = 'ReferenceCompleted',
  ExperienceCompleted = 'ExperienceCompleted',
  EducationCompleted = 'EducationCompleted',
  SkillsCompleted = 'SkillsCompleted',
}

export interface ConversationEventPayload {
  event: ConversationEventType;
  timestamp: string;
  conversationId: string;
  userId: string;
  state?: string;
  section?: string;
  metadata?: Record<string, unknown>;
}

export interface IEventBus {
  publish(event: ConversationEventPayload): void;
  subscribe(eventType: ConversationEventType, handler: (payload: ConversationEventPayload) => void): void;
  unsubscribe(eventType: ConversationEventType, handler: (payload: ConversationEventPayload) => void): void;
}
