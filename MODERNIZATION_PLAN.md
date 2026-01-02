# HyperTarot Modernization Plan

## Philosophy & Vision

### The Fatum Connection

HyperTarot is rooted in the [Fatum Project](https://www.reddit.com/r/DimensionJumping/comments/b2aqfu/the_fatum_project/) philosophy—the same foundation that spawned [Randonautica](https://www.randonautica.app/about). The core premise:

> **True quantum randomness can break us out of "probability tunnels"—the deterministic patterns that constrain our lives.**

Key concepts to embody in the modernized app:

| Concept | Meaning | Application in HyperTarot |
|---------|---------|---------------------------|
| **Stasis Field** | Life patterns that keep us in predictable loops | The mundane—before the reading begins |
| **Probability Tunnel** | Deterministic paths we follow unconsciously | What we're breaking out of with QRNG |
| **Intention** | Conscious focus that may influence quantum outcomes | User's question/focus before the draw |
| **Quantum Blindspot** | Areas outside our probability tunnel | New insights revealed by the cards |
| **Mind-Matter Interaction** | Hypothesis that consciousness affects RNG | The mystical element—the "why it might work" |

### Design Philosophy

The app should feel like **stepping through a portal**—from the mundane into the liminal. The UX should:

1. **Honor the ritual** — Tarot is ceremonial. The experience should feel intentional, not like clicking a slot machine
2. **Emphasize the quantum** — Make the source of randomness visible and meaningful
3. **Create space for intention** — Before drawing, users should have time to focus
4. **Reveal with reverence** — Card reveals should be theatrical, not instant

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│   Next.js 14+ / React 18+ with App Router                       │
│   ├── Framer Motion (ritual animations)                         │
│   ├── Tailwind CSS (styling)                                    │
│   └── Radix UI (accessible primitives)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│   Next.js API Routes / Server Actions                            │
│   ├── /api/entropy — Fetch quantum randomness                   │
│   ├── /api/reading — Generate & store readings                  │
│   └── /api/cards — Card data & interpretations                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   QRNG SERVICE LAYER                             │
│   Quantum-only entropy with fallback chain                      │
│   ├── Primary: ANU QRNG (vacuum fluctuations)                   │
│   ├── Fallback: CamRNG (sensor shot/thermal noise)              │
│   └── No CSPRNG — fail if no quantum source available           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│   ├── tarot-json (card definitions)                             │
│   ├── SQLite/Turso (reading history - optional)                 │
│   └── Local Storage (session persistence)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## QRNG Sources: Detailed Analysis

### Primary: ANU Quantum Random Numbers

**Current implementation uses this.**

| Attribute | Details |
|-----------|---------|
| Provider | [Australian National University](https://qrng.anu.edu.au/) |
| Method | Vacuum fluctuation measurement via lasers |
| Speed | Up to 5.7 Gbits/s (hardware), API rate-limited |
| Library | `quantumrandom` (Python), direct API (JS) |
| Reliability | Generally good, but has gone down (e.g., 2019 Australian fires) |
| Cost | Free |

**API Endpoint:**
```
GET https://qrng.anu.edu.au/API/jsonI.php?length=11&type=uint8
```

### Fallback 1: API3 QRNG (Web3)

For blockchain-connected experiences or as a secondary source.

| Attribute | Details |
|-----------|---------|
| Provider | [API3](https://medium.com/api3/api3-qrng-web3-quantum-random-numbers-4ca7517fc5bc) |
| Source | ANU Quantum Numbers backend |
| Chains | Ethereum, Polygon, Arbitrum, Optimism, etc. |
| Use Case | If building a Web3 tarot experience, or if primary fails |

### Fallback 2: Camera Entropy (CamRNG)

Inspired by Randonautica's solution when ANU failed.

| Attribute | Details |
|-----------|---------|
| Method | Thermal/shot noise from smartphone camera sensor |
| Implementation | Capture black frames, extract LSBs as entropy |
| Pros | Works offline, uses device hardware |
| Cons | Requires camera permission, mobile-only |

**Implementation sketch:**
```javascript
async function getCameraEntropy(bytes = 11) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;

  // Cover lens for pure sensor noise
  ctx.drawImage(video, 0, 0, 64, 64);
  const imageData = ctx.getImageData(0, 0, 64, 64);

  // Extract LSBs from pixel values
  const entropy = [];
  for (let i = 0; i < bytes * 8 && i < imageData.data.length; i++) {
    entropy.push(imageData.data[i] & 1);
  }

  stream.getTracks().forEach(t => t.stop());
  return bitsToBytes(entropy);
}
```

### No CSPRNG Fallback

We intentionally **do not** fall back to `crypto.getRandomValues()` or any pseudo-random source. While cryptographically secure, CSPRNG is deterministic—given the same internal state, it produces the same output. This violates the core Fatum premise that consciousness may influence quantum superposition states.

If both ANU and CamRNG fail, the app displays an error rather than compromising on entropy quality.

### Entropy Provider Strategy

**No pseudo-random fallbacks.** If we can't get quantum entropy, the reading fails. This preserves the integrity of the Fatum philosophy—deterministic algorithms cannot be influenced by intention.

```typescript
interface EntropyProvider {
  name: string;
  type: 'quantum' | 'quantum-physical'; // No 'pseudo' allowed
  priority: number;
  getEntropy(count: number): Promise<number[]>;
  healthCheck(): Promise<boolean>;
}

class EntropyService {
  private providers: EntropyProvider[] = [
    { name: 'ANU QRNG', type: 'quantum', priority: 1, ... },
    { name: 'CamRNG', type: 'quantum-physical', priority: 2, ... },
    // NO Web Crypto / CSPRNG fallback
  ];

  async getCardIndices(count: number = 11): Promise<{
    indices: number[];
    source: string;
    type: 'quantum' | 'quantum-physical';
  }> {
    for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
      try {
        if (await provider.healthCheck()) {
          const entropy = await provider.getEntropy(count);
          return {
            indices: entropy.map(n => n % 78),
            source: provider.name,
            type: provider.type
          };
        }
      } catch (e) {
        console.warn(`Provider ${provider.name} failed, trying next...`);
      }
    }
    // No fallback - fail with meaningful message
    throw new Error(
      'Unable to obtain quantum entropy. Please check your connection or enable camera access.'
    );
  }
}
```

---

## Frontend Design System

### Color Palette: "Liminal Void"

```css
:root {
  /* Backgrounds - Deep space void */
  --void-deepest: #0a0a0f;
  --void-deep: #12121a;
  --void-mid: #1a1a25;

  /* Accents - Quantum glow */
  --quantum-primary: #7c3aed;    /* Violet */
  --quantum-secondary: #06b6d4;  /* Cyan */
  --quantum-tertiary: #f59e0b;   /* Amber (card backs) */

  /* Text */
  --text-primary: #f4f4f5;
  --text-muted: #a1a1aa;
  --text-mystic: #c4b5fd;        /* Light violet */

  /* Borders & Effects */
  --glow-quantum: 0 0 30px rgba(124, 58, 237, 0.3);
  --glow-reveal: 0 0 60px rgba(245, 158, 11, 0.5);
}
```

### Typography

```css
/* Headings - Mystical but readable */
--font-display: 'Cormorant Garamond', serif;

/* Body - Clean and modern */
--font-body: 'Inter', system-ui, sans-serif;

/* Accents - For quantum/technical elements */
--font-mono: 'JetBrains Mono', monospace;
```

### Component Hierarchy

```
App
├── IntentionScreen
│   ├── IntentionPrompt ("What question do you bring?")
│   ├── IntentionInput (text field or just meditation timer)
│   ├── EntropyIndicator (shows QRNG source & status)
│   └── BeginButton
│
├── DrawingScreen
│   ├── CardDeck (animated stack)
│   ├── SpreadLayout (positions for drawn cards)
│   ├── DrawProgress (11 of 11)
│   └── EntropyStream (visualized quantum bits)
│
├── ReadingScreen
│   ├── SpreadView (all cards in spread layout)
│   ├── CardDetail (expanded view on tap)
│   │   ├── CardImage
│   │   ├── CardName
│   │   ├── CardMeaning
│   │   └── Position meaning
│   ├── ReadingInterpretation (AI-generated synthesis - optional)
│   └── SaveReading / ShareReading
│
└── HistoryScreen (optional)
    ├── PastReadings
    └── ReadingDetail
```

### Key Animations

**1. Intention Pulse**
Subtle breathing animation while user focuses:
```javascript
const intentionPulse = {
  scale: [1, 1.02, 1],
  opacity: [0.7, 1, 0.7],
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
};
```

**2. Card Draw**
Cards should feel like they're being pulled from the quantum void:
```javascript
const cardDraw = {
  initial: { y: 100, opacity: 0, rotateY: 180 },
  animate: {
    y: 0,
    opacity: 1,
    rotateY: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] // Custom easing
    }
  }
};
```

**3. Entropy Visualization**
Real-time display of quantum bits as they arrive:
```javascript
// Show incoming quantum bits as particles
const EntropyStream = ({ bits }) => (
  <div className="entropy-stream">
    {bits.map((bit, i) => (
      <motion.span
        key={i}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={bit ? 'text-quantum-primary' : 'text-quantum-secondary'}
      >
        {bit}
      </motion.span>
    ))}
  </div>
);
```

---

## Spread Types

### Phase 1: Celtic Cross (11 cards)
The current POC uses 11 cards. This maps to the traditional Celtic Cross:

| Position | Meaning |
|----------|---------|
| 1 | Present situation |
| 2 | Challenge/Cross |
| 3 | Foundation/Past |
| 4 | Recent past |
| 5 | Crown/Best outcome |
| 6 | Near future |
| 7 | Self/Attitude |
| 8 | Environment/Others |
| 9 | Hopes and fears |
| 10 | Outcome |
| 11 | Clarifier |

### Future Spreads

- **Three Card** (Past/Present/Future) — Quick reading
- **Single Card** — Daily draw
- **Horseshoe** (7 cards) — Medium depth
- **Tree of Life** (10 cards) — Kabbalistic spread

---

## Data Model

### Card (from tarot-json, extended)

```typescript
interface Card {
  id: number;              // 0-77
  name: string;            // "The Fool"
  number: number;          // 0
  arcana: 'Major Arcana' | 'Minor Arcana';
  suit: 'Cups' | 'Wands' | 'Swords' | 'Pentacles' | null;
  img: string;             // "m00.jpg"

  // Extensions
  keywords: string[];      // ["beginnings", "innocence", "leap"]
  upright: string;         // Meaning when upright
  reversed: string;        // Meaning when reversed
  element?: string;        // "Air", "Fire", etc.
  astrology?: string;      // "Uranus", etc.
}
```

### Reading

```typescript
interface Reading {
  id: string;              // UUID
  timestamp: Date;
  intention?: string;      // User's question/focus

  spread: {
    type: 'celtic-cross' | 'three-card' | 'single';
    cards: DrawnCard[];
  };

  entropy: {
    source: string;        // "ANU QRNG", "CamRNG", etc.
    isQuantum: boolean;
    rawValues: number[];   // Original entropy values
  };
}

interface DrawnCard {
  card: Card;
  position: number;
  reversed: boolean;       // 50% chance via separate entropy
}
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal:** Working web app with single spread type and ANU QRNG

- [ ] Initialize Next.js 14 project with App Router
- [ ] Port tarot-json data and card images
- [ ] Implement ANU QRNG client
- [ ] Build core components: IntentionScreen, DrawingScreen, ReadingScreen
- [ ] Basic card reveal animations
- [ ] Responsive design (mobile-first)

### Phase 2: Entropy Resilience

**Goal:** Multiple QRNG sources with graceful fallback

- [ ] Abstract entropy provider interface
- [ ] Implement Camera entropy (CamRNG)
- [ ] Implement Web Crypto fallback
- [ ] Add entropy source indicator in UI
- [ ] Health monitoring for providers

### Phase 3: Rich Experience

**Goal:** Full mystical experience with polish

- [ ] Advanced animations (Framer Motion)
- [ ] Entropy visualization stream
- [ ] Sound design (ambient + card sounds)
- [ ] Multiple spread types
- [ ] Card reversal logic
- [ ] Reading history (local storage)

### Phase 4: Expansion

**Goal:** Community and advanced features

- [ ] Reading sharing (unique URLs)
- [ ] AI interpretation integration (optional)
- [ ] Multiple deck artwork options
- [ ] PWA support (offline capable)
- [ ] Web3 integration (optional)

---

## Technical Decisions

### Why Next.js?

1. **App Router** — Server components for card data, client for interactions
2. **API Routes** — Easy QRNG proxy to avoid CORS
3. **Image Optimization** — Built-in for card images
4. **Vercel Deploy** — One-click hosting

### Why Not Pure SPA?

- Need server-side QRNG calls (CORS protection on ANU)
- Want SSR for shareable reading URLs
- Image optimization benefits

### Alternative: Astro + React

If lighter-weight preferred:
- Astro for static shell
- React islands for interactive components
- Still need API for QRNG proxy

---

## File Structure

```
hypertarot/
├── public/
│   └── cards/              # Card images (from tarot-json)
│       ├── m00.jpg
│       └── ...
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx        # IntentionScreen
│   │   ├── draw/
│   │   │   └── page.tsx    # DrawingScreen
│   │   ├── reading/
│   │   │   └── [id]/
│   │   │       └── page.tsx # ReadingScreen
│   │   └── api/
│   │       ├── entropy/
│   │       │   └── route.ts
│   │       └── reading/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/             # Radix-based primitives
│   │   ├── Card.tsx
│   │   ├── Deck.tsx
│   │   ├── SpreadLayout.tsx
│   │   ├── EntropyStream.tsx
│   │   └── IntentionInput.tsx
│   ├── lib/
│   │   ├── entropy/
│   │   │   ├── provider.ts
│   │   │   ├── anu.ts
│   │   │   ├── camera.ts
│   │   │   └── crypto.ts
│   │   ├── cards.ts
│   │   └── spreads.ts
│   ├── data/
│   │   └── tarot.json
│   └── styles/
│       └── globals.css
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

---

## Sources & References

- [The Fatum Project (Reddit)](https://www.reddit.com/r/DimensionJumping/comments/b2aqfu/the_fatum_project/)
- [Randonautica Theory](https://www.randonautica.app/theory)
- [Randonautica About](https://www.randonautica.app/about)
- [ANU Quantum Random Numbers](https://qrng.anu.edu.au/)
- [API3 QRNG for Web3](https://medium.com/api3/api3-qrng-web3-quantum-random-numbers-4ca7517fc5bc)
- [Quantropi QRNG Open API Framework](https://www.quantropi.com/announcing-qrng-open-api-framework/)
- [ID Quantique QRNG](https://www.idquantique.com/random-number-generation/overview/)
- [pyrandonaut (Open source implementation)](https://github.com/openrandonaut/pyrandonaut)
- [Randonauts Wiki - Quantum Entropy](https://randonauts.fandom.com/wiki/Quantum_Entropy)
