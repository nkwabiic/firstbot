import { AIPolicyEngine } from './src/ai/policy/AIPolicyEngine';
import { GeminiProvider } from './src/ai/policy/GeminiProvider';

const provider = new GeminiProvider('fake-key');
AIPolicyEngine.initialize(provider);
