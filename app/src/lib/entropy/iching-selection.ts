import { CastLine, HexagramCast, LineValue } from './types';
import { getHexagramByLines, getTransformedHexagram, LineType } from '@/data/iching';

/**
 * Traditional three-coin method for I Ching:
 * - 3 coins are tossed, heads = 3, tails = 2
 * - Sum determines line type: 6, 7, 8, or 9
 *
 * Probabilities:
 * - 6 (old yin, changing):  1/8 (all tails: 2+2+2)
 * - 7 (young yang, stable): 3/8 (two tails, one head)
 * - 8 (young yin, stable):  3/8 (two heads, one tail)
 * - 9 (old yang, changing): 1/8 (all heads: 3+3+3)
 *
 * We use 3 bits per line to simulate 3 coin tosses.
 * Each bit: 0 = tails (2), 1 = heads (3)
 */

function bitsToLineValue(bit1: number, bit2: number, bit3: number): LineValue {
  // Each bit represents a coin: 0 = tails (2), 1 = heads (3)
  const sum = (bit1 ? 3 : 2) + (bit2 ? 3 : 2) + (bit3 ? 3 : 2);
  return sum as LineValue;
}

function lineValueToCastLine(value: LineValue): CastLine {
  return {
    value,
    isYang: value === 7 || value === 9,
    isChanging: value === 6 || value === 9,
  };
}

function lineValueToLineType(value: LineValue): LineType {
  // For the primary hexagram, use the current state (before change)
  return (value === 7 || value === 9) ? 'yang' : 'yin';
}

export interface HexagramSelection {
  casts: HexagramCast[];
  bytesUsed: number;
}

/**
 * Cast one hexagram using quantum entropy.
 * Uses 3 bits per line (simulating 3 coin tosses).
 * 6 lines = 18 bits = 3 bytes minimum, but we use whole bytes per line for simplicity.
 *
 * @param entropy - Array of random bytes (0-255)
 * @param startIndex - Index to start reading from entropy array
 * @returns The cast hexagram and the next available index
 */
function castSingleHexagram(entropy: number[], startIndex: number): { cast: HexagramCast; nextIndex: number } {
  const lines: CastLine[] = [];
  let byteIndex = startIndex;

  // Cast 6 lines, bottom to top
  for (let i = 0; i < 6; i++) {
    if (byteIndex >= entropy.length) {
      throw new Error('Insufficient entropy for hexagram casting');
    }

    const byte = entropy[byteIndex];
    // Extract 3 bits for coin tosses
    const bit1 = (byte >> 0) & 1;
    const bit2 = (byte >> 1) & 1;
    const bit3 = (byte >> 2) & 1;

    const lineValue = bitsToLineValue(bit1, bit2, bit3);
    lines.push(lineValueToCastLine(lineValue));
    byteIndex++;
  }

  const castLines = lines as [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine];

  // Determine hexagram from lines
  const lineTypes = castLines.map(l => lineValueToLineType(l.value)) as [LineType, LineType, LineType, LineType, LineType, LineType];
  const hexagram = getHexagramByLines(lineTypes);

  if (!hexagram) {
    throw new Error('Invalid hexagram - this should never happen');
  }

  // Check for changing lines
  const changingLines = castLines.map(l => l.isChanging);
  const hasChangingLines = changingLines.some(c => c);

  // Get transformed hexagram if there are changing lines
  let transformedHexagramNumber: number | null = null;
  if (hasChangingLines) {
    const transformed = getTransformedHexagram(hexagram, changingLines);
    if (transformed) {
      transformedHexagramNumber = transformed.number;
    }
  }

  return {
    cast: {
      lines: castLines,
      hexagramNumber: hexagram.number,
      transformedHexagramNumber,
      hasChangingLines,
    },
    nextIndex: byteIndex,
  };
}

/**
 * Cast multiple hexagrams for I Ching reading.
 *
 * @param entropy - Array of random bytes (0-255)
 * @param hexagramCount - Number of hexagrams to cast
 * @returns Array of cast hexagrams and bytes consumed
 */
export function castHexagrams(entropy: number[], hexagramCount: number): HexagramSelection {
  const casts: HexagramCast[] = [];
  let byteIndex = 0;

  for (let i = 0; i < hexagramCount; i++) {
    const result = castSingleHexagram(entropy, byteIndex);
    casts.push(result.cast);
    byteIndex = result.nextIndex;
  }

  return { casts, bytesUsed: byteIndex };
}

/**
 * Calculate how many entropy bytes to request for I Ching casting.
 * Each hexagram needs 6 bytes (1 per line).
 */
export function ichingEntropyBytesNeeded(hexagramCount: number): number {
  // 6 bytes per hexagram, plus small buffer
  return hexagramCount * 8;
}
