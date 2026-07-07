import { ConversationContext, ContextBuilderParams } from './types.js';

export class ContextBuilder {
  public static build(params: ContextBuilderParams): Readonly<ConversationContext> {
    return Object.freeze({
      ...params,
      timestamp: new Date().toISOString()
    });
  }
}
