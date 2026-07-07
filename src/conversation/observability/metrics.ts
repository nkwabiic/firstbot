import { ConversationEventType, ConversationEventPayload } from '../events/event-types.js';
import { ConversationEventBus } from '../events/event-bus.js';
import { logger } from '../../utils/logger.js';

/**
 * MetricsObserver is responsible for collecting and logging metrics
 * based on conversation events. In a production environment, this could
 * forward metrics to Prometheus, DataDog, Cloud Monitoring, etc.
 */
export class MetricsObserver {
  private static instance: MetricsObserver;
  private eventBus: ConversationEventBus;

  // In-memory counters for simple reporting (optional)
  private metrics = {
    totalConversations: 0,
    aiRequests: 0,
    aiSuccess: 0,
    aiFailures: 0,
    validationFailures: 0,
    clarifications: 0,
    pdfsGenerated: 0,
  };

  private constructor() {
    this.eventBus = ConversationEventBus.getInstance();
    this.initializeSubscriptions();
  }

  public static getInstance(): MetricsObserver {
    if (!MetricsObserver.instance) {
      MetricsObserver.instance = new MetricsObserver();
    }
    return MetricsObserver.instance;
  }

  private initializeSubscriptions(): void {
    // We bind the methods to maintain context
    this.eventBus.subscribe(ConversationEventType.ConversationStarted, this.handleConversationStarted.bind(this));
    this.eventBus.subscribe(ConversationEventType.AIRequested, this.handleAIRequested.bind(this));
    this.eventBus.subscribe(ConversationEventType.AISucceeded, this.handleAISucceeded.bind(this));
    this.eventBus.subscribe(ConversationEventType.AIFailed, this.handleAIFailed.bind(this));
    this.eventBus.subscribe(ConversationEventType.ValidationFailed, this.handleValidationFailed.bind(this));
    this.eventBus.subscribe(ConversationEventType.ClarificationRequested, this.handleClarificationRequested.bind(this));
    this.eventBus.subscribe(ConversationEventType.PDFGenerated, this.handlePDFGenerated.bind(this));

    // A generic handler for all events to standardise logging
    Object.values(ConversationEventType).forEach((eventType) => {
      this.eventBus.subscribe(eventType as ConversationEventType, this.logEvent.bind(this));
    });
  }

  private logEvent(payload: ConversationEventPayload): void {
    // Do not log PII. Ensure payload.metadata doesn't contain user-sensitive data
    // logger.info format: START/SUCCESS/FAILURE/LATENCY
    
    // Determine the status suffix based on event name conventions
    let status = 'INFO';
    if (payload.event.includes('Started') || payload.event.includes('Requested')) {
      status = 'START';
    } else if (payload.event.includes('Completed') || payload.event.includes('Succeeded') || payload.event.includes('Passed') || payload.event.includes('Generated') || payload.event.includes('Saved') || payload.event.includes('Updated')) {
      status = 'SUCCESS';
    } else if (payload.event.includes('Failed')) {
      status = 'FAILURE';
    }

    const latencyInfo = payload.metadata?.latency ? ` LATENCY: ${payload.metadata.latency}ms` : '';
    
    logger.info(`[Metrics] ${status} - Event: ${payload.event} | ConvID: ${payload.conversationId}${latencyInfo}`);
  }

  private handleConversationStarted(_payload: ConversationEventPayload): void {
    this.metrics.totalConversations++;
  }

  private handleAIRequested(_payload: ConversationEventPayload): void {
    this.metrics.aiRequests++;
  }

  private handleAISucceeded(_payload: ConversationEventPayload): void {
    this.metrics.aiSuccess++;
  }

  private handleAIFailed(_payload: ConversationEventPayload): void {
    this.metrics.aiFailures++;
  }

  private handleValidationFailed(_payload: ConversationEventPayload): void {
    this.metrics.validationFailures++;
  }

  private handleClarificationRequested(_payload: ConversationEventPayload): void {
    this.metrics.clarifications++;
  }

  private handlePDFGenerated(_payload: ConversationEventPayload): void {
    this.metrics.pdfsGenerated++;
  }

  public getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }
}
