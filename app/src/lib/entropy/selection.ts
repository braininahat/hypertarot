import { DECK_SIZE, REVERSAL_THRESHOLD } from './constants';

/**
 * Rejection sampling for unbiased random selection from [0, range).
 * Returns null if the byte should be rejected (would cause modulo bias).
 */
function selectUnbiased(byte: number, range: number): number | null {
  const limit = Math.floor(256 / range) * range;
  if (byte >= limit) return null;
  return byte % range;
}

export interface CardSelection {
  indices: number[];
  reversals: boolean[];
  bytesUsed: number;
}

/**
 * Partial Fisher-Yates shuffle to select N unique cards.
 *
 * Uses rejection sampling for unbiased selection at each step.
 * Guarantees uniqueness by construction - no collision handling needed.
 *
 * @param entropy - Array of random bytes (0-255)
 * @param cardCount - Number of cards to select
 * @returns Selected card indices, reversal states, and bytes consumed
 */
export function selectCards(entropy: number[], cardCount: number): CardSelection {
  const deck = Array.from({ length: DECK_SIZE }, (_, i) => i);

  const indices: number[] = [];
  const reversals: boolean[] = [];
  let byteIndex = 0;

  for (let i = 0; i < cardCount; i++) {
    // Select random position from [0, DECK_SIZE - i)
    const range = DECK_SIZE - i;
    let offset: number | null = null;

    while (offset === null) {
      if (byteIndex >= entropy.length) {
        throw new Error('Insufficient entropy for card selection');
      }
      offset = selectUnbiased(entropy[byteIndex], range);
      byteIndex++;
    }

    // Swap deck[i] with deck[i + offset]
    const swapIndex = i + offset;
    [deck[i], deck[swapIndex]] = [deck[swapIndex], deck[i]];
    indices.push(deck[i]);

    // Use next byte for reversal
    if (byteIndex >= entropy.length) {
      throw new Error('Insufficient entropy for reversal');
    }
    reversals.push(entropy[byteIndex] >= REVERSAL_THRESHOLD);
    byteIndex++;
  }

  return { indices, reversals, bytesUsed: byteIndex };
}

/**
 * Calculate how many entropy bytes to request for a given card count.
 * Includes buffer for rejection sampling.
 */
export function entropyBytesNeeded(cardCount: number): number {
  // Each card needs: ~1.2 bytes for selection (with rejection buffer) + 1 byte for reversal
  // Use 3x multiplier for safety
  return cardCount * 3;
}
