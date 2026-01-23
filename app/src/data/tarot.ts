export interface Card {
  id: number;
  name: string;
  number: string;
  arcana: 'Major Arcana' | 'Minor Arcana';
  suit: 'Cups' | 'Swords' | 'Wands' | 'Pentacles' | null;
  img: string;
}

export interface DrawnCard {
  card: Card;
  position: number;
  reversed: boolean;
}

export interface SpreadPosition {
  name: string;
  description: string;
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  positions: SpreadPosition[];
  interpretPrompt: string;
}

export const SPREADS: Spread[] = [
  {
    id: 'single',
    name: 'Single Card',
    description: 'Daily check-in, quick yes/no energy, or a theme to meditate on',
    cardCount: 1,
    positions: [
      { name: 'The Card', description: 'Your message from the quantum void' },
    ],
    interpretPrompt: 'Please interpret this single tarot card for me. What message or theme does it suggest for reflection today?',
  },
  {
    id: 'three-card',
    name: 'Three Card',
    description: 'Simple situation overview: how did I get here, where am I, where is this going?',
    cardCount: 3,
    positions: [
      { name: 'Past', description: 'What has led to this moment' },
      { name: 'Present', description: 'Your current situation' },
      { name: 'Future', description: 'Where things are heading' },
    ],
    interpretPrompt: 'Please interpret this three-card tarot spread showing past, present, and future. How do these cards tell a story together?',
  },
  {
    id: 'five-card',
    name: 'Five Card Cross',
    description: 'Focused question with context: "Should I take this job?" "Is this relationship right?"',
    cardCount: 5,
    positions: [
      { name: 'Present', description: 'Your current situation' },
      { name: 'Challenge', description: 'What you face' },
      { name: 'Past', description: 'What brought you here' },
      { name: 'Future', description: 'What lies ahead' },
      { name: 'Outcome', description: 'Potential resolution' },
    ],
    interpretPrompt: 'Please interpret this five-card cross spread. Consider how the challenge relates to my present situation, what the past reveals, and what the future and outcome suggest about my path forward.',
  },
  {
    id: 'celtic-cross',
    name: 'Celtic Cross',
    description: 'Deep dive into a complex situation: life transitions, major decisions, recurring patterns',
    cardCount: 10,
    positions: [
      { name: 'Present', description: 'Your current situation' },
      { name: 'Challenge', description: 'What crosses you' },
      { name: 'Foundation', description: 'The root of the matter' },
      { name: 'Past', description: 'Recent influences' },
      { name: 'Crown', description: 'Best possible outcome' },
      { name: 'Future', description: 'What lies ahead' },
      { name: 'Self', description: 'Your attitude' },
      { name: 'Environment', description: 'External influences' },
      { name: 'Hopes & Fears', description: 'Your inner landscape' },
      { name: 'Outcome', description: 'The likely result' },
    ],
    interpretPrompt: 'Please provide a comprehensive interpretation of this Celtic Cross tarot spread. Analyze each position, explore how the cards interact with each other, and synthesize the overall message. Pay special attention to the relationship between the challenge and the foundation, and how my hopes/fears might influence the outcome.',
  },
  {
    id: 'celtic-cross-plus',
    name: 'Celtic Cross + Clarifier',
    description: 'When the outcome needs more context, or when one card feels especially cryptic',
    cardCount: 11,
    positions: [
      { name: 'Present', description: 'Your current situation' },
      { name: 'Challenge', description: 'What crosses you' },
      { name: 'Foundation', description: 'The root of the matter' },
      { name: 'Past', description: 'Recent influences' },
      { name: 'Crown', description: 'Best possible outcome' },
      { name: 'Future', description: 'What lies ahead' },
      { name: 'Self', description: 'Your attitude' },
      { name: 'Environment', description: 'External influences' },
      { name: 'Hopes & Fears', description: 'Your inner landscape' },
      { name: 'Outcome', description: 'The likely result' },
      { name: 'Clarifier', description: 'Additional insight' },
    ],
    interpretPrompt: 'Please provide a comprehensive interpretation of this Celtic Cross tarot spread with clarifier card. Analyze each position, explore how the cards interact, and pay special attention to how the Clarifier card illuminates or modifies the Outcome. What additional nuance does it bring to the reading?',
  },
  {
    id: 'relationship-reflection',
    name: 'Relationship Reflection',
    description: 'Understanding any significant relationship: what each person brings, hidden dynamics, what it teaches',
    cardCount: 7,
    positions: [
      { name: 'What I Bring', description: 'What you contribute to this relationship' },
      { name: 'What They Bring', description: 'What the other person contributes' },
      { name: 'The Dynamic', description: 'What you create together' },
      { name: 'My Blind Spot', description: 'What you don\'t see about yourself here' },
      { name: 'Their Experience', description: 'How they experience you / the relationship' },
      { name: 'The Unspoken', description: 'What remains unsaid between you' },
      { name: 'The Lesson', description: 'What this relationship is teaching you' },
    ],
    interpretPrompt: `Please interpret this Relationship Reflection spread for understanding a significant relationship.

Important context for interpretation:
- Positions 1-3 map the relational field: what each person brings and what emerges between you
- Position 4 (My Blind Spot) requires honesty. Do not soften difficult cards—if the Five of Swords appears here, it means what it means
- Positions 5-6 (Their Experience, The Unspoken) are not telepathy. They surface what you perceived but didn't let yourself fully know—patterns you registered subconsciously, things their behavior told you that you explained away. This is your own deeper read, given permission to surface
- Position 7 asks what this relationship is here to teach—whether it's ongoing, ended, or in transition

This spread works for romantic partners, family members, friendships, professional relationships, or any significant interpersonal dynamic. Please analyze each position with care, explore how the cards interact across the spread, and be direct about difficult truths that emerge.`,
  },
  {
    id: 'right-hand-of-eris',
    name: 'Right Hand of Eris',
    description: 'Decision-making spread: understand your question, what helps and hinders, and choose between two possible outcomes',
    cardCount: 5,
    positions: [
      { name: 'Your Question', description: 'The heart of what you\'re asking about' },
      { name: 'What May Help', description: 'Forces, resources, or attitudes working in your favor' },
      { name: 'What May Hinder', description: 'Obstacles, resistances, or blind spots to watch for' },
      { name: 'Outcome One', description: 'One possible path forward' },
      { name: 'Outcome Two', description: 'Another possible path forward' },
    ],
    interpretPrompt: `Please interpret this Right Hand of Eris spread, a chaos magick divination tool for decision-making.

Important context for interpretation:
- Position 1 (Your Question) reveals the true nature of what's being asked—which may differ from how the querent framed it
- Position 2 (What May Help) shows resources, allies, attitudes, or circumstances that support movement forward
- Position 3 (What May Hinder) reveals obstacles, shadow aspects, or resistances—be direct about difficult cards here
- Positions 4 and 5 (Outcome One and Two) show two possible futures. Neither is inherently "better"—they represent different paths with different costs and rewards

After interpreting each position, help the querent understand what distinguishes the two outcomes and what choosing each might require of them. This is not about predicting which will happen, but about illuminating the choice.`,
  },
];

export const DEFAULT_SPREAD = SPREADS.find(s => s.id === 'celtic-cross')!;

// Legacy export for backwards compatibility
export const SPREAD_POSITIONS = DEFAULT_SPREAD.positions;

export const cards: Card[] = [
  { id: 0, name: "The Fool", number: "0", arcana: "Major Arcana", suit: null, img: "m00.jpg" },
  { id: 1, name: "The Magician", number: "1", arcana: "Major Arcana", suit: null, img: "m01.jpg" },
  { id: 2, name: "The High Priestess", number: "2", arcana: "Major Arcana", suit: null, img: "m02.jpg" },
  { id: 3, name: "The Empress", number: "3", arcana: "Major Arcana", suit: null, img: "m03.jpg" },
  { id: 4, name: "The Emperor", number: "4", arcana: "Major Arcana", suit: null, img: "m04.jpg" },
  { id: 5, name: "The Hierophant", number: "5", arcana: "Major Arcana", suit: null, img: "m05.jpg" },
  { id: 6, name: "The Lovers", number: "6", arcana: "Major Arcana", suit: null, img: "m06.jpg" },
  { id: 7, name: "The Chariot", number: "7", arcana: "Major Arcana", suit: null, img: "m07.jpg" },
  { id: 8, name: "Strength", number: "8", arcana: "Major Arcana", suit: null, img: "m08.jpg" },
  { id: 9, name: "The Hermit", number: "9", arcana: "Major Arcana", suit: null, img: "m09.jpg" },
  { id: 10, name: "Wheel of Fortune", number: "10", arcana: "Major Arcana", suit: null, img: "m10.jpg" },
  { id: 11, name: "Justice", number: "11", arcana: "Major Arcana", suit: null, img: "m11.jpg" },
  { id: 12, name: "The Hanged Man", number: "12", arcana: "Major Arcana", suit: null, img: "m12.jpg" },
  { id: 13, name: "Death", number: "13", arcana: "Major Arcana", suit: null, img: "m13.jpg" },
  { id: 14, name: "Temperance", number: "14", arcana: "Major Arcana", suit: null, img: "m14.jpg" },
  { id: 15, name: "The Devil", number: "15", arcana: "Major Arcana", suit: null, img: "m15.jpg" },
  { id: 16, name: "The Tower", number: "16", arcana: "Major Arcana", suit: null, img: "m16.jpg" },
  { id: 17, name: "The Star", number: "17", arcana: "Major Arcana", suit: null, img: "m17.jpg" },
  { id: 18, name: "The Moon", number: "18", arcana: "Major Arcana", suit: null, img: "m18.jpg" },
  { id: 19, name: "The Sun", number: "19", arcana: "Major Arcana", suit: null, img: "m19.jpg" },
  { id: 20, name: "Judgement", number: "20", arcana: "Major Arcana", suit: null, img: "m20.jpg" },
  { id: 21, name: "The World", number: "21", arcana: "Major Arcana", suit: null, img: "m21.jpg" },
  { id: 22, name: "Ace of Cups", number: "1", arcana: "Minor Arcana", suit: "Cups", img: "c01.jpg" },
  { id: 23, name: "Two of Cups", number: "2", arcana: "Minor Arcana", suit: "Cups", img: "c02.jpg" },
  { id: 24, name: "Three of Cups", number: "3", arcana: "Minor Arcana", suit: "Cups", img: "c03.jpg" },
  { id: 25, name: "Four of Cups", number: "4", arcana: "Minor Arcana", suit: "Cups", img: "c04.jpg" },
  { id: 26, name: "Five of Cups", number: "5", arcana: "Minor Arcana", suit: "Cups", img: "c05.jpg" },
  { id: 27, name: "Six of Cups", number: "6", arcana: "Minor Arcana", suit: "Cups", img: "c06.jpg" },
  { id: 28, name: "Seven of Cups", number: "7", arcana: "Minor Arcana", suit: "Cups", img: "c07.jpg" },
  { id: 29, name: "Eight of Cups", number: "8", arcana: "Minor Arcana", suit: "Cups", img: "c08.jpg" },
  { id: 30, name: "Nine of Cups", number: "9", arcana: "Minor Arcana", suit: "Cups", img: "c09.jpg" },
  { id: 31, name: "Ten of Cups", number: "10", arcana: "Minor Arcana", suit: "Cups", img: "c10.jpg" },
  { id: 32, name: "Page of Cups", number: "11", arcana: "Minor Arcana", suit: "Cups", img: "c11.jpg" },
  { id: 33, name: "Knight of Cups", number: "12", arcana: "Minor Arcana", suit: "Cups", img: "c12.jpg" },
  { id: 34, name: "Queen of Cups", number: "13", arcana: "Minor Arcana", suit: "Cups", img: "c13.jpg" },
  { id: 35, name: "King of Cups", number: "14", arcana: "Minor Arcana", suit: "Cups", img: "c14.jpg" },
  { id: 36, name: "Ace of Swords", number: "1", arcana: "Minor Arcana", suit: "Swords", img: "s01.jpg" },
  { id: 37, name: "Two of Swords", number: "2", arcana: "Minor Arcana", suit: "Swords", img: "s02.jpg" },
  { id: 38, name: "Three of Swords", number: "3", arcana: "Minor Arcana", suit: "Swords", img: "s03.jpg" },
  { id: 39, name: "Four of Swords", number: "4", arcana: "Minor Arcana", suit: "Swords", img: "s04.jpg" },
  { id: 40, name: "Five of Swords", number: "5", arcana: "Minor Arcana", suit: "Swords", img: "s05.jpg" },
  { id: 41, name: "Six of Swords", number: "6", arcana: "Minor Arcana", suit: "Swords", img: "s06.jpg" },
  { id: 42, name: "Seven of Swords", number: "7", arcana: "Minor Arcana", suit: "Swords", img: "s07.jpg" },
  { id: 43, name: "Eight of Swords", number: "8", arcana: "Minor Arcana", suit: "Swords", img: "s08.jpg" },
  { id: 44, name: "Nine of Swords", number: "9", arcana: "Minor Arcana", suit: "Swords", img: "s09.jpg" },
  { id: 45, name: "Ten of Swords", number: "10", arcana: "Minor Arcana", suit: "Swords", img: "s10.jpg" },
  { id: 46, name: "Page of Swords", number: "11", arcana: "Minor Arcana", suit: "Swords", img: "s11.jpg" },
  { id: 47, name: "Knight of Swords", number: "12", arcana: "Minor Arcana", suit: "Swords", img: "s12.jpg" },
  { id: 48, name: "Queen of Swords", number: "13", arcana: "Minor Arcana", suit: "Swords", img: "s13.jpg" },
  { id: 49, name: "King of Swords", number: "14", arcana: "Minor Arcana", suit: "Swords", img: "s14.jpg" },
  { id: 50, name: "Ace of Wands", number: "1", arcana: "Minor Arcana", suit: "Wands", img: "w01.jpg" },
  { id: 51, name: "Two of Wands", number: "2", arcana: "Minor Arcana", suit: "Wands", img: "w02.jpg" },
  { id: 52, name: "Three of Wands", number: "3", arcana: "Minor Arcana", suit: "Wands", img: "w03.jpg" },
  { id: 53, name: "Four of Wands", number: "4", arcana: "Minor Arcana", suit: "Wands", img: "w04.jpg" },
  { id: 54, name: "Five of Wands", number: "5", arcana: "Minor Arcana", suit: "Wands", img: "w05.jpg" },
  { id: 55, name: "Six of Wands", number: "6", arcana: "Minor Arcana", suit: "Wands", img: "w06.jpg" },
  { id: 56, name: "Seven of Wands", number: "7", arcana: "Minor Arcana", suit: "Wands", img: "w07.jpg" },
  { id: 57, name: "Eight of Wands", number: "8", arcana: "Minor Arcana", suit: "Wands", img: "w08.jpg" },
  { id: 58, name: "Nine of Wands", number: "9", arcana: "Minor Arcana", suit: "Wands", img: "w09.jpg" },
  { id: 59, name: "Ten of Wands", number: "10", arcana: "Minor Arcana", suit: "Wands", img: "w10.jpg" },
  { id: 60, name: "Page of Wands", number: "11", arcana: "Minor Arcana", suit: "Wands", img: "w11.jpg" },
  { id: 61, name: "Knight of Wands", number: "12", arcana: "Minor Arcana", suit: "Wands", img: "w12.jpg" },
  { id: 62, name: "Queen of Wands", number: "13", arcana: "Minor Arcana", suit: "Wands", img: "w13.jpg" },
  { id: 63, name: "King of Wands", number: "14", arcana: "Minor Arcana", suit: "Wands", img: "w14.jpg" },
  { id: 64, name: "Ace of Pentacles", number: "1", arcana: "Minor Arcana", suit: "Pentacles", img: "p01.jpg" },
  { id: 65, name: "Two of Pentacles", number: "2", arcana: "Minor Arcana", suit: "Pentacles", img: "p02.jpg" },
  { id: 66, name: "Three of Pentacles", number: "3", arcana: "Minor Arcana", suit: "Pentacles", img: "p03.jpg" },
  { id: 67, name: "Four of Pentacles", number: "4", arcana: "Minor Arcana", suit: "Pentacles", img: "p04.jpg" },
  { id: 68, name: "Five of Pentacles", number: "5", arcana: "Minor Arcana", suit: "Pentacles", img: "p05.jpg" },
  { id: 69, name: "Six of Pentacles", number: "6", arcana: "Minor Arcana", suit: "Pentacles", img: "p06.jpg" },
  { id: 70, name: "Seven of Pentacles", number: "7", arcana: "Minor Arcana", suit: "Pentacles", img: "p07.jpg" },
  { id: 71, name: "Eight of Pentacles", number: "8", arcana: "Minor Arcana", suit: "Pentacles", img: "p08.jpg" },
  { id: 72, name: "Nine of Pentacles", number: "9", arcana: "Minor Arcana", suit: "Pentacles", img: "p09.jpg" },
  { id: 73, name: "Ten of Pentacles", number: "10", arcana: "Minor Arcana", suit: "Pentacles", img: "p10.jpg" },
  { id: 74, name: "Page of Pentacles", number: "11", arcana: "Minor Arcana", suit: "Pentacles", img: "p11.jpg" },
  { id: 75, name: "Knight of Pentacles", number: "12", arcana: "Minor Arcana", suit: "Pentacles", img: "p12.jpg" },
  { id: 76, name: "Queen of Pentacles", number: "13", arcana: "Minor Arcana", suit: "Pentacles", img: "p13.jpg" },
  { id: 77, name: "King of Pentacles", number: "14", arcana: "Minor Arcana", suit: "Pentacles", img: "p14.jpg" },
];

export function getCardById(id: number): Card | undefined {
  return cards.find(c => c.id === id);
}

export function getCardImagePath(card: Card): string {
  return `/cards/${card.img}`;
}
