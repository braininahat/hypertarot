# HyperTarot

Quantum entropy divination app — Tarot + I Ching powered by true quantum randomness from ID Quantique hardware at the LfD.

## Stack

- Next.js 16 / React 19 / TypeScript 5.9
- Three.js for 3D particle visualizations
- Framer Motion for animations
- Tailwind CSS v4

## Project Structure

```
app/src/
  app/
    page.tsx         — Main page, all UI state + layout (choose → casting → reading)
    api/entropy/     — Quantum RNG endpoint
  components/
    Hexagram.tsx          — HexagramReadingDisplay, Hexagram, HexagramDetail, MiniHexagram
    HexagramVis3D.tsx     — Three.js particle visualization (trigram→geometry morphing)
    TarotCard.tsx         — Tarot card component
    TrigramCompass.tsx    — Trigram compass visualization
    EntropyIndicator.tsx  — Entropy source indicator
  data/
    iching.ts        — 64 hexagrams, trigrams, spreads
    tarot.ts         — 78 cards, spreads
  lib/entropy/
    selection.ts         — Tarot card selection from entropy
    iching-selection.ts  — Hexagram casting from entropy
    types.ts             — Shared types (DivinationSystem, HexagramCast, CastLine)
```

## Key Architecture

### I Ching Particle Visualization (HexagramVis3D)
- 1500 particles split into inner (lower trigram, 750) and outer (upper trigram, 750)
- Each of 8 trigrams has a unique deterministic geometry (fibonacci sphere, helix, cone, etc.)
- Particles morph between geometries using **optimal transport** (spherical-angle-sorted matching + linear interpolation)
- When hexagram has changing lines, particles oscillate smoothly between primary and transformed shapes
- **Do NOT use React `key` to force remount** — always let the particle system morph smoothly via stateRef updates
- Camera supports drag rotation with inertia and auto-rotate

### Reading Flow
1. User picks system (Tarot / I Ching) → spread → optional question → Cast/Draw
2. Quantum entropy fetched from `/api/entropy`
3. Cards/hexagrams selected deterministically from entropy bytes
4. Reading displayed with visualizations

## Commands

```bash
cd app && npm run dev    # Development server
cd app && npm run build  # Production build
cd app && npm run lint   # ESLint
```
