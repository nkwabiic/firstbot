import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InputNormalizer } from '../InputNormalizer.js';
import { LanguageDetector } from '../LanguageDetector.js';
import { CommandDetector, CommandIntent } from '../CommandDetector.js';
import { Layer1Validation } from '../validation/Layer1.js';
import { Layer2Validation } from '../validation/Layer2.js';
import { ConversationRouter } from '../ConversationRouter.js';
import { ConversationState } from '../../fsm/states.js';

describe('InputNormalizer', () => {
  it('should trim and normalize spaces', () => {
    const result = InputNormalizer.normalize('  hello   world  ');
    assert.strictEqual(result.normalized, 'hello world');
    assert.strictEqual(result.lowercase, 'hello world');
    assert.strictEqual(result.original, '  hello   world  ');
  });
});

describe('LanguageDetector', () => {
  it('should detect Swahili via heuristics', () => {
    const result = LanguageDetector.detectLanguage('Habari yako asante', 'en');
    assert.strictEqual(result.language, 'sw');
    assert.ok(result.confidence > 0.5);
    assert.strictEqual(result.reason, 'heuristic');
  });

  it('should detect explicit English command', () => {
    const result = LanguageDetector.detectLanguage('switch to english', 'sw', CommandIntent.CHANGE_LANGUAGE_EN);
    assert.strictEqual(result.language, 'en');
    assert.strictEqual(result.confidence, 1.0);
    assert.strictEqual(result.reason, 'explicit_command');
  });

  it('should fallback to current lang on unknown', () => {
    const result = LanguageDetector.detectLanguage('xyzabc', 'en');
    assert.strictEqual(result.language, 'en');
    assert.strictEqual(result.reason, 'session_persistence');
  });
});

describe('CommandDetector', () => {
  it('should detect skip command', () => {
    assert.strictEqual(CommandDetector.detect('skip'), CommandIntent.SKIP);
    assert.strictEqual(CommandDetector.detect('ruka'), CommandIntent.SKIP);
  });

  it('should detect explicit language commands', () => {
    assert.strictEqual(CommandDetector.detect('badili lugha'), CommandIntent.CHANGE_LANGUAGE_SW);
    assert.strictEqual(CommandDetector.detect('english'), CommandIntent.CHANGE_LANGUAGE_EN);
  });

  it('should ignore non-commands', () => {
    assert.strictEqual(CommandDetector.detect('hello'), null);
  });
});

describe('Layer1Validation', () => {
  it('should validate email', () => {
    assert.strictEqual(Layer1Validation.isEmail('test@example.com').isValid, true);
    assert.strictEqual(Layer1Validation.isEmail('test').isValid, false);
  });

  it('should validate phone', () => {
    assert.strictEqual(Layer1Validation.isPhone('+255712345678').isValid, true);
    assert.strictEqual(Layer1Validation.isPhone('abc').isValid, false);
  });
});

describe('Layer2Validation', () => {
  it('should validate graduation year', () => {
    const currYear = new Date().getFullYear();
    assert.strictEqual(Layer2Validation.validateGraduationYear(currYear + 1).isValid, true);
    assert.strictEqual(Layer2Validation.validateGraduationYear(currYear + 10).isValid, false);
  });

  it('should validate graduation logically related to birth year', () => {
    // birth year 2000, grad year 2010 -> false
    assert.strictEqual(Layer2Validation.validateGraduationYear(2010, 2000).isValid, false);
  });

  it('should validate end year is not in future', () => {
    const currYear = new Date().getFullYear();
    assert.strictEqual(Layer2Validation.validateYears(2020, currYear + 1).isValid, false);
    assert.strictEqual(Layer2Validation.validateYears(2020, 2022).isValid, true);
  });
});

describe('ConversationRouter', () => {
  it('should route commands correctly and enrich RouterResult', () => {
    const router = ConversationRouter.getInstance();
    const result = router.route('skip', 'en', ConversationState.EXP_LOCATION, 'conv-1');
    assert.strictEqual(result.route, 'COMMAND');
    assert.strictEqual(result.intent, CommandIntent.SKIP);
    assert.strictEqual(result.confidence, 1.0);
    assert.strictEqual(result.language, 'en');
    assert.ok(result.normalizedInput);
  });

  it('should route language switch explicitly', () => {
    const router = ConversationRouter.getInstance();
    const result = router.route('swahili', 'en', ConversationState.HOME, 'conv-1');
    assert.strictEqual(result.route, 'LANGUAGE');
    assert.strictEqual(result.language, 'sw');
  });

  it('should fail validation on invalid email', () => {
    const router = ConversationRouter.getInstance();
    const result = router.route('not-an-email', 'en', ConversationState.REGISTER_EMAIL, 'conv-1');
    assert.strictEqual(result.route, 'VALIDATION');
    assert.strictEqual(result.validationResult?.isValid, false);
  });

  it('should require AI for questions', () => {
    const router = ConversationRouter.getInstance();
    const result = router.route('what is this?', 'en', ConversationState.HOME, 'conv-1');
    assert.strictEqual(result.route, 'AI');
    assert.strictEqual(result.requiresAI, true);
    assert.strictEqual(result.confidence, 0.0);
  });
});
