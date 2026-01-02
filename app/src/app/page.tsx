'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from '@/components/TarotCard';
import { EntropyIndicator } from '@/components/EntropyIndicator';
import { cards, SPREADS, DEFAULT_SPREAD, type DrawnCard, type Spread } from '@/data/tarot';

type AppState = 'intention' | 'drawing' | 'reading';

interface ReadingData {
  drawnCards: DrawnCard[];
  entropySource: string;
  entropyType: 'quantum' | 'quantum-physical';
  intention: string;
  timestamp: Date;
  spread: Spread;
}

export default function Home() {
  const [state, setState] = useState<AppState>('intention');
  const [intention, setIntention] = useState('');
  const [selectedSpread, setSelectedSpread] = useState<Spread>(DEFAULT_SPREAD);
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchQuantumEntropy = useCallback(async (): Promise<{
    data: number[];
    source: string;
    type: 'quantum' | 'quantum-physical';
  }> => {
    // Try QRNG via our API proxy
    try {
      const response = await fetch('/api/entropy?count=100');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return { data: result.data, source: result.source, type: result.type };
        }
      }
    } catch (e) {
      console.warn('QRNG API failed, trying CamRNG...', e);
    }

    // Fallback to CamRNG - capture multiple frames for sufficient entropy
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 128, height: 128 },
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      await video.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      canvas.width = 128;
      canvas.height = 128;

      const allBytes: number[] = [];

      // Capture 5 frames with delays to accumulate entropy
      for (let frame = 0; frame < 5; frame++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.drawImage(video, 0, 0, 128, 128);
        const imageData = ctx.getImageData(0, 0, 128, 128);

        // Extract entropy from pixel values (use multiple bits, XOR frames)
        for (let i = 0; i < imageData.data.length - 3; i += 4) {
          // Combine RGB channels, skip alpha
          const byte = (imageData.data[i] ^ imageData.data[i + 1] ^ imageData.data[i + 2]) & 0xFF;
          allBytes.push(byte);
        }
      }

      stream.getTracks().forEach(track => track.stop());

      // Shuffle and take what we need
      const shuffled = allBytes.sort(() => allBytes[0] - 128);
      return { data: shuffled.slice(0, 200), source: 'CamRNG', type: 'quantum-physical' };
    } catch (e) {
      console.error('CamRNG failed:', e);
      throw new Error(
        'Unable to obtain quantum entropy. Please check your internet connection or enable camera access.'
      );
    }
  }, []);

  const performReading = useCallback(async () => {
    setLoading(true);
    setError(null);
    setState('drawing');

    try {
      const entropy = await fetchQuantumEntropy();
      const cardCount = selectedSpread.cardCount;

      // Select unique cards based on spread size
      const indices: number[] = [];
      const reversals: boolean[] = [];
      let i = 0;

      while (indices.length < cardCount && i < entropy.data.length) {
        const cardIndex = entropy.data[i] % 78;
        if (!indices.includes(cardIndex)) {
          indices.push(cardIndex);
          reversals.push((entropy.data[i + 1] || entropy.data[i]) > 127);
        }
        i++;
      }

      if (indices.length < cardCount) {
        throw new Error('Insufficient entropy for reading');
      }

      const drawnCards: DrawnCard[] = indices.map((cardIndex, position) => ({
        card: cards[cardIndex],
        position,
        reversed: reversals[position],
      }));

      // Dramatic pause for the drawing experience
      await new Promise(resolve => setTimeout(resolve, 1500));

      setReading({
        drawnCards,
        entropySource: entropy.source,
        entropyType: entropy.type,
        intention,
        timestamp: new Date(),
        spread: selectedSpread,
      });

      setState('reading');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to perform reading');
      setState('intention');
    } finally {
      setLoading(false);
    }
  }, [intention, selectedSpread, fetchQuantumEntropy]);

  const copyReadingToClipboard = useCallback(async () => {
    if (!reading) return;

    const positions = reading.spread.positions;

    // Build markdown table
    const lines = [
      '| Position | Meaning | Card |',
      '|----------|---------|------|',
    ];

    reading.drawnCards.forEach((drawn, index) => {
      const pos = positions[index];
      const cardName = drawn.reversed
        ? `${drawn.card.name} (Reversed)`
        : drawn.card.name;
      lines.push(`| ${index + 1} | ${pos.name} / ${pos.description} | ${cardName} |`);
    });

    // Add intention if present
    if (reading.intention) {
      lines.unshift(`**Question:** ${reading.intention}\n`);
    }

    // Add spread name
    lines.unshift(`**Spread:** ${reading.spread.name}\n`);

    const markdown = lines.join('\n');

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }, [reading]);

  const resetReading = useCallback(() => {
    setState('intention');
    setIntention('');
    setReading(null);
    setSelectedCard(null);
    setError(null);
    setCopied(false);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <AnimatePresence mode="wait">
        {/* INTENTION SCREEN */}
        {state === 'intention' && (
          <motion.div
            key="intention"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-lg w-full text-center space-y-8"
          >
            <motion.div
              className="animate-breathe"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <h1 className="text-5xl md:text-6xl font-display font-semibold text-gradient-mystic mb-4">
                HyperTarot
              </h1>
              <p className="text-text-muted text-sm font-mono">
                Quantum Entropy Divination
              </p>
            </motion.div>

            {/* Spread Selector */}
            <div className="space-y-3">
              <p className="text-text-mystic text-sm font-display">Choose your spread</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPREADS.map((spread) => (
                  <button
                    key={spread.id}
                    onClick={() => setSelectedSpread(spread)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      selectedSpread.id === spread.id
                        ? 'border-violet-500 bg-violet-500/20 glow-quantum'
                        : 'border-violet-500/30 bg-void-deep hover:border-violet-500/60'
                    }`}
                  >
                    <div className="text-sm font-display text-text-primary">{spread.name}</div>
                    <div className="text-xs text-text-muted">{spread.cardCount} cards</div>
                  </button>
                ))}
              </div>
              <p className="text-text-muted text-xs">{selectedSpread.description}</p>
            </div>

            <div className="space-y-4">
              <p className="text-text-mystic text-lg font-display">
                What question do you bring to the quantum void?
              </p>

              <textarea
                value={intention}
                onChange={e => setIntention(e.target.value)}
                placeholder="Focus your intention... (optional)"
                className="w-full h-24 bg-void-deep border border-violet-500/30 rounded-lg p-4 text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-violet-500 focus:glow-quantum resize-none"
              />
              <p className="text-text-muted/60 text-xs">
                For your reflection only. Never sent anywhere or used in card selection.
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              onClick={performReading}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-lg font-display font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all glow-quantum disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Channeling Entropy...' : 'Draw the Cards'}
            </motion.button>

            <p className="text-text-muted text-xs max-w-md mx-auto">
              Cards are drawn using true quantum randomness from vacuum fluctuations,
              measured by ID Quantique hardware at German LfD or Australian National University.
            </p>
          </motion.div>
        )}

        {/* DRAWING SCREEN */}
        {state === 'drawing' && (
          <motion.div
            key="drawing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-2 border-violet-500 border-t-transparent rounded-full"
            />

            <div className="text-center space-y-2">
              <p className="text-xl font-display text-text-mystic">
                Drawing from the quantum void...
              </p>
              <p className="text-sm text-text-muted font-mono">
                {selectedSpread.name} ({selectedSpread.cardCount} cards)
              </p>
              <EntropyIndicator source="QRNG" type="quantum" loading />
            </div>
          </motion.div>
        )}

        {/* READING SCREEN */}
        {state === 'reading' && reading && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-6xl space-y-8"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-gradient-mystic">
                Your Reading
              </h2>
              <p className="text-text-muted text-sm font-mono">{reading.spread.name}</p>
              {reading.intention && (
                <p className="text-text-muted italic">&ldquo;{reading.intention}&rdquo;</p>
              )}
              <EntropyIndicator
                source={reading.entropySource}
                type={reading.entropyType}
              />
            </div>

            {/* Card Spread - Grid Layout */}
            <div className={`grid gap-3 md:gap-4 justify-items-center items-start ${
              reading.spread.cardCount === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              reading.spread.cardCount <= 3 ? 'grid-cols-3 max-w-md mx-auto' :
              reading.spread.cardCount <= 5 ? 'grid-cols-3 sm:grid-cols-5 max-w-2xl mx-auto' :
              'grid-cols-3 sm:grid-cols-4 md:grid-cols-6'
            }`}>
              {reading.drawnCards.map((drawn, index) => (
                <motion.div
                  key={drawn.card.id}
                  className={`relative ${index === selectedCard ? 'z-10' : 'z-0'}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <div className="text-center mb-2">
                    <span className="text-[10px] md:text-xs text-text-muted font-mono">
                      {reading.spread.positions[index]?.name || `Card ${index + 1}`}
                    </span>
                  </div>
                  <TarotCard
                    card={drawn.card}
                    reversed={drawn.reversed}
                    revealed={true}
                    delay={index * 0.15}
                    onClick={() => setSelectedCard(selectedCard === index ? null : index)}
                    size={reading.spread.cardCount <= 3 ? 'md' : 'sm'}
                  />
                  {drawn.reversed && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] text-violet-400 font-mono">
                      reversed
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Selected Card Detail */}
            <AnimatePresence>
              {selectedCard !== null && reading.drawnCards[selectedCard] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-void-deep border border-violet-500/30 rounded-lg p-6 max-w-md mx-auto"
                >
                  <h3 className="text-2xl font-display font-semibold text-text-primary mb-2">
                    {reading.drawnCards[selectedCard].card.name}
                    {reading.drawnCards[selectedCard].reversed && (
                      <span className="text-violet-400 text-sm ml-2">(Reversed)</span>
                    )}
                  </h3>
                  <p className="text-text-muted text-sm mb-2">
                    {reading.drawnCards[selectedCard].card.arcana}
                    {reading.drawnCards[selectedCard].card.suit &&
                      ` - ${reading.drawnCards[selectedCard].card.suit}`}
                  </p>
                  <p className="text-cyan-400 text-sm font-mono">
                    Position: {reading.spread.positions[selectedCard]?.name}
                  </p>
                  <p className="text-text-muted text-xs mt-1">
                    {reading.spread.positions[selectedCard]?.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={copyReadingToClipboard}
                className={`px-6 py-3 border rounded-lg font-display transition-all ${
                  copied
                    ? 'bg-green-600/20 border-green-500 text-green-400'
                    : 'bg-void-mid border-cyan-500/30 hover:border-cyan-500'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? 'Copied!' : 'Copy for Claude'}
              </motion.button>
              <motion.button
                onClick={resetReading}
                className="px-6 py-3 bg-void-mid border border-violet-500/30 rounded-lg font-display hover:border-violet-500 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                New Reading
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 text-center text-text-muted text-xs font-mono"
      >
        <a
          href="https://lfdr.de/QRNG/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-400 transition-colors"
        >
          Powered by Quantum Random Numbers
        </a>
      </motion.footer>
    </main>
  );
}
