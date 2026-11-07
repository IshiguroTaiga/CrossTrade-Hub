import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { GAMES, gameById, type GameId, type ItemDef } from '../data/values';
import type { Entry, Profile } from './store';
import { fmt } from './format';

export interface SharedItem {
  game: GameId;
  name: string;
  qty: number;
  value: number | null;
}

export interface Post {
  name: string;
  contact: string;
  note: string;
  have: SharedItem[];
  want: SharedItem[];
  at: string; // ISO date the post was made
}

type Packed = [GameId, string, number, number | null];
const LIMIT = 60;
const GAME_IDS = new Set(GAMES.map((g) => g.id));

export function buildPost(profile: Profile, inventory: Entry[], wants: Entry[], byId: Map<string, ItemDef>): Post {
  const toShared = (e: Entry): SharedItem | null => {
    const it = byId.get(e.itemId);
    return it ? { game: it.game, name: it.name, qty: e.qty, value: it.value } : null;
  };
  return {
    name: profile.name.trim().slice(0, 40),
    contact: profile.contact.trim().slice(0, 40),
    note: profile.note.trim().slice(0, 280),
    have: inventory.filter((e) => e.forTrade).map(toShared).filter((x): x is SharedItem => !!x).slice(0, LIMIT),
    want: wants.map(toShared).filter((x): x is SharedItem => !!x).slice(0, LIMIT),
    at: new Date().toISOString().slice(0, 10),
  };
}

export function encodePost(p: Post): string {
  const pack = (l: SharedItem[]): Packed[] => l.map((i) => [i.game, i.name, i.qty, i.value]);
  return compressToEncodedURIComponent(JSON.stringify({ v: 1, n: p.name, c: p.contact, t: p.note, h: pack(p.have), w: pack(p.want), a: p.at }));
}

export function decodePost(code: string): Post | null {
  try {
    const raw = decompressFromEncodedURIComponent(code);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d?.v !== 1) return null;
    const str = (x: unknown, max: number) => (typeof x === 'string' ? x.slice(0, max) : '');
    const unpack = (l: unknown): SharedItem[] =>
      (Array.isArray(l) ? l : [])
        .filter((r): r is Packed => Array.isArray(r) && GAME_IDS.has(r[0]) && typeof r[1] === 'string')
        .slice(0, LIMIT)
        .map(([game, name, qty, value]) => ({
          game,
          name: name.slice(0, 80),
          qty: Number.isFinite(qty) ? Math.max(1, Math.min(9999, Math.floor(qty))) : 1,
          value: typeof value === 'number' && Number.isFinite(value) ? value : null,
        }));
    return { name: str(d.n, 40), contact: str(d.c, 40), note: str(d.t, 280), have: unpack(d.h), want: unpack(d.w), at: str(d.a, 10) };
  } catch {
    return null;
  }
}

export function postUrl(p: Post): string {
  return `${location.origin}${location.pathname}#/p/${encodePost(p)}`;
}

export function discordText(p: Post, url: string): string {
  const line = (i: SharedItem) =>
    `• [${gameById(i.game).short}] ${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}${i.value != null ? ` — ${fmt(i.value)}` : ''}`;
  const out = [`**${p.name || 'My'} trade list** (CrossTrade Hub)`];
  if (p.have.length) out.push('', '**Have:**', ...p.have.map(line));
  if (p.want.length) out.push('', '**Looking for:**', ...p.want.map(line));
  if (p.note) out.push('', p.note);
  if (p.contact) out.push('', `DM: ${p.contact}`);
  out.push('', `Full list: <${url}>`);
  return out.join('\n');
}
