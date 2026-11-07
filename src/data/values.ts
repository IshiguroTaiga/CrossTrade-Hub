// Seed value data. Every number carries a source and a date so users can judge how stale it is.
// Values are only comparable WITHIN one game — never add AA numbers to GPO numbers.
// To update: edit the numbers below (and the source's `asOf`), then redeploy.

export type GameId = 'aa' | 'av' | 'gpo';
export type Trend = 'stable' | 'rising' | 'falling' | 'unstable' | 'overpriced' | 'unknown';

export interface Game {
  id: GameId;
  name: string;
  short: string;
  color: string;
}

export const GAMES: Game[] = [
  { id: 'aa', name: 'Anime Adventures', short: 'AA', color: '#f5a524' },
  { id: 'av', name: 'Anime Vanguards', short: 'AV', color: '#a78bfa' },
  { id: 'gpo', name: 'Grand Piece Online', short: 'GPO', color: '#38bdf8' },
];

export const gameById = (id: GameId) => GAMES.find((g) => g.id === id)!;

export interface Source {
  id: string;
  label: string;
  url: string;
  asOf: string | null; // ISO date, null = source shows no date
  note?: string;
}

export const SOURCES: Record<string, Source> = {
  aavt: {
    id: 'aavt',
    label: 'AAValues.trade',
    url: 'https://aavalues.trade/',
    asOf: '2026-10-21',
    note: 'Restored historical prices, not verified sales. Update 21 units have no price yet.',
  },
  'gg-av': {
    id: 'gg-av',
    label: 'game.guide (Anime Vanguards)',
    url: 'https://www.game.guide/anime-vanguards-value-list',
    asOf: '2026-11-05',
  },
  backdash: {
    id: 'backdash',
    label: 'The Backdash (GPO)',
    url: 'https://thebackdash.com/gaming/grand-piece-online-trading-guide-how-to-trade-and-trade-list/',
    asOf: null,
  },
  you: { id: 'you', label: 'Your value', url: '', asOf: null },
};

export interface ItemDef {
  id: string;
  game: GameId;
  name: string;
  rarity?: string;
  value: number | null;
  demand?: number | null; // out of 10
  trend?: Trend;
  source: string; // key of SOURCES
  custom?: boolean;
  overridden?: boolean;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const makeId = (game: GameId, name: string) => `${game}:${slug(name)}`;

type Row = [name: string, rarity: string | undefined, value: number | null, demand?: number | null, trend?: Trend];

function rows(game: GameId, source: string, list: Row[]): ItemDef[] {
  return list.map(([name, rarity, value, demand = null, trend = 'unknown']) => ({
    id: makeId(game, name),
    game,
    name,
    rarity,
    value,
    demand,
    trend,
    source,
  }));
}

export const BUILTIN_ITEMS: ItemDef[] = [
  // ── Anime Adventures ─ top units
  ...rows('aa', 'aavt', [
    ['JIO (Over Heaven)', 'Secret', 38500, null, 'overpriced'],
    ['Time Saviour (Future Gohan)', undefined, 33000],
    ['Blue Flare (Rin) (Shiny)', undefined, 30000],
    ['Blue Flare (Rin)', undefined, 22800],
    ['Dracula (Alucard) (Shiny)', undefined, 20600, null, 'overpriced'],
    ['Shade Hunter (Zabuza) (Shiny)', undefined, 20000],
    ['Artificial AAA (A21) (Shiny)', undefined, 17250],
    ['Illusionist (Aizen) (Shiny)', undefined, 15000, null, 'overpriced'],
    ['Shadowgirl (Homura) (Shiny)', undefined, 10750],
    ['Artificial AAA (A21)', undefined, 10000],
    ['Pirate King (Roger) (Shiny)', undefined, 6450],
  ]),
  // ── Anime Adventures ─ April Fools banner
  ...rows('aa', 'aavt', [
    ['Vengeful Swordsman (Sky Reaver)', 'Secret', 275, 5, 'unstable'],
    ['Vengeful Swordsman (Sky Reaver) (Shiny)', 'Secret', 1600, 6.5, 'unstable'],
    ['Chuuni (Delusion)', 'Mythic', 75, 4, 'unknown'],
    ['Chuuni (Delusion) (Shiny)', 'Mythic', 375, 5, 'unstable'],
    ['Violentine (Brutal Angel)', 'Mythic', 75, 4, 'unknown'],
    ['Violentine (Brutal Angel) (Shiny)', 'Mythic', 300, 5.5, 'unknown'],
    ['Kansai (Daydream)', 'Mythic', 50, 4, 'stable'],
    ['Kansai (Daydream) (Shiny)', 'Mythic', 200, 6, 'unknown'],
    ['Foolish Bundle', 'Gamepass', 850, 6, 'stable'],
  ]),
  // ── Anime Adventures ─ Update 21 (Summer) — no prices yet
  ...rows('aa', 'aavt', [
    ['Fishi (Obsession)', 'Mythic', null],
    ['Water Goddess (Holy)', 'Mythic', null],
    ['Armored Crusader (Noble)', 'Mythic', null],
    ['World Mage (Script)', 'Mythic', null],
    ['Explosion Mage (Archdemon)', 'Secret', null],
    ['Explosion Mage (Archdemon) (Shiny)', 'Secret', null],
    ['Phoenix (Mythic Flames)', 'Secret', null],
    ['Sky God', 'Secret', null],
    ['Viking', undefined, null],
    ['Summer Bundle #1 (Gift)', 'Gamepass', null],
    ['Summer Bundle #2 (Gift)', 'Gamepass', null],
    ['Summer Bundle #3 (Gift)', 'Gamepass', null],
  ]),
  // ── Anime Vanguards
  ...rows('av', 'gg-av', [
    ['Yummers', undefined, 3100],
    ['Ichiga (Casual)', undefined, 730],
  ]),
  // ── Grand Piece Online
  ...rows('gpo', 'backdash', [['Mochi', 'Fruit', 6500, null, 'unstable']]),
];
