import { GAMES, type GameId } from '../data/values';

export const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('en-US'));

export function daysAgo(iso: string | null): string {
  if (!iso) return 'no date';
  const d = Math.round((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86_400_000);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

/** Sum value×qty per game. Unpriced items are counted separately so totals are never silently wrong. */
export function totalsByGame<T>(list: T[], get: (x: T) => { game: GameId; value: number | null; qty: number } | null) {
  const out = new Map<GameId, { total: number; count: number; unpriced: number }>();
  for (const x of list) {
    const r = get(x);
    if (!r) continue;
    const t = out.get(r.game) ?? { total: 0, count: 0, unpriced: 0 };
    t.count += r.qty;
    if (r.value == null) t.unpriced += r.qty;
    else t.total += r.value * r.qty;
    out.set(r.game, t);
  }
  return GAMES.filter((g) => out.has(g.id)).map((g) => ({ game: g, ...out.get(g.id)! }));
}
