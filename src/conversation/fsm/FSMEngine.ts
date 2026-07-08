import { Conversation, User, CV } from '@prisma/client';
import { IWhatsAppProvider } from '../../whatsapp/whatsapp.interface.js';
import { ConversationService } from '../../domain/services/conversation.service.js';
import { CVService } from '../../domain/services/cv.service.js';
import { CvPreviewService } from '../../domain/services/cv-preview.service.js';
import { IntentEngine } from '../../ai/intent/IntentEngine.js';
import { ContextBuilder } from '../../ai/context/ContextBuilder.js';
import { SECTION_REGISTRY, ORDERED_SECTIONS } from './sections/SectionRegistry.js';
import { SectionId, SectionDefinition } from './sections/types.js';
import { ConversationEventBus } from '../events/event-bus.js';
import { ConversationEventType } from '../events/event-types.js';
import { logger } from '../../utils/logger.js';
import { IntentResult } from '../../ai/intent/types.js';
import { SessionMetadata } from './types.js';
import { PDFService } from '../../pdf/pdf.service.js';
import { AuthoringService } from '../../ai/authoring/AuthoringService.js';
import { CVDataUpdater } from './CVDataUpdater.js';

export class FSMEngine {
  private eventBus = ConversationEventBus.getInstance();
  private intentEngine = new IntentEngine();

  constructor(
    private provider: IWhatsAppProvider,
    private convService: ConversationService,
    private cvService: CVService,
    private pdfService: PDFService,
    private authoringService: AuthoringService,
    private cvPreviewService: CvPreviewService
  ) {}

  public async processMessage(
    user: User,
    conversation: Conversation,
    message: string
  ): Promise<void> {
    const meta = (
      typeof conversation.metadata === 'object' && conversation.metadata !== null
        ? conversation.metadata
        : {}
    ) as SessionMetadata;

    logger.info(
      `[FSM] RAW conversation.metadata = ${JSON.stringify(conversation.metadata, null, 2)}`
    );
    logger.info(
      `[FSM] Parsed meta = ${JSON.stringify(meta, null, 2)}`
    );

    let cv = await this.cvService.getActiveCVForUser(user.id);
    if (!cv) {
      cv = await this.cvService.createCV({ userId: user.id });
    }

    if (!meta.currentSectionId) {
      meta.currentSectionId = 'WELCOME';
      meta.currentFieldId = 'DONE';
    }

    const lang = meta.lang === 'sw' ? 'sw' : 'en';

    if (meta.currentSectionId === 'WELCOME') {
      const section = SECTION_REGISTRY['WELCOME'];
      await this.completeSection(section, conversation, user, lang, cv, meta, false);
      
      const trimmed = message.trim().toLowerCase();
      const isLangChoice = trimmed === '1' || trimmed === '2' || 
                           trimmed.includes('swahili') || trimmed.includes('kiswahili') || 
                           trimmed.includes('english') || trimmed.includes('en') || trimmed.includes('sw');
      
      if (!isLangChoice) {
        logger.info("[TRACE] Returning from processMessage (!isLangChoice)");
        return;
      }
    }

    logger.info(
      `[FSM] processMessage section=${meta.currentSectionId} field=${meta.currentFieldId} review=${meta.isReviewMode}`
    );

    if (meta.isReviewMode) {
      logger.info("[FSM] Entering Review Mode");

      const handled = await this.handleReviewMode(
        message,
        conversation,
        user,
        lang,
        cv,
        meta
      );

      logger.info(`[FSM] Review handled=${handled}`);

      if (handled) {
        logger.info("[TRACE] Returning from processMessage (review handled)");
        return;
      }
    }

    // Prepare expected field info for IntentEngine
    let expectedField: string | undefined = undefined;
    let expectedFieldType: string | undefined = undefined;
    let currentQuestion: string | undefined = undefined;
    let fieldDescription: string | undefined = undefined;
    let validationHints: string | undefined = undefined;

    const currentSectionId = meta.currentSectionId as SectionId;
    if (currentSectionId) {
      const section = SECTION_REGISTRY[currentSectionId];
      if (section && meta.currentFieldId) {
        const field = section.fields.find((f) => f.id === meta.currentFieldId);
        if (field) {
          expectedField = field.id;
          currentQuestion = field.prompt[lang];
          fieldDescription = field.name[lang];
          
          if (field.id === 'email') {
            expectedFieldType = 'email address';
            validationHints = 'Must be a valid professional email address containing @ and a valid domain name.';
          } else if (field.id === 'phone') {
            expectedFieldType = 'phone number';
            validationHints = 'Must be a valid international or local phone number.';
          } else if (field.id === 'lang') {
            expectedFieldType = 'language code';
            validationHints = 'Must be either Swahili ( Kiswahili, 1, sw ) or English ( English, 2, en ). Extract "sw" or "en".';
          } else if (field.id === 'startYear' || field.id === 'endYear' || field.id === 'gradYear' || field.id === 'certYear') {
            expectedFieldType = 'year';
            validationHints = 'Must be a 4-digit number representing a year (e.g. 2021).';
          } else {
            expectedFieldType = 'string';
            validationHints = 'Provide a concise and accurate answer.';
          }
        }
      }
    }

    const context = ContextBuilder.build({
      language: lang,
      conversationId: conversation.id,
      currentSection: meta.currentSectionId,
      currentState: meta.currentFieldId || 'INTRO',
      lastBotMessage: meta.lastBotMessage || '',
      latestUserMessage: message,
      conversationHistory: [],
      cvSnapshot: cv,
      completedSections: meta.completedSections || [],
      activeTemplate: meta.template || 'modern',
      sessionMetadata: meta as any,
      expectedField,
      expectedFieldType,
      currentQuestion,
      fieldDescription,
      validationHints,
    });

    const intentResult = await this.intentEngine.evaluate(context);

    logger.info(
      `[FSM] Meta BEFORE handleIntent = ${JSON.stringify(meta, null, 2)}`
    );
    await this.handleIntent(intentResult, conversation, user, lang, cv, meta, message);
    logger.info("[TRACE] Returning from FSMEngine processMessage");
  }

  private async handleIntent(
    intentResult: IntentResult,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV,
    meta: SessionMetadata,
    message: string
  ) {
    const section = SECTION_REGISTRY[meta.currentSectionId as SectionId];
    if (intentResult.extractedData && intentResult.extractedData.lang) {
      meta.lang = intentResult.extractedData.lang as 'sw' | 'en';
      lang = meta.lang;
    }

    if (meta.currentFieldId === 'ADD_ANOTHER') {
      const ans = message.trim().toLowerCase();
      const isYes =
        ans === 'yes' ||
        ans === 'ndio' ||
        ans === 'y' ||
        ans === 'sawa' ||
        ans.startsWith('yes ') ||
        ans.startsWith('ndio ');

      if (isYes) {
        // Reset to first field of the multi-item section
        meta.currentFieldId = section.fields.length > 0 ? section.fields[0].id : 'DONE';
        await this.saveMeta(conversation.id, meta);
        await this.sendCurrentPrompt(section, meta, user, lang);
      } else {
        // Assume No/Done, complete section
        await this.completeSection(section, conversation, user, lang, cv, meta, false);
      }
      logger.info("[TRACE] Returning from handleIntent (ADD_ANOTHER)");
      return;
    }

    if (intentResult.intent === 'edit') {
      const sectionName = intentResult.extractedData?.sectionToEdit;
      if (sectionName) {
        const nameLower = String(sectionName).toLowerCase();
        let targetSection: SectionDefinition | undefined;

        // Try matching section by name or known keywords like 'phone', 'simu', 'email', 'address' which map to PERSONAL_INFO
        const personalInfoKeywords = [
          'simu',
          'phone',
          'email',
          'address',
          'jina',
          'name',
          'personal',
          'binafsi',
          'anwani',
        ];
        if (personalInfoKeywords.some((k) => nameLower.includes(k))) {
          targetSection = ORDERED_SECTIONS.find((s) => s.id === 'PERSONAL_INFO');
        } else {
          for (const s of ORDERED_SECTIONS) {
            if (s.id === 'REVIEW') continue;
            if (
              nameLower.includes(s.name.en.toLowerCase()) ||
              nameLower.includes(s.name.sw.toLowerCase()) ||
              s.name.en.toLowerCase().includes(nameLower) ||
              s.name.sw.toLowerCase().includes(nameLower)
            ) {
              targetSection = s;
              break;
            }
          }
        }

        if (targetSection) {
          this.eventBus.publish({
            event: ConversationEventType.EditStarted,
            timestamp: new Date().toISOString(),
            conversationId: conversation.id,
            userId: user.id,
            section: targetSection.id,
          });
          if (meta.currentSectionId !== 'REVIEW' && !meta.isReviewMode) {
            meta.returnToReview = false;
          } else {
            meta.isReviewMode = false;
            meta.returnToReview = true;
          }
          logger.info(
            `[FSM] Calling startSection(${targetSection.id})`
          );
          await this.startSection(targetSection.id, conversation, user, lang, cv);
          logger.info("[TRACE] Returning from handleIntent (edit target section)");
          return;
        }
      }

      // If we couldn't match a section, maybe just ask them what they want to edit
      const botReply =
        intentResult.botReply ||
        (lang === 'sw'
          ? 'Umesema unataka kubadili taarifa, lakini sijui ni sehemu gani. Tafadhali taja sehemu (mfano: elimu, uzoefu).'
          : 'I understand you want to edit, but I am not sure which section. Please specify (e.g., education, experience).');
      await this.provider.sendMessage(user.phone, botReply);
      logger.info("[TRACE] Returning from handleIntent (edit default)");
      return;
    }

    if (
      intentResult.intent === 'help' ||
      intentResult.intent === 'clarification' ||
      intentResult.intent === 'unknown'
    ) {
      this.eventBus.publish({
        event: ConversationEventType.ConversationPaused,
        timestamp: new Date().toISOString(),
        conversationId: conversation.id,
        userId: user.id,
      });
      const reply =
        intentResult.botReply ||
        (lang === 'sw' ? 'Sijaelewa, tafadhali rudia.' : "I didn't understand, please try again.");
      await this.provider.sendMessage(user.phone, reply);

      this.eventBus.publish({
        event: ConversationEventType.ConversationResumed,
        timestamp: new Date().toISOString(),
        conversationId: conversation.id,
        userId: user.id,
      });
      // Resend current prompt
      await this.sendCurrentPrompt(section, meta, user, lang);
      logger.info("[TRACE] Returning from handleIntent (help/unknown)");
      return;
    }

    if (intentResult.intent === 'skip') {
      if (section.required) {
        // Adaptive logic: If Experience is skipped, allow it but warn.
        if (section.id === 'EXPERIENCE') {
          const warnMsg =
            lang === 'sw'
              ? 'Naelewa huna uzoefu wa kazi kwa sasa. Ni sawa kabisa! Tutaangazia zaidi Elimu na Miradi yako ili kuvutia waajiri. Ungependa kuendelea bila uzoefu? (Ndio/Hapana)'
              : "I understand you might not have formal work experience yet. That's completely fine! We will highlight your Education and Projects instead to impress employers. Do you want to proceed without adding experience? (Yes/No)";
          meta.currentFieldId = 'CONFIRM_SKIP';
          await this.saveMeta(conversation.id, meta);
          await this.provider.sendMessage(user.phone, warnMsg);
        } else {
          const warnMsg =
            lang === 'sw'
              ? `Sehemu ya ${section.name.sw} ni muhimu sana kwa waajiri kwani inawasaidia kukutathmini kikamilifu. Je, una uhakika unataka kuruka sehemu hii kwa sasa? (Ndio/Hapana)`
              : `The ${section.name.en} section is highly recommended as it helps employers evaluate you comprehensively. Are you sure you want to skip this section for now? (Yes/No)`;
          meta.currentFieldId = 'CONFIRM_SKIP';
          await this.saveMeta(conversation.id, meta);
          await this.provider.sendMessage(user.phone, warnMsg);
        }
      } else {
        this.eventBus.publish({
          event: ConversationEventType.SectionSkipped,
          timestamp: new Date().toISOString(),
          conversationId: conversation.id,
          userId: user.id,
          section: section.id,
        });
        await this.completeSection(section, conversation, user, lang, cv, meta, true);
      }
      logger.info("[TRACE] Returning from handleIntent (skip)");
      return;
    }

    if (meta.currentFieldId === 'CONFIRM_SKIP') {
      const ans = message.trim().toLowerCase();
      // Check for positive confirmation of skipping (Yes)
      const isYes =
        ans === 'yes' ||
        ans === 'ndio' ||
        ans === 'y' ||
        ans === 'sawa' ||
        ans === 'sawa kabisa' ||
        ans === 'skip' ||
        ans === 'ruka' ||
        ans.startsWith('yes ') ||
        ans.startsWith('ndio ');

      // Check for negative confirmation of skipping (No / fill in details)
      const isNo =
        ans === 'no' ||
        ans === 'hapana' ||
        ans === 'n' ||
        ans === 'si sahihi' ||
        ans.startsWith('no ') ||
        ans.startsWith('hapana ') ||
        ans.includes('change my mind') ||
        ans.includes('badili mawazo') ||
        ans.includes('nitaweka') ||
        ans.includes('nitajaza');

      if (isYes) {
        this.eventBus.publish({
          event: ConversationEventType.SectionSkipped,
          timestamp: new Date().toISOString(),
          conversationId: conversation.id,
          userId: user.id,
          section: section.id,
        });
        await this.completeSection(section, conversation, user, lang, cv, meta, true);
      } else if (isNo) {
        meta.currentFieldId = section.fields.length > 0 ? section.fields[0].id : 'DONE';
        await this.saveMeta(conversation.id, meta);
        await this.sendCurrentPrompt(section, meta, user, lang);
      } else {
        // Under CONFIRM_SKIP, if the user asks questions or for clarification, we let the Intent Engine's AI reply naturally
        if (intentResult.botReply) {
          await this.provider.sendMessage(user.phone, intentResult.botReply);
        } else {
          const fallback =
            lang === 'sw'
              ? 'Sikuelewa vizuri. Tafadhali thibitisha kwa kujibu *Ndio* kama ungependa kuruka sehemu hii, au *Hapana* ili tuijaze sasa.'
              : "I didn't quite catch that. Please confirm by replying *Yes* to skip this section, or *No* to fill it in now.";
          await this.provider.sendMessage(user.phone, fallback);
        }
      }
      logger.info("[TRACE] Returning from handleIntent (CONFIRM_SKIP)");
      return;
    }

    if (intentResult.intent === 'confirmation') {
      if (meta.pendingConfirmationData) {
        // Confirming AI extracted data
        // Assume yes for now, could be yes/no
        await this.applyExtractedData(meta.pendingConfirmationData, cv);
        meta.pendingConfirmationData = undefined;
        await this.advanceField(
          section,
          conversation,
          user,
          lang,
          cv,
          meta,
          meta.pendingConfirmationData
        );
        logger.info("[TRACE] Returning from handleIntent (confirmation advanced)");
        return;
      }
    }

    if (intentResult.intent === 'answer' || intentResult.intent === 'correction') {
      if (meta.skipConfirmed) meta.skipConfirmed = false; // Reset

      if (intentResult.requiresConfirmation) {
        meta.pendingConfirmationData = intentResult.extractedData;
        await this.saveMeta(conversation.id, meta);
        const confirmMsg =
          lang === 'sw'
            ? 'Nimeelewa: ' + JSON.stringify(intentResult.extractedData) + '. Ni sahihi?'
            : 'I understood: ' + JSON.stringify(intentResult.extractedData) + '. Is this correct?';
        await this.provider.sendMessage(user.phone, confirmMsg);
        logger.info("[TRACE] Returning from handleIntent (answer requires confirmation)");
        return;
      }
      if (intentResult.extractedData) {
        await this.applyExtractedData(intentResult.extractedData, cv);
      }

      // Handle "Add Another" for multi-item sections
      if (meta.currentFieldId === 'ADD_ANOTHER') {
        // If extracted data implies yes, or if user said yes
        // For now, let's assume they said no unless intent says they want to add
        // If intent is answer, and they provided data, maybe we loop.
        // Simplification: if intent is answer, check if truthy
        // Actually, if they say 'Yes', it's confirmation
      }

      await this.advanceField(
        section,
        conversation,
        user,
        lang,
        cv,
        meta,
        intentResult.extractedData,
        intentResult.botReply
      );
      logger.info("[TRACE] Returning from handleIntent (answer advanced)");
      return;
    }

    // Default catch-all
    await this.sendCurrentPrompt(section, meta, user, lang);
    logger.info("[TRACE] Returning from handleIntent (default)");
  }

  private async applyExtractedData(data: Record<string, any>, cv: CV) {
    await CVDataUpdater.updateCV(cv.id, data);
  }

  private async startSection(
    sectionId: SectionId,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV
  ) {
    logger.info(`[TRACE] ENTER startSection(${sectionId})`);
    logger.info(`[FSM] ENTER startSection(${sectionId})`);
    const section = SECTION_REGISTRY[sectionId];
    if (!section) {
      logger.info("[TRACE] Returning from startSection (!section)");
      return;
    }

    this.eventBus.publish({
      event: ConversationEventType.SectionStarted,
      timestamp: new Date().toISOString(),
      conversationId: conversation.id,
      userId: user.id,
      section: sectionId,
    });

    const meta = (
      typeof conversation.metadata === 'object' && conversation.metadata !== null
        ? conversation.metadata
        : {}
    ) as SessionMetadata;

    meta.currentSectionId = sectionId;
    meta.currentFieldId = section.fields.length > 0 ? section.fields[0].id : 'DONE';
    meta.skipConfirmed = false;
    meta.pendingConfirmationData = undefined;

    // Show Progress
    await this.showProgress(section, meta, user, lang);

    let intro = section.introPrompt[lang];
    if (section.id === 'REVIEW') {
      meta.isReviewMode = true;
      logger.info("[FSM] startSection SET meta.isReviewMode=true");
      logger.info(
        "[FSM] AFTER SET isReviewMode\n" +
        JSON.stringify(meta, null, 2)
      );
      intro += '\n\n' + (await this.buildReviewText(cv, meta, lang));
    }
    if (intro && intro.trim() !== '') {
      await this.provider.sendMessage(user.phone, intro);
    }

    logger.info("[TRACE] saveMeta about to execute");
    logger.info(
      "[FSM] BEFORE saveMeta()\n" +
      JSON.stringify(meta, null, 2)
    );
    await this.saveMeta(conversation.id, meta);
    const savedConversation =
        await this.convService.getConversationById(conversation.id);

    logger.info(
      "[FSM] DATABASE metadata AFTER save\n" +
      JSON.stringify(savedConversation?.metadata, null, 2)
    );

    if (meta.currentFieldId !== 'DONE') {
      await this.sendCurrentPrompt(section, meta, user, lang);
    } else {
      // Review section is practically "done" fields-wise
      if (sectionId !== 'REVIEW') {
        await this.completeSection(section, conversation, user, lang, cv, meta, false);
      }
    }
  }

  private async advanceField(
    section: SectionDefinition,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV,
    meta: SessionMetadata,
    extractedData?: Record<string, any>,
    botReply?: string
  ) {
    let currentIndex = section.fields.findIndex((f) => f.id === meta.currentFieldId);

    // auto-skip logic
    if (extractedData) {
      while (currentIndex < section.fields.length - 1) {
        const nextF = section.fields[currentIndex + 1];
        if (extractedData[nextF.id] !== undefined && extractedData[nextF.id] !== null) {
          currentIndex++; // skip because it was just extracted!
        } else {
          break;
        }
      }
    }

    if (currentIndex === -1 || currentIndex >= section.fields.length - 1) {
      if (section.isMultiItem && meta.currentFieldId !== 'ADD_ANOTHER') {
        meta.currentFieldId = 'ADD_ANOTHER';
        await this.saveMeta(conversation.id, meta);
        let prompt =
          lang === 'sw'
            ? 'Je, ungependa kuongeza nyingine? (Ndio/Hapana)'
            : 'Would you like to add another? (Yes/No)';
        if (botReply) {
          prompt = `${botReply.trim()}\n\n${prompt}`;
        }
        await this.provider.sendMessage(user.phone, prompt);
    } else {
      logger.warn(`[FSM] sendCurrentPrompt called but field ${meta.currentFieldId} not found in section ${section.id}`);
      if (botReply) {
        await this.provider.sendMessage(user.phone, botReply);
      }
        logger.info("[TRACE] Returning from advanceField (ADD_ANOTHER)");
        return;
      }
      if (meta.currentFieldId === 'ADD_ANOTHER') {
        // For now we assume complete.
      }
      await this.completeSection(section, conversation, user, lang, cv, meta, false);
    } else {
      const nextField = section.fields[currentIndex + 1];
      meta.currentFieldId = nextField.id;
      await this.saveMeta(conversation.id, meta);
      await this.sendCurrentPrompt(section, meta, user, lang, botReply);
    }
  }

  private async sendCurrentPrompt(
    section: SectionDefinition,
    meta: SessionMetadata,
    user: User,
    lang: 'sw' | 'en',
    botReply?: string
  ) {
    const field = section.fields.find((f) => f.id === meta.currentFieldId);
    if (field) {
      let prompt = field.prompt[lang];

      if (botReply) {
        prompt = `${botReply.trim()}\n\n${prompt}`;
      }

      meta.lastBotMessage = prompt;
      await this.provider.sendMessage(user.phone, prompt);
    } else {
      logger.warn(`[FSM] sendCurrentPrompt called but field ${meta.currentFieldId} not found in section ${section.id}`);
      if (botReply) {
        await this.provider.sendMessage(user.phone, botReply);
      }
    }
  }

  private async completeSection(
    section: SectionDefinition,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV,
    meta: SessionMetadata,
    skipped: boolean
  ) {
    if (!meta.completedSections) meta.completedSections = [];
    if (!meta.skippedSections) meta.skippedSections = [];

    if (skipped) {
      if (!meta.skippedSections.includes(section.id)) meta.skippedSections.push(section.id);
    } else {
      if (!meta.completedSections.includes(section.id)) meta.completedSections.push(section.id);
    }

    this.eventBus.publish({
      event: ConversationEventType.SectionCompleted,
      timestamp: new Date().toISOString(),
      conversationId: conversation.id,
      userId: user.id,
      section: section.id,
    });

    // Show rewarding message only if returning to review, to avoid duplicating the next section's intro prompt
    if (!skipped && section.id !== 'REVIEW' && meta.returnToReview) {
      const ack = this.getAcknowledgement(lang);
      const reward =
        lang === 'sw'
          ? `${ack} ${section.name.sw} imeongezwa kikamilifu.`
          : `${ack} Your ${section.name.en} has been successfully updated.`;
      await this.provider.sendMessage(user.phone, reward);
    }

    if (meta.returnToReview) {
      meta.returnToReview = false;
      logger.info(
        `[FSM] Calling startSection(REVIEW)`
      );
      logger.info("[TRACE] About to enter REVIEW");
      await this.startSection('REVIEW', conversation, user, lang, cv);
    } else {
      const currentIndex = ORDERED_SECTIONS.findIndex((s) => s.id === section.id);
      if (currentIndex < ORDERED_SECTIONS.length - 1) {
        const nextSection = ORDERED_SECTIONS[currentIndex + 1];
        logger.info(
          `[FSM] Calling startSection(${nextSection.id})`
        );
        if (nextSection.id === 'REVIEW') {
          logger.info("[TRACE] About to enter REVIEW");
        }
        await this.startSection(nextSection.id, conversation, user, lang, cv);
      } else {
        // Finished Review!
        const endMsg =
          lang === 'sw'
            ? 'Hongera! CV yako imekamilika. Tutaandaa PDF sasa.'
            : 'Congratulations! Your CV is complete. We will generate the PDF now.';
        await this.provider.sendMessage(user.phone, endMsg);
      }
    }
  }

  private async showProgress(
    section: SectionDefinition,
    meta: SessionMetadata,
    user: User,
    lang: 'sw' | 'en'
  ) {
    if (section.id === 'WELCOME' || section.id === 'LANGUAGE_SELECTION') return;
    const total = ORDERED_SECTIONS.filter(s => s.id !== 'REVIEW' && s.id !== 'WELCOME' && s.id !== 'LANGUAGE_SELECTION').length;
    const current = section.order;

    let msg = lang === 'sw' ? '📊 *Maendeleo Yako:*\n\n' : '📊 *Live Progress:*\n\n';

    const comp: string[] = [];
    let next = null;
    let remain = 0;
    ORDERED_SECTIONS.forEach((s) => {
      if (s.id === 'REVIEW' || s.id === 'WELCOME' || s.id === 'LANGUAGE_SELECTION') return;
      if (meta.completedSections?.includes(s.id) || meta.skippedSections?.includes(s.id)) {
        comp.push(s.name[lang]);
      } else if (s.id === section.id) {
        next = s.name[lang];
      } else if (s.order > current) {
        remain++;
      }
    });

    if (comp.length > 0) {
      msg += `✅ Kamili: ${comp.length}/${total}\n`;
    }
    if (next) {
      msg += `➡️ Inayofuata: *${next}*\n`;
    }
    if (remain > 0) {
      msg += lang === 'sw' ? `\nZilizobaki: ${remain}\n` : `\nRemaining: ${remain}\n`;
    }
    await this.provider.sendMessage(user.phone, msg);
  }

  private async buildReviewText(cv: CV, meta: SessionMetadata, lang: 'sw' | 'en'): Promise<string> {
    let msg = lang === 'sw' ? '📋 *Uhakiki wa CV Yako:*\n\n' : '📋 *Review your CV:*\n\n';
    ORDERED_SECTIONS.forEach((s) => {
      if (s.id === 'REVIEW' || s.id === 'WELCOME' || s.id === 'LANGUAGE_SELECTION') return;
      const isSkipped = meta.skippedSections?.includes(s.id);
      const isCompleted = meta.completedSections?.includes(s.id);
      let status = '';
      if (isSkipped) status = '⏭️';
      else if (isCompleted) status = '✓';
      else status = '❌';

      msg += `${status} ${s.name[lang]}\n`;
    });
    const askStr =
      lang === 'sw'
        ? '\nJe, ungependa kurekebisha chochote kabla sijatengeneza CV yako?\n(Andika "hariri [sehemu]" kurekebisha au "Sahihi" kumaliza)'
        : '\nWould you like to edit anything before I generate your professional CV?\n(Type "edit [section]" to change something, or "Yes" to finish)';
    msg += askStr;
    return msg;
  }

  private async handleReviewMode(
    message: string,
    conversation: Conversation,
    user: User,
    lang: 'sw' | 'en',
    cv: CV,
    _meta: SessionMetadata
  ): Promise<boolean> {
    logger.info(
      `[FSM] handleReviewMode message="${message}"`
    );
    const msgLower = message.toLowerCase();
    if (
      msgLower.includes('correct') ||
      msgLower.includes('sahihi') ||
      msgLower.includes('yes') ||
      msgLower.includes('ndio') ||
      msgLower.includes('generate')
    ) {
      this.eventBus.publish({
        event: ConversationEventType.ReviewCompleted,
        timestamp: new Date().toISOString(),
        conversationId: conversation.id,
        userId: user.id,
      });

      const endMsg =
        lang === 'sw'
          ? 'Tunatengeneza CV yako kitaalam sasa (inaweza kuchukua sekunde chache)...'
          : 'Enhancing and generating your professional CV now (this may take a few seconds)...';
      await this.provider.sendMessage(user.phone, endMsg);

      // Step 1: Authoring Pipeline
      logger.info("[FSM] Calling AuthoringService");
      const enhancementResult = await this.authoringService.enhanceCV(cv, lang);
      logger.info("[FSM] Authoring finished");

      if (!enhancementResult.success) {
        logger.error(`[FSMEngine] Authoring Service failed: ${enhancementResult.reason}`);
      }

      const finalCVData = enhancementResult.success ? enhancementResult.data : cv;

      if (enhancementResult.success && enhancementResult.consistency?.hasInconsistencies) {
        logger.warn(
          `[FSMEngine] CV Consistency warnings found: ${JSON.stringify(enhancementResult.consistency.inconsistencies)}`
        );
      }

      // Update CV in DB with final data
      await this.cvService.updateCV(cv.id, {
        professionalSummary: finalCVData.professionalSummary,
        experience: finalCVData.experience,
        skills: finalCVData.skills,
        education: finalCVData.education,
        projects: finalCVData.projects,
      });

      // Step 2: Generate PDF
      const htmlContent = this.cvPreviewService.generateHtml(user, finalCVData);
      logger.info("[FSM] Generating PDF");
      const pdfUrl = await this.pdfService.generatePDF(htmlContent, `CV_${user.id}.pdf`);
      if (pdfUrl) {
        logger.info("[FSM] Sending PDF");
        await this.provider.sendMessage(
          user.phone,
          lang === 'sw'
            ? `Asante kwa kutumia CareerBot! CV yako ipo tayari: ${pdfUrl}`
            : `Thank you for using CareerBot! Your CV is ready: ${pdfUrl}`
        );
      } else {
        await this.provider.sendMessage(user.phone, 'Error generating PDF.');
      }
      logger.info("[TRACE] Returning from handleReviewMode (true)");
      return true;
    }
    logger.info("[TRACE] Returning from handleReviewMode (false)");
    return false;
  }

  private getAcknowledgement(lang: 'sw' | 'en'): string {
    const sw = [
      'Safi sana!',
      'Kazi nzuri!',
      'Tumepata maelezo hayo, vizuri sana.',
      'Sawa kabisa, imekamilika vyema.',
      'Ushirikiano wako ni mzuri sana.',
      'Marekebisho yamehifadhiwa vizuri.',
      'Safi mno!',
      'Hakika, taarifa hizi zitafanya CV yako kuvutia zaidi.',
    ];
    const en = [
      'Wonderful!',
      'Perfect, got that.',
      'That makes total sense.',
      'Excellent progress!',
      'Thank you, that is clear.',
      'Beautifully phrased!',
      'Got it. This is shaping up nicely.',
      'Indeed, this details your background perfectly.',
      'Fantastic!',
    ];
    const arr = lang === 'sw' ? sw : en;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private async saveMeta(conversationId: string, meta: SessionMetadata) {
    logger.info("[TRACE] ENTER saveMeta");
    logger.info(
      "[FSM] saveMeta() received\n" +
      JSON.stringify(meta, null, 2)
    );
    await this.convService.updateConversation(conversationId, { metadata: meta as any });
  }
}
