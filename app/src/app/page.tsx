'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from '@/components/TarotCard';
import { Hexagram, HexagramReadingDisplay, HexagramDetail, MiniHexagram } from '@/components/Hexagram';
import { EntropyIndicator } from '@/components/EntropyIndicator';
import { TrigramCompass } from '@/components/TrigramCompass';
import { cards, SPREADS, DEFAULT_SPREAD, type DrawnCard, type Spread } from '@/data/tarot';
import { ICHING_SPREADS, DEFAULT_ICHING_SPREAD, HEXAGRAMS, getHexagramByNumber, TRIGRAMS, type IChing_Spread, type Hexagram as HexagramType } from '@/data/iching';
import { selectCards, entropyBytesNeeded } from '@/lib/entropy/selection';
import { castHexagrams, ichingEntropyBytesNeeded } from '@/lib/entropy/iching-selection';
import { DivinationSystem, HexagramCast, CastLine } from '@/lib/entropy/types';

// ─── State machine ───────────────────────────────────────────────
// Every step is one focused thing. Full viewport. No scrolling.
type AppStep =
  | 'oracle'     // choose tarot or iching
  | 'method'     // choose spread / casting method
  | 'focus'      // enter intention / question
  | 'casting'    // entropy fetch + dramatic pause
  | 'reveal'     // primary reading display
  | 'details'    // deeper look (text, trigrams, transformation)
  | 'integrate'; // actions: copy interpretation, new reading

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

// ─── Transition config ───────────────────────────────────────────
const stepTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

// ─── Step navigation dots ────────────────────────────────────────
function StepDots({ current, total, onDot }: { current: number; total: number; onDot?: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDot?.(i)}
          disabled={!onDot}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-1.5 bg-accent-primary animate-dot-pulse'
              : i < current
                ? 'w-1.5 h-1.5 bg-accent-dim'
                : 'w-1.5 h-1.5 bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Bottom nav bar (dots + optional arrows) ─────────────────────
function StepNav({
  current,
  total,
  onPrev,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  current: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 pb-6 pt-10 flex flex-col items-center gap-4 pointer-events-none bg-gradient-to-t from-[var(--void-deepest)] via-[var(--void-deepest)]/80 to-transparent z-30">
      <div className="flex items-center gap-6 pointer-events-auto">
        {onPrev ? (
          <button
            onClick={onPrev}
            className="text-text-muted hover:text-text-primary transition-colors text-sm font-display px-3 py-1"
          >
            Back
          </button>
        ) : (
          <div className="w-14" />
        )}

        <StepDots current={current} total={total} />

        {onNext ? (
          <motion.button
            onClick={onNext}
            disabled={nextDisabled}
            className="text-accent-primary hover:text-iching-tertiary transition-colors text-sm font-display px-3 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.95 }}
          >
            {nextLabel || 'Next'}
          </motion.button>
        ) : (
          <div className="w-14" />
        )}
      </div>
    </div>
  );
}

// ─── Mini visualizations for spread picker ───────────────────────
function MiniCard({ highlight = false, className = '' }: { highlight?: boolean; className?: string }) {
  return (
    <div className={`w-2 h-3 rounded-[1px] ${highlight ? 'bg-violet-400' : 'bg-violet-500/40'} ${className}`} />
  );
}

function SpreadDiagram({ spreadId, selected }: { spreadId: string; selected: boolean }) {
  const h = selected;
  switch (spreadId) {
    case 'single':
      return <div className="flex items-center justify-center"><MiniCard highlight={h} /></div>;
    case 'three-card':
      return <div className="flex items-center gap-1"><MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} /></div>;
    case 'five-card':
      return (
        <div className="grid grid-cols-3 gap-0.5 items-center justify-items-center">
          <div /><MiniCard highlight={h} /><div />
          <MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} />
          <div /><MiniCard highlight={h} /><div />
        </div>
      );
    case 'celtic-cross':
    case 'celtic-cross-plus':
      return (
        <div className="flex items-center gap-1">
          <div className="grid grid-cols-3 gap-0.5 items-center justify-items-center">
            <div /><MiniCard highlight={h} /><div />
            <MiniCard highlight={h} />
            <div className="relative">
              <MiniCard highlight={h} />
              <MiniCard highlight={h} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
            </div>
            <MiniCard highlight={h} />
            <div /><MiniCard highlight={h} /><div />
          </div>
          <div className="flex flex-col gap-0.5">
            <MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} />
          </div>
        </div>
      );
    case 'relationship-reflection':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2"><MiniCard highlight={h} /><MiniCard highlight={h} /></div>
          <MiniCard highlight={h} />
          <div className="flex items-center gap-1"><MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} /></div>
          <MiniCard highlight={h} />
        </div>
      );
    case 'right-hand-of-eris':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1"><MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} /></div>
          <div className="flex items-center gap-2"><MiniCard highlight={h} /><MiniCard highlight={h} /></div>
        </div>
      );
    default:
      return <div className="flex items-center gap-0.5">{Array.from({ length: 3 }).map((_, i) => <MiniCard key={i} highlight={h} />)}</div>;
  }
}

// ─── Card slot for tarot spread layouts ──────────────────────────
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
  const CARD_DELAY = 0.6;
  return (
    <motion.div
      className={`relative ${className} ${index === selectedCard ? 'z-20' : 'z-0'} ${crossCard ? 'rotate-90' : ''}`}
      initial={{ opacity: 0, scale: 0.3, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * CARD_DELAY, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center mb-1">
        <span className="text-[9px] md:text-[10px] text-text-muted font-mono leading-tight block">{position.name}</span>
      </div>
      <TarotCard card={drawn.card} reversed={drawn.reversed} revealed={true} delay={index * CARD_DELAY} onClick={() => setSelectedCard(selectedCard === index ? null : index)} size={size} />
      {drawn.reversed && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-violet-400 font-mono">reversed</span>
      )}
    </motion.div>
  );
}

// ─── Spread-specific tarot layouts ───────────────────────────────
interface SpreadLayoutProps {
  drawnCards: DrawnCard[];
  positions: { name: string; description: string }[];
  spreadId: string;
  selectedCard: number | null;
  setSelectedCard: (index: number | null) => void;
}

function SpreadLayout({ drawnCards, positions, spreadId, selectedCard, setSelectedCard }: SpreadLayoutProps) {
  const slotProps = (index: number, extra: Partial<CardSlotProps> = {}) => ({
    drawn: drawnCards[index], index, position: positions[index], selectedCard, setSelectedCard, ...extra,
  });

  switch (spreadId) {
    case 'single':
      return <div className="flex justify-center"><CardSlot {...slotProps(0, { size: 'md' })} /></div>;
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
          <CardSlot {...slotProps(3)} />
          <div className="flex justify-center items-start gap-3">
            <CardSlot {...slotProps(2)} /><CardSlot {...slotProps(0)} /><CardSlot {...slotProps(1)} />
          </div>
          <CardSlot {...slotProps(4)} />
        </div>
      );
    case 'celtic-cross':
    case 'celtic-cross-plus':
      return (
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8">
          <div className="grid grid-cols-3 gap-2 items-center justify-items-center" style={{ gridTemplateRows: 'auto auto auto' }}>
            <div /><CardSlot {...slotProps(4)} /><div />
            <CardSlot {...slotProps(3)} />
            <div className="relative">
              <CardSlot {...slotProps(0)} />
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0.3, rotate: 90 }}
                animate={{ opacity: 1, scale: 1, rotate: 90 }}
                transition={{ delay: 1 * 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <TarotCard card={drawnCards[1].card} reversed={drawnCards[1].reversed} revealed={true} delay={1 * 0.6} onClick={() => setSelectedCard(selectedCard === 1 ? null : 1)} size="sm" />
              </motion.div>
            </div>
            <CardSlot {...slotProps(5)} />
            <div /><CardSlot {...slotProps(2)} /><div />
          </div>
          <div className="flex flex-row md:flex-col gap-2 md:gap-3">
            <CardSlot {...slotProps(9)} /><CardSlot {...slotProps(8)} /><CardSlot {...slotProps(7)} /><CardSlot {...slotProps(6)} />
            {spreadId === 'celtic-cross-plus' && drawnCards[10] && <CardSlot {...slotProps(10)} />}
          </div>
        </div>
      );
    case 'relationship-reflection':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center items-start gap-8 md:gap-12">
            <CardSlot {...slotProps(0)} /><CardSlot {...slotProps(1)} />
          </div>
          <CardSlot {...slotProps(2)} />
          <div className="flex justify-center items-start gap-3 md:gap-4">
            <CardSlot {...slotProps(3)} /><CardSlot {...slotProps(4)} /><CardSlot {...slotProps(5)} />
          </div>
          <CardSlot {...slotProps(6)} />
        </div>
      );
    case 'right-hand-of-eris':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center items-start gap-3 md:gap-4">
            <CardSlot {...slotProps(1)} /><CardSlot {...slotProps(0)} /><CardSlot {...slotProps(2)} />
          </div>
          <div className="flex justify-center items-start gap-6 md:gap-8">
            <CardSlot {...slotProps(3)} /><CardSlot {...slotProps(4)} />
          </div>
        </div>
      );
    default:
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 justify-items-center">
          {drawnCards.map((drawn, index) => <CardSlot key={drawn.card.id} {...slotProps(index)} />)}
        </div>
      );
  }
}

// ─── Keyboard navigation hook ────────────────────────────────────
function useKeyNav(onLeft: (() => void) | undefined, onRight: (() => void) | undefined) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onLeft?.(); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onRight?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onLeft, onRight]);
}

// =================================================================
// MAIN COMPONENT
// =================================================================
export default function Home() {
  // ─── State ───────────────────────────────────────────────────
  const [step, setStep] = useState<AppStep>('oracle');
  const [divinationSystem, setDivinationSystem] = useState<DivinationSystem>('iching');
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

  // ─── Step index for dot display ──────────────────────────────
  const ALL_STEPS: AppStep[] = ['oracle', 'method', 'focus', 'casting', 'reveal', 'details', 'integrate'];
  const stepIndex = ALL_STEPS.indexOf(step);

  // ─── Entropy + reading logic ─────────────────────────────────
  const fetchQuantumEntropy = useCallback(async (bytesNeeded: number) => {
    const response = await fetch(`/api/entropy?count=${bytesNeeded}`);
    if (!response.ok) throw new Error('Entropy source unavailable. Please try again.');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch entropy');
    return { data: result.data, source: result.source };
  }, []);

  const performReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStep('casting');

    try {
      if (divinationSystem === 'tarot') {
        const cardCount = selectedSpread.cardCount;
        const bytesNeeded = entropyBytesNeeded(cardCount);
        const entropy = await fetchQuantumEntropy(bytesNeeded);
        const { indices, reversals } = selectCards(entropy.data, cardCount);
        const drawnCards: DrawnCard[] = indices.map((cardIndex, position) => ({
          card: cards[cardIndex], position, reversed: reversals[position],
        }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        setReading({
          type: 'tarot', drawnCards, entropySource: entropy.source, intention, timestamp: new Date(), spread: selectedSpread,
        });
      } else {
        const hexagramCount = selectedIChingSpread.id === 'single-hexagram' ? 1 : selectedIChingSpread.id === 'past-future' ? 2 : 3;
        const bytesNeeded = ichingEntropyBytesNeeded(hexagramCount);
        const entropy = await fetchQuantumEntropy(bytesNeeded);
        const { casts } = castHexagrams(entropy.data, hexagramCount);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setReading({
          type: 'iching', casts, entropySource: entropy.source, intention, timestamp: new Date(), spread: selectedIChingSpread,
        });
      }
      setStep('reveal');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to perform reading');
      setStep('focus');
    } finally {
      setLoading(false);
    }
  }, [intention, selectedSpread, selectedIChingSpread, divinationSystem, fetchQuantumEntropy]);

  // ─── Markdown builder ────────────────────────────────────────
  const buildReadingMarkdown = useCallback(() => {
    if (!reading) return '';
    const lines: string[] = [];
    lines.push(reading.spread.interpretPrompt);
    lines.push('');
    if (reading.intention) { lines.push(`**Question:** ${reading.intention}`); lines.push(''); }

    if (reading.type === 'tarot') {
      lines.push(`**Spread:** ${reading.spread.name}`);
      lines.push('');
      lines.push('| Position | Meaning | Card |');
      lines.push('|----------|---------|------|');
      reading.drawnCards.forEach((drawn, index) => {
        const pos = reading.spread.positions[index];
        const cardName = drawn.reversed ? `${drawn.card.name} (Reversed)` : drawn.card.name;
        lines.push(`| ${index + 1} | ${pos.name} / ${pos.description} | ${cardName} |`);
      });
    } else {
      lines.push(`**Method:** ${reading.spread.name}`);
      lines.push('');
      reading.casts.forEach((cast, castIndex) => {
        const hexagram = getHexagramByNumber(cast.hexagramNumber);
        if (!hexagram) return;
        const castLabel = reading.casts.length === 1 ? '' :
          reading.casts.length === 2 ? (castIndex === 0 ? '### Past' : '### Future') :
          `### Aspect ${castIndex + 1}`;
        if (castLabel) { lines.push(castLabel); lines.push(''); }
        lines.push(`**Primary Hexagram:** ${cast.hexagramNumber}. ${hexagram.name} (${hexagram.chinese} ${hexagram.pinyin})`);
        lines.push('');
        lines.push(`*Judgment:* ${hexagram.judgment}`);
        lines.push('');
        lines.push(`*Image:* ${hexagram.image}`);
        lines.push('');
        const changingLineNumbers = cast.lines.map((line, i) => line.isChanging ? i + 1 : null).filter(Boolean);
        if (changingLineNumbers.length > 0) { lines.push(`**Changing Lines:** ${changingLineNumbers.join(', ')}`); lines.push(''); }
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
    } catch (e) { console.error('Failed to copy:', e); }
  }, [buildReadingMarkdown]);

  const shareReading = useCallback(async () => {
    const markdown = buildReadingMarkdown();
    if (!markdown) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'HyperTarot Reading', text: markdown }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    await copyReadingToClipboard();
  }, [buildReadingMarkdown, copyReadingToClipboard]);

  const resetReading = useCallback(() => {
    setStep('oracle');
    setIntention('');
    setReading(null);
    setSelectedCard(null);
    setSelectedHexagram(null);
    setSelectedCastIndex(0);
    setError(null);
    setCopied(false);
  }, []);

  // ─── Navigation helpers ──────────────────────────────────────
  const goBack = useCallback(() => {
    const prev: Record<AppStep, AppStep | null> = {
      oracle: null, method: 'oracle', focus: 'method', casting: null, reveal: null, details: 'reveal', integrate: 'details',
    };
    const p = prev[step];
    if (p) setStep(p);
  }, [step]);

  const goNext = useCallback(() => {
    const next: Record<AppStep, AppStep | null> = {
      oracle: 'method', method: 'focus', focus: null, casting: null, reveal: 'details', details: 'integrate', integrate: null,
    };
    const n = next[step];
    if (n) setStep(n);
  }, [step]);

  // Keyboard: arrows / space / enter to navigate
  useKeyNav(
    step !== 'oracle' && step !== 'casting' ? goBack : undefined,
    step === 'reveal' || step === 'details' ? goNext : step === 'oracle' || step === 'method' ? goNext : undefined,
  );

  // ─── I Ching helpers for reading steps ───────────────────────
  const currentCast = reading?.type === 'iching' ? reading.casts[selectedCastIndex] : null;
  const primaryHex = currentCast ? getHexagramByNumber(currentCast.hexagramNumber) : null;
  const transformedHex = currentCast?.transformedHexagramNumber ? getHexagramByNumber(currentCast.transformedHexagramNumber) : null;
  const changingLines = currentCast?.lines.map((l, i) => l.isChanging ? i + 1 : null).filter(Boolean) as number[] || [];

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ═══════════════════════════════════════════════════════════
            STEP 1: ORACLE — Choose your system
        ═══════════════════════════════════════════════════════════ */}
        {step === 'oracle' && (
          <motion.div key="oracle" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg text-center gap-12">
            <div className="space-y-3 animate-breathe">
              <h1 className="text-5xl md:text-7xl font-display font-semibold text-gradient-iching">
                HyperTarot
              </h1>
              <p className="text-text-muted text-xs font-mono tracking-wider">
                Quantum entropy divination
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <motion.button
                onClick={() => { setDivinationSystem('tarot'); setStep('method'); }}
                className="group relative px-10 py-6 rounded-2xl border border-violet-500/20 bg-void-deep hover:border-violet-500/50 transition-all w-48"
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(124, 58, 237, 0.15)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-2xl font-display text-violet-300 group-hover:text-violet-200 transition-colors">Tarot</span>
                <span className="block text-xs text-text-muted mt-1">78 cards</span>
              </motion.button>

              <span className="text-text-muted/30 text-xs font-mono">or</span>

              <motion.button
                onClick={() => { setDivinationSystem('iching'); setStep('method'); }}
                className="group relative px-10 py-6 rounded-2xl border border-accent-dim/30 bg-void-deep hover:border-accent-primary/50 transition-all w-48"
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(201, 165, 74, 0.12)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-2xl font-display text-iching-tertiary group-hover:text-accent-primary transition-colors">I Ching</span>
                <span className="block text-xs text-text-muted mt-1">64 hexagrams</span>
              </motion.button>
            </div>

            <p className="text-text-muted/40 text-xs max-w-xs leading-relaxed">
              Readings use true quantum randomness from vacuum fluctuations, measured by ID Quantique hardware at the LfD.
            </p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 2: METHOD — Choose spread / casting method
        ═══════════════════════════════════════════════════════════ */}
        {step === 'method' && (
          <motion.div key="method" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg text-center gap-8">
            <h2 className="text-2xl md:text-3xl font-display text-text-primary/80">
              {divinationSystem === 'tarot' ? 'Choose your spread' : 'Choose your method'}
            </h2>

            {divinationSystem === 'tarot' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {SPREADS.map((spread) => (
                  <motion.button
                    key={spread.id}
                    onClick={() => { setSelectedSpread(spread); setStep('focus'); }}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      selectedSpread.id === spread.id
                        ? 'border-violet-500/60 bg-violet-500/10 glow-quantum'
                        : 'border-zinc-800 bg-void-deep hover:border-violet-500/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-12 flex items-center justify-center">
                      <SpreadDiagram spreadId={spread.id} selected={selectedSpread.id === spread.id} />
                    </div>
                    <span className="text-sm font-display text-text-primary">{spread.name}</span>
                    <span className="text-[10px] text-text-muted">{spread.cardCount} cards</span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {ICHING_SPREADS.map((spread) => (
                  <motion.button
                    key={spread.id}
                    onClick={() => { setSelectedIChingSpread(spread); setStep('focus'); }}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${
                      selectedIChingSpread.id === spread.id
                        ? 'border-accent-primary/50 bg-accent-primary/5 glow-iching'
                        : 'border-zinc-800 bg-void-deep hover:border-accent-dim/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-12 flex items-center justify-center text-iching-tertiary">
                      <MiniHexagram />
                      {spread.id === 'past-future' && <><span className="mx-2 text-accent-dim/50">→</span><MiniHexagram /></>}
                      {spread.id === 'three-coins' && <><span className="mx-1 text-accent-dim/50">·</span><MiniHexagram /><span className="mx-1 text-accent-dim/50">·</span><MiniHexagram /></>}
                    </div>
                    <span className="text-sm font-display text-text-primary">{spread.name}</span>
                    <span className="text-[10px] text-text-muted">{spread.description}</span>
                  </motion.button>
                ))}
              </div>
            )}

            <StepNav current={1} total={7} onPrev={() => setStep('oracle')} />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 3: FOCUS — Enter intention
        ═══════════════════════════════════════════════════════════ */}
        {step === 'focus' && (
          <motion.div key="focus" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md text-center gap-8">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-display text-text-primary/80">
                Your question
              </h2>
              <p className="text-text-muted text-xs">
                Optional. For your reflection only — never sent anywhere.
              </p>
            </div>

            <textarea
              value={intention}
              onChange={e => setIntention(e.target.value)}
              placeholder="What are you asking?"
              className={`w-full h-32 bg-transparent border-b rounded-none p-4 text-text-primary text-center font-display text-lg placeholder:text-text-muted/30 focus:outline-none resize-none transition-colors ${
                divinationSystem === 'tarot'
                  ? 'border-violet-500/20 focus:border-violet-500/60'
                  : 'border-accent-dim/20 focus:border-accent-primary/60'
              }`}
              autoFocus
            />

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
                {error}
              </motion.p>
            )}

            <motion.button
              onClick={performReading}
              disabled={loading}
              className={`px-10 py-4 rounded-full text-lg font-display font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                divinationSystem === 'tarot'
                  ? 'bg-violet-600/80 hover:bg-violet-500/80 text-white glow-quantum'
                  : 'bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary border border-accent-primary/30 glow-iching'
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {divinationSystem === 'tarot' ? 'Draw' : 'Cast'}
            </motion.button>

            <StepNav current={2} total={7} onPrev={() => setStep('method')} />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 4: CASTING — Entropy fetch + dramatic pause
        ═══════════════════════════════════════════════════════════ */}
        {step === 'casting' && (
          <motion.div key="casting" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className={`w-16 h-16 rounded-full border border-t-transparent ${
                divinationSystem === 'tarot' ? 'border-violet-500/40' : 'border-accent-primary/40'
              }`}
            />
            <div className="text-center space-y-3">
              <p className="text-lg font-display text-text-primary/60">
                {divinationSystem === 'tarot' ? 'Drawing...' : 'Casting...'}
              </p>
              <p className="text-xs text-text-muted font-mono">
                {divinationSystem === 'tarot' ? selectedSpread.name : selectedIChingSpread.name}
              </p>
              <EntropyIndicator source="LfD QRNG" loading />
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 5: REVEAL — The primary reading
        ═══════════════════════════════════════════════════════════ */}
        {step === 'reveal' && reading && (
          <motion.div key="reveal" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-6xl">

            {/* ── TAROT reveal ── */}
            {reading.type === 'tarot' && (
              <div className="w-full space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-text-muted text-xs font-mono">{reading.spread.name}</p>
                  {reading.intention && <p className="text-text-muted/60 text-sm italic">&ldquo;{reading.intention}&rdquo;</p>}
                </div>

                <SpreadLayout
                  drawnCards={reading.drawnCards}
                  positions={reading.spread.positions}
                  spreadId={reading.spread.id}
                  selectedCard={selectedCard}
                  setSelectedCard={setSelectedCard}
                />

                <AnimatePresence>
                  {selectedCard !== null && reading.drawnCards[selectedCard] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                      className="bg-void-deep/80 backdrop-blur border border-violet-500/20 rounded-xl p-6 max-w-md mx-auto"
                    >
                      <h3 className="text-2xl font-display font-semibold text-text-primary mb-2">
                        {reading.drawnCards[selectedCard].card.name}
                        {reading.drawnCards[selectedCard].reversed && <span className="text-violet-400 text-sm ml-2">(Reversed)</span>}
                      </h3>
                      <p className="text-text-muted text-sm mb-2">
                        {reading.drawnCards[selectedCard].card.arcana}
                        {reading.drawnCards[selectedCard].card.suit && ` — ${reading.drawnCards[selectedCard].card.suit}`}
                      </p>
                      <p className="text-violet-300/70 text-sm font-mono">
                        {reading.spread.positions[selectedCard]?.name}
                      </p>
                      <p className="text-text-muted text-xs mt-1">
                        {reading.spread.positions[selectedCard]?.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── I CHING reveal: 3D particle visualization ── */}
            {reading.type === 'iching' && primaryHex && (
              <div className="flex flex-col items-center w-full">
                {/* Multi-cast selector */}
                {reading.casts.length > 1 && (
                  <div className="flex gap-2 mb-4">
                    {reading.casts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCastIndex(index)}
                        className={`px-4 py-1.5 rounded-full text-xs font-display transition-all ${
                          selectedCastIndex === index
                            ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40'
                            : 'text-text-muted hover:text-text-primary border border-zinc-800'
                        }`}
                      >
                        {reading.casts.length === 2 ? (index === 0 ? 'Past' : 'Future') : `Cast ${index + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                <HexagramReadingDisplay
                  primaryHexagram={primaryHex}
                  transformedHexagram={transformedHex}
                  castLines={currentCast!.lines as [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine]}
                  revealed={true}
                  onHexagramClick={(type) => setSelectedHexagram(type)}
                />

                <AnimatePresence>
                  {selectedHexagram && currentCast && (() => {
                    const hexNum = selectedHexagram === 'primary' ? currentCast.hexagramNumber : currentCast.transformedHexagramNumber;
                    if (!hexNum) return null;
                    const hex = getHexagramByNumber(hexNum);
                    if (!hex) return null;
                    return (
                      <HexagramDetail
                        hexagram={hex}
                        castLines={selectedHexagram === 'primary' ? currentCast.lines as [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine] : undefined}
                        onClose={() => setSelectedHexagram(null)}
                      />
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}

            <StepNav
              current={4}
              total={7}
              onNext={goNext}
              nextLabel="Details"
            />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 6: DETAILS — Deeper reading
        ═══════════════════════════════════════════════════════════ */}
        {step === 'details' && reading && (
          <motion.div key="details" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-lg px-4">

            {/* ── TAROT details ── */}
            {reading.type === 'tarot' && (
              <div className="space-y-6 text-center w-full">
                <h2 className="text-2xl font-display text-text-primary/80">Your Reading</h2>
                <div className="space-y-4">
                  {reading.drawnCards.map((drawn, i) => (
                    <motion.div
                      key={drawn.card.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 text-left py-3 border-b border-zinc-800/50"
                    >
                      <span className="text-xs text-text-muted font-mono w-6 shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary font-display">
                          {drawn.card.name}{drawn.reversed ? ' (Reversed)' : ''}
                        </p>
                        <p className="text-xs text-text-muted">{reading.spread.positions[i]?.name} — {reading.spread.positions[i]?.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <EntropyIndicator source={reading.entropySource} />
              </div>
            )}

            {/* ── I CHING details: text reading ── */}
            {reading.type === 'iching' && primaryHex && currentCast && (
              <div className="space-y-8 w-full">
                {/* Multi-cast selector */}
                {reading.casts.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {reading.casts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedCastIndex(index)}
                        className={`px-4 py-1.5 rounded-full text-xs font-display transition-all ${
                          selectedCastIndex === index
                            ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40'
                            : 'text-text-muted hover:text-text-primary border border-zinc-800'
                        }`}
                      >
                        {reading.casts.length === 2 ? (index === 0 ? 'Past' : 'Future') : `Cast ${index + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Hexagram identity */}
                <motion.div
                  className="text-center space-y-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-4xl text-text-primary/40 font-serif">{primaryHex.chinese}</span>
                  <p className="text-lg font-display text-text-primary/80">{primaryHex.number}. {primaryHex.name}</p>
                  <p className="text-xs text-text-muted italic">{primaryHex.pinyin}</p>
                  <p className="text-sm text-iching-tertiary/80 font-display mt-2">{primaryHex.essence}</p>
                </motion.div>

                {/* Judgment */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">The Judgment</p>
                  <p className="text-sm text-text-primary/70 font-serif leading-relaxed">{primaryHex.judgment}</p>
                </motion.div>

                {/* Image */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">The Image</p>
                  <p className="text-sm text-text-primary/70 font-serif leading-relaxed">{primaryHex.image}</p>
                </motion.div>

                {/* Trigram dynamics */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <TrigramCompass
                    primaryHexagram={primaryHex}
                    transformedHexagram={transformedHex}
                    size={260}
                  />
                </motion.div>

                {/* Changing lines */}
                {changingLines.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="text-center space-y-2"
                  >
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Changing Lines</p>
                    <p className="text-sm text-iching-tertiary/70 font-mono">
                      {changingLines.join(', ')}
                    </p>
                  </motion.div>
                )}

                {/* Transformation */}
                {transformedHex && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    className="text-center space-y-3 pt-4 border-t border-zinc-800/50"
                  >
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Transforms to</p>
                    <span className="text-3xl text-text-primary/30 font-serif">{transformedHex.chinese}</span>
                    <p className="text-lg font-display text-text-primary/70">{transformedHex.number}. {transformedHex.name}</p>
                    <p className="text-sm text-iching-tertiary/60 font-display">{transformedHex.essence}</p>
                    <p className="text-sm text-text-primary/60 font-serif leading-relaxed mt-2">{transformedHex.judgment}</p>
                  </motion.div>
                )}

                <div className="flex justify-center pt-2">
                  <EntropyIndicator source={reading.entropySource} />
                </div>
              </div>
            )}

            <StepNav
              current={5}
              total={7}
              onPrev={goBack}
              onNext={goNext}
              nextLabel="Done"
            />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 7: INTEGRATE — Actions
        ═══════════════════════════════════════════════════════════ */}
        {step === 'integrate' && reading && (
          <motion.div key="integrate" {...stepTransition} className="flex flex-col items-center justify-center min-h-[80vh] gap-8 max-w-sm text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-text-primary/80">Interpretation</h2>
              <p className="text-text-muted text-xs leading-relaxed">
                Copy your reading to paste into Claude, ChatGPT, or any AI.
                Bring your own subscription — that&apos;s how we keep this free.
              </p>
            </div>

            {reading.intention && (
              <p className="text-text-muted/50 text-sm italic">&ldquo;{reading.intention}&rdquo;</p>
            )}

            <div className="flex flex-col items-center gap-3 w-full">
              <motion.button
                onClick={shareReading}
                className={`w-full px-6 py-4 rounded-xl font-display text-sm transition-all ${
                  copied
                    ? 'bg-green-600/10 border border-green-500/40 text-green-400'
                    : 'bg-void-deep border border-accent-dim/30 hover:border-accent-primary/50 text-text-primary'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? 'Copied to clipboard' : 'Copy reading for interpretation'}
              </motion.button>

              <motion.button
                onClick={resetReading}
                className="w-full px-6 py-4 rounded-xl font-display text-sm border border-zinc-800 text-text-muted hover:text-text-primary hover:border-zinc-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                New reading
              </motion.button>
            </div>

            <StepNav current={6} total={7} onPrev={goBack} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 pb-2 text-center text-text-muted/40 text-[10px] font-mono z-10 pointer-events-none"
      >
        <div className="pointer-events-auto inline-flex items-center gap-3">
          <a href="https://lfdr.de/QRNG/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary/60 transition-colors">
            Quantum Random Numbers
          </a>
          <span>·</span>
          <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#D97757]/60 transition-colors">
            <svg className="w-3 h-3" viewBox="0 0 248 248" fill="currentColor">
              <path d="M52.4285 162.873L98.7844 136.879L99.5485 134.602L98.7844 133.334H96.4921L88.7237 132.862L62.2346 132.153L39.3113 131.207L17.0249 130.026L11.4214 128.844L6.2 121.873L6.7094 118.447L11.4214 115.257L18.171 115.847L33.0711 116.911L55.485 118.447L71.6586 119.392L95.728 121.873H99.5485L100.058 120.337L98.7844 119.392L97.7656 118.447L74.5877 102.732L49.4995 86.1905L36.3823 76.62L29.3779 71.7757L25.8121 67.2858L24.2839 57.3608L30.6515 50.2716L39.3113 50.8623L41.4763 51.4531L50.2636 58.1879L68.9842 72.7209L93.4357 90.6804L97.0015 93.6343L98.4374 92.6652L98.6571 91.9801L97.0015 89.2625L83.757 65.2772L69.621 40.8192L63.2534 30.6579L61.5978 24.632C60.9565 22.1032 60.579 20.0111 60.579 17.4246L67.8381 7.49965L71.9133 6.19995L81.7193 7.49965L85.7946 11.0443L91.9074 24.9865L101.714 46.8451L116.996 76.62L121.453 85.4816L123.873 93.6343L124.764 96.1155H126.292V94.6976L127.566 77.9197L129.858 57.3608L132.15 30.8942L132.915 23.4505L136.608 14.4708L143.994 9.62643L149.725 12.344L154.437 19.0788L153.8 23.4505L150.998 41.6463L145.522 70.1215L141.957 89.2625H143.994L146.414 86.7813L156.093 74.0206L172.266 53.698L179.398 45.6635L187.803 36.802L193.152 32.5484H203.34L210.726 43.6549L207.415 55.1159L196.972 68.3492L188.312 79.5739L175.896 96.2095L168.191 109.585L168.882 110.689L170.738 110.53L198.755 104.504L213.91 101.787L231.994 98.7149L240.144 102.496L241.036 106.395L237.852 114.311L218.495 119.037L195.826 123.645L162.07 131.592L161.696 131.893L162.137 132.547L177.36 133.925L183.855 134.279H199.774L229.447 136.524L237.215 141.605L241.8 147.867L241.036 152.711L229.065 158.737L213.019 154.956L175.45 145.977L162.587 142.787H160.805V143.85L171.502 154.366L191.242 172.089L215.82 195.011L217.094 200.682L213.91 205.172L210.599 204.699L188.949 188.394L180.544 181.069L161.696 165.118H160.422V166.772L164.752 173.152L187.803 207.771L188.949 218.405L187.294 221.832L181.308 223.959L174.813 222.777L161.187 203.754L147.305 182.486L136.098 163.345L134.745 164.2L128.075 235.42L125.019 239.082L117.887 241.8L111.902 237.31L108.718 229.984L111.902 215.452L115.722 196.547L118.779 181.541L121.58 162.873L123.291 156.636L123.14 156.219L121.773 156.449L107.699 175.752L86.304 204.699L69.3663 222.777L65.291 224.431L58.2867 220.768L58.9235 214.27L62.8713 208.48L86.304 178.705L100.44 160.155L109.551 149.507L109.462 147.967L108.959 147.924L46.6977 188.512L35.6182 189.93L30.7788 185.44L31.4156 178.115L33.7079 175.752L52.4285 162.873Z" />
            </svg>
            Claude Code
          </a>
        </div>
      </motion.footer>
    </main>
  );
}
