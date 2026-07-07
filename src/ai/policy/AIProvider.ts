import { ConversationContext } from '../context/types.js';
import { PromptDefinition } from '../prompts/v1/types.js';

export interface AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute<TOutput>(promptDef: PromptDefinition<TOutput>, context: ConversationContext): Promise<string>;
}
