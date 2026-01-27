'use client';

import { motion } from 'framer-motion';
import { Hexagram as HexagramData, TRIGRAMS, HexagramMood } from '@/data/iching';
import { useMemo } from 'react';

// Fu Xi (Earlier Heaven) arrangement - complementary pairs exactly opposite
// Clockwise from top: Heaven, Lake, Fire, Thunder, Earth, Mountain, Water, Wind
const FU_XI_ORDER = ['qian', 'dui', 'li', 'zhen', 'kun', 'gen', 'kan', 'xun'] as const;

// Compute angle for each trigram position on the circle
// 0 index = top (-PI/2), going clockwise
function trigramAngle(key: string): number {
  const index = FU_XI_ORDER.indexOf(key as (typeof FU_XI_ORDER)[number]);
  if (index === -1) return 0;
  return -Math.PI / 2 + (index * 2 * Math.PI) / 8;
}

// The 4 complementary-pair axes
const AXES = [
  { from: 'qian', to: 'kun', label: 'FORCE', sublabel: 'creative \u2194 receptive' },
  { from: 'li', to: 'kan', label: 'AWARENESS', sublabel: 'clinging \u2194 abysmal' },
  { from: 'dui', to: 'gen', label: 'EXCHANGE', sublabel: 'joyous \u2194 still' },
  { from: 'zhen', to: 'xun', label: 'MOTION', sublabel: 'arousing \u2194 gentle' },
];

// Mood -> chord color mapping
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

  // Pre-compute trigram positions on the circle
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

  // Primary hexagram chord endpoints
  const pInner = positions[primaryHexagram.lowerTrigram];
  const pOuter = positions[primaryHexagram.upperTrigram];
  const isDoubled = primaryHexagram.lowerTrigram === primaryHexagram.upperTrigram;

  // Transformed hexagram chord endpoints
  const tInner = transformedHexagram ? positions[transformedHexagram.lowerTrigram] : null;
  const tOuter = transformedHexagram ? positions[transformedHexagram.upperTrigram] : null;
  const isTransformedDoubled = transformedHexagram
    ? transformedHexagram.lowerTrigram === transformedHexagram.upperTrigram
    : false;

  const chordColor = MOOD_COLORS[primaryHexagram.mood];
  const chordGlow = MOOD_GLOW[primaryHexagram.mood];
  const tChordColor = transformedHexagram ? MOOD_COLORS[transformedHexagram.mood] : chordColor;

  // Chord midpoint for center label
  const chordMidX = isDoubled ? pInner.x : (pInner.x + pOuter.x) / 2;
  const chordMidY = isDoubled ? pInner.y : (pInner.y + pOuter.y) / 2;

  // Chord length as fraction of diameter (0 = doubled/zero, 1 = maximum tension)
  const chordLength = isDoubled
    ? 0
    : Math.sqrt((pOuter.x - pInner.x) ** 2 + (pOuter.y - pInner.y) ** 2) / (2 * radius);

  // Tension description
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
          <filter id="compass-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
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

        {/* Inner reference circle (half radius) */}
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

        {/* Axis lines - subtle structural connections between complementary pairs */}
        {AXES.map((axis, i) => {
          const from = positions[axis.from];
          const to = positions[axis.to];
          // Label at center, offset perpendicular to the axis
          const axisAngle = Math.atan2(to.y - from.y, to.x - from.x);
          const perpAngle = axisAngle + Math.PI / 2;
          const labelDist = 14 + i * 2; // stagger slightly
          const labelX = cx + labelDist * Math.cos(perpAngle);
          const labelY = cy + labelDist * Math.sin(perpAngle);

          return (
            <g key={axis.label}>
              <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.75}
                strokeDasharray="3 6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: delay + 0.3 + i * 0.08 }}
              />
              <motion.text
                x={labelX}
                y={labelY}
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

        {/* === THE CHORD: Primary hexagram === */}
        {isDoubled ? (
          /* Doubled trigram: pulsing dot at the shared position */
          <motion.circle
            cx={pInner.x}
            cy={pInner.y}
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
          <g>
            {/* Chord glow layer */}
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
            {/* Chord solid line */}
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
            {/* Inner endpoint (lower trigram) */}
            <motion.circle
              cx={pInner.x}
              cy={pInner.y}
              r={5}
              fill={chordColor}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 1.5, type: 'spring' }}
              style={{ transformOrigin: `${pInner.x}px ${pInner.y}px` }}
            />
            {/* Outer endpoint (upper trigram) — hollow ring to distinguish */}
            <motion.circle
              cx={pOuter.x}
              cy={pOuter.y}
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

        {/* === TRANSFORMATION CHORD (ghost/dashed) === */}
        {hasTransformation && tInner && tOuter && (
          isTransformedDoubled ? (
            <motion.circle
              cx={tInner.x}
              cy={tInner.y}
              r={6}
              fill="none"
              stroke={tChordColor}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 2.0 },
                opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 2.0 },
              }}
              style={{ transformOrigin: `${tInner.x}px ${tInner.y}px` }}
            />
          ) : (
            <g>
              {/* Transformed chord - dashed */}
              <motion.path
                d={`M ${tInner.x} ${tInner.y} L ${tOuter.x} ${tOuter.y}`}
                fill="none"
                stroke={tChordColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.45 }}
                transition={{ duration: 0.8, delay: delay + 2.0, ease: 'easeOut' }}
              />
              {/* Transformed inner endpoint */}
              <motion.circle
                cx={tInner.x}
                cy={tInner.y}
                r={3.5}
                fill={tChordColor}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.45 }}
                transition={{ duration: 0.3, delay: delay + 2.5 }}
                style={{ transformOrigin: `${tInner.x}px ${tInner.y}px` }}
              />
              {/* Transformed outer endpoint */}
              <motion.circle
                cx={tOuter.x}
                cy={tOuter.y}
                r={3.5}
                fill="none"
                stroke={tChordColor}
                strokeWidth={1.5}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.45 }}
                transition={{ duration: 0.3, delay: delay + 2.6 }}
                style={{ transformOrigin: `${tOuter.x}px ${tOuter.y}px` }}
              />
            </g>
          )
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

          // Push role labels outward
          const outward = nodeR + 14;
          const roleLabelX = cx + (radius + outward) * Math.cos(pos.angle);
          const roleLabelY = cy + (radius + outward) * Math.sin(pos.angle);

          // Determine role text
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
              {/* Node background */}
              <circle
                cx={pos.x}
                cy={pos.y}
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

              {/* Trigram unicode symbol */}
              <text
                x={pos.x}
                y={pos.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? '#fff' : 'rgba(255,255,255,0.45)'}
                fontSize={15}
                fontFamily="serif"
              >
                {trigram.symbol}
              </text>

              {/* Image name (e.g. "Heaven", "Fire") */}
              <text
                x={pos.x}
                y={pos.y + 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)'}
                fontSize={7.5}
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.04em"
              >
                {trigram.image.split('/')[0]}
              </text>

              {/* Role label (INNER / OUTER / DOUBLED) */}
              {roleText && (
                <motion.text
                  x={roleLabelX}
                  y={roleLabelY}
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

        {/* Center label: hexagram number */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 1.8, duration: 0.5 }}
        >
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={22}
            fontFamily="'Cormorant Garamond', Georgia, serif"
          >
            {primaryHexagram.chinese}
          </text>
          <text
            x={cx}
            y={cy + 12}
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

      {/* Legend / readout below the compass */}
      <motion.div
        className="flex flex-col items-center gap-2 mt-1 w-full max-w-xs"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: revealed ? 1 : 0, y: 0 }}
        transition={{ delay: delay + 2.0, duration: 0.5 }}
      >
        {/* Tension readout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-[2px] rounded-full"
              style={{ backgroundColor: chordColor }}
            />
            <span className="text-[10px] text-zinc-500 font-mono">
              {isDoubled ? 'self-referent' : tensionLabel}
            </span>
          </div>
          {!isDoubled && (
            <span className="text-[10px] text-zinc-600 font-mono">
              d={chordLength.toFixed(2)}
            </span>
          )}
        </div>

        {/* Chord key */}
        <div className="flex items-center gap-4 text-[9px] text-zinc-600">
          <div className="flex items-center gap-1">
            <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill={chordColor} /></svg>
            <span>inner</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="8" height="8"><circle cx="4" cy="4" r="2.5" fill="none" stroke={chordColor} strokeWidth="1.5" /></svg>
            <span>outer</span>
          </div>
          {hasTransformation && (
            <div className="flex items-center gap-1">
              <svg width="14" height="2">
                <line x1="0" y1="1" x2="14" y2="1" stroke={tChordColor} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5" />
              </svg>
              <span>becoming</span>
            </div>
          )}
        </div>

        {/* Transformation summary */}
        {hasTransformation && transformedHexagram && (
          <motion.div
            className="text-[10px] text-zinc-500 text-center mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 2.5, duration: 0.4 }}
          >
            <span style={{ color: chordColor }}>
              {TRIGRAMS[primaryHexagram.lowerTrigram].image.split('/')[0]}
            </span>
            <span className="text-zinc-700"> {'\u2192'} </span>
            <span style={{ color: tChordColor, opacity: 0.6 }}>
              {TRIGRAMS[transformedHexagram.lowerTrigram].image.split('/')[0]}
            </span>
            <span className="text-zinc-700 mx-1.5">/</span>
            <span style={{ color: chordColor }}>
              {TRIGRAMS[primaryHexagram.upperTrigram].image.split('/')[0]}
            </span>
            <span className="text-zinc-700"> {'\u2192'} </span>
            <span style={{ color: tChordColor, opacity: 0.6 }}>
              {TRIGRAMS[transformedHexagram.upperTrigram].image.split('/')[0]}
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
