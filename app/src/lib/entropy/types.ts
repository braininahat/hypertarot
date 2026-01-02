export type EntropyType = 'quantum' | 'quantum-physical';

export interface EntropyResult {
  values: number[];
  source: string;
  type: EntropyType;
}

export interface EntropyProvider {
  name: string;
  type: EntropyType;
  getEntropy(count: number): Promise<number[]>;
  healthCheck(): Promise<boolean>;
}
