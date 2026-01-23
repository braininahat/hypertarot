'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from '@/components/TarotCard';
import { Hexagram, HexagramReadingDisplay, HexagramDetail, MiniHexagram } from '@/components/Hexagram';
import { EntropyIndicator } from '@/components/EntropyIndicator';
import { cards, SPREADS, DEFAULT_SPREAD, type DrawnCard, type Spread } from '@/data/tarot';
import { ICHING_SPREADS, DEFAULT_ICHING_SPREAD, HEXAGRAMS, getHexagramByNumber, type IChing_Spread, type Hexagram as HexagramType } from '@/data/iching';
import { selectCards, entropyBytesNeeded } from '@/lib/entropy/selection';
import { castHexagrams, ichingEntropyBytesNeeded } from '@/lib/entropy/iching-selection';
import { DivinationSystem, HexagramCast, CastLine } from '@/lib/entropy/types';

type AppState = 'intention' | 'drawing' | 'reading';

interface TarotReadingData {
  type: 'tarot';
  drawnCards: DrawnCard[];
  entropySource: string;
  intention: string;
  timestamp: Date;
  spread: Spread;
}

interface IChingReadingData {
  type: 'iching';
  casts: HexagramCast[];
  entropySource: string;
  intention: string;
  timestamp: Date;
  spread: IChing_Spread;
}

type ReadingData = TarotReadingData | IChingReadingData;

// Mini card visualization for spread picker
function MiniCard({ className = '', highlight = false }: { className?: string; highlight?: boolean }) {
  return (
    <div
      className={`w-2 h-3 rounded-[1px] ${
        highlight ? 'bg-violet-400' : 'bg-violet-500/40'
      } ${className}`}
    />
  );
}

function SpreadDiagram({ spreadId, selected }: { spreadId: string; selected: boolean }) {
  const highlight = selected;

  switch (spreadId) {
    case 'single':
      return (
        <div className="flex items-center justify-center">
          <MiniCard highlight={highlight} className="w-3 h-4" />
        </div>
      );

    case 'three-card':
      return (
        <div className="flex items-center gap-1">
          <MiniCard highlight={highlight} />
          <MiniCard highlight={highlight} />
          <MiniCard highlight={highlight} />
        </div>
      );

    case 'five-card':
      return (
        <div className="grid grid-cols-3 gap-0.5 items-center justify-items-center">
          <div />
          <MiniCard highlight={highlight} />
          <div />
          <MiniCard highlight={highlight} />
          <MiniCard highlight={highlight} />
          <MiniCard highlight={highlight} />
          <div />
          <MiniCard highlight={highlight} />
          <div />
        </div>
      );

    case 'celtic-cross':
    case 'celtic-cross-plus':
      return (
        <div className="flex items-center gap-1">
          {/* Cross section */}
          <div className="grid grid-cols-3 gap-0.5 items-center justify-items-center">
            <div />
            <MiniCard highlight={highlight} />
            <div />
            <MiniCard highlight={highlight} />
            <div className="relative">
              <MiniCard highlight={highlight} />
              <MiniCard highlight={highlight} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
            </div>
            <MiniCard highlight={highlight} />
            <div />
            <MiniCard highlight={highlight} />
            <div />
          </div>
          {/* Staff section */}
          <div className="flex flex-col gap-0.5">
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
          </div>
        </div>
      );

    case 'relationship-reflection':
      return (
        <div className="flex flex-col items-center gap-0.5">
          {/* Top row: What each brought */}
          <div className="flex items-center gap-2">
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
          </div>
          {/* Middle: The dynamic */}
          <MiniCard highlight={highlight} />
          {/* Bottom rows */}
          <div className="flex items-center gap-1">
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
          </div>
          <MiniCard highlight={highlight} />
        </div>
      );

    case 'right-hand-of-eris':
      return (
        <div className="flex flex-col items-center gap-0.5">
          {/* Top row: Help - Question - Hinder (like fingers) */}
          <div className="flex items-center gap-1">
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
          </div>
          {/* Bottom row: Two outcomes */}
          <div className="flex items-center gap-2">
            <MiniCard highlight={highlight} />
            <MiniCard highlight={highlight} />
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <MiniCard key={i} highlight={highlight} />
          ))}
        </div>
      );
  }
}

// Card slot for spread layouts - handles animation timing
interface CardSlotProps {
  drawn: DrawnCard;
  index: number;
  position: { name: string; description: string };
  selectedCard: number | null;
  setSelectedCard: (index: number | null) => void;
  size?: 'sm' | 'md';
  className?: string;
  crossCard?: boolean;
}

function CardSlot({ drawn, index, position, selectedCard, setSelectedCard, size = 'sm', className = '', crossCard = false }: CardSlotProps) {
  const CARD_DELAY = 0.6; // seconds between each card

  return (
    <motion.div
      className={`relative ${className} ${index === selectedCard ? 'z-20' : 'z-0'} ${crossCard ? 'rotate-90' : ''}`}
      initial={{ opacity: 0, scale: 0.3, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * CARD_DELAY,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <div className="text-center mb-1">
        <span className="text-[9px] md:text-[10px] text-text-muted font-mono leading-tight block">
          {position.name}
        </span>
      </div>
      <TarotCard
        card={drawn.card}
        reversed={drawn.reversed}
        revealed={true}
        delay={index * CARD_DELAY}
        onClick={() => setSelectedCard(selectedCard === index ? null : index)}
        size={size}
      />
      {drawn.reversed && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-violet-400 font-mono">
          reversed
        </span>
      )}
    </motion.div>
  );
}

// Spread-specific layouts that match the picker diagrams
interface SpreadLayoutProps {
  drawnCards: DrawnCard[];
  positions: { name: string; description: string }[];
  spreadId: string;
  selectedCard: number | null;
  setSelectedCard: (index: number | null) => void;
}

function SpreadLayout({ drawnCards, positions, spreadId, selectedCard, setSelectedCard }: SpreadLayoutProps) {
  const slotProps = (index: number, extra: Partial<CardSlotProps> = {}) => ({
    drawn: drawnCards[index],
    index,
    position: positions[index],
    selectedCard,
    setSelectedCard,
    ...extra,
  });

  switch (spreadId) {
    case 'single':
      return (
        <div className="flex justify-center">
          <CardSlot {...slotProps(0, { size: 'md' })} />
        </div>
      );

    case 'three-card':
      return (
        <div className="flex justify-center items-start gap-4 md:gap-6">
          <CardSlot {...slotProps(0, { size: 'md' })} />
          <CardSlot {...slotProps(1, { size: 'md' })} />
          <CardSlot {...slotProps(2, { size: 'md' })} />
        </div>
      );

    case 'five-card':
      return (
        <div className="flex flex-col items-center gap-3">
          {/* Top: Future */}
          <CardSlot {...slotProps(3)} />
          {/* Middle row: Past - Present - Challenge */}
          <div className="flex justify-center items-start gap-3">
            <CardSlot {...slotProps(2)} />
            <CardSlot {...slotProps(0)} />
            <CardSlot {...slotProps(1)} />
          </div>
          {/* Bottom: Outcome */}
          <CardSlot {...slotProps(4)} />
        </div>
      );

    case 'celtic-cross':
    case 'celtic-cross-plus':
      return (
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8">
          {/* Cross section */}
          <div className="grid grid-cols-3 gap-2 items-center justify-items-center" style={{ gridTemplateRows: 'auto auto auto' }}>
            {/* Row 1: Crown (top) */}
            <div />
            <CardSlot {...slotProps(4)} />
            <div />
            {/* Row 2: Past - Present/Challenge - Future */}
            <CardSlot {...slotProps(3)} />
            <div className="relative">
              <CardSlot {...slotProps(0)} />
              {/* Challenge card crosses the present */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0.3, rotate: 90 }}
                animate={{ opacity: 1, scale: 1, rotate: 90 }}
                transition={{ delay: 1 * 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <TarotCard
                  card={drawnCards[1].card}
                  reversed={drawnCards[1].reversed}
                  revealed={true}
                  delay={1 * 0.6}
                  onClick={() => setSelectedCard(selectedCard === 1 ? null : 1)}
                  size="sm"
                />
              </motion.div>
            </div>
            <CardSlot {...slotProps(5)} />
            {/* Row 3: Foundation (bottom) */}
            <div />
            <CardSlot {...slotProps(2)} />
            <div />
          </div>
          {/* Staff section (right side) */}
          <div className="flex flex-row md:flex-col gap-2 md:gap-3">
            <CardSlot {...slotProps(9)} />
            <CardSlot {...slotProps(8)} />
            <CardSlot {...slotProps(7)} />
            <CardSlot {...slotProps(6)} />
            {spreadId === 'celtic-cross-plus' && drawnCards[10] && (
              <CardSlot {...slotProps(10)} />
            )}
          </div>
        </div>
      );

    case 'relationship-reflection':
      return (
        <div className="flex flex-col items-center gap-4">
          {/* Row 1: What I Bring / What They Bring */}
          <div className="flex justify-center items-start gap-8 md:gap-12">
            <CardSlot {...slotProps(0)} />
            <CardSlot {...slotProps(1)} />
          </div>
          {/* Row 2: The Dynamic (centered between them) */}
          <CardSlot {...slotProps(2)} />
          {/* Row 3: Blind Spot / Their Experience / Unspoken */}
          <div className="flex justify-center items-start gap-3 md:gap-4">
            <CardSlot {...slotProps(3)} />
            <CardSlot {...slotProps(4)} />
            <CardSlot {...slotProps(5)} />
          </div>
          {/* Row 4: The Lesson */}
          <CardSlot {...slotProps(6)} />
        </div>
      );

    case 'right-hand-of-eris':
      return (
        <div className="flex flex-col items-center gap-4">
          {/* Top row: What May Help - Your Question - What May Hinder */}
          <div className="flex justify-center items-start gap-3 md:gap-4">
            <CardSlot {...slotProps(1)} />
            <CardSlot {...slotProps(0)} />
            <CardSlot {...slotProps(2)} />
          </div>
          {/* Bottom row: Two Outcomes */}
          <div className="flex justify-center items-start gap-6 md:gap-8">
            <CardSlot {...slotProps(3)} />
            <CardSlot {...slotProps(4)} />
          </div>
        </div>
      );

    default:
      // Fallback: simple grid
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 justify-items-center">
          {drawnCards.map((drawn, index) => (
            <CardSlot key={drawn.card.id} {...slotProps(index)} />
          ))}
        </div>
      );
  }
}

export default function Home() {
  const [state, setState] = useState<AppState>('intention');
  const [divinationSystem, setDivinationSystem] = useState<DivinationSystem>('tarot');
  const [intention, setIntention] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread>(DEFAULT_SPREAD);
  const [selectedIChingSpread, setSelectedIChingSpread] = useState<IChing_Spread>(DEFAULT_ICHING_SPREAD);
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedHexagram, setSelectedHexagram] = useState<'primary' | 'transformed' | null>(null);
  const [selectedCastIndex, setSelectedCastIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const fetchQuantumEntropy = useCallback(async (cardCount: number): Promise<{
    data: number[];
    source: string;
  }> => {
    const bytesNeeded = entropyBytesNeeded(cardCount);
    const response = await fetch(`/api/entropy?count=${bytesNeeded}`);

    if (!response.ok) {
      throw new Error('Quantum entropy source unavailable. Please try again.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch quantum entropy');
    }

    return { data: result.data, source: result.source };
  }, []);

  const performReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    setState('drawing');

    try {
      if (divinationSystem === 'tarot') {
        const cardCount = selectedSpread.cardCount;
        const entropy = await fetchQuantumEntropy(cardCount);

        // Fisher-Yates selection: guarantees uniqueness, no modulo bias
        const { indices, reversals } = selectCards(entropy.data, cardCount);

        const drawnCards: DrawnCard[] = indices.map((cardIndex, position) => ({
          card: cards[cardIndex],
          position,
          reversed: reversals[position],
        }));

        // Dramatic pause for the drawing experience
        await new Promise(resolve => setTimeout(resolve, 1500));

        setReading({
          type: 'tarot',
          drawnCards,
          entropySource: entropy.source,
          intention,
          timestamp: new Date(),
          spread: selectedSpread,
        });
      } else {
        // I Ching reading
        const hexagramCount = selectedIChingSpread.id === 'single-hexagram' ? 1 :
                             selectedIChingSpread.id === 'past-future' ? 2 : 3;
        const bytesNeeded = ichingEntropyBytesNeeded(hexagramCount);
        const response = await fetch(`/api/entropy?count=${bytesNeeded}`);

        if (!response.ok) {
          throw new Error('Quantum entropy source unavailable. Please try again.');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch quantum entropy');
        }

        const { casts } = castHexagrams(result.data, hexagramCount);

        // Dramatic pause for the casting experience
        await new Promise(resolve => setTimeout(resolve, 1500));

        setReading({
          type: 'iching',
          casts,
          entropySource: result.source,
          intention,
          timestamp: new Date(),
          spread: selectedIChingSpread,
        });
      }

      setState('reading');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to perform reading');
      setState('intention');
    } finally {
      setLoading(false);
    }
  }, [intention, selectedSpread, selectedIChingSpread, divinationSystem, fetchQuantumEntropy]);

  const buildReadingMarkdown = useCallback(() => {
    if (!reading) return '';

    const lines: string[] = [];

    // Add interpretation prompt at the top
    lines.push(reading.spread.interpretPrompt);
    lines.push('');

    // Add question if present
    if (reading.intention) {
      lines.push(`**Question:** ${reading.intention}`);
      lines.push('');
    }

    if (reading.type === 'tarot') {
      const positions = reading.spread.positions;

      // Add spread info and table
      lines.push(`**Spread:** ${reading.spread.name}`);
      lines.push('');
      lines.push('| Position | Meaning | Card |');
      lines.push('|----------|---------|------|');

      reading.drawnCards.forEach((drawn, index) => {
        const pos = positions[index];
        const cardName = drawn.reversed
          ? `${drawn.card.name} (Reversed)`
          : drawn.card.name;
        lines.push(`| ${index + 1} | ${pos.name} / ${pos.description} | ${cardName} |`);
      });
    } else {
      // I Ching reading
      lines.push(`**Method:** ${reading.spread.name}`);
      lines.push('');

      reading.casts.forEach((cast, castIndex) => {
        const hexagram = getHexagramByNumber(cast.hexagramNumber);
        if (!hexagram) return;

        const castLabel = reading.casts.length === 1 ? '' :
                         reading.casts.length === 2 ? (castIndex === 0 ? '### Past' : '### Future') :
                         `### Aspect ${castIndex + 1}`;

        if (castLabel) {
          lines.push(castLabel);
          lines.push('');
        }

        lines.push(`**Primary Hexagram:** ${cast.hexagramNumber}. ${hexagram.name} (${hexagram.chinese} ${hexagram.pinyin})`);
        lines.push('');
        lines.push(`*Judgment:* ${hexagram.judgment}`);
        lines.push('');
        lines.push(`*Image:* ${hexagram.image}`);
        lines.push('');

        // Changing lines
        const changingLineNumbers = cast.lines
          .map((line, i) => line.isChanging ? i + 1 : null)
          .filter(Boolean);

        if (changingLineNumbers.length > 0) {
          lines.push(`**Changing Lines:** ${changingLineNumbers.join(', ')}`);
          lines.push('');
        }

        // Transformed hexagram
        if (cast.transformedHexagramNumber) {
          const transformed = getHexagramByNumber(cast.transformedHexagramNumber);
          if (transformed) {
            lines.push(`**Transforms to:** ${transformed.number}. ${transformed.name} (${transformed.chinese} ${transformed.pinyin})`);
            lines.push('');
            lines.push(`*Judgment:* ${transformed.judgment}`);
            lines.push('');
          }
        }
      });
    }

    return lines.join('\n');
  }, [reading]);

  const copyReadingToClipboard = useCallback(async () => {
    const markdown = buildReadingMarkdown();
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }, [buildReadingMarkdown]);

  const shareReading = useCallback(async () => {
    const markdown = buildReadingMarkdown();
    if (!markdown) return;

    // Try native share (mobile/tablet)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HyperTarot Reading',
          text: markdown,
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fall through to copy
        if ((e as Error).name === 'AbortError') return;
      }
    }

    // Fallback: copy and show confirmation
    await copyReadingToClipboard();
  }, [buildReadingMarkdown, copyReadingToClipboard]);

  const resetReading = useCallback(() => {
    setState('intention');
    setIntention('');
    setReading(null);
    setSelectedCard(null);
    setSelectedHexagram(null);
    setSelectedCastIndex(0);
    setError(null);
    setCopied(false);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <AnimatePresence mode="wait">
        {/* INTENTION SCREEN */}
        {state === 'intention' && (
          <motion.div
            key="intention"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg w-full text-center space-y-8"
          >
            <motion.div
              className="animate-breathe"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <h1 className="text-5xl md:text-6xl font-display font-semibold text-gradient-mystic mb-4">
                {divinationSystem === 'tarot' ? 'HyperTarot' : 'HyperOracle'}
              </h1>
              <p className="text-text-muted text-sm font-mono">
                Quantum Entropy Divination
              </p>
            </motion.div>

            {/* Divination System Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-lg border border-violet-500/30 p-1 bg-void-deep">
                <button
                  onClick={() => setDivinationSystem('tarot')}
                  className={`px-4 py-2 rounded-md text-sm font-display transition-all ${
                    divinationSystem === 'tarot'
                      ? 'bg-violet-600 text-white'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Tarot
                </button>
                <button
                  onClick={() => setDivinationSystem('iching')}
                  className={`px-4 py-2 rounded-md text-sm font-display transition-all ${
                    divinationSystem === 'iching'
                      ? 'bg-amber-600 text-white'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  I Ching
                </button>
              </div>
            </div>

            {/* Spread Selector */}
            <div className="space-y-4">
              <p className="text-text-mystic text-sm font-display">
                {divinationSystem === 'tarot' ? 'Choose your spread' : 'Choose your method'}
              </p>

              {divinationSystem === 'tarot' ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SPREADS.map((spread) => (
                      <button
                        key={spread.id}
                        onClick={() => setSelectedSpread(spread)}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                          selectedSpread.id === spread.id
                            ? 'border-violet-500 bg-violet-500/20 glow-quantum'
                            : 'border-violet-500/30 bg-void-deep hover:border-violet-500/60'
                        }`}
                      >
                        {/* Mini spread visualization */}
                        <div className="h-12 flex items-center justify-center">
                          <SpreadDiagram spreadId={spread.id} selected={selectedSpread.id === spread.id} />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-display text-text-primary">{spread.name}</div>
                          <div className="text-[10px] text-text-muted">{spread.cardCount} cards</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs text-center max-w-sm mx-auto">{selectedSpread.description}</p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ICHING_SPREADS.map((spread) => (
                      <button
                        key={spread.id}
                        onClick={() => setSelectedIChingSpread(spread)}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                          selectedIChingSpread.id === spread.id
                            ? 'border-amber-500 bg-amber-500/20 glow-iching'
                            : 'border-amber-500/30 bg-void-deep hover:border-amber-500/60'
                        }`}
                      >
                        {/* Mini hexagram visualization */}
                        <div className="h-12 flex items-center justify-center text-amber-400">
                          <MiniHexagram />
                          {spread.id === 'past-future' && (
                            <>
                              <span className="mx-2 text-amber-500/50">→</span>
                              <MiniHexagram />
                            </>
                          )}
                          {spread.id === 'three-coins' && (
                            <>
                              <span className="mx-1 text-amber-500/50">·</span>
                              <MiniHexagram />
                              <span className="mx-1 text-amber-500/50">·</span>
                              <MiniHexagram />
                            </>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-display text-text-primary">{spread.name}</div>
                          <div className="text-[10px] text-text-muted">
                            {spread.id === 'single-hexagram' ? '1 hexagram' :
                             spread.id === 'past-future' ? '2 hexagrams' : '3 hexagrams'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs text-center max-w-sm mx-auto">{selectedIChingSpread.description}</p>
                </>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-text-mystic text-lg font-display">
                What question do you bring to the quantum void?
              </p>

              <textarea
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="Focus your intention... (optional)"
                className={`w-full h-24 bg-void-deep border rounded-lg p-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none resize-none ${
                  divinationSystem === 'tarot'
                    ? 'border-violet-500/30 focus:border-violet-500 focus:glow-quantum'
                    : 'border-amber-500/30 focus:border-amber-500 focus:glow-iching'
                }`}
              />
              <p className="text-text-muted/60 text-xs">
                For your reflection only. Never sent anywhere or used in {divinationSystem === 'tarot' ? 'card selection' : 'the casting'}.
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              onClick={performReading}
              disabled={loading}
              className={`px-8 py-4 rounded-lg text-lg font-display font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                divinationSystem === 'tarot'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 glow-quantum'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 glow-iching'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Channeling Entropy...' : divinationSystem === 'tarot' ? 'Draw the Cards' : 'Cast the Hexagram'}
            </motion.button>

            <p className="text-text-muted text-xs max-w-md mx-auto">
              {divinationSystem === 'tarot' ? 'Cards are drawn' : 'Lines are cast'} using true quantum randomness from vacuum fluctuations,
              measured by ID Quantique hardware at the German LfD (Landesamt für Digitalisierung).
            </p>
          </motion.div>
        )}

        {/* DRAWING SCREEN */}
        {state === 'drawing' && (
          <motion.div
            key="drawing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className={`w-16 h-16 border-2 border-t-transparent rounded-full ${
                divinationSystem === 'tarot' ? 'border-violet-500' : 'border-amber-500'
              }`}
            />

            <div className="text-center space-y-2">
              <p className="text-xl font-display text-text-mystic">
                {divinationSystem === 'tarot' ? 'Drawing from the quantum void...' : 'Casting from the quantum void...'}
              </p>
              <p className="text-sm text-text-muted font-mono">
                {divinationSystem === 'tarot'
                  ? `${selectedSpread.name} (${selectedSpread.cardCount} cards)`
                  : selectedIChingSpread.name}
              </p>
              <EntropyIndicator source="LfD QRNG" loading />
            </div>
          </motion.div>
        )}

        {/* READING SCREEN */}
        {state === 'reading' && reading && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-6xl space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className={`text-3xl md:text-4xl font-display font-semibold ${
                reading.type === 'tarot' ? 'text-gradient-mystic' : 'text-gradient-iching'
              }`}>
                Your Reading
              </h2>
              <p className="text-text-muted text-sm font-mono">{reading.spread.name}</p>
              {reading.intention && (
                <p className="text-text-muted italic">&ldquo;{reading.intention}&rdquo;</p>
              )}
              <EntropyIndicator source={reading.entropySource} />
            </div>

            {/* Tarot Card Spread */}
            {reading.type === 'tarot' && (
              <>
                <SpreadLayout
                  drawnCards={reading.drawnCards}
                  positions={reading.spread.positions}
                  spreadId={reading.spread.id}
                  selectedCard={selectedCard}
                  setSelectedCard={setSelectedCard}
                />

                {/* Selected Card Detail */}
                <AnimatePresence>
                  {selectedCard !== null && reading.drawnCards[selectedCard] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-void-deep border border-violet-500/30 rounded-lg p-6 max-w-md mx-auto"
                    >
                      <h3 className="text-2xl font-display font-semibold text-text-primary mb-2">
                        {reading.drawnCards[selectedCard].card.name}
                        {reading.drawnCards[selectedCard].reversed && (
                          <span className="text-violet-400 text-sm ml-2">(Reversed)</span>
                        )}
                      </h3>
                      <p className="text-text-muted text-sm mb-2">
                        {reading.drawnCards[selectedCard].card.arcana}
                        {reading.drawnCards[selectedCard].card.suit &&
                          ` - ${reading.drawnCards[selectedCard].card.suit}`}
                      </p>
                      <p className="text-cyan-400 text-sm font-mono">
                        Position: {reading.spread.positions[selectedCard]?.name}
                      </p>
                      <p className="text-text-muted text-xs mt-1">
                        {reading.spread.positions[selectedCard]?.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* I Ching Hexagram Display */}
            {reading.type === 'iching' && (
              <>
                {/* Multiple hexagram selector for multi-cast spreads */}
                {reading.casts.length > 1 && (
                  <div className="flex justify-center gap-2 mb-4">
                    {reading.casts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCastIndex(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-display transition-all ${
                          selectedCastIndex === index
                            ? 'bg-amber-600 text-white'
                            : 'bg-void-deep border border-amber-500/30 text-text-muted hover:border-amber-500'
                        }`}
                      >
                        {reading.casts.length === 2
                          ? (index === 0 ? 'Past' : 'Future')
                          : `Hexagram ${index + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Current hexagram display */}
                {reading.casts[selectedCastIndex] && (() => {
                  const cast = reading.casts[selectedCastIndex];
                  const primaryHexagram = getHexagramByNumber(cast.hexagramNumber);
                  const transformedHexagram = cast.transformedHexagramNumber
                    ? getHexagramByNumber(cast.transformedHexagramNumber)
                    : null;

                  if (!primaryHexagram) return null;

                  return (
                    <HexagramReadingDisplay
                      primaryHexagram={primaryHexagram}
                      transformedHexagram={transformedHexagram}
                      castLines={cast.lines}
                      revealed={true}
                      onHexagramClick={(type) => setSelectedHexagram(type)}
                    />
                  );
                })()}

                {/* Hexagram Detail Modal */}
                <AnimatePresence>
                  {selectedHexagram && reading.casts[selectedCastIndex] && (() => {
                    const cast = reading.casts[selectedCastIndex];
                    const hexagramNumber = selectedHexagram === 'primary'
                      ? cast.hexagramNumber
                      : cast.transformedHexagramNumber;

                    if (!hexagramNumber) return null;
                    const hexagram = getHexagramByNumber(hexagramNumber);
                    if (!hexagram) return null;

                    return (
                      <HexagramDetail
                        hexagram={hexagram}
                        castLines={selectedHexagram === 'primary' ? cast.lines : undefined}
                        onClose={() => setSelectedHexagram(null)}
                      />
                    );
                  })()}
                </AnimatePresence>
              </>
            )}

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center gap-3 flex-wrap">
                <motion.button
                  onClick={shareReading}
                  className={`px-6 py-3 border rounded-lg font-display transition-all ${
                    copied
                      ? 'bg-green-600/20 border-green-500 text-green-400'
                      : 'bg-void-mid border-cyan-500/30 hover:border-cyan-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {copied ? 'Copied!' : 'Get Interpretation'}
                </motion.button>
                <motion.button
                  onClick={resetReading}
                  className={`px-6 py-3 bg-void-mid border rounded-lg font-display transition-all ${
                    reading.type === 'tarot'
                      ? 'border-violet-500/30 hover:border-violet-500'
                      : 'border-amber-500/30 hover:border-amber-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  New Reading
                </motion.button>
              </div>
              <p className="text-text-muted/60 text-xs text-center max-w-sm">
                Paste into Claude, ChatGPT, or your favorite AI for interpretation.
                Bring your own subscription — that&apos;s how we keep this free.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 text-center text-text-muted text-xs font-mono space-y-1"
      >
        <div>
          <a
            href="https://lfdr.de/QRNG/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Powered by Quantum Random Numbers
          </a>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-text-muted/50">
          <span>Built with</span>
          <a
            href="https://claude.ai/code"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#D97757] transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 248 248" fill="currentColor">
              <path d="M52.4285 162.873L98.7844 136.879L99.5485 134.602L98.7844 133.334H96.4921L88.7237 132.862L62.2346 132.153L39.3113 131.207L17.0249 130.026L11.4214 128.844L6.2 121.873L6.7094 118.447L11.4214 115.257L18.171 115.847L33.0711 116.911L55.485 118.447L71.6586 119.392L95.728 121.873H99.5485L100.058 120.337L98.7844 119.392L97.7656 118.447L74.5877 102.732L49.4995 86.1905L36.3823 76.62L29.3779 71.7757L25.8121 67.2858L24.2839 57.3608L30.6515 50.2716L39.3113 50.8623L41.4763 51.4531L50.2636 58.1879L68.9842 72.7209L93.4357 90.6804L97.0015 93.6343L98.4374 92.6652L98.6571 91.9801L97.0015 89.2625L83.757 65.2772L69.621 40.8192L63.2534 30.6579L61.5978 24.632C60.9565 22.1032 60.579 20.0111 60.579 17.4246L67.8381 7.49965L71.9133 6.19995L81.7193 7.49965L85.7946 11.0443L91.9074 24.9865L101.714 46.8451L116.996 76.62L121.453 85.4816L123.873 93.6343L124.764 96.1155H126.292V94.6976L127.566 77.9197L129.858 57.3608L132.15 30.8942L132.915 23.4505L136.608 14.4708L143.994 9.62643L149.725 12.344L154.437 19.0788L153.8 23.4505L150.998 41.6463L145.522 70.1215L141.957 89.2625H143.994L146.414 86.7813L156.093 74.0206L172.266 53.698L179.398 45.6635L187.803 36.802L193.152 32.5484H203.34L210.726 43.6549L207.415 55.1159L196.972 68.3492L188.312 79.5739L175.896 96.2095L168.191 109.585L168.882 110.689L170.738 110.53L198.755 104.504L213.91 101.787L231.994 98.7149L240.144 102.496L241.036 106.395L237.852 114.311L218.495 119.037L195.826 123.645L162.07 131.592L161.696 131.893L162.137 132.547L177.36 133.925L183.855 134.279H199.774L229.447 136.524L237.215 141.605L241.8 147.867L241.036 152.711L229.065 158.737L213.019 154.956L175.45 145.977L162.587 142.787H160.805V143.85L171.502 154.366L191.242 172.089L215.82 195.011L217.094 200.682L213.91 205.172L210.599 204.699L188.949 188.394L180.544 181.069L161.696 165.118H160.422V166.772L164.752 173.152L187.803 207.771L188.949 218.405L187.294 221.832L181.308 223.959L174.813 222.777L161.187 203.754L147.305 182.486L136.098 163.345L134.745 164.2L128.075 235.42L125.019 239.082L117.887 241.8L111.902 237.31L108.718 229.984L111.902 215.452L115.722 196.547L118.779 181.541L121.58 162.873L123.291 156.636L123.14 156.219L121.773 156.449L107.699 175.752L86.304 204.699L69.3663 222.777L65.291 224.431L58.2867 220.768L58.9235 214.27L62.8713 208.48L86.304 178.705L100.44 160.155L109.551 149.507L109.462 147.967L108.959 147.924L46.6977 188.512L35.6182 189.93L30.7788 185.44L31.4156 178.115L33.7079 175.752L52.4285 162.873Z" />
            </svg>
            Claude Code
          </a>
        </div>
      </motion.footer>
    </main>
  );
}
