import { SectionId } from './sections/types.js';

export interface SessionMetadata {
  currentSectionId?: SectionId;
  currentFieldId?: string;
  completedSections?: SectionId[];
  skippedSections?: SectionId[];
  lang?: 'sw' | 'en';
  isReviewMode?: boolean;
  returnToReview?: boolean;
  skipConfirmed?: boolean;
  pendingConfirmationData?: Record<string, any>;
  lastBotMessage?: string;
  template?: string;
}
