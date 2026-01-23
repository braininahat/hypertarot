'use client';

import { motion } from 'framer-motion';
import { Hexagram as HexagramData, TRIGRAMS, getHexagramByNumber } from '@/data/iching';
import { CastLine } from '@/lib/entropy/types';

interface HexagramLineProps {
  isYang: boolean;
  isChanging?: boolean;
  delay?: number;
  animate?: boolean;
}

function HexagramLine({ isYang, isChanging = false, delay = 0, animate = true }: HexagramLineProps) {
  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { scaleX: 1, opacity: 1 },
  };

  const LineContent = () => (
    <div className="flex items-center justify-center gap-2 w-full">
      {isYang ? (
        // Solid line (Yang)
        <div className="h-3 bg-current flex-1 rounded-sm" />
      ) : (
        // Broken line (Yin)
        <>
          <div className="h-3 bg-current flex-1 rounded-sm" />
          <div className="w-4" /> {/* Gap */}
          <div className="h-3 bg-current flex-1 rounded-sm" />
        </>
      )}
      {/* Changing line indicator */}
      {isChanging && (
        <div className="absolute -right-6 text-amber-500 text-sm font-bold">
          {isYang ? '○' : '×'}
        </div>
      )}
    </div>
  );

  if (!animate) {
    return (
      <div className="relative flex items-center h-5 text-zinc-100">
        <LineContent />
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex items-center h-5 text-zinc-100"
      variants={lineVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <LineContent />
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
  label?: string;
}

const sizeClasses = {
  sm: 'w-24',
  md: 'w-32',
  lg: 'w-40',
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
  label,
}: HexagramProps) {
  const upperTrigram = TRIGRAMS[hexagram.upperTrigram];
  const lowerTrigram = TRIGRAMS[hexagram.lowerTrigram];

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
        {/* Upper trigram label */}
        {showTrigrams && upperTrigram && (
          <div className="text-center text-xs text-zinc-500 mb-1">
            {upperTrigram.chinese} {upperTrigram.image}
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
              />
            );
          })}
        </div>

        {/* Lower trigram label */}
        {showTrigrams && lowerTrigram && (
          <div className="text-center text-xs text-zinc-500 mt-1">
            {lowerTrigram.chinese} {lowerTrigram.image}
          </div>
        )}

        {/* Hexagram info */}
        <div className="mt-3 text-center">
          <div className="text-2xl text-zinc-300 font-serif">{hexagram.chinese}</div>
          <div className="text-sm text-zinc-400 mt-1">
            {hexagram.number}. {hexagram.name}
          </div>
          <div className="text-xs text-zinc-500 italic">{hexagram.pinyin}</div>
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

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={`flex items-center justify-center gap-8 ${hasTransformation ? '' : ''}`}>
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
            label="Present"
          />
        </div>

        {/* Transformation Arrow */}
        {hasTransformation && (
          <motion.div
            className="flex flex-col items-center text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: revealed ? 1 : 0 }}
            transition={{ duration: 0.5, delay: delay + 0.8 }}
          >
            <div className="text-xs uppercase tracking-wider mb-1">transforms</div>
            <div className="text-2xl">→</div>
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
              label="Becoming"
            />
          </div>
        )}
      </div>

      {/* Changing lines indicator */}
      {hasTransformation && (
        <motion.div
          className="text-sm text-amber-500/80 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.5, delay: delay + 1.5 }}
        >
          Changing lines: {castLines
            .map((line, i) => (line.isChanging ? i + 1 : null))
            .filter(Boolean)
            .join(', ')}
        </motion.div>
      )}
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
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Trigrams */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex-1 bg-zinc-800/50 rounded p-3">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Upper</div>
            <div className="text-zinc-300">
              {upperTrigram.chinese} {upperTrigram.name} ({upperTrigram.image})
            </div>
          </div>
          <div className="flex-1 bg-zinc-800/50 rounded p-3">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Lower</div>
            <div className="text-zinc-300">
              {lowerTrigram.chinese} {lowerTrigram.name} ({lowerTrigram.image})
            </div>
          </div>
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
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
            <div className="text-amber-500 text-xs uppercase tracking-wider mb-2">
              Changing Lines
            </div>
            <div className="text-zinc-300 text-sm">
              Lines {changingLineNumbers.join(', ')} are in motion, indicating where change is active
              in your situation.
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
