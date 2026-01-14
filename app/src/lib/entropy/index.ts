import { EntropyProvider, EntropyResult } from './types';
import { anuProvider } from './anu';
import { cameraProvider } from './camera';
import { selectCards, entropyBytesNeeded } from './selection';

export type { EntropyResult, EntropyType } from './types';
export { DECK_SIZE, REVERSAL_THRESHOLD } from './constants';

const providers: EntropyProvider[] = [
  anuProvider,
  cameraProvider,
  // NO CSPRNG fallback - we only use quantum sources
];

export class EntropyService {
  private lastSource: string = '';
  private lastType: 'quantum' | 'quantum-physical' = 'quantum';

  async getEntropy(count: number): Promise<EntropyResult> {
    for (const provider of providers) {
      try {
        const isHealthy = await provider.healthCheck();
        if (isHealthy) {
          const values = await provider.getEntropy(count);
          this.lastSource = provider.name;
          this.lastType = provider.type;

          return {
            values,
            source: provider.name,
            type: provider.type,
          };
        }
      } catch (error) {
        console.warn(`Entropy provider ${provider.name} failed:`, error);
      }
    }

    throw new Error(
      'Unable to obtain quantum entropy. Please check your internet connection or enable camera access for fallback.'
    );
  }

  async getCardIndices(count: number = 11): Promise<{
    indices: number[];
    source: string;
    type: 'quantum' | 'quantum-physical';
    reversals: boolean[];
  }> {
    const bytesNeeded = entropyBytesNeeded(count);
    const entropy = await this.getEntropy(bytesNeeded);

    // Fisher-Yates selection: guarantees uniqueness, no bias
    const { indices, reversals } = selectCards(entropy.values, count);

    return {
      indices,
      source: entropy.source,
      type: entropy.type,
      reversals,
    };
  }

  getLastSource(): string {
    return this.lastSource;
  }

  getLastType(): 'quantum' | 'quantum-physical' {
    return this.lastType;
  }
}

export const entropyService = new EntropyService();
