import { Conversation, User } from '@prisma/client';
import { IWhatsAppProvider } from '../../whatsapp/whatsapp.interface.js';
import { ConversationService } from '../../domain/services/conversation.service.js';
import { UserService } from '../../domain/services/user.service.js';
import { CVService } from '../../domain/services/cv.service.js';
import { AuthoringService } from '../../ai/authoring/AuthoringService.js';
import { PDFService } from '../../pdf/pdf.service.js';
import { CvPreviewService } from '../../domain/services/cv-preview.service.js';
import { FSMEngine } from './FSMEngine.js';

export class FiniteStateMachine {
  private engine: FSMEngine;

  constructor(
    provider: IWhatsAppProvider,
    convService: ConversationService,
    userService: UserService,
    cvService: CVService,
    authoringService: AuthoringService,
    private pdfService: PDFService,
    private cvPreviewService: CvPreviewService
  ) {
    this.engine = new FSMEngine(
      provider,
      convService,
      cvService,
      pdfService,
      authoringService,
      cvPreviewService
    );
  }

  async processMessage(user: User, conversation: Conversation, message: string): Promise<void> {
    await this.engine.processMessage(user, conversation, message);
    console.log(`[TRACE] Returning from FSM processMessage`);
  }
}
