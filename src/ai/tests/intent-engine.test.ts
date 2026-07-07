import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { IntentEngine } from '../intent/IntentEngine.js';
import { ContextBuilder } from '../context/ContextBuilder.js';
import { AIPolicyEngine } from '../policy/AIPolicyEngine.js';
import { AIProvider } from '../policy/AIProvider.js';
import { PromptDefinition } from '../prompts/v1/types.js';
import { ConversationContext } from '../context/types.js';
import { AICache } from '../cache/AICache.js';

class MockIntentProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public responseData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public validationResponse: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  public async execute<TOutput>(promptDef: PromptDefinition<TOutput>, context: ConversationContext): Promise<string> {
    if (promptDef.metadata.module === 'ValidationPrompt') {
       return JSON.stringify(this.validationResponse || { isValid: true });
    }
    if (promptDef.metadata.module === 'IntentPrompt') {
      if (this.responseData === 'INVALID_JSON') return '{"bad":';
      return JSON.stringify(this.responseData);
    }
    throw new Error(`Unknown module ${promptDef.metadata.module}`);
  }
}

describe('IntentEngine', () => {
  let mockProvider: MockIntentProvider;
  let intentEngine: IntentEngine;

  beforeEach(() => {
    AICache.clear(); // Important! Clear cache between tests
    mockProvider = new MockIntentProvider();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (AIPolicyEngine as any).instance = undefined;
    AIPolicyEngine.initialize(mockProvider);
    intentEngine = new IntentEngine();
  });

  const getContext = (message: string, lang: 'en' | 'sw' = 'en') => ContextBuilder.build({
    language: lang,
    conversationId: '123',
    currentSection: 'experience',
    currentState: 'EXP_START_YEAR',
    lastBotMessage: 'When did you start?',
    latestUserMessage: message,
    conversationHistory: [],
    cvSnapshot: {},
    completedSections: [],
    activeTemplate: 'modern',
    sessionMetadata: {}
  });

  it('detects Answer and requires no confirmation for high confidence (95-100)', async () => {
    mockProvider.responseData = { intent: 'answer', confidence: 98, extractedData: { year: 2020 }, reason: 'Clear answer' };
    const res = await intentEngine.evaluate(getContext('2020'));
    assert.strictEqual(res.intent, 'answer');
    assert.strictEqual(res.requiresConfirmation, false);
    assert.deepStrictEqual(res.extractedData, { year: 2020 });
  });

  it('detects Answer and requires confirmation for medium confidence (80-94)', async () => {
    mockProvider.responseData = { intent: 'answer', confidence: 85, extractedData: { year: 2020 }, reason: 'Clear answer' };
    const res = await intentEngine.evaluate(getContext('I think 2020'));
    assert.strictEqual(res.intent, 'answer');
    assert.strictEqual(res.requiresConfirmation, true);
  });

  it('forces Clarification for lower confidence (60-79)', async () => {
    mockProvider.responseData = { intent: 'answer', confidence: 75, extractedData: { year: 2020 }, reason: 'Clear answer' };
    const res = await intentEngine.evaluate(getContext('20 something'));
    assert.strictEqual(res.intent, 'clarification');
    assert.strictEqual(res.requiresConfirmation, false);
  });

  it('forces Unknown for very low confidence (<60)', async () => {
    mockProvider.responseData = { intent: 'answer', confidence: 50, reason: 'Clear answer' };
    const res = await intentEngine.evaluate(getContext('abcd'));
    assert.strictEqual(res.intent, 'unknown');
    assert.strictEqual(res.requiresConfirmation, false);
  });

  it('detects Help', async () => {
    mockProvider.responseData = { intent: 'help', confidence: 99, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Help me'));
    assert.strictEqual(res.intent, 'help');
  });

  it('detects Clarification', async () => {
    mockProvider.responseData = { intent: 'clarification', confidence: 98, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('What do you mean?'));
    assert.strictEqual(res.intent, 'clarification');
  });

  it('detects Greeting', async () => {
    mockProvider.responseData = { intent: 'greeting', confidence: 99, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Hello'));
    assert.strictEqual(res.intent, 'greeting');
  });

  it('detects Correction', async () => {
    mockProvider.responseData = { intent: 'correction', confidence: 96, extractedData: { year: 2021 }, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Actually 2021'));
    assert.strictEqual(res.intent, 'correction');
    assert.deepStrictEqual(res.extractedData, { year: 2021 });
  });

  it('detects Confirmation', async () => {
    mockProvider.responseData = { intent: 'confirmation', confidence: 98, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Yes'));
    assert.strictEqual(res.intent, 'confirmation');
  });

  it('detects Skip', async () => {
    mockProvider.responseData = { intent: 'skip', confidence: 100, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Skip'));
    assert.strictEqual(res.intent, 'skip');
  });

  it('detects Cancel', async () => {
    mockProvider.responseData = { intent: 'cancel', confidence: 99, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Cancel'));
    assert.strictEqual(res.intent, 'cancel');
  });

  it('detects Back', async () => {
    mockProvider.responseData = { intent: 'back', confidence: 99, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Go back'));
    assert.strictEqual(res.intent, 'back');
  });

  it('detects Edit', async () => {
    mockProvider.responseData = { intent: 'edit', confidence: 95, reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Edit this'));
    assert.strictEqual(res.intent, 'edit');
  });

  it('handles multi-field extraction', async () => {
    mockProvider.responseData = { 
      intent: 'answer', 
      confidence: 96, 
      extractedData: { company: 'CRDB', role: 'SWE', startYear: 2021, endYear: 2023 },
      reason: 'Help'
    };
    const res = await intentEngine.evaluate(getContext('I worked at CRDB as SWE from 2021 to 2023'));
    assert.strictEqual(res.intent, 'answer');
    assert.deepStrictEqual(res.extractedData, { company: 'CRDB', role: 'SWE', startYear: 2021, endYear: 2023 });
  });

  it('handles semantic validation failure', async () => {
    mockProvider.responseData = { intent: 'answer', confidence: 98, extractedData: { year: 1890 }, reason: 'Help' };
    mockProvider.validationResponse = { isValid: false, reason: 'Year is too far in the past.' };
    
    const res = await intentEngine.evaluate(getContext('1890'));
    assert.strictEqual(res.intent, 'unknown');
    assert.strictEqual(res.botReply, 'Year is too far in the past.');
  });

  it('returns unknown on schema validation failure', async () => {
    mockProvider.responseData = 'INVALID_JSON';
    const res = await intentEngine.evaluate(getContext('foo'));
    assert.strictEqual(res.intent, 'unknown');
    assert.strictEqual(res.confidence, 0);
  });

  it('respects Language Consistency', async () => {
    mockProvider.responseData = { intent: 'help', confidence: 98, botReply: 'Ninawezaje kukusaidia?', reason: 'Help' };
    const res = await intentEngine.evaluate(getContext('Msaada', 'sw'));
    assert.strictEqual(res.intent, 'help');
    assert.strictEqual(res.botReply, 'Ninawezaje kukusaidia?');
  });
});
