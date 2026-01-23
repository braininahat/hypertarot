// I Ching (Book of Changes) Data
// 64 Hexagrams composed of 8 Trigrams

export type LineType = 'yang' | 'yin'; // solid or broken
export type ChangingLineType = 'old_yang' | 'young_yang' | 'young_yin' | 'old_yin';
// old_yang (9) changes to yin, old_yin (6) changes to yang
// young_yang (7) and young_yin (8) are stable

export interface Trigram {
  name: string;
  chinese: string;
  attribute: string;
  image: string;
  lines: [LineType, LineType, LineType]; // bottom to top
}

export const TRIGRAMS: Record<string, Trigram> = {
  qian: { name: 'Qian', chinese: '乾', attribute: 'Creative', image: 'Heaven', lines: ['yang', 'yang', 'yang'] },
  kun: { name: 'Kun', chinese: '坤', attribute: 'Receptive', image: 'Earth', lines: ['yin', 'yin', 'yin'] },
  zhen: { name: 'Zhen', chinese: '震', attribute: 'Arousing', image: 'Thunder', lines: ['yang', 'yin', 'yin'] },
  kan: { name: 'Kan', chinese: '坎', attribute: 'Abysmal', image: 'Water', lines: ['yin', 'yang', 'yin'] },
  gen: { name: 'Gen', chinese: '艮', attribute: 'Stillness', image: 'Mountain', lines: ['yin', 'yin', 'yang'] },
  xun: { name: 'Xun', chinese: '巽', attribute: 'Gentle', image: 'Wind/Wood', lines: ['yin', 'yang', 'yang'] },
  li: { name: 'Li', chinese: '離', attribute: 'Clinging', image: 'Fire', lines: ['yang', 'yin', 'yang'] },
  dui: { name: 'Dui', chinese: '兌', attribute: 'Joyous', image: 'Lake', lines: ['yang', 'yang', 'yin'] },
};

export interface Hexagram {
  number: number;
  name: string;
  chinese: string;
  pinyin: string;
  upperTrigram: string; // key into TRIGRAMS
  lowerTrigram: string;
  judgment: string;
  image: string;
  lines: [LineType, LineType, LineType, LineType, LineType, LineType]; // bottom to top
}

export interface IChing_Spread {
  id: string;
  name: string;
  description: string;
  interpretPrompt: string;
}

export const ICHING_SPREADS: IChing_Spread[] = [
  {
    id: 'single-hexagram',
    name: 'Single Hexagram',
    description: 'Cast one hexagram with changing lines to reveal present situation and its transformation',
    interpretPrompt: `Please interpret this I Ching reading. You have been given a primary hexagram and, if there are changing lines, a transformed hexagram.

For the interpretation:
1. Begin with the primary hexagram's overall meaning and how it relates to the querent's situation
2. Examine each changing line specifically - these are the active, dynamic points of the reading
3. If there is a transformed hexagram, explain how the situation is evolving from the primary state to this new state
4. The changing lines bridge the two hexagrams - they show the process of transformation

Remember: Changing lines (old yang ⚊○ and old yin ⚋×) are where the energy is most active. They indicate where change is happening or needs to happen.`,
  },
  {
    id: 'past-future',
    name: 'Past & Future',
    description: 'Two separate castings: one for where you have been, one for where you are going',
    interpretPrompt: `Please interpret this two-hexagram I Ching reading showing Past and Future.

The first hexagram (with its changing lines and transformation) represents the past - the energies and patterns that have shaped the current moment.

The second hexagram (with its changing lines and transformation) represents the future - the energies and patterns that are emerging.

Consider:
1. What story does the past hexagram tell about how the querent arrived at this moment?
2. What is the future hexagram suggesting about the path ahead?
3. How do these two readings relate to each other? Is there continuity, contrast, or evolution?
4. Pay special attention to any trigrams that appear in both readings - they may indicate persistent themes.`,
  },
  {
    id: 'three-coins',
    name: 'Three Questions',
    description: 'Three separate castings for three related aspects of a situation',
    interpretPrompt: `Please interpret this three-hexagram I Ching reading addressing three aspects of the querent's situation.

Each hexagram represents a different facet or question:
1. The first hexagram: The situation as it currently stands
2. The second hexagram: The challenge or obstacle
3. The third hexagram: The guidance or way forward

Analyze each hexagram with its changing lines and transformations, then synthesize how they work together to illuminate the querent's path.`,
  },
];

export const DEFAULT_ICHING_SPREAD = ICHING_SPREADS[0];

// The 64 Hexagrams in King Wen sequence
export const HEXAGRAMS: Hexagram[] = [
  {
    number: 1,
    name: 'The Creative',
    chinese: '乾',
    pinyin: 'Qián',
    upperTrigram: 'qian',
    lowerTrigram: 'qian',
    judgment: 'The Creative works sublime success, furthering through perseverance.',
    image: 'The movement of heaven is full of power. Thus the superior man makes himself strong and untiring.',
    lines: ['yang', 'yang', 'yang', 'yang', 'yang', 'yang'],
  },
  {
    number: 2,
    name: 'The Receptive',
    chinese: '坤',
    pinyin: 'Kūn',
    upperTrigram: 'kun',
    lowerTrigram: 'kun',
    judgment: 'The Receptive brings about sublime success, furthering through the perseverance of a mare.',
    image: 'The earth\'s condition is receptive devotion. Thus the superior man who has breadth of character carries the outer world.',
    lines: ['yin', 'yin', 'yin', 'yin', 'yin', 'yin'],
  },
  {
    number: 3,
    name: 'Difficulty at the Beginning',
    chinese: '屯',
    pinyin: 'Zhūn',
    upperTrigram: 'kan',
    lowerTrigram: 'zhen',
    judgment: 'Difficulty at the Beginning works supreme success, furthering through perseverance. Nothing should be undertaken. It furthers one to appoint helpers.',
    image: 'Clouds and thunder: the image of Difficulty at the Beginning. Thus the superior man brings order out of confusion.',
    lines: ['yang', 'yin', 'yin', 'yin', 'yang', 'yin'],
  },
  {
    number: 4,
    name: 'Youthful Folly',
    chinese: '蒙',
    pinyin: 'Méng',
    upperTrigram: 'gen',
    lowerTrigram: 'kan',
    judgment: 'Youthful Folly has success. It is not I who seek the young fool; the young fool seeks me.',
    image: 'A spring wells up at the foot of the mountain: the image of Youth. Thus the superior man fosters his character by thoroughness in all that he does.',
    lines: ['yin', 'yang', 'yin', 'yin', 'yin', 'yang'],
  },
  {
    number: 5,
    name: 'Waiting',
    chinese: '需',
    pinyin: 'Xū',
    upperTrigram: 'kan',
    lowerTrigram: 'qian',
    judgment: 'Waiting. If you are sincere, you have light and success. Perseverance brings good fortune.',
    image: 'Clouds rise up to heaven: the image of Waiting. Thus the superior man eats and drinks, is joyous and of good cheer.',
    lines: ['yang', 'yang', 'yang', 'yin', 'yang', 'yin'],
  },
  {
    number: 6,
    name: 'Conflict',
    chinese: '訟',
    pinyin: 'Sòng',
    upperTrigram: 'qian',
    lowerTrigram: 'kan',
    judgment: 'Conflict. You are sincere and are being obstructed. A cautious halt halfway brings good fortune.',
    image: 'Heaven and water go their opposite ways: the image of Conflict. Thus in all his transactions the superior man carefully considers the beginning.',
    lines: ['yin', 'yang', 'yin', 'yang', 'yang', 'yang'],
  },
  {
    number: 7,
    name: 'The Army',
    chinese: '師',
    pinyin: 'Shī',
    upperTrigram: 'kun',
    lowerTrigram: 'kan',
    judgment: 'The Army. The army needs perseverance and a strong man. Good fortune without blame.',
    image: 'In the middle of the earth is water: the image of the Army. Thus the superior man increases his masses by generosity toward the people.',
    lines: ['yin', 'yang', 'yin', 'yin', 'yin', 'yin'],
  },
  {
    number: 8,
    name: 'Holding Together',
    chinese: '比',
    pinyin: 'Bǐ',
    upperTrigram: 'kan',
    lowerTrigram: 'kun',
    judgment: 'Holding Together brings good fortune. Inquire of the oracle once again whether you possess sublimity, constancy, and perseverance.',
    image: 'On the earth is water: the image of Holding Together. Thus the kings of antiquity bestowed the different states as fiefs and cultivated friendly relations with the feudal lords.',
    lines: ['yin', 'yin', 'yin', 'yin', 'yang', 'yin'],
  },
  {
    number: 9,
    name: 'Small Taming',
    chinese: '小畜',
    pinyin: 'Xiǎo Chù',
    upperTrigram: 'xun',
    lowerTrigram: 'qian',
    judgment: 'The Taming Power of the Small has success. Dense clouds, no rain from our western region.',
    image: 'The wind drives across heaven: the image of the Taming Power of the Small. Thus the superior man refines the outward aspect of his nature.',
    lines: ['yang', 'yang', 'yang', 'yin', 'yang', 'yang'],
  },
  {
    number: 10,
    name: 'Treading',
    chinese: '履',
    pinyin: 'Lǚ',
    upperTrigram: 'qian',
    lowerTrigram: 'dui',
    judgment: 'Treading upon the tail of the tiger. It does not bite the man. Success.',
    image: 'Heaven above, the lake below: the image of Treading. Thus the superior man discriminates between high and low.',
    lines: ['yang', 'yang', 'yin', 'yang', 'yang', 'yang'],
  },
  {
    number: 11,
    name: 'Peace',
    chinese: '泰',
    pinyin: 'Tài',
    upperTrigram: 'kun',
    lowerTrigram: 'qian',
    judgment: 'Peace. The small departs, the great approaches. Good fortune. Success.',
    image: 'Heaven and earth unite: the image of Peace. Thus the ruler divides and completes the course of heaven and earth.',
    lines: ['yang', 'yang', 'yang', 'yin', 'yin', 'yin'],
  },
  {
    number: 12,
    name: 'Standstill',
    chinese: '否',
    pinyin: 'Pǐ',
    upperTrigram: 'qian',
    lowerTrigram: 'kun',
    judgment: 'Standstill. Evil people do not further the perseverance of the superior man. The great departs; the small approaches.',
    image: 'Heaven and earth do not unite: the image of Standstill. Thus the superior man falls back upon his inner worth.',
    lines: ['yin', 'yin', 'yin', 'yang', 'yang', 'yang'],
  },
  {
    number: 13,
    name: 'Fellowship',
    chinese: '同人',
    pinyin: 'Tóng Rén',
    upperTrigram: 'qian',
    lowerTrigram: 'li',
    judgment: 'Fellowship with Men in the open. Success. It furthers one to cross the great water.',
    image: 'Heaven together with fire: the image of Fellowship with Men. Thus the superior man organizes the clans and makes distinctions between things.',
    lines: ['yang', 'yin', 'yang', 'yang', 'yang', 'yang'],
  },
  {
    number: 14,
    name: 'Great Possession',
    chinese: '大有',
    pinyin: 'Dà Yǒu',
    upperTrigram: 'li',
    lowerTrigram: 'qian',
    judgment: 'Possession in Great Measure. Supreme success.',
    image: 'Fire in heaven above: the image of Possession in Great Measure. Thus the superior man curbs evil and furthers good.',
    lines: ['yang', 'yang', 'yang', 'yang', 'yin', 'yang'],
  },
  {
    number: 15,
    name: 'Modesty',
    chinese: '謙',
    pinyin: 'Qiān',
    upperTrigram: 'kun',
    lowerTrigram: 'gen',
    judgment: 'Modesty creates success. The superior man carries things through.',
    image: 'Within the earth, a mountain: the image of Modesty. Thus the superior man reduces that which is too much, and augments that which is too little.',
    lines: ['yin', 'yin', 'yang', 'yin', 'yin', 'yin'],
  },
  {
    number: 16,
    name: 'Enthusiasm',
    chinese: '豫',
    pinyin: 'Yù',
    upperTrigram: 'zhen',
    lowerTrigram: 'kun',
    judgment: 'Enthusiasm. It furthers one to install helpers and to set armies marching.',
    image: 'Thunder comes resounding out of the earth: the image of Enthusiasm. Thus the ancient kings made music in order to honor merit.',
    lines: ['yin', 'yin', 'yin', 'yang', 'yin', 'yin'],
  },
  {
    number: 17,
    name: 'Following',
    chinese: '隨',
    pinyin: 'Suí',
    upperTrigram: 'dui',
    lowerTrigram: 'zhen',
    judgment: 'Following has supreme success. Perseverance furthers. No blame.',
    image: 'Thunder in the middle of the lake: the image of Following. Thus the superior man at nightfall goes indoors for rest and recuperation.',
    lines: ['yang', 'yin', 'yin', 'yang', 'yang', 'yin'],
  },
  {
    number: 18,
    name: 'Work on the Decayed',
    chinese: '蠱',
    pinyin: 'Gǔ',
    upperTrigram: 'gen',
    lowerTrigram: 'xun',
    judgment: 'Work on what has been spoiled has supreme success. It furthers one to cross the great water.',
    image: 'The wind blows low on the mountain: the image of Decay. Thus the superior man stirs up the people and strengthens their spirit.',
    lines: ['yin', 'yang', 'yang', 'yin', 'yin', 'yang'],
  },
  {
    number: 19,
    name: 'Approach',
    chinese: '臨',
    pinyin: 'Lín',
    upperTrigram: 'kun',
    lowerTrigram: 'dui',
    judgment: 'Approach has supreme success. Perseverance furthers. When the eighth month comes, there will be misfortune.',
    image: 'The earth above the lake: the image of Approach. Thus the superior man is inexhaustible in his will to teach.',
    lines: ['yang', 'yang', 'yin', 'yin', 'yin', 'yin'],
  },
  {
    number: 20,
    name: 'Contemplation',
    chinese: '觀',
    pinyin: 'Guān',
    upperTrigram: 'xun',
    lowerTrigram: 'kun',
    judgment: 'Contemplation. The ablution has been made, but not yet the offering. Full of trust they look up to him.',
    image: 'The wind blows over the earth: the image of Contemplation. Thus the kings of old visited the regions of the world, contemplated the people, and gave them instruction.',
    lines: ['yin', 'yin', 'yin', 'yin', 'yang', 'yang'],
  },
  {
    number: 21,
    name: 'Biting Through',
    chinese: '噬嗑',
    pinyin: 'Shì Kè',
    upperTrigram: 'li',
    lowerTrigram: 'zhen',
    judgment: 'Biting Through has success. It is favorable to let justice be administered.',
    image: 'Thunder and lightning: the image of Biting Through. Thus the kings of former times made firm the laws through clearly defined penalties.',
    lines: ['yang', 'yin', 'yin', 'yang', 'yin', 'yang'],
  },
  {
    number: 22,
    name: 'Grace',
    chinese: '賁',
    pinyin: 'Bì',
    upperTrigram: 'gen',
    lowerTrigram: 'li',
    judgment: 'Grace has success. In small matters it is favorable to undertake something.',
    image: 'Fire at the foot of the mountain: the image of Grace. Thus does the superior man proceed when clearing up current affairs.',
    lines: ['yang', 'yin', 'yang', 'yin', 'yin', 'yang'],
  },
  {
    number: 23,
    name: 'Splitting Apart',
    chinese: '剝',
    pinyin: 'Bō',
    upperTrigram: 'gen',
    lowerTrigram: 'kun',
    judgment: 'Splitting Apart. It does not further one to go anywhere.',
    image: 'The mountain rests on the earth: the image of Splitting Apart. Thus those above can ensure their position only by giving generously to those below.',
    lines: ['yin', 'yin', 'yin', 'yin', 'yin', 'yang'],
  },
  {
    number: 24,
    name: 'Return',
    chinese: '復',
    pinyin: 'Fù',
    upperTrigram: 'kun',
    lowerTrigram: 'zhen',
    judgment: 'Return. Success. Going out and coming in without error. Friends come without blame.',
    image: 'Thunder within the earth: the image of the Turning Point. Thus the kings of antiquity closed the passes at the time of solstice.',
    lines: ['yang', 'yin', 'yin', 'yin', 'yin', 'yin'],
  },
  {
    number: 25,
    name: 'Innocence',
    chinese: '無妄',
    pinyin: 'Wú Wàng',
    upperTrigram: 'qian',
    lowerTrigram: 'zhen',
    judgment: 'Innocence. Supreme success. Perseverance furthers. If someone is not as he should be, he has misfortune.',
    image: 'Under heaven thunder rolls: all things attain the natural state of innocence. Thus the kings of old, rich in virtue and in harmony with the time, fostered and nourished all beings.',
    lines: ['yang', 'yin', 'yin', 'yang', 'yang', 'yang'],
  },
  {
    number: 26,
    name: 'Great Taming',
    chinese: '大畜',
    pinyin: 'Dà Chù',
    upperTrigram: 'gen',
    lowerTrigram: 'qian',
    judgment: 'The Taming Power of the Great. Perseverance furthers. Not eating at home brings good fortune.',
    image: 'Heaven within the mountain: the image of the Taming Power of the Great. Thus the superior man acquaints himself with many sayings of antiquity.',
    lines: ['yang', 'yang', 'yang', 'yin', 'yin', 'yang'],
  },
  {
    number: 27,
    name: 'Nourishment',
    chinese: '頤',
    pinyin: 'Yí',
    upperTrigram: 'gen',
    lowerTrigram: 'zhen',
    judgment: 'The Corners of the Mouth. Perseverance brings good fortune. Pay heed to the providing of nourishment.',
    image: 'At the foot of the mountain, thunder: the image of Providing Nourishment. Thus the superior man is careful of his words and temperate in eating and drinking.',
    lines: ['yang', 'yin', 'yin', 'yin', 'yin', 'yang'],
  },
  {
    number: 28,
    name: 'Great Excess',
    chinese: '大過',
    pinyin: 'Dà Guò',
    upperTrigram: 'dui',
    lowerTrigram: 'xun',
    judgment: 'Preponderance of the Great. The ridgepole sags to the breaking point. It furthers one to have somewhere to go.',
    image: 'The lake rises above the trees: the image of Preponderance of the Great. Thus the superior man, when he stands alone, is unconcerned.',
    lines: ['yin', 'yang', 'yang', 'yang', 'yang', 'yin'],
  },
  {
    number: 29,
    name: 'The Abysmal',
    chinese: '坎',
    pinyin: 'Kǎn',
    upperTrigram: 'kan',
    lowerTrigram: 'kan',
    judgment: 'The Abysmal repeated. If you are sincere, you have success in your heart, and whatever you do succeeds.',
    image: 'Water flows on and reaches the goal: the image of the Abysmal repeated. Thus the superior man walks in lasting virtue and carries on the business of teaching.',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yin'],
  },
  {
    number: 30,
    name: 'The Clinging',
    chinese: '離',
    pinyin: 'Lí',
    upperTrigram: 'li',
    lowerTrigram: 'li',
    judgment: 'The Clinging. Perseverance furthers. It brings success. Care of the cow brings good fortune.',
    image: 'That which is bright rises twice: the image of Fire. Thus the great man, by perpetuating this brightness, illumines the four quarters of the world.',
    lines: ['yang', 'yin', 'yang', 'yang', 'yin', 'yang'],
  },
  {
    number: 31,
    name: 'Influence',
    chinese: '咸',
    pinyin: 'Xián',
    upperTrigram: 'dui',
    lowerTrigram: 'gen',
    judgment: 'Influence. Success. Perseverance furthers. To take a maiden to wife brings good fortune.',
    image: 'A lake on the mountain: the image of Influence. Thus the superior man encourages people to approach him by his readiness to receive them.',
    lines: ['yin', 'yin', 'yang', 'yang', 'yang', 'yin'],
  },
  {
    number: 32,
    name: 'Duration',
    chinese: '恆',
    pinyin: 'Héng',
    upperTrigram: 'zhen',
    lowerTrigram: 'xun',
    judgment: 'Duration. Success. No blame. Perseverance furthers. It furthers one to have somewhere to go.',
    image: 'Thunder and wind: the image of Duration. Thus the superior man stands firm and does not change his direction.',
    lines: ['yin', 'yang', 'yang', 'yang', 'yin', 'yin'],
  },
  {
    number: 33,
    name: 'Retreat',
    chinese: '遯',
    pinyin: 'Dùn',
    upperTrigram: 'qian',
    lowerTrigram: 'gen',
    judgment: 'Retreat. Success. In what is small, perseverance furthers.',
    image: 'Mountain under heaven: the image of Retreat. Thus the superior man keeps the inferior man at a distance, not angrily but with reserve.',
    lines: ['yin', 'yin', 'yang', 'yang', 'yang', 'yang'],
  },
  {
    number: 34,
    name: 'Great Power',
    chinese: '大壯',
    pinyin: 'Dà Zhuàng',
    upperTrigram: 'zhen',
    lowerTrigram: 'qian',
    judgment: 'The Power of the Great. Perseverance furthers.',
    image: 'Thunder in heaven above: the image of the Power of the Great. Thus the superior man does not tread upon paths that do not accord with established order.',
    lines: ['yang', 'yang', 'yang', 'yang', 'yin', 'yin'],
  },
  {
    number: 35,
    name: 'Progress',
    chinese: '晉',
    pinyin: 'Jìn',
    upperTrigram: 'li',
    lowerTrigram: 'kun',
    judgment: 'Progress. The powerful prince is honored with horses in large numbers. In a single day he is granted audience three times.',
    image: 'The sun rises over the earth: the image of Progress. Thus the superior man himself brightens his bright virtue.',
    lines: ['yin', 'yin', 'yin', 'yang', 'yin', 'yang'],
  },
  {
    number: 36,
    name: 'Darkening of the Light',
    chinese: '明夷',
    pinyin: 'Míng Yí',
    upperTrigram: 'kun',
    lowerTrigram: 'li',
    judgment: 'Darkening of the Light. In adversity it furthers one to be persevering.',
    image: 'The light has sunk into the earth: the image of Darkening of the Light. Thus does the superior man live with the great mass: he veils his light, yet still shines.',
    lines: ['yang', 'yin', 'yang', 'yin', 'yin', 'yin'],
  },
  {
    number: 37,
    name: 'The Family',
    chinese: '家人',
    pinyin: 'Jiā Rén',
    upperTrigram: 'xun',
    lowerTrigram: 'li',
    judgment: 'The Family. The perseverance of the woman furthers.',
    image: 'Wind comes forth from fire: the image of the Family. Thus the superior man has substance in his words and duration in his way of life.',
    lines: ['yang', 'yin', 'yang', 'yin', 'yang', 'yang'],
  },
  {
    number: 38,
    name: 'Opposition',
    chinese: '睽',
    pinyin: 'Kuí',
    upperTrigram: 'li',
    lowerTrigram: 'dui',
    judgment: 'Opposition. In small matters, good fortune.',
    image: 'Above, fire; below, the lake: the image of Opposition. Thus amid all fellowship the superior man retains his individuality.',
    lines: ['yang', 'yang', 'yin', 'yang', 'yin', 'yang'],
  },
  {
    number: 39,
    name: 'Obstruction',
    chinese: '蹇',
    pinyin: 'Jiǎn',
    upperTrigram: 'kan',
    lowerTrigram: 'gen',
    judgment: 'Obstruction. The southwest furthers. The northeast does not further. It furthers one to see the great man.',
    image: 'Water on the mountain: the image of Obstruction. Thus the superior man turns his attention to himself and molds his character.',
    lines: ['yin', 'yin', 'yang', 'yin', 'yang', 'yin'],
  },
  {
    number: 40,
    name: 'Deliverance',
    chinese: '解',
    pinyin: 'Xiè',
    upperTrigram: 'zhen',
    lowerTrigram: 'kan',
    judgment: 'Deliverance. The southwest furthers. If there is no longer anything where one has to go, return brings good fortune.',
    image: 'Thunder and rain set in: the image of Deliverance. Thus the superior man pardons mistakes and forgives misdeeds.',
    lines: ['yin', 'yang', 'yin', 'yang', 'yin', 'yin'],
  },
  {
    number: 41,
    name: 'Decrease',
    chinese: '損',
    pinyin: 'Sǔn',
    upperTrigram: 'gen',
    lowerTrigram: 'dui',
    judgment: 'Decrease combined with sincerity brings about supreme good fortune without blame. One may be persevering in this.',
    image: 'At the foot of the mountain, the lake: the image of Decrease. Thus the superior man controls his anger and restrains his instincts.',
    lines: ['yang', 'yang', 'yin', 'yin', 'yin', 'yang'],
  },
  {
    number: 42,
    name: 'Increase',
    chinese: '益',
    pinyin: 'Yì',
    upperTrigram: 'xun',
    lowerTrigram: 'zhen',
    judgment: 'Increase. It furthers one to undertake something. It furthers one to cross the great water.',
    image: 'Wind and thunder: the image of Increase. Thus the superior man: if he sees good, he imitates it; if he has faults, he rids himself of them.',
    lines: ['yang', 'yin', 'yin', 'yin', 'yang', 'yang'],
  },
  {
    number: 43,
    name: 'Breakthrough',
    chinese: '夬',
    pinyin: 'Guài',
    upperTrigram: 'dui',
    lowerTrigram: 'qian',
    judgment: 'Breakthrough. One must resolutely make the matter known at the court of the king. It must be announced truthfully. Danger.',
    image: 'The lake has risen up to heaven: the image of Breakthrough. Thus the superior man dispenses riches downward and refrains from resting on his virtue.',
    lines: ['yang', 'yang', 'yang', 'yang', 'yang', 'yin'],
  },
  {
    number: 44,
    name: 'Coming to Meet',
    chinese: '姤',
    pinyin: 'Gòu',
    upperTrigram: 'qian',
    lowerTrigram: 'xun',
    judgment: 'Coming to Meet. The maiden is powerful. One should not marry such a maiden.',
    image: 'Under heaven, wind: the image of Coming to Meet. Thus does the prince act when disseminating his commands and proclaiming them to the four quarters of heaven.',
    lines: ['yin', 'yang', 'yang', 'yang', 'yang', 'yang'],
  },
  {
    number: 45,
    name: 'Gathering Together',
    chinese: '萃',
    pinyin: 'Cuì',
    upperTrigram: 'dui',
    lowerTrigram: 'kun',
    judgment: 'Gathering Together. Success. The king approaches his temple. It furthers one to see the great man.',
    image: 'Over the earth, the lake: the image of Gathering Together. Thus the superior man renews his weapons in order to meet the unforeseen.',
    lines: ['yin', 'yin', 'yin', 'yang', 'yang', 'yin'],
  },
  {
    number: 46,
    name: 'Pushing Upward',
    chinese: '升',
    pinyin: 'Shēng',
    upperTrigram: 'kun',
    lowerTrigram: 'xun',
    judgment: 'Pushing Upward has supreme success. One must see the great man. Fear not. Departure toward the south brings good fortune.',
    image: 'Within the earth, wood grows: the image of Pushing Upward. Thus the superior man of devoted character heaps up small things in order to achieve something high and great.',
    lines: ['yin', 'yang', 'yang', 'yin', 'yin', 'yin'],
  },
  {
    number: 47,
    name: 'Oppression',
    chinese: '困',
    pinyin: 'Kùn',
    upperTrigram: 'dui',
    lowerTrigram: 'kan',
    judgment: 'Oppression. Success. Perseverance. The great man brings about good fortune. No blame. When one has something to say, it is not believed.',
    image: 'There is no water in the lake: the image of Exhaustion. Thus the superior man stakes his life on following his will.',
    lines: ['yin', 'yang', 'yin', 'yang', 'yang', 'yin'],
  },
  {
    number: 48,
    name: 'The Well',
    chinese: '井',
    pinyin: 'Jǐng',
    upperTrigram: 'kan',
    lowerTrigram: 'xun',
    judgment: 'The Well. The town may be changed, but the well cannot be changed. It neither decreases nor increases.',
    image: 'Water over wood: the image of the Well. Thus the superior man encourages the people at their work and exhorts them to help one another.',
    lines: ['yin', 'yang', 'yang', 'yin', 'yang', 'yin'],
  },
  {
    number: 49,
    name: 'Revolution',
    chinese: '革',
    pinyin: 'Gé',
    upperTrigram: 'dui',
    lowerTrigram: 'li',
    judgment: 'Revolution. On your own day you are believed. Supreme success, furthering through perseverance. Remorse disappears.',
    image: 'Fire in the lake: the image of Revolution. Thus the superior man sets the calendar in order and makes the seasons clear.',
    lines: ['yang', 'yin', 'yang', 'yang', 'yang', 'yin'],
  },
  {
    number: 50,
    name: 'The Cauldron',
    chinese: '鼎',
    pinyin: 'Dǐng',
    upperTrigram: 'li',
    lowerTrigram: 'xun',
    judgment: 'The Cauldron. Supreme good fortune. Success.',
    image: 'Fire over wood: the image of the Cauldron. Thus the superior man consolidates his fate by making his position correct.',
    lines: ['yin', 'yang', 'yang', 'yang', 'yin', 'yang'],
  },
  {
    number: 51,
    name: 'The Arousing',
    chinese: '震',
    pinyin: 'Zhèn',
    upperTrigram: 'zhen',
    lowerTrigram: 'zhen',
    judgment: 'Shock brings success. Shock comes—oh, oh! Laughing words—ha, ha! The shock terrifies for a hundred miles.',
    image: 'Thunder repeated: the image of Shock. Thus in fear and trembling the superior man sets his life in order and examines himself.',
    lines: ['yang', 'yin', 'yin', 'yang', 'yin', 'yin'],
  },
  {
    number: 52,
    name: 'Keeping Still',
    chinese: '艮',
    pinyin: 'Gèn',
    upperTrigram: 'gen',
    lowerTrigram: 'gen',
    judgment: 'Keeping Still. Keeping his back still so that he no longer feels his body. He goes into his courtyard and does not see his people. No blame.',
    image: 'Mountains standing close together: the image of Keeping Still. Thus the superior man does not permit his thoughts to go beyond his situation.',
    lines: ['yin', 'yin', 'yang', 'yin', 'yin', 'yang'],
  },
  {
    number: 53,
    name: 'Development',
    chinese: '漸',
    pinyin: 'Jiàn',
    upperTrigram: 'xun',
    lowerTrigram: 'gen',
    judgment: 'Development. The maiden is given in marriage. Good fortune. Perseverance furthers.',
    image: 'On the mountain, a tree: the image of Development. Thus the superior man abides in dignity and virtue, in order to improve the mores.',
    lines: ['yin', 'yin', 'yang', 'yin', 'yang', 'yang'],
  },
  {
    number: 54,
    name: 'The Marrying Maiden',
    chinese: '歸妹',
    pinyin: 'Guī Mèi',
    upperTrigram: 'zhen',
    lowerTrigram: 'dui',
    judgment: 'The Marrying Maiden. Undertakings bring misfortune. Nothing that would further.',
    image: 'Thunder over the lake: the image of the Marrying Maiden. Thus the superior man understands the transitory in the light of the eternity of the end.',
    lines: ['yang', 'yang', 'yin', 'yang', 'yin', 'yin'],
  },
  {
    number: 55,
    name: 'Abundance',
    chinese: '豐',
    pinyin: 'Fēng',
    upperTrigram: 'zhen',
    lowerTrigram: 'li',
    judgment: 'Abundance has success. The king attains abundance. Be not sad. Be like the sun at midday.',
    image: 'Both thunder and lightning come: the image of Abundance. Thus the superior man decides lawsuits and carries out punishments.',
    lines: ['yang', 'yin', 'yang', 'yang', 'yin', 'yin'],
  },
  {
    number: 56,
    name: 'The Wanderer',
    chinese: '旅',
    pinyin: 'Lǚ',
    upperTrigram: 'li',
    lowerTrigram: 'gen',
    judgment: 'The Wanderer. Success through smallness. Perseverance brings good fortune to the wanderer.',
    image: 'Fire on the mountain: the image of the Wanderer. Thus the superior man is clear-minded and cautious in imposing penalties, and protracts no lawsuits.',
    lines: ['yin', 'yin', 'yang', 'yang', 'yin', 'yang'],
  },
  {
    number: 57,
    name: 'The Gentle',
    chinese: '巽',
    pinyin: 'Xùn',
    upperTrigram: 'xun',
    lowerTrigram: 'xun',
    judgment: 'The Gentle. Success through what is small. It furthers one to have somewhere to go. It furthers one to see the great man.',
    image: 'Winds following one upon the other: the image of the Gently Penetrating. Thus the superior man spreads his commands abroad and carries out his undertakings.',
    lines: ['yin', 'yang', 'yang', 'yin', 'yang', 'yang'],
  },
  {
    number: 58,
    name: 'The Joyous',
    chinese: '兌',
    pinyin: 'Duì',
    upperTrigram: 'dui',
    lowerTrigram: 'dui',
    judgment: 'The Joyous. Success. Perseverance is favorable.',
    image: 'Lakes resting one on the other: the image of the Joyous. Thus the superior man joins with his friends for discussion and practice.',
    lines: ['yang', 'yang', 'yin', 'yang', 'yang', 'yin'],
  },
  {
    number: 59,
    name: 'Dispersion',
    chinese: '渙',
    pinyin: 'Huàn',
    upperTrigram: 'xun',
    lowerTrigram: 'kan',
    judgment: 'Dispersion. Success. The king approaches his temple. It furthers one to cross the great water. Perseverance furthers.',
    image: 'The wind drives over the water: the image of Dispersion. Thus the kings of old sacrificed to the Lord and built temples.',
    lines: ['yin', 'yang', 'yin', 'yin', 'yang', 'yang'],
  },
  {
    number: 60,
    name: 'Limitation',
    chinese: '節',
    pinyin: 'Jié',
    upperTrigram: 'kan',
    lowerTrigram: 'dui',
    judgment: 'Limitation. Success. Galling limitation must not be persevered in.',
    image: 'Water over lake: the image of Limitation. Thus the superior man creates number and measure, and examines the nature of virtue and correct conduct.',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yin'],
  },
  {
    number: 61,
    name: 'Inner Truth',
    chinese: '中孚',
    pinyin: 'Zhōng Fú',
    upperTrigram: 'xun',
    lowerTrigram: 'dui',
    judgment: 'Inner Truth. Pigs and fishes. Good fortune. It furthers one to cross the great water. Perseverance furthers.',
    image: 'Wind over lake: the image of Inner Truth. Thus the superior man discusses criminal cases in order to delay executions.',
    lines: ['yang', 'yang', 'yin', 'yin', 'yang', 'yang'],
  },
  {
    number: 62,
    name: 'Small Excess',
    chinese: '小過',
    pinyin: 'Xiǎo Guò',
    upperTrigram: 'zhen',
    lowerTrigram: 'gen',
    judgment: 'Preponderance of the Small. Success. Perseverance furthers. Small things may be done; great things should not be done.',
    image: 'Thunder on the mountain: the image of Preponderance of the Small. Thus in his conduct the superior man gives preponderance to reverence.',
    lines: ['yin', 'yin', 'yang', 'yang', 'yin', 'yin'],
  },
  {
    number: 63,
    name: 'After Completion',
    chinese: '既濟',
    pinyin: 'Jì Jì',
    upperTrigram: 'kan',
    lowerTrigram: 'li',
    judgment: 'After Completion. Success in small matters. Perseverance furthers. At the beginning good fortune, at the end disorder.',
    image: 'Water over fire: the image of the condition in After Completion. Thus the superior man takes thought of misfortune and arms himself against it in advance.',
    lines: ['yang', 'yin', 'yang', 'yin', 'yang', 'yin'],
  },
  {
    number: 64,
    name: 'Before Completion',
    chinese: '未濟',
    pinyin: 'Wèi Jì',
    upperTrigram: 'li',
    lowerTrigram: 'kan',
    judgment: 'Before Completion. Success. But if the little fox, after nearly completing the crossing, gets his tail in the water, there is nothing that would further.',
    image: 'Fire over water: the image of the condition before transition. Thus the superior man is careful in the differentiation of things, so that each finds its place.',
    lines: ['yin', 'yang', 'yin', 'yang', 'yin', 'yang'],
  },
];

export function getHexagramByNumber(num: number): Hexagram | undefined {
  return HEXAGRAMS.find(h => h.number === num);
}

export function getHexagramByLines(lines: [LineType, LineType, LineType, LineType, LineType, LineType]): Hexagram | undefined {
  return HEXAGRAMS.find(h =>
    h.lines[0] === lines[0] &&
    h.lines[1] === lines[1] &&
    h.lines[2] === lines[2] &&
    h.lines[3] === lines[3] &&
    h.lines[4] === lines[4] &&
    h.lines[5] === lines[5]
  );
}

// Transform a hexagram by flipping its changing lines
export function getTransformedHexagram(
  original: Hexagram,
  changingLines: boolean[] // true = this line is changing
): Hexagram | undefined {
  const newLines = original.lines.map((line, i) => {
    if (changingLines[i]) {
      return line === 'yang' ? 'yin' : 'yang';
    }
    return line;
  }) as [LineType, LineType, LineType, LineType, LineType, LineType];

  return getHexagramByLines(newLines);
}

// Get the trigram key from three lines
export function getTrigramFromLines(lines: [LineType, LineType, LineType]): string | undefined {
  for (const [key, trigram] of Object.entries(TRIGRAMS)) {
    if (trigram.lines[0] === lines[0] &&
        trigram.lines[1] === lines[1] &&
        trigram.lines[2] === lines[2]) {
      return key;
    }
  }
  return undefined;
}
