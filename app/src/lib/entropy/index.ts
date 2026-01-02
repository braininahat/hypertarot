import { EntropyProvider, EntropyResult } from './types';
import { anuProvider } from './anu';
import { cameraProvider } from './camera';

export type { EntropyResult, EntropyType } from './types';

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
    const entropy = await this.getEntropy(count * 3); // Extra for uniqueness + reversals

    // Select unique card indices (0-77)
    const indices: number[] = [];
    const reversals: boolean[] = [];
    let entropyIndex = 0;

    while (indices.length < count && entropyIndex < entropy.values.length) {
      const cardIndex = entropy.values[entropyIndex] % 78;

      if (!indices.includes(cardIndex)) {
        indices.push(cardIndex);
        // Use next entropy value for reversal (>127 = reversed)
        const reversalValue = entropy.values[entropyIndex + 1] ?? entropy.values[entropyIndex];
        reversals.push(reversalValue > 127);
      }

      entropyIndex++;
    }

    if (indices.length < count) {
      throw new Error('Not enough entropy to generate unique cards');
    }

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
