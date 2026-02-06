'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { TarotCard } from '@/components/TarotCard';
import { Hexagram, HexagramReadingDisplay, HexagramDetail, MiniHexagram } from '@/components/Hexagram';
import { EntropyIndicator } from '@/components/EntropyIndicator';
import { TrigramCompass } from '@/components/TrigramCompass';
import { cards, SPREADS, DEFAULT_SPREAD, type DrawnCard, type Spread } from '@/data/tarot';
import { ICHING_SPREADS, DEFAULT_ICHING_SPREAD, HEXAGRAMS, getHexagramByNumber, TRIGRAMS, type IChing_Spread, type Hexagram as HexagramType } from '@/data/iching';
import { selectCards, entropyBytesNeeded } from '@/lib/entropy/selection';
import { castHexagrams, ichingEntropyBytesNeeded } from '@/lib/entropy/iching-selection';
import { DivinationSystem, HexagramCast, CastLine } from '@/lib/entropy/types';

// ─── Phase: what have we resolved so far? ────────────────────────
// Not discrete screens — a continuous accumulation of choices.
// Everything stays on the same surface; new layers dissolve in.
type Phase = 'choose' | 'casting' | 'reading';

// ─── Reading data ────────────────────────────────────────────────
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

// ─── Ambient particle field ──────────────────────────────────────
// Always present. Gives the void life before any reading happens.
function AmbientField({ intensity = 1 }: { intensity?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (i * 37 + 13) % 100,
      y: (i * 53 + 7) % 100,
      size: 1 + (i % 3) * 0.5,
      duration: 10 + (i % 7) * 3,
      delay: i * 0.6,
      drift: i % 2 === 0 ? 1 : -1,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" style={{ opacity: intensity }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-accent-primary"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -40 * p.drift, 0],
            x: [0, 20 * p.drift, 0],
            opacity: [0, 0.25, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Dissolve wrapper ────────────────────────────────────────────
// Layers dissolve in/out rather than hard-swapping.
function Dissolve({
  show,
  children,
  delay = 0,
  className = '',
}: {
  show: boolean;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        opacity: show ? 1 : 0,
        y: show ? 0 : 8,
        scale: show ? 1 : 0.98,
        filter: show ? 'blur(0px)' : 'blur(4px)',
      }}
      transition={{ duration: 0.5, delay: show ? delay : 0, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Mini visualizations ─────────────────────────────────────────
function MiniCard({ highlight = false, className = '' }: { highlight?: boolean; className?: string }) {
  return <div className={`w-2 h-3 rounded-[1px] ${highlight ? 'bg-violet-400' : 'bg-violet-500/40'} ${className}`} />;
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
    case 'celtic-cross': case 'celtic-cross-plus':
      return (
        <div className="flex items-center gap-1">
          <div className="grid grid-cols-3 gap-0.5 items-center justify-items-center">
            <div /><MiniCard highlight={h} /><div />
            <MiniCard highlight={h} />
            <div className="relative"><MiniCard highlight={h} /><MiniCard highlight={h} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" /></div>
            <MiniCard highlight={h} />
            <div /><MiniCard highlight={h} /><div />
          </div>
          <div className="flex flex-col gap-0.5"><MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} /><MiniCard highlight={h} /></div>
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

// ─── Card slot ───────────────────────────────────────────────────
interface CardSlotProps {
  drawn: DrawnCard;
  index: number;
  position: { name: string; description: string };
  selectedCard: number | null;
  setSelectedCard: (index: number | null) => void;
  size?: 'sm' | 'md';
  className?: string;
}

function CardSlot({ drawn, index, position, selectedCard, setSelectedCard, size = 'sm', className = '' }: CardSlotProps) {
  const CARD_DELAY = 0.6;
  return (
    <motion.div
      className={`relative ${className} ${index === selectedCard ? 'z-20' : 'z-0'}`}
      initial={{ opacity: 0, scale: 0.3, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * CARD_DELAY, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center mb-1">
        <span className="text-[9px] md:text-[10px] text-text-muted font-mono leading-tight block">{position.name}</span>
      </div>
      <TarotCard card={drawn.card} reversed={drawn.reversed} revealed={true} delay={index * CARD_DELAY} onClick={() => setSelectedCard(selectedCard === index ? null : index)} size={size} />
      {drawn.reversed && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-violet-400 font-mono">reversed</span>}
    </motion.div>
  );
}

// ─── Spread layouts ──────────────────────────────────────────────
interface SpreadLayoutProps {
  drawnCards: DrawnCard[];
  positions: { name: string; description: string }[];
  spreadId: string;
  selectedCard: number | null;
  setSelectedCard: (index: number | null) => void;
}

function SpreadLayout({ drawnCards, positions, spreadId, selectedCard, setSelectedCard }: SpreadLayoutProps) {
  const s = (index: number, extra: Partial<CardSlotProps> = {}) => ({
    drawn: drawnCards[index], index, position: positions[index], selectedCard, setSelectedCard, ...extra,
  });
  switch (spreadId) {
    case 'single':
      return <div className="flex justify-center"><CardSlot {...s(0, { size: 'md' })} /></div>;
    case 'three-card':
      return <div className="flex justify-center items-start gap-4 md:gap-6"><CardSlot {...s(0, { size: 'md' })} /><CardSlot {...s(1, { size: 'md' })} /><CardSlot {...s(2, { size: 'md' })} /></div>;
    case 'five-card':
      return (
        <div className="flex flex-col items-center gap-3">
          <CardSlot {...s(3)} />
          <div className="flex justify-center items-start gap-3"><CardSlot {...s(2)} /><CardSlot {...s(0)} /><CardSlot {...s(1)} /></div>
          <CardSlot {...s(4)} />
        </div>
      );
    case 'celtic-cross': case 'celtic-cross-plus':
      return (
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8">
          <div className="grid grid-cols-3 gap-2 items-center justify-items-center">
            <div /><CardSlot {...s(4)} /><div />
            <CardSlot {...s(3)} />
            <div className="relative">
              <CardSlot {...s(0)} />
              <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ opacity: 0, scale: 0.3, rotate: 90 }} animate={{ opacity: 1, scale: 1, rotate: 90 }}
                transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <TarotCard card={drawnCards[1].card} reversed={drawnCards[1].reversed} revealed={true} delay={0.6} onClick={() => setSelectedCard(selectedCard === 1 ? null : 1)} size="sm" />
              </motion.div>
            </div>
            <CardSlot {...s(5)} />
            <div /><CardSlot {...s(2)} /><div />
          </div>
          <div className="flex flex-row md:flex-col gap-2 md:gap-3">
            <CardSlot {...s(9)} /><CardSlot {...s(8)} /><CardSlot {...s(7)} /><CardSlot {...s(6)} />
            {spreadId === 'celtic-cross-plus' && drawnCards[10] && <CardSlot {...s(10)} />}
          </div>
        </div>
      );
    case 'relationship-reflection':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center items-start gap-8 md:gap-12"><CardSlot {...s(0)} /><CardSlot {...s(1)} /></div>
          <CardSlot {...s(2)} />
          <div className="flex justify-center items-start gap-3 md:gap-4"><CardSlot {...s(3)} /><CardSlot {...s(4)} /><CardSlot {...s(5)} /></div>
          <CardSlot {...s(6)} />
        </div>
      );
    case 'right-hand-of-eris':
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex justify-center items-start gap-3 md:gap-4"><CardSlot {...s(1)} /><CardSlot {...s(0)} /><CardSlot {...s(2)} /></div>
          <div className="flex justify-center items-start gap-6 md:gap-8"><CardSlot {...s(3)} /><CardSlot {...s(4)} /></div>
        </div>
      );
    default:
      return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 justify-items-center">
          {drawnCards.map((drawn, index) => <CardSlot key={drawn.card.id} {...s(index)} />)}
        </div>
      );
  }
}

// =================================================================
// MAIN
// =================================================================
export default function Home() {
  // ─── State ─────────────────────────────────────────────────────
  // These aren't "steps" — they're accumulating choices.
  // The UI shows everything, dimming what's not yet relevant.
  const [phase, setPhase] = useState<Phase>('choose');
  const [system, setSystem] = useState<DivinationSystem | null>(null);
  const [selectedSpread, setSelectedSpread] = useState<Spread>(DEFAULT_SPREAD);
  const [selectedIChingSpread, setSelectedIChingSpread] = useState<IChing_Spread>(DEFAULT_ICHING_SPREAD);
  const [intention, setIntention] = useState('');
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedHexagram, setSelectedHexagram] = useState<'primary' | 'transformed' | null>(null);
  const [selectedCastIndex, setSelectedCastIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Derived: what's been decided
  const hasSystem = system !== null;
  const hasMethod = hasSystem; // method is chosen inline with system
  const isReading = phase === 'reading' && reading !== null;

  // ─── Entropy + reading ─────────────────────────────────────────
  const fetchQuantumEntropy = useCallback(async (bytesNeeded: number) => {
    const response = await fetch(`/api/entropy?count=${bytesNeeded}`);
    if (!response.ok) throw new Error('Entropy source unavailable. Please try again.');
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to fetch entropy');
    return { data: result.data, source: result.source };
  }, []);

  const performReading = useCallback(async () => {
    if (!system) return;
    setLoading(true);
    setError(null);
    setPhase('casting');

    try {
      if (system === 'tarot') {
        const cardCount = selectedSpread.cardCount;
        const bytesNeeded = entropyBytesNeeded(cardCount);
        const entropy = await fetchQuantumEntropy(bytesNeeded);
        const { indices, reversals } = selectCards(entropy.data, cardCount);
        const drawnCards: DrawnCard[] = indices.map((cardIndex, position) => ({
          card: cards[cardIndex], position, reversed: reversals[position],
        }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        setReading({ type: 'tarot', drawnCards, entropySource: entropy.source, intention, timestamp: new Date(), spread: selectedSpread });
      } else {
        const hexagramCount = selectedIChingSpread.id === 'single-hexagram' ? 1 : selectedIChingSpread.id === 'past-future' ? 2 : 3;
        const bytesNeeded = ichingEntropyBytesNeeded(hexagramCount);
        const entropy = await fetchQuantumEntropy(bytesNeeded);
        const { casts } = castHexagrams(entropy.data, hexagramCount);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setReading({ type: 'iching', casts, entropySource: entropy.source, intention, timestamp: new Date(), spread: selectedIChingSpread });
      }
      setPhase('reading');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to perform reading');
      setPhase('choose');
    } finally {
      setLoading(false);
    }
  }, [intention, selectedSpread, selectedIChingSpread, system, fetchQuantumEntropy]);

  // ─── Markdown + clipboard ──────────────────────────────────────
  const buildReadingMarkdown = useCallback(() => {
    if (!reading) return '';
    const lines: string[] = [];
    lines.push(reading.spread.interpretPrompt, '');
    if (reading.intention) lines.push(`**Question:** ${reading.intention}`, '');
    if (reading.type === 'tarot') {
      lines.push(`**Spread:** ${reading.spread.name}`, '', '| Position | Meaning | Card |', '|----------|---------|------|');
      reading.drawnCards.forEach((drawn, i) => {
        const pos = reading.spread.positions[i];
        lines.push(`| ${i + 1} | ${pos.name} / ${pos.description} | ${drawn.reversed ? `${drawn.card.name} (Reversed)` : drawn.card.name} |`);
      });
    } else {
      lines.push(`**Method:** ${reading.spread.name}`, '');
      reading.casts.forEach((cast, ci) => {
        const hex = getHexagramByNumber(cast.hexagramNumber);
        if (!hex) return;
        const label = reading.casts.length === 1 ? '' : reading.casts.length === 2 ? (ci === 0 ? '### Past' : '### Future') : `### Aspect ${ci + 1}`;
        if (label) lines.push(label, '');
        lines.push(`**Primary Hexagram:** ${cast.hexagramNumber}. ${hex.name} (${hex.chinese} ${hex.pinyin})`, '', `*Judgment:* ${hex.judgment}`, '', `*Image:* ${hex.image}`, '');
        const cl = cast.lines.map((l, i) => l.isChanging ? i + 1 : null).filter(Boolean);
        if (cl.length > 0) lines.push(`**Changing Lines:** ${cl.join(', ')}`, '');
        if (cast.transformedHexagramNumber) {
          const t = getHexagramByNumber(cast.transformedHexagramNumber);
          if (t) lines.push(`**Transforms to:** ${t.number}. ${t.name} (${t.chinese} ${t.pinyin})`, '', `*Judgment:* ${t.judgment}`, '');
        }
      });
    }
    return lines.join('\n');
  }, [reading]);

  const copyReading = useCallback(async () => {
    const md = buildReadingMarkdown();
    if (!md) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'HyperTarot Reading', text: md }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [buildReadingMarkdown]);

  const reset = useCallback(() => {
    setPhase('choose');
    setSystem(null);
    setIntention('');
    setReading(null);
    setSelectedCard(null);
    setSelectedHexagram(null);
    setSelectedCastIndex(0);
    setError(null);
    setCopied(false);
    setShowDetails(false);
  }, []);

  // ─── I Ching reading helpers ───────────────────────────────────
  const currentCast = reading?.type === 'iching' ? reading.casts[selectedCastIndex] : null;
  const primaryHex = currentCast ? getHexagramByNumber(currentCast.hexagramNumber) : null;
  const transformedHex = currentCast?.transformedHexagramNumber ? getHexagramByNumber(currentCast.transformedHexagramNumber) : null;
  const changingLines = (currentCast?.lines.map((l, i) => l.isChanging ? i + 1 : null).filter(Boolean) ?? []) as number[];

  // =================================================================
  // RENDER — one continuous surface, layers dissolve in/out
  // =================================================================
  return (
    <main className="min-h-screen flex flex-col items-center p-4 md:p-8 relative">
      <AmbientField intensity={phase === 'reading' ? 0.3 : 0.8} />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-6 pt-12 pb-24">

        {/* ═══════════════════════════════════════════════════════
            TITLE — always present, morphs with context
        ═══════════════════════════════════════════════════════ */}
        <motion.div
          layout
          className="text-center"
          animate={{
            scale: isReading ? 0.7 : hasSystem ? 0.85 : 1,
            opacity: phase === 'casting' ? 0.3 : 1,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className={`font-display font-semibold ${isReading ? 'text-2xl' : hasSystem ? 'text-3xl md:text-4xl' : 'text-5xl md:text-7xl'} ${
            system === 'tarot' ? 'text-gradient-mystic' : 'text-gradient-iching'
          }`}>
            {system === 'tarot' ? 'HyperTarot' : system === 'iching' ? 'HyperOracle' : 'HyperTarot'}
          </h1>
          {!hasSystem && (
            <motion.p
              className="text-text-muted text-xs font-mono tracking-wider mt-2"
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Quantum entropy divination
            </motion.p>
          )}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            CONTEXT TRAIL — shows accumulated choices
        ═══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {hasSystem && phase !== 'casting' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 0.5, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-[10px] font-mono text-text-muted overflow-hidden"
            >
              <span>{system === 'tarot' ? 'Tarot' : 'I Ching'}</span>
              {hasMethod && (
                <>
                  <span className="text-text-muted/30">·</span>
                  <span>{system === 'tarot' ? selectedSpread.name : selectedIChingSpread.name}</span>
                </>
              )}
              {reading?.intention && (
                <>
                  <span className="text-text-muted/30">·</span>
                  <span className="italic truncate max-w-[140px]">&ldquo;{reading.intention}&rdquo;</span>
                </>
              )}
              {reading && (
                <>
                  <span className="text-text-muted/30">·</span>
                  <EntropyIndicator source={reading.entropySource} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════
            LAYER 1: ORACLE CHOICE — dissolves out when chosen
        ═══════════════════════════════════════════════════════ */}
        <Dissolve show={!hasSystem && phase === 'choose'} className="w-full">
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <motion.button
                onClick={() => setSystem('tarot')}
                className="group relative px-10 py-8 rounded-2xl border border-violet-500/20 bg-void-deep/50 hover:border-violet-500/50 transition-all w-56"
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(124, 58, 237, 0.15)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-2xl font-display text-violet-300 group-hover:text-violet-200 transition-colors">Tarot</span>
                <span className="block text-xs text-text-muted mt-2">78 cards drawn by quantum noise</span>
                <div className="mt-4 flex justify-center opacity-40 group-hover:opacity-70 transition-opacity">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-4 h-6 rounded-sm bg-violet-500/30 border border-violet-500/20" />)}
                  </div>
                </div>
              </motion.button>

              <span className="text-text-muted/20 text-xs font-mono">or</span>

              <motion.button
                onClick={() => setSystem('iching')}
                className="group relative px-10 py-8 rounded-2xl border border-accent-dim/20 bg-void-deep/50 hover:border-accent-primary/50 transition-all w-56"
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(201, 165, 74, 0.12)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-2xl font-display text-iching-tertiary group-hover:text-accent-primary transition-colors">I Ching</span>
                <span className="block text-xs text-text-muted mt-2">64 hexagrams cast by quantum noise</span>
                <div className="mt-4 flex justify-center opacity-40 group-hover:opacity-70 transition-opacity">
                  <div className="flex flex-col gap-0.5 items-center">
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} className={`h-[3px] rounded-sm bg-iching-tertiary/40 ${i % 2 === 0 ? 'w-8' : 'w-8 flex gap-1'}`}>
                        {i % 2 !== 0 && <><div className="flex-1 h-full rounded-sm bg-iching-tertiary/40" /><div className="w-1" /><div className="flex-1 h-full rounded-sm bg-iching-tertiary/40" /></>}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.button>
            </div>

            <p className="text-text-muted/30 text-xs max-w-sm text-center leading-relaxed">
              True quantum randomness from vacuum fluctuations, measured by ID Quantique hardware at the LfD.
            </p>
          </div>
        </Dissolve>

        {/* ═══════════════════════════════════════════════════════
            LAYER 2: METHOD — dissolves in when system chosen
        ═══════════════════════════════════════════════════════ */}
        <Dissolve show={hasSystem && !isReading && phase === 'choose'} delay={0.15} className="w-full">
          <div className="flex flex-col items-center gap-6 w-full">
            {system === 'tarot' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mx-auto">
                {SPREADS.map((spread) => (
                  <motion.button
                    key={spread.id}
                    onClick={() => setSelectedSpread(spread)}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      selectedSpread.id === spread.id
                        ? 'border-violet-500/50 bg-violet-500/10 glow-quantum'
                        : 'border-zinc-800/50 bg-void-deep/30 hover:border-violet-500/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-10 flex items-center justify-center">
                      <SpreadDiagram spreadId={spread.id} selected={selectedSpread.id === spread.id} />
                    </div>
                    <span className="text-sm font-display text-text-primary">{spread.name}</span>
                    <span className="text-[10px] text-text-muted">{spread.cardCount} cards</span>
                  </motion.button>
                ))}
              </div>
            ) : system === 'iching' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mx-auto">
                {ICHING_SPREADS.map((spread) => (
                  <motion.button
                    key={spread.id}
                    onClick={() => setSelectedIChingSpread(spread)}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-3 ${
                      selectedIChingSpread.id === spread.id
                        ? 'border-accent-primary/40 bg-accent-primary/5 glow-iching'
                        : 'border-zinc-800/50 bg-void-deep/30 hover:border-accent-dim/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="h-10 flex items-center justify-center text-iching-tertiary">
                      <MiniHexagram />
                      {spread.id === 'past-future' && <><span className="mx-2 text-accent-dim/50">→</span><MiniHexagram /></>}
                      {spread.id === 'three-coins' && <><span className="mx-1 text-accent-dim/50">·</span><MiniHexagram /><span className="mx-1 text-accent-dim/50">·</span><MiniHexagram /></>}
                    </div>
                    <span className="text-sm font-display text-text-primary">{spread.name}</span>
                    <span className="text-[10px] text-text-muted text-center">{spread.description}</span>
                  </motion.button>
                ))}
              </div>
            ) : null}

            {/* ─── INTENTION + CAST ──────────────────────────────── */}
            {hasSystem && (
              <div className="flex flex-col items-center gap-5 w-full max-w-sm">
                <textarea
                  value={intention}
                  onChange={e => setIntention(e.target.value)}
                  placeholder="Your question (optional)"
                  className={`w-full h-20 bg-transparent border-b rounded-none px-2 py-3 text-text-primary text-center font-display text-base placeholder:text-text-muted/25 focus:outline-none resize-none transition-colors ${
                    system === 'tarot' ? 'border-violet-500/15 focus:border-violet-500/50' : 'border-accent-dim/15 focus:border-accent-primary/50'
                  }`}
                />
                <p className="text-text-muted/30 text-[10px]">For your reflection only — never sent anywhere.</p>

                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">{error}</motion.p>}

                <motion.button
                  onClick={performReading}
                  disabled={loading}
                  className={`px-10 py-3.5 rounded-full text-base font-display font-semibold transition-all disabled:opacity-40 ${
                    system === 'tarot'
                      ? 'bg-violet-600/80 hover:bg-violet-500/80 text-white glow-quantum'
                      : 'bg-accent-primary/15 hover:bg-accent-primary/25 text-accent-primary border border-accent-primary/25 glow-iching'
                  }`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {system === 'tarot' ? 'Draw' : 'Cast'}
                </motion.button>

                <button onClick={() => { setSystem(null); setIntention(''); }} className="text-text-muted/40 hover:text-text-muted text-xs font-mono transition-colors">
                  ← change system
                </button>
              </div>
            )}
          </div>
        </Dissolve>

        {/* ═══════════════════════════════════════════════════════
            LAYER 3: CASTING — dissolves in during entropy fetch
        ═══════════════════════════════════════════════════════ */}
        <Dissolve show={phase === 'casting'} className="flex flex-col items-center gap-6 py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className={`w-14 h-14 rounded-full border border-t-transparent ${
              system === 'tarot' ? 'border-violet-500/30' : 'border-accent-primary/30'
            }`}
          />
          <p className="text-sm font-display text-text-primary/40">
            {system === 'tarot' ? 'Drawing...' : 'Casting...'}
          </p>
          <EntropyIndicator source="LfD QRNG" loading />
        </Dissolve>

        {/* ═══════════════════════════════════════════════════════
            LAYER 4: READING — dissolves in with result
        ═══════════════════════════════════════════════════════ */}
        <Dissolve show={isReading} delay={0.1} className="w-full">
          {reading?.type === 'tarot' && (
            <div className="w-full space-y-6">
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
                    className="bg-void-deep/80 backdrop-blur border border-violet-500/15 rounded-xl p-5 max-w-md mx-auto"
                  >
                    <h3 className="text-xl font-display font-semibold text-text-primary mb-1">
                      {reading.drawnCards[selectedCard].card.name}
                      {reading.drawnCards[selectedCard].reversed && <span className="text-violet-400 text-sm ml-2">(Reversed)</span>}
                    </h3>
                    <p className="text-text-muted text-sm">{reading.drawnCards[selectedCard].card.arcana}{reading.drawnCards[selectedCard].card.suit && ` — ${reading.drawnCards[selectedCard].card.suit}`}</p>
                    <p className="text-violet-300/60 text-xs font-mono mt-2">{reading.spread.positions[selectedCard]?.name}</p>
                    <p className="text-text-muted text-xs mt-0.5">{reading.spread.positions[selectedCard]?.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {reading?.type === 'iching' && primaryHex && (
            <div className="flex flex-col items-center w-full">
              {reading.casts.length > 1 && (
                <div className="flex gap-2 mb-4">
                  {reading.casts.map((_, index) => (
                    <button key={index} onClick={() => setSelectedCastIndex(index)}
                      className={`px-4 py-1.5 rounded-full text-xs font-display transition-all ${
                        selectedCastIndex === index ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30' : 'text-text-muted hover:text-text-primary border border-zinc-800/50'
                      }`}>
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
                  return <HexagramDetail hexagram={hex} castLines={selectedHexagram === 'primary' ? currentCast.lines as [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine] : undefined} onClose={() => setSelectedHexagram(null)} />;
                })()}
              </AnimatePresence>
            </div>
          )}
        </Dissolve>

        {/* ═══════════════════════════════════════════════════════
            LAYER 5: DETAILS — dissolves in below reading
        ═══════════════════════════════════════════════════════ */}
        <Dissolve show={isReading && showDetails} delay={0.1} className="w-full max-w-lg">
          {reading?.type === 'tarot' && (
            <div className="space-y-4 w-full">
              {reading.drawnCards.map((drawn, i) => (
                <motion.div key={drawn.card.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 text-left py-2.5 border-b border-zinc-800/30">
                  <span className="text-xs text-text-muted font-mono w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-text-primary font-display">{drawn.card.name}{drawn.reversed ? ' (Reversed)' : ''}</p>
                    <p className="text-xs text-text-muted">{reading.spread.positions[i]?.name} — {reading.spread.positions[i]?.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {reading?.type === 'iching' && primaryHex && currentCast && (
            <div className="space-y-6 w-full">
              <div className="text-center space-y-1">
                <span className="text-3xl text-text-primary/30 font-serif">{primaryHex.chinese}</span>
                <p className="text-base font-display text-text-primary/70">{primaryHex.number}. {primaryHex.name}</p>
                <p className="text-xs text-text-muted italic">{primaryHex.pinyin}</p>
                <p className="text-sm text-iching-tertiary/70 font-display mt-1">{primaryHex.essence}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">The Judgment</p>
                <p className="text-sm text-text-primary/60 font-serif leading-relaxed">{primaryHex.judgment}</p>
              </div>

              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1.5">The Image</p>
                <p className="text-sm text-text-primary/60 font-serif leading-relaxed">{primaryHex.image}</p>
              </div>

              <div className="flex justify-center">
                <TrigramCompass primaryHexagram={primaryHex} transformedHexagram={transformedHex} size={240} />
              </div>

              {changingLines.length > 0 && (
                <div className="text-center">
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mb-1">Changing Lines</p>
                  <p className="text-sm text-iching-tertiary/60 font-mono">{changingLines.join(', ')}</p>
                </div>
              )}

              {transformedHex && (
                <div className="text-center space-y-2 pt-4 border-t border-zinc-800/30">
                  <p className="text-[10px] text-text-muted uppercase tracking-widest">Transforms to</p>
                  <span className="text-2xl text-text-primary/20 font-serif">{transformedHex.chinese}</span>
                  <p className="text-base font-display text-text-primary/60">{transformedHex.number}. {transformedHex.name}</p>
                  <p className="text-sm text-iching-tertiary/50 font-display">{transformedHex.essence}</p>
                  <p className="text-sm text-text-primary/50 font-serif leading-relaxed">{transformedHex.judgment}</p>
                </div>
              )}
            </div>
          )}
        </Dissolve>

        {/* ═══════════════════════════════════════════════════════
            LAYER 6: ACTIONS — dissolves in below reading
        ═══════════════════════════════════════════════════════ */}
        <Dissolve show={isReading} delay={0.3} className="flex flex-col items-center gap-3 w-full max-w-sm pt-4">
          {!showDetails && (
            <motion.button
              onClick={() => setShowDetails(true)}
              className="text-text-muted/50 hover:text-text-muted text-xs font-display transition-colors mb-2"
              whileTap={{ scale: 0.97 }}
            >
              Show details
            </motion.button>
          )}

          <motion.button
            onClick={copyReading}
            className={`w-full px-5 py-3.5 rounded-xl font-display text-sm transition-all ${
              copied ? 'bg-green-600/10 border border-green-500/30 text-green-400' : 'bg-void-deep/50 border border-accent-dim/20 hover:border-accent-primary/40 text-text-primary'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {copied ? 'Copied to clipboard' : 'Copy reading for interpretation'}
          </motion.button>
          <p className="text-text-muted/30 text-[10px] text-center">
            Paste into Claude, ChatGPT, or any AI. Bring your own subscription — that&apos;s how we keep this free.
          </p>

          <motion.button
            onClick={reset}
            className="text-text-muted/40 hover:text-text-muted text-xs font-mono transition-colors mt-2"
            whileTap={{ scale: 0.97 }}
          >
            New reading
          </motion.button>
        </Dissolve>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 pb-2 text-center text-text-muted/30 text-[10px] font-mono z-10 pointer-events-none"
      >
        <div className="pointer-events-auto inline-flex items-center gap-3">
          <a href="https://lfdr.de/QRNG/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-primary/60 transition-colors">Quantum Random Numbers</a>
          <span>·</span>
          <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#D97757]/60 transition-colors">
            <svg className="w-3 h-3" viewBox="0 0 248 248" fill="currentColor"><path d="M52.4285 162.873L98.7844 136.879L99.5485 134.602L98.7844 133.334H96.4921L88.7237 132.862L62.2346 132.153L39.3113 131.207L17.0249 130.026L11.4214 128.844L6.2 121.873L6.7094 118.447L11.4214 115.257L18.171 115.847L33.0711 116.911L55.485 118.447L71.6586 119.392L95.728 121.873H99.5485L100.058 120.337L98.7844 119.392L97.7656 118.447L74.5877 102.732L49.4995 86.1905L36.3823 76.62L29.3779 71.7757L25.8121 67.2858L24.2839 57.3608L30.6515 50.2716L39.3113 50.8623L41.4763 51.4531L50.2636 58.1879L68.9842 72.7209L93.4357 90.6804L97.0015 93.6343L98.4374 92.6652L98.6571 91.9801L97.0015 89.2625L83.757 65.2772L69.621 40.8192L63.2534 30.6579L61.5978 24.632C60.9565 22.1032 60.579 20.0111 60.579 17.4246L67.8381 7.49965L71.9133 6.19995L81.7193 7.49965L85.7946 11.0443L91.9074 24.9865L101.714 46.8451L116.996 76.62L121.453 85.4816L123.873 93.6343L124.764 96.1155H126.292V94.6976L127.566 77.9197L129.858 57.3608L132.15 30.8942L132.915 23.4505L136.608 14.4708L143.994 9.62643L149.725 12.344L154.437 19.0788L153.8 23.4505L150.998 41.6463L145.522 70.1215L141.957 89.2625H143.994L146.414 86.7813L156.093 74.0206L172.266 53.698L179.398 45.6635L187.803 36.802L193.152 32.5484H203.34L210.726 43.6549L207.415 55.1159L196.972 68.3492L188.312 79.5739L175.896 96.2095L168.191 109.585L168.882 110.689L170.738 110.53L198.755 104.504L213.91 101.787L231.994 98.7149L240.144 102.496L241.036 106.395L237.852 114.311L218.495 119.037L195.826 123.645L162.07 131.592L161.696 131.893L162.137 132.547L177.36 133.925L183.855 134.279H199.774L229.447 136.524L237.215 141.605L241.8 147.867L241.036 152.711L229.065 158.737L213.019 154.956L175.45 145.977L162.587 142.787H160.805V143.85L171.502 154.366L191.242 172.089L215.82 195.011L217.094 200.682L213.91 205.172L210.599 204.699L188.949 188.394L180.544 181.069L161.696 165.118H160.422V166.772L164.752 173.152L187.803 207.771L188.949 218.405L187.294 221.832L181.308 223.959L174.813 222.777L161.187 203.754L147.305 182.486L136.098 163.345L134.745 164.2L128.075 235.42L125.019 239.082L117.887 241.8L111.902 237.31L108.718 229.984L111.902 215.452L115.722 196.547L118.779 181.541L121.58 162.873L123.291 156.636L123.14 156.219L121.773 156.449L107.699 175.752L86.304 204.699L69.3663 222.777L65.291 224.431L58.2867 220.768L58.9235 214.27L62.8713 208.48L86.304 178.705L100.44 160.155L109.551 149.507L109.462 147.967L108.959 147.924L46.6977 188.512L35.6182 189.93L30.7788 185.44L31.4156 178.115L33.7079 175.752L52.4285 162.873Z" /></svg>
            Claude Code
          </a>
        </div>
      </motion.footer>
    </main>
  );
}
