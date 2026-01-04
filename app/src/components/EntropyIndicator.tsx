'use client';

import { motion } from 'framer-motion';

interface EntropyIndicatorProps {
  source: string;
  loading?: boolean;
}

export function EntropyIndicator({ source, loading = false }: EntropyIndicatorProps) {
  return (
    <motion.div
      className="flex items-center gap-2 text-xs font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Pulsing indicator dot */}
      <motion.div
        className="w-2 h-2 rounded-full bg-cyan-400"
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
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">
          QUANTUM
        </span>
      )}
    </motion.div>
  );
}
