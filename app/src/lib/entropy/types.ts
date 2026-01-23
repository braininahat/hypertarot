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

// Divination system type
export type DivinationSystem = 'tarot' | 'iching';

// I Ching specific types
export type LineValue = 6 | 7 | 8 | 9;
// 6 = old yin (changing), 7 = young yang (stable), 8 = young yin (stable), 9 = old yang (changing)

export interface CastLine {
  value: LineValue;
  isYang: boolean;      // true for 7 or 9, false for 6 or 8
  isChanging: boolean;  // true for 6 or 9
}

export interface HexagramCast {
  lines: [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine]; // bottom to top
  hexagramNumber: number;
  transformedHexagramNumber: number | null; // null if no changing lines
  hasChangingLines: boolean;
}
