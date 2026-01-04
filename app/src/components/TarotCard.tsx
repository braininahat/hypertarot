'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card, getCardImagePath } from '@/data/tarot';

interface TarotCardProps {
  card: Card;
  reversed?: boolean;
  revealed?: boolean;
  delay?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-20 h-32',
  md: 'w-28 h-44',
  lg: 'w-36 h-56',
};

export function TarotCard({
  card,
  reversed = false,
  revealed = true,
  delay = 0,
  onClick,
  size = 'md',
}: TarotCardProps) {
  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer perspective-1000`}
      initial={{ opacity: 0, y: 50, rotateY: 180 }}
      animate={{
        opacity: revealed ? 1 : 0.8,
        y: 0,
        rotateY: revealed ? 0 : 180,
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      onClick={onClick}
    >
      {/* Card Back */}
      <div
        className={`absolute inset-0 rounded-lg bg-gradient-to-br from-violet-900 to-indigo-950 border-2 border-violet-500/30 backface-hidden ${
          revealed ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ transform: 'rotateY(180deg)' }}
      >
        <div className="absolute inset-2 rounded border border-violet-400/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 animate-pulse" />
        </div>
      </div>

      {/* Card Front */}
      <div
        className={`absolute inset-0 rounded-lg overflow-hidden shadow-lg glow-quantum transition-all ${
          revealed ? 'opacity-100' : 'opacity-0'
        } ${reversed ? 'rotate-180' : ''}`}
      >
        <Image
          src={getCardImagePath(card)}
          alt={card.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 80px, 112px"
        />
      </div>
    </motion.div>
  );
}

interface CardBackProps {
  className?: string;
}

export function CardBack({ className = '' }: CardBackProps) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-br from-violet-900 to-indigo-950 border-2 border-violet-500/30 ${className}`}
    >
      <div className="absolute inset-2 rounded border border-violet-400/20 flex items-center justify-center">
        <div className="text-violet-400/50 text-4xl">&#10022;</div>
      </div>
    </div>
  );
}
