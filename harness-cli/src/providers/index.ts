import type { Provider } from '../core/types.ts';
import { createMockProvider } from './mock.ts';
import { createOpenAIProvider } from './openai.ts';

export function createProvider(name: string): Provider {
  switch (name) {
    case 'mock':
      return createMockProvider();
    case 'openai':
      return createOpenAIProvider();
    default:
      throw new Error(`unknown provider: ${name} (use mock|openai)`);
  }
}
