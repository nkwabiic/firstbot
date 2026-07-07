import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './AIProvider.js';
import { PromptDefinition } from '../prompts/v1/types.js';
import { ConversationContext } from '../context/types.js';
import { config } from '../../app/config/env.js';

function unwrapZod(schema: any): any {
  while (schema && schema._def) {
    if (
      schema._def.typeName === 'ZodOptional' ||
      schema._def.typeName === 'ZodNullable' ||
      schema._def.typeName === 'ZodDefault'
    ) {
      schema = schema._def.innerType;
    } else if (schema._def.typeName === 'ZodEffects') {
      schema = schema._def.schema;
    } else {
      break;
    }
  }
  return schema;
}

function convertZodToGeminiSchema(zodSchema: any): any {
  if (!zodSchema || !zodSchema._def) {
    return { type: 'STRING' };
  }

  const typeName = zodSchema._def.typeName;

  switch (typeName) {
    case 'ZodString':
      return { type: 'STRING' };
    case 'ZodNumber':
      return { type: 'NUMBER' };
    case 'ZodBoolean':
      return { type: 'BOOLEAN' };
    case 'ZodEnum':
      return {
        type: 'STRING',
        enum: zodSchema._def.values,
      };
    case 'ZodArray':
      return {
        type: 'ARRAY',
        items: convertZodToGeminiSchema(zodSchema._def.type),
      };
    case 'ZodObject': {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, valueSchema] of Object.entries(zodSchema.shape)) {
        const unwrapped = unwrapZod(valueSchema);
        properties[key] = convertZodToGeminiSchema(unwrapped);

        const isOptional =
          (valueSchema as any)._def.typeName === 'ZodOptional' ||
          (valueSchema as any)._def.typeName === 'ZodNullable';
        if (!isOptional) {
          required.push(key);
        }
      }

      const result: any = {
        type: 'OBJECT',
        properties,
      };
      if (required.length > 0) {
        result.required = required;
      }
      return result;
    }
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return convertZodToGeminiSchema(zodSchema._def.innerType);
    case 'ZodEffects':
      return convertZodToGeminiSchema(zodSchema._def.schema);
    case 'ZodRecord':
      return {
        type: 'OBJECT',
      };
    case 'ZodAny':
    default:
      return { type: 'STRING' };
  }
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  public async execute<TOutput>(promptDef: PromptDefinition<TOutput>, context: ConversationContext): Promise<string> {
    const { profile, systemInstruction, userPrompt } = promptDef;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout')), profile.timeoutMs);
    });

    const apiConfig: any = {
      systemInstruction: systemInstruction,
      responseMimeType: profile.responseMimeType,
      temperature: profile.temperature,
      topP: profile.topP,
      maxOutputTokens: profile.maxOutputTokens,
    };

    if (profile.responseMimeType === 'application/json' && promptDef.outputSchema) {
      apiConfig.responseSchema = convertZodToGeminiSchema(promptDef.outputSchema);
    }

    const responsePromise = this.ai.models.generateContent({
      model: profile.model,
      contents: userPrompt,
      config: apiConfig,
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    if (!response.text) {
      throw new Error('Empty response from AI Provider');
    }
    
    return response.text;
  }
}
