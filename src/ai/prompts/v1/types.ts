import { z } from 'zod';
import { ConversationContext } from '../../context/types.js';
import { AIProfile } from '../../policy/types.js';

export interface PromptDefinition<TOutput> {
  version: string;
  purpose: string;
  systemInstruction: string;
  userPrompt: string;
  outputSchema: z.ZodType<TOutput>;
  profile: AIProfile;
  metadata: {
    module: string;
    promptVersion: string;
  };
}

export interface PromptModule<TInput, TOutput> {
  version: string;
  purpose: string;
  moduleName: string;
  profile: AIProfile;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  buildPrompt(context: ConversationContext, input: TInput): PromptDefinition<TOutput>;
}
