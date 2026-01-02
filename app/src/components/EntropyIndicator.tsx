'use client';

import { motion } from 'framer-motion';

interface EntropyIndicatorProps {
  source: string;
  type: 'quantum' | 'quantum-physical';
  loading?: boolean;
}

export function EntropyIndicator({ source, type, loading = false }: EntropyIndicatorProps) {
  return (
    <motion.div
      className="flex items-center gap-2 text-xs font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Pulsing indicator dot */}
      <motion.div
        className={`w-2 h-2 rounded-full ${
          type === 'quantum' ? 'bg-cyan-400' : 'bg-violet-400'
        }`}
        animate={
          loading
            ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
            : { scale: 1, opacity: 1 }
        }
        transition={
          loading
            ? { duration: 1, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      />

      <span className="text-text-muted">
        {loading ? 'Fetching entropy...' : source}
      </span>

      {!loading && (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] ${
            type === 'quantum'
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'bg-violet-500/20 text-violet-300'
          }`}
        >
          {type === 'quantum' ? 'QUANTUM' : 'PHYSICAL'}
        </span>
      )}
    </motion.div>
  );
}

interface EntropyStreamProps {
  bits: number[];
  maxVisible?: number;
}

export function EntropyStream({ bits, maxVisible = 32 }: EntropyStreamProps) {
  const visibleBits = bits.slice(-maxVisible);

  return (
    <div className="font-mono text-xs flex gap-0.5 overflow-hidden">
      {visibleBits.map((bit, i) => (
        <motion.span
          key={`${i}-${bit}`}
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={bit ? 'text-cyan-400' : 'text-violet-400'}
        >
          {bit}
        </motion.span>
      ))}
    </div>
  );
}
