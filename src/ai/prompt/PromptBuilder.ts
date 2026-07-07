import { ConversationContext } from '../context/types.js';
import { PromptModule, PromptDefinition } from '../prompts/v1/types.js';

export class PromptBuilder {
  public static build<TInput, TOutput>(
    module: PromptModule<TInput, TOutput>,
    context: ConversationContext,
    input: TInput
  ): PromptDefinition<TOutput> {
    const parsedInput = module.inputSchema.parse(input);
    return module.buildPrompt(context, parsedInput);
  }
}
