'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Hexagram as HexagramData, TRIGRAMS, getHexagramByNumber, Trigram, HexagramMood } from '@/data/iching';
import { CastLine } from '@/lib/entropy/types';
import { useMemo } from 'react';
import { TrigramCompass } from './TrigramCompass';

// Particle/element types for different trigrams
const TRIGRAM_ELEMENTS: Record<string, { particles: string[]; animation: string }> = {
  qian: { particles: ['✦', '✧', '⋆'], animation: 'float-up' },      // Heaven - stars rising
  kun: { particles: ['·', '•', '◦'], animation: 'settle' },          // Earth - dust settling
  zhen: { particles: ['⚡', '↯', '϶'], animation: 'flash' },         // Thunder - lightning
  kan: { particles: ['〰', '≋', '∿'], animation: 'flow' },           // Water - waves
  gen: { particles: ['▲', '△', '◮'], animation: 'still' },          // Mountain - stones
  xun: { particles: ['〜', '∼', '≀'], animation: 'drift' },          // Wind - wisps
  li: { particles: ['🔥', '✺', '❋'], animation: 'flicker' },        // Fire - flames
  dui: { particles: ['○', '◯', '◌'], animation: 'ripple' },         // Lake - ripples
};

// Mood-based styling
const MOOD_STYLES: Record<HexagramMood, { glow: string; intensity: string; pulse: boolean }> = {
  serene: { glow: 'shadow-[0_0_30px_rgba(148,163,184,0.3)]', intensity: 'opacity-60', pulse: false },
  tense: { glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]', intensity: 'opacity-80', pulse: true },
  dynamic: { glow: 'shadow-[0_0_40px_rgba(251,191,36,0.4)]', intensity: 'opacity-90', pulse: true },
  mysterious: { glow: 'shadow-[0_0_35px_rgba(139,92,246,0.3)]', intensity: 'opacity-70', pulse: false },
  joyful: { glow: 'shadow-[0_0_35px_rgba(74,222,128,0.3)]', intensity: 'opacity-85', pulse: false },
  dangerous: { glow: 'shadow-[0_0_40px_rgba(220,38,38,0.4)]', intensity: 'opacity-90', pulse: true },
  powerful: { glow: 'shadow-[0_0_45px_rgba(251,191,36,0.5)]', intensity: 'opacity-95', pulse: true },
  gentle: { glow: 'shadow-[0_0_25px_rgba(148,163,184,0.2)]', intensity: 'opacity-50', pulse: false },
};

// Atmospheric particles component
function AtmosphericParticles({
  upperTrigram,
  lowerTrigram,
  mood
}: {
  upperTrigram: string;
  lowerTrigram: string;
  mood: HexagramMood;
}) {
  const upperElements = TRIGRAM_ELEMENTS[upperTrigram] || TRIGRAM_ELEMENTS.qian;
  const lowerElements = TRIGRAM_ELEMENTS[lowerTrigram] || TRIGRAM_ELEMENTS.kun;

  const particles = useMemo(() => {
    const result = [];
    // Upper particles (fall from top)
    for (let i = 0; i < 8; i++) {
      result.push({
        id: `upper-${i}`,
        char: upperElements.particles[i % upperElements.particles.length],
        x: 10 + Math.random() * 80,
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 3,
        isUpper: true,
      });
    }
    // Lower particles (rise from bottom)
    for (let i = 0; i < 6; i++) {
      result.push({
        id: `lower-${i}`,
        char: lowerElements.particles[i % lowerElements.particles.length],
        x: 10 + Math.random() * 80,
        delay: Math.random() * 3,
        duration: 5 + Math.random() * 3,
        isUpper: false,
      });
    }
    return result;
  }, [upperElements, lowerElements]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-sm opacity-30"
          style={{ left: `${p.x}%` }}
          initial={{
            y: p.isUpper ? '-10%' : '110%',
            opacity: 0
          }}
          animate={{
            y: p.isUpper ? '110%' : '-10%',
            opacity: [0, 0.4, 0.4, 0]
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {p.char}
        </motion.div>
      ))}
    </div>
  );
}

// Scene visualization component
interface HexagramSceneProps {
  hexagram: HexagramData;
  revealed?: boolean;
  delay?: number;
}

function HexagramScene({ hexagram, revealed = true, delay = 0 }: HexagramSceneProps) {
  const { sceneData, mood } = hexagram;
  const moodStyle = MOOD_STYLES[mood];

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden ${moodStyle.glow}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: revealed ? 1 : 0, scale: 1 }}
      transition={{ duration: 0.8, delay }}
    >
      {/* Gradient background based on hexagram colors */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${sceneData.colors[0]}, ${sceneData.colors[1]}, ${sceneData.colors[2]})`,
        }}
      />

      {/* Atmospheric particles */}
      <AtmosphericParticles
        upperTrigram={hexagram.upperTrigram}
        lowerTrigram={hexagram.lowerTrigram}
        mood={mood}
      />

      {/* Scene content */}
      <div className="relative z-10 p-6 space-y-4">
        {/* Scene description */}
        <motion.p
          className="text-sm text-white/90 leading-relaxed font-serif italic"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: revealed ? 1 : 0, y: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
        >
          {sceneData.scene}
        </motion.p>

        {/* Sensory details */}
        <motion.div
          className="space-y-2 pt-2 border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ delay: delay + 0.6, duration: 0.6 }}
        >
          <div className="flex items-start gap-2">
            <span className="text-white/50 text-xs uppercase tracking-wider w-12 shrink-0">Feel</span>
            <span className="text-white/70 text-xs">{sceneData.feel}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-white/50 text-xs uppercase tracking-wider w-12 shrink-0">Hear</span>
            <span className="text-white/70 text-xs">{sceneData.sounds}</span>
          </div>
        </motion.div>

        {/* Mood indicator */}
        <motion.div
          className="flex items-center gap-2 pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ delay: delay + 0.8, duration: 0.4 }}
        >
          <span className="text-white/40 text-[10px] uppercase tracking-wider">Energy</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
            mood === 'dangerous' || mood === 'tense' ? 'bg-red-500/20 text-red-300' :
            mood === 'dynamic' || mood === 'powerful' ? 'bg-amber-500/20 text-amber-300' :
            mood === 'joyful' ? 'bg-green-500/20 text-green-300' :
            mood === 'mysterious' ? 'bg-purple-500/20 text-purple-300' :
            'bg-zinc-500/20 text-zinc-300'
          }`}>
            {mood}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface HexagramLineProps {
  isYang: boolean;
  isChanging?: boolean;
  delay?: number;
  animate?: boolean;
  lineNumber: number;
  showLabels?: boolean;
}

function HexagramLine({
  isYang,
  isChanging = false,
  delay = 0,
  animate = true,
  lineNumber,
  showLabels = true,
}: HexagramLineProps) {
  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { scaleX: 1, opacity: 1 },
  };

  const lineTypeName = isYang ? 'Yang' : 'Yin';

  const LineContent = () => (
    <div className="flex items-center w-full gap-2">
      {showLabels && (
        <div className="w-4 text-[10px] text-zinc-600 font-mono text-right shrink-0">
          {lineNumber}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 flex-1 relative">
        {isYang ? (
          <div className={`h-3 flex-1 rounded-sm transition-all duration-500 ${
            isChanging
              ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
              : 'bg-zinc-200'
          }`} />
        ) : (
          <>
            <div className={`h-3 flex-1 rounded-sm transition-all duration-500 ${
              isChanging
                ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                : 'bg-zinc-400'
            }`} />
            <div className="w-4" />
            <div className={`h-3 flex-1 rounded-sm transition-all duration-500 ${
              isChanging
                ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                : 'bg-zinc-400'
            }`} />
          </>
        )}
      </div>

      {showLabels && (
        <div className="w-20 shrink-0">
          {isChanging ? (
            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3, duration: 0.3 }}
            >
              <motion.span
                className="text-amber-400 text-xs"
                animate={{ opacity: [0.6, 1, 0.6], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⟳
              </motion.span>
              <span className="text-[10px] text-amber-400/90 font-medium">
                shifting
              </span>
            </motion.div>
          ) : (
            <span className="text-[10px] text-zinc-600">
              {lineTypeName}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!animate) {
    return (
      <div className="relative flex items-center h-5">
        <LineContent />
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex items-center h-5"
      variants={lineVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <LineContent />
    </motion.div>
  );
}

interface TrigramDisplayProps {
  trigram: Trigram;
  position: 'upper' | 'lower';
  delay?: number;
}

function TrigramDisplay({ trigram, position, delay = 0 }: TrigramDisplayProps) {
  return (
    <motion.div
      className="flex items-center gap-2 px-2 py-1"
      initial={{ opacity: 0, y: position === 'upper' ? -10 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <span className="text-xl text-amber-400 font-mono">{trigram.symbol}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-300 text-xs">{trigram.chinese}</span>
          <span className="text-zinc-500 text-xs">{trigram.image}</span>
        </div>
        <span className="text-[10px] text-zinc-600 italic">{trigram.nature}</span>
      </div>
      <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400/80 uppercase tracking-wider">
        {trigram.attribute}
      </span>
    </motion.div>
  );
}

interface HexagramProps {
  hexagram: HexagramData;
  castLines?: [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine];
  revealed?: boolean;
  delay?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showTrigrams?: boolean;
  showEssence?: boolean;
  label?: string;
}

const sizeClasses = {
  sm: 'w-32',
  md: 'w-44',
  lg: 'w-56',
};

const lineDelays = {
  sm: 0.08,
  md: 0.1,
  lg: 0.12,
};

export function Hexagram({
  hexagram,
  castLines,
  revealed = true,
  delay = 0,
  onClick,
  size = 'md',
  showTrigrams = false,
  showEssence = true,
  label,
}: HexagramProps) {
  const upperTrigram = TRIGRAMS[hexagram.upperTrigram];
  const lowerTrigram = TRIGRAMS[hexagram.lowerTrigram];
  const showLabels = size !== 'sm';

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: revealed ? 1 : 0.3, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      {label && (
        <div className="text-center text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
          {label}
        </div>
      )}

      <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-4 backdrop-blur-sm">
        {showTrigrams && upperTrigram && (
          <div className="mb-2 border-b border-zinc-800 pb-2">
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Upper · Outer</div>
            <TrigramDisplay trigram={upperTrigram} position="upper" delay={delay + 0.2} />
          </div>
        )}

        <div className="flex flex-col gap-1 py-2">
          {[5, 4, 3, 2, 1, 0].map((lineIndex, visualIndex) => {
            const castLine = castLines?.[lineIndex];
            const isYang = castLine ? castLine.isYang : hexagram.lines[lineIndex] === 'yang';
            const isChanging = castLine?.isChanging ?? false;

            return (
              <HexagramLine
                key={lineIndex}
                isYang={isYang}
                isChanging={isChanging}
                delay={revealed ? delay + visualIndex * lineDelays[size] : 0}
                animate={revealed}
                lineNumber={lineIndex + 1}
                showLabels={showLabels}
              />
            );
          })}
        </div>

        {showTrigrams && lowerTrigram && (
          <div className="mt-2 border-t border-zinc-800 pt-2">
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Lower · Inner</div>
            <TrigramDisplay trigram={lowerTrigram} position="lower" delay={delay + 0.8} />
          </div>
        )}

        <div className="mt-3 text-center border-t border-zinc-800 pt-3">
          <div className="text-3xl text-zinc-300 font-serif">{hexagram.chinese}</div>
          <div className="text-sm text-zinc-300 mt-1 font-medium">
            {hexagram.number}. {hexagram.name}
          </div>
          <div className="text-xs text-zinc-500 italic">{hexagram.pinyin}</div>

          {showEssence && hexagram.essence && (
            <motion.div
              className="mt-2 text-xs text-amber-400/90 font-medium px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 1, duration: 0.5 }}
            >
              {hexagram.essence}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface HexagramReadingDisplayProps {
  primaryHexagram: HexagramData;
  transformedHexagram?: HexagramData | null;
  castLines: [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine];
  revealed?: boolean;
  delay?: number;
  onHexagramClick?: (type: 'primary' | 'transformed') => void;
}

export function HexagramReadingDisplay({
  primaryHexagram,
  transformedHexagram,
  castLines,
  revealed = true,
  delay = 0,
  onHexagramClick,
}: HexagramReadingDisplayProps) {
  const hasTransformation = transformedHexagram != null;
  const changingLineNumbers = castLines
    .map((line, i) => (line.isChanging ? i + 1 : null))
    .filter(Boolean) as number[];

  const colors = primaryHexagram.sceneData.colors;

  return (
    <div className="relative flex flex-col items-center w-full min-h-[70vh]">
      {/* Full-bleed atmospheric background — mood gradient radiating from center */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${colors[1]}18, ${colors[0]}0a, transparent 70%)`,
          }}
        />
        <AtmosphericParticles
          upperTrigram={primaryHexagram.upperTrigram}
          lowerTrigram={primaryHexagram.lowerTrigram}
          mood={primaryHexagram.mood}
        />
      </div>

      {/* Content — floating in atmosphere, no containers */}
      <div className="relative z-10 flex flex-col items-center gap-6 py-8 w-full max-w-lg mx-auto">

        {/* The compass — hero element, clickable for primary detail */}
        <motion.div
          className="cursor-pointer"
          onClick={() => onHexagramClick?.('primary')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <TrigramCompass
            primaryHexagram={primaryHexagram}
            transformedHexagram={transformedHexagram}
            revealed={revealed}
            delay={delay}
          />
        </motion.div>

        {/* Essence — floating text */}
        <motion.div
          className="text-center px-6 max-w-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: revealed ? 1 : 0, y: 0 }}
          transition={{ delay: delay + 2.5, duration: 0.7 }}
        >
          <p className="text-sm text-zinc-300/90 font-serif italic leading-relaxed">
            {primaryHexagram.essence}
          </p>
        </motion.div>

        {/* Transformation line */}
        {hasTransformation && transformedHexagram && (
          <motion.div
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => onHexagramClick?.('transformed')}
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{ delay: delay + 3.0, duration: 0.6 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2">
              {/* Animated transition dots */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-zinc-500"
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-500 font-serif italic">
              becoming: {transformedHexagram.essence}
            </p>
          </motion.div>
        )}

        {/* Status — minimal, almost invisible */}
        <motion.p
          className="text-[10px] text-zinc-600 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 0.5 : 0 }}
          transition={{ delay: delay + 3.5, duration: 0.5 }}
        >
          {hasTransformation
            ? `${changingLineNumbers.length} line${changingLineNumbers.length > 1 ? 's' : ''} shifting`
            : 'all lines stable'}
          {' \u00b7 tap for text'}
        </motion.p>
      </div>
    </div>
  );
}

// Mini hexagram for spread picker
interface MiniHexagramProps {
  className?: string;
}

export function MiniHexagram({ className = '' }: MiniHexagramProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-1 w-6 bg-current rounded-sm" />
      ))}
    </div>
  );
}

// Hexagram detail modal
interface HexagramDetailProps {
  hexagram: HexagramData;
  castLines?: [CastLine, CastLine, CastLine, CastLine, CastLine, CastLine];
  onClose: () => void;
}

export function HexagramDetail({ hexagram, castLines, onClose }: HexagramDetailProps) {
  const upperTrigram = TRIGRAMS[hexagram.upperTrigram];
  const lowerTrigram = TRIGRAMS[hexagram.lowerTrigram];
  const changingLineNumbers = castLines
    ?.map((line, i) => (line.isChanging ? i + 1 : null))
    .filter(Boolean) ?? [];

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-4xl text-zinc-200">{hexagram.chinese}</div>
            <div className="text-xl text-zinc-300 font-serif mt-1">
              {hexagram.number}. {hexagram.name}
            </div>
            <div className="text-sm text-zinc-500 italic">{hexagram.pinyin}</div>
            <div className="text-sm text-amber-400 mt-2 font-medium">
              {hexagram.essence}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-2xl leading-none p-2"
          >
            ×
          </button>
        </div>

        {/* Scene */}
        <div
          className="rounded-lg p-4 mb-4 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${hexagram.sceneData.colors[0]}, ${hexagram.sceneData.colors[1]})`,
          }}
        >
          <p className="text-white/90 text-sm font-serif italic leading-relaxed">
            {hexagram.sceneData.scene}
          </p>
          <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
            <p className="text-white/60 text-xs"><span className="text-white/40">Feel:</span> {hexagram.sceneData.feel}</p>
            <p className="text-white/60 text-xs"><span className="text-white/40">Hear:</span> {hexagram.sceneData.sounds}</p>
          </div>
        </div>

        {/* Trigram Dynamics */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Trigram Dynamics</div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl text-amber-400 font-mono">{upperTrigram.symbol}</div>
              <div className="text-sm text-zinc-300">{upperTrigram.chinese} {upperTrigram.image}</div>
              <div className="text-xs text-amber-400/70">{upperTrigram.attribute}</div>
              <div className="text-[10px] text-zinc-600 mt-1">outer · above</div>
            </div>
            <div className="text-zinc-600 text-lg">over</div>
            <div className="text-center">
              <div className="text-2xl text-amber-400 font-mono">{lowerTrigram.symbol}</div>
              <div className="text-sm text-zinc-300">{lowerTrigram.chinese} {lowerTrigram.image}</div>
              <div className="text-xs text-amber-400/70">{lowerTrigram.attribute}</div>
              <div className="text-[10px] text-zinc-600 mt-1">inner · below</div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center mt-3 italic">
            {upperTrigram.image} over {lowerTrigram.image} — {upperTrigram.nature} meeting {lowerTrigram.nature}
          </p>
        </div>

        {/* Judgment */}
        <div className="mb-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">The Judgment</div>
          <div className="text-zinc-300 leading-relaxed">{hexagram.judgment}</div>
        </div>

        {/* Image */}
        <div className="mb-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">The Image</div>
          <div className="text-zinc-300 leading-relaxed">{hexagram.image}</div>
        </div>

        {/* Changing Lines */}
        {changingLineNumbers.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="text-amber-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                ⟳
              </motion.span>
              Moving Lines: {changingLineNumbers.join(', ')}
            </div>
            <div className="text-zinc-300 text-sm">
              These lines are shifting — the pivot points where your situation transforms.
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
