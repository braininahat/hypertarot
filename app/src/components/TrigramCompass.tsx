'use client';

import { motion } from 'framer-motion';
import { Hexagram as HexagramData, TRIGRAMS, HexagramMood } from '@/data/iching';
import { useMemo } from 'react';

// Fu Xi (Earlier Heaven) arrangement - complementary pairs exactly opposite
// Clockwise from top: Heaven, Lake, Fire, Thunder, Earth, Mountain, Water, Wind
const FU_XI_ORDER = ['qian', 'dui', 'li', 'zhen', 'kun', 'gen', 'kan', 'xun'] as const;

function trigramAngle(key: string): number {
  const index = FU_XI_ORDER.indexOf(key as (typeof FU_XI_ORDER)[number]);
  if (index === -1) return 0;
  return -Math.PI / 2 + (index * 2 * Math.PI) / 8;
}

const AXES = [
  { from: 'qian', to: 'kun', label: 'FORCE' },
  { from: 'li', to: 'kan', label: 'AWARENESS' },
  { from: 'dui', to: 'gen', label: 'EXCHANGE' },
  { from: 'zhen', to: 'xun', label: 'MOTION' },
];

const MOOD_COLORS: Record<HexagramMood, string> = {
  serene: '#94a3b8',
  tense: '#ef4444',
  dynamic: '#fbbf24',
  mysterious: '#a78bfa',
  joyful: '#4ade80',
  dangerous: '#dc2626',
  powerful: '#f59e0b',
  gentle: '#a5b4fc',
};

const MOOD_GLOW: Record<HexagramMood, string> = {
  serene: 'rgba(148,163,184,0.4)',
  tense: 'rgba(239,68,68,0.4)',
  dynamic: 'rgba(251,191,36,0.4)',
  mysterious: 'rgba(167,139,250,0.4)',
  joyful: 'rgba(74,222,128,0.4)',
  dangerous: 'rgba(220,38,38,0.4)',
  powerful: 'rgba(245,158,11,0.4)',
  gentle: 'rgba(165,180,252,0.4)',
};

interface TrigramCompassProps {
  primaryHexagram: HexagramData;
  transformedHexagram?: HexagramData | null;
  revealed?: boolean;
  delay?: number;
  size?: number;
}

export function TrigramCompass({
  primaryHexagram,
  transformedHexagram,
  revealed = true,
  delay = 0,
  size = 360,
}: TrigramCompassProps) {
  const cx = 200;
  const cy = 200;
  const radius = 140;
  const nodeR = 26;

  const hasTransformation = transformedHexagram != null;

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number; angle: number }> = {};
    for (const key of FU_XI_ORDER) {
      const angle = trigramAngle(key);
      pos[key] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle,
      };
    }
    return pos;
  }, []);

  // Primary chord endpoints
  const pInner = positions[primaryHexagram.lowerTrigram];
  const pOuter = positions[primaryHexagram.upperTrigram];
  const isDoubled = primaryHexagram.lowerTrigram === primaryHexagram.upperTrigram;

  // Transformed chord endpoints
  const tInner = transformedHexagram ? positions[transformedHexagram.lowerTrigram] : null;
  const tOuter = transformedHexagram ? positions[transformedHexagram.upperTrigram] : null;
  const isTransformedDoubled = transformedHexagram
    ? transformedHexagram.lowerTrigram === transformedHexagram.upperTrigram
    : false;

  const chordColor = MOOD_COLORS[primaryHexagram.mood];
  const chordGlow = MOOD_GLOW[primaryHexagram.mood];
  const tChordColor = transformedHexagram ? MOOD_COLORS[transformedHexagram.mood] : chordColor;

  // Chord length as fraction of diameter for tension readout
  const chordLength = isDoubled
    ? 0
    : Math.sqrt((pOuter.x - pInner.x) ** 2 + (pOuter.y - pInner.y) ** 2) / (2 * radius);

  const tensionLabel =
    chordLength === 0
      ? 'pure resonance'
      : chordLength > 0.85
        ? 'maximum tension'
        : chordLength > 0.6
          ? 'high tension'
          : chordLength > 0.35
            ? 'moderate tension'
            : 'low tension';

  // For migration: effective endpoints (doubled collapses to single point)
  const fromInner = pInner;
  const fromOuter = isDoubled ? pInner : pOuter;
  const toInner = tInner ?? pInner;
  const toOuter = tOuter
    ? isTransformedDoubled ? tInner! : tOuter
    : isDoubled ? pInner : pOuter;

  // Migration timing
  const migrateDuration = 5;
  const migrateDelay = delay + 2.5;
  const migrateTransition = {
    duration: migrateDuration,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const,
    delay: migrateDelay,
  };

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <svg
        viewBox="0 0 400 400"
        width={size}
        height={size}
        className="overflow-visible"
      >
        <defs>
          <filter id="chord-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Inner reference circle */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius * 0.5}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={0.5}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: delay + 0.1, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Axis lines */}
        {AXES.map((axis, i) => {
          const from = positions[axis.from];
          const to = positions[axis.to];
          const axisAngle = Math.atan2(to.y - from.y, to.x - from.x);
          const perpAngle = axisAngle + Math.PI / 2;
          const labelDist = 14 + i * 2;
          const labelX = cx + labelDist * Math.cos(perpAngle);
          const labelY = cy + labelDist * Math.sin(perpAngle);

          return (
            <g key={axis.label}>
              <motion.line
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.75}
                strokeDasharray="3 6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: delay + 0.3 + i * 0.08 }}
              />
              <motion.text
                x={labelX} y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.12)"
                fontSize={7}
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.12em"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: delay + 0.6 + i * 0.08 }}
              >
                {axis.label}
              </motion.text>
            </g>
          );
        })}

        {/* === THE CHORD === */}
        {hasTransformation ? (
          /* MIGRATING CHORD — one living chord that oscillates between states */
          <g>
            {/* Glow layer */}
            <motion.line
              x1={fromInner.x} y1={fromInner.y}
              x2={fromOuter.x} y2={fromOuter.y}
              stroke={chordGlow}
              strokeWidth={6}
              strokeLinecap="round"
              filter="url(#chord-glow)"
              initial={{ opacity: 0 }}
              animate={{
                x1: [fromInner.x, toInner.x],
                y1: [fromInner.y, toInner.y],
                x2: [fromOuter.x, toOuter.x],
                y2: [fromOuter.y, toOuter.y],
                opacity: 0.4,
              }}
              transition={{
                x1: migrateTransition,
                y1: migrateTransition,
                x2: migrateTransition,
                y2: migrateTransition,
                opacity: { duration: 0.8, delay: delay + 0.9 },
              }}
            />
            {/* Solid chord */}
            <motion.line
              x1={fromInner.x} y1={fromInner.y}
              x2={fromOuter.x} y2={fromOuter.y}
              stroke={chordColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{
                x1: [fromInner.x, toInner.x],
                y1: [fromInner.y, toInner.y],
                x2: [fromOuter.x, toOuter.x],
                y2: [fromOuter.y, toOuter.y],
                opacity: 1,
              }}
              transition={{
                x1: migrateTransition,
                y1: migrateTransition,
                x2: migrateTransition,
                y2: migrateTransition,
                opacity: { duration: 0.6, delay: delay + 0.9 },
              }}
            />
            {/* Inner endpoint (filled dot) */}
            <motion.circle
              cx={fromInner.x} cy={fromInner.y}
              r={5}
              fill={chordColor}
              initial={{ opacity: 0 }}
              animate={{
                cx: [fromInner.x, toInner.x],
                cy: [fromInner.y, toInner.y],
                opacity: 1,
              }}
              transition={{
                cx: migrateTransition,
                cy: migrateTransition,
                opacity: { duration: 0.3, delay: delay + 1.5 },
              }}
            />
            {/* Outer endpoint (ring) */}
            <motion.circle
              cx={fromOuter.x} cy={fromOuter.y}
              r={5}
              fill="none"
              stroke={chordColor}
              strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{
                cx: [fromOuter.x, toOuter.x],
                cy: [fromOuter.y, toOuter.y],
                opacity: 1,
              }}
              transition={{
                cx: migrateTransition,
                cy: migrateTransition,
                opacity: { duration: 0.3, delay: delay + 1.6 },
              }}
            />
            {/* Ghost trace: starting position (faint) */}
            <motion.line
              x1={fromInner.x} y1={fromInner.y}
              x2={fromOuter.x} y2={fromOuter.y}
              stroke={chordColor}
              strokeWidth={0.75}
              strokeLinecap="round"
              strokeDasharray="2 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 0.8, delay: delay + 2.5 }}
            />
            {/* Ghost trace: destination (faint) */}
            <motion.line
              x1={toInner.x} y1={toInner.y}
              x2={toOuter.x} y2={toOuter.y}
              stroke={tChordColor}
              strokeWidth={0.75}
              strokeLinecap="round"
              strokeDasharray="2 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.12 }}
              transition={{ duration: 0.8, delay: delay + 2.8 }}
            />
          </g>
        ) : isDoubled ? (
          /* DOUBLED — pulsing dot at the shared position */
          <motion.circle
            cx={pInner.x} cy={pInner.y}
            r={8}
            fill={chordColor}
            filter="url(#chord-glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 1.0 },
              opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 1.0 },
            }}
            style={{ transformOrigin: `${pInner.x}px ${pInner.y}px` }}
          />
        ) : (
          /* STATIC CHORD — draw-in animation, no transformation */
          <g>
            <motion.path
              d={`M ${pInner.x} ${pInner.y} L ${pOuter.x} ${pOuter.y}`}
              fill="none"
              stroke={chordGlow}
              strokeWidth={6}
              strokeLinecap="round"
              filter="url(#chord-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 }}
              transition={{ duration: 0.9, delay: delay + 0.9, ease: 'easeOut' }}
            />
            <motion.path
              d={`M ${pInner.x} ${pInner.y} L ${pOuter.x} ${pOuter.y}`}
              fill="none"
              stroke={chordColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: delay + 0.9, ease: 'easeOut' }}
            />
            <motion.circle
              cx={pInner.x} cy={pInner.y}
              r={5}
              fill={chordColor}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 1.5, type: 'spring' }}
              style={{ transformOrigin: `${pInner.x}px ${pInner.y}px` }}
            />
            <motion.circle
              cx={pOuter.x} cy={pOuter.y}
              r={5}
              fill="none"
              stroke={chordColor}
              strokeWidth={2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 1.6, type: 'spring' }}
              style={{ transformOrigin: `${pOuter.x}px ${pOuter.y}px` }}
            />
          </g>
        )}

        {/* === TRIGRAM NODES === */}
        {FU_XI_ORDER.map((key, i) => {
          const pos = positions[key];
          const trigram = TRIGRAMS[key];
          const isPrimaryInner = key === primaryHexagram.lowerTrigram;
          const isPrimaryOuter = key === primaryHexagram.upperTrigram;
          const isActive = isPrimaryInner || isPrimaryOuter;
          const isTransformedNode = transformedHexagram
            ? key === transformedHexagram.lowerTrigram || key === transformedHexagram.upperTrigram
            : false;

          // Role label pushed outward
          const outward = nodeR + 14;
          const roleLabelX = cx + (radius + outward) * Math.cos(pos.angle);
          const roleLabelY = cy + (radius + outward) * Math.sin(pos.angle);

          let roleText = '';
          if (isDoubled && isActive) {
            roleText = 'DOUBLED';
          } else if (isPrimaryInner && isPrimaryOuter) {
            roleText = 'DOUBLED';
          } else if (isPrimaryInner) {
            roleText = 'INNER';
          } else if (isPrimaryOuter) {
            roleText = 'OUTER';
          }

          return (
            <motion.g
              key={key}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.35,
                delay: delay + 0.15 + i * 0.06,
                ease: 'backOut',
              }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              <circle
                cx={pos.x} cy={pos.y}
                r={nodeR}
                fill={isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)'}
                stroke={
                  isActive
                    ? chordColor
                    : isTransformedNode
                      ? `${tChordColor}66`
                      : 'rgba(255,255,255,0.08)'
                }
                strokeWidth={isActive ? 1.5 : 0.5}
              />

              <text
                x={pos.x} y={pos.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? '#fff' : 'rgba(255,255,255,0.45)'}
                fontSize={15}
                fontFamily="serif"
              >
                {trigram.symbol}
              </text>

              <text
                x={pos.x} y={pos.y + 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)'}
                fontSize={7.5}
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.04em"
              >
                {trigram.image.split('/')[0]}
              </text>

              {roleText && (
                <motion.text
                  x={roleLabelX} y={roleLabelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={chordColor}
                  fontSize={8}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  letterSpacing="0.1em"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ delay: delay + 1.5, duration: 0.4 }}
                >
                  {roleText}
                </motion.text>
              )}
            </motion.g>
          );
        })}

        {/* Center label */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 1.8, duration: 0.5 }}
        >
          <text
            x={cx} y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={22}
            fontFamily="'Cormorant Garamond', Georgia, serif"
          >
            {primaryHexagram.chinese}
          </text>
          <text
            x={cx} y={cy + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize={8}
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.06em"
          >
            {primaryHexagram.number}. {primaryHexagram.name}
          </text>
        </motion.g>
      </svg>

      {/* Readout — minimal, floating */}
      <motion.div
        className="flex items-center gap-3 mt-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: revealed ? 1 : 0, y: 0 }}
        transition={{ delay: delay + 2.0, duration: 0.5 }}
      >
        <div
          className="w-5 h-[2px] rounded-full"
          style={{ backgroundColor: chordColor }}
        />
        <span className="text-[10px] text-zinc-500 font-mono">
          {isDoubled ? 'self-referent' : tensionLabel}
        </span>
        {!isDoubled && (
          <span className="text-[10px] text-zinc-600 font-mono">
            d={chordLength.toFixed(2)}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
