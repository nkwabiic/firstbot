import { IEventBus, ConversationEventType, ConversationEventPayload } from './event-types.js';
import { logger } from '../../utils/logger.js';

export class ConversationEventBus implements IEventBus {
  private static instance: ConversationEventBus;
  private handlers: Map<ConversationEventType, Array<(payload: ConversationEventPayload) => void>>;

  private constructor() {
    this.handlers = new Map();
  }

  public static getInstance(): ConversationEventBus {
    if (!ConversationEventBus.instance) {
      ConversationEventBus.instance = new ConversationEventBus();
    }
    return ConversationEventBus.instance;
  }

  public publish(event: ConversationEventPayload): void {
    try {
      const eventHandlers = this.handlers.get(event.event) || [];
      for (const handler of eventHandlers) {
        // Execute handlers asynchronously to prevent blocking the main conversation thread
        setImmediate(() => {
          try {
            handler(event);
          } catch (error) {
            logger.error(`[EventBus] Error in handler for event ${event.event}: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
      }
    } catch (error) {
       logger.error(`[EventBus] Error publishing event ${event.event}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public subscribe(eventType: ConversationEventType, handler: (payload: ConversationEventPayload) => void): void {
    const eventHandlers = this.handlers.get(eventType) || [];
    eventHandlers.push(handler);
    this.handlers.set(eventType, eventHandlers);
  }

  public unsubscribe(eventType: ConversationEventType, handler: (payload: ConversationEventPayload) => void): void {
    const eventHandlers = this.handlers.get(eventType) || [];
    const index = eventHandlers.indexOf(handler);
    if (index !== -1) {
      eventHandlers.splice(index, 1);
      this.handlers.set(eventType, eventHandlers);
    }
  }
}
