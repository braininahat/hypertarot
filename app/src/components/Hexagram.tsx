'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Hexagram as HexagramData, TRIGRAMS, getHexagramByNumber, Trigram } from '@/data/iching';
import { CastLine } from '@/lib/entropy/types';

interface HexagramLineProps {
  isYang: boolean;
  isChanging?: boolean;
  delay?: number;
  animate?: boolean;
  lineNumber: number; // 1-6, bottom to top
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

  // Determine line type name for AR overlay
  const lineTypeName = isYang ? 'Yang' : 'Yin';
  const lineDescription = isYang ? 'solid, active' : 'broken, receptive';

  const LineContent = () => (
    <div className="flex items-center w-full gap-2">
      {/* Line position number */}
      {showLabels && (
        <div className="w-4 text-[10px] text-zinc-600 font-mono text-right shrink-0">
          {lineNumber}
        </div>
      )}

      {/* The actual line */}
      <div className="flex items-center justify-center gap-2 flex-1 relative">
        {isYang ? (
          // Solid line (Yang) - warmer color
          <div className={`h-3 flex-1 rounded-sm transition-colors ${
            isChanging
              ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
              : 'bg-zinc-200'
          }`} />
        ) : (
          // Broken line (Yin) - cooler color
          <>
            <div className={`h-3 flex-1 rounded-sm transition-colors ${
              isChanging
                ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                : 'bg-zinc-400'
            }`} />
            <div className="w-4" /> {/* Gap */}
            <div className={`h-3 flex-1 rounded-sm transition-colors ${
              isChanging
                ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                : 'bg-zinc-400'
            }`} />
          </>
        )}
      </div>

      {/* Changing line indicator - AR style */}
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
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⟳
              </motion.span>
              <span className="text-[10px] text-amber-400/90 font-medium">
                moving
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

// Trigram display component with AR overlay
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
      {/* Trigram symbol */}
      <span className="text-lg text-amber-400 font-mono">{trigram.symbol}</span>

      {/* Info */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-300 text-xs">{trigram.chinese}</span>
          <span className="text-zinc-500 text-xs">{trigram.image}</span>
        </div>
        <span className="text-[10px] text-zinc-600 italic">{trigram.nature}</span>
      </div>

      {/* Attribute badge */}
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
      {/* Label (position name) */}
      {label && (
        <div className="text-center text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
          {label}
        </div>
      )}

      {/* Hexagram container */}
      <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-lg p-4 backdrop-blur-sm">
        {/* Upper trigram display */}
        {showTrigrams && upperTrigram && (
          <div className="mb-2 border-b border-zinc-800 pb-2">
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Upper · Outer</div>
            <TrigramDisplay trigram={upperTrigram} position="upper" delay={delay + 0.2} />
          </div>
        )}

        {/* The 6 lines - rendered top to bottom (line 6 at top, line 1 at bottom) */}
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

        {/* Lower trigram display */}
        {showTrigrams && lowerTrigram && (
          <div className="mt-2 border-t border-zinc-800 pt-2">
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">Lower · Inner</div>
            <TrigramDisplay trigram={lowerTrigram} position="lower" delay={delay + 0.8} />
          </div>
        )}

        {/* Hexagram info */}
        <div className="mt-3 text-center border-t border-zinc-800 pt-3">
          <div className="text-3xl text-zinc-300 font-serif">{hexagram.chinese}</div>
          <div className="text-sm text-zinc-300 mt-1 font-medium">
            {hexagram.number}. {hexagram.name}
          </div>
          <div className="text-xs text-zinc-500 italic">{hexagram.pinyin}</div>

          {/* Essence - the key insight */}
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
  const hasTransformation = transformedHexagram !== null && transformedHexagram !== undefined;
  const changingLineNumbers = castLines
    .map((line, i) => (line.isChanging ? i + 1 : null))
    .filter(Boolean) as number[];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Reading explanation header */}
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: revealed ? 1 : 0, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >
        <p className="text-xs text-zinc-500">
          {hasTransformation
            ? `Your reading has ${changingLineNumbers.length} moving line${changingLineNumbers.length > 1 ? 's' : ''}, showing a situation in flux`
            : 'All lines are stable — the situation is settled'}
        </p>
      </motion.div>

      <div className={`flex items-start justify-center gap-4 md:gap-8 flex-wrap`}>
        {/* Primary Hexagram */}
        <div className="flex flex-col items-center">
          <Hexagram
            hexagram={primaryHexagram}
            castLines={castLines}
            revealed={revealed}
            delay={delay}
            onClick={() => onHexagramClick?.('primary')}
            size="lg"
            showTrigrams
            showEssence
            label={hasTransformation ? "The Present" : "Your Reading"}
          />
        </div>

        {/* Transformation Arrow & Explanation */}
        {hasTransformation && (
          <motion.div
            className="flex flex-col items-center justify-center py-8 gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{ duration: 0.5, delay: delay + 0.8 }}
          >
            {/* Flow indicator */}
            <div className="flex items-center gap-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-500/60"
                animate={{ x: [0, 8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-500/60"
                animate={{ x: [0, 8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-500/60"
                animate={{ x: [0, 8, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
              <span className="text-xl text-zinc-600 mx-1">→</span>
            </div>

            <div className="text-[10px] text-zinc-500 text-center uppercase tracking-wider">
              transforms<br/>into
            </div>
          </motion.div>
        )}

        {/* Transformed Hexagram */}
        {hasTransformation && transformedHexagram && (
          <div className="flex flex-col items-center">
            <Hexagram
              hexagram={transformedHexagram}
              revealed={revealed}
              delay={delay + 1}
              onClick={() => onHexagramClick?.('transformed')}
              size="lg"
              showTrigrams
              showEssence
              label="Becoming"
            />
          </div>
        )}
      </div>

      {/* Moving Lines Explanation Card */}
      {hasTransformation && (
        <motion.div
          className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 max-w-lg text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: revealed ? 1 : 0, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 1.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.span
              className="text-amber-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              ⟳
            </motion.span>
            <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">
              Moving Lines: {changingLineNumbers.join(', ')}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            These are the active points of your reading — where energy is shifting from one state to another.
            The moving lines show <span className="text-amber-400/80">where</span> and <span className="text-amber-400/80">how</span> transformation is occurring.
          </p>
        </motion.div>
      )}

      {/* At a Glance Summary */}
      <motion.div
        className="bg-zinc-900/60 border border-zinc-700/50 rounded-lg p-4 max-w-xl w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.5, delay: delay + 1.8 }}
      >
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-amber-400">◈</span> At a Glance
        </div>

        <div className="space-y-3">
          {/* Primary hexagram summary */}
          <div>
            <div className="text-xs text-zinc-400 mb-1">
              <span className="text-zinc-300 font-medium">{primaryHexagram.name}</span>
              {' '}&mdash;{' '}
              <span className="text-amber-400/80">{primaryHexagram.essence}</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {primaryHexagram.judgment.split('.')[0]}.
            </p>
          </div>

          {/* Transformation summary */}
          {hasTransformation && transformedHexagram && (
            <div className="border-t border-zinc-800 pt-3">
              <div className="text-xs text-zinc-400 mb-1">
                <span className="text-zinc-500">→</span>{' '}
                <span className="text-zinc-300 font-medium">{transformedHexagram.name}</span>
                {' '}&mdash;{' '}
                <span className="text-amber-400/80">{transformedHexagram.essence}</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {transformedHexagram.judgment.split('.')[0]}.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 text-center">
          <span className="text-[10px] text-zinc-600">
            Tap hexagram for full interpretation
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Mini hexagram for spread picker
interface MiniHexagramProps {
  className?: string;
}

export function MiniHexagram({ className = '' }: MiniHexagramProps) {
  // Show hexagram 1 (The Creative - all yang lines) as example
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-1 w-6 bg-current rounded-sm" />
      ))}
    </div>
  );
}

// Hexagram detail panel for when user clicks on a hexagram
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
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
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
            {/* Essence */}
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

        {/* Trigram Relationship */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Trigram Dynamics</div>
          <div className="flex items-center justify-center gap-4">
            {/* Upper */}
            <div className="text-center">
              <div className="text-2xl text-amber-400 font-mono">{upperTrigram.symbol}</div>
              <div className="text-sm text-zinc-300">{upperTrigram.chinese} {upperTrigram.image}</div>
              <div className="text-xs text-amber-400/70">{upperTrigram.attribute}</div>
              <div className="text-[10px] text-zinc-600 mt-1">outer · above</div>
            </div>

            <div className="text-zinc-600 text-lg">over</div>

            {/* Lower */}
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
              These lines are in motion, shifting from one state to another. They represent
              the active points where transformation is occurring in your situation.
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
