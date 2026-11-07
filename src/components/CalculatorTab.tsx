import { useState } from 'react';
import { useStore, type Entry } from '../lib/store';
import { fmt, totalsByGame } from '../lib/format';
import { GAMES } from '../data/values';
import { GameBadge, ItemPicker, Qty } from './ui';

function Side({ title, entries, setEntries }: { title: string; entries: Entry[]; setEntries: (e: Entry[]) => void }) {
  const { byId } = useStore();
  const add = (id: string) =>
    setEntries(
      entries.some((e) => e.itemId === id)
        ? entries.map((e) => (e.itemId === id ? { ...e, qty: e.qty + 1 } : e))
        : [...entries, { itemId: id, qty: 1 }],
    );
  return (
    <div className="side">
      <h3>{title}</h3>
      <ItemPicker onPick={add} />
      <ul className="rows compact">
        {entries.map((e) => {
          const it = byId.get(e.itemId);
          if (!it) return null;
          return (
            <li key={e.itemId} className="row">
              <GameBadge game={it.game} />
              <div className="grow">
                <div className="name">{it.name}</div>
                <div className="muted small">
                  {it.value == null ? 'No price' : fmt(it.value * e.qty)}
                  {it.demand != null ? ` · demand ${it.demand}/10` : ''}
                </div>
              </div>
              <Qty
                value={e.qty}
                onChange={(n) => setEntries(entries.map((x) => (x.itemId === e.itemId ? { ...x, qty: Math.max(1, n) } : x)))}
              />
              <button className="icon danger" aria-label="Remove" onClick={() => setEntries(entries.filter((x) => x.itemId !== e.itemId))}>
                ✕
              </button>
            </li>
          );
        })}
        {!entries.length && <li className="muted small pad">Add items to this side.</li>}
      </ul>
    </div>
  );
}

export function CalculatorTab() {
  const { byId, inventory } = useStore();
  const [give, setGive] = useState<Entry[]>([]);
  const [get, setGet] = useState<Entry[]>([]);

  const lookup = (e: Entry) => {
    const it = byId.get(e.itemId);
    return it ? { game: it.game, value: it.value, qty: e.qty } : null;
  };
  const g = totalsByGame(give, lookup);
  const r = totalsByGame(get, lookup);
  const games = GAMES.filter((x) => g.some((t) => t.game.id === x.id) || r.some((t) => t.game.id === x.id));
  const sameGame = games.length === 1;
  const unpriced = [...g, ...r].some((t) => t.unpriced > 0);

  let verdict: string | null = null;
  if (sameGame && g.length && r.length) {
    const a = g[0].total;
    const b = r[0].total;
    const diff = b - a;
    const pct = a > 0 ? Math.round((diff / a) * 100) : null;
    verdict =
      Math.abs(diff) <= Math.max(a, b) * 0.05
        ? 'About even (within 5%)'
        : diff > 0
          ? `You gain ${fmt(diff)}${pct != null ? ` (+${pct}%)` : ''}`
          : `You lose ${fmt(-diff)}${pct != null ? ` (${pct}%)` : ''}`;
  }

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h2>Trade calculator</h2>
          <p className="muted">Compare both sides. Values from different games use different scales, so each game is totalled separately.</p>
        </div>
        <div className="actions">
          <button
            className="ghost"
            disabled={!inventory.some((e) => e.forTrade)}
            onClick={() => setGive(inventory.filter((e) => e.forTrade).map((e) => ({ itemId: e.itemId, qty: e.qty })))}
          >
            Load my trade list
          </button>
          <button className="ghost" onClick={() => (setGive([]), setGet([]))}>
            Clear
          </button>
        </div>
      </header>

      <div className="sides">
        <Side title="You give" entries={give} setEntries={setGive} />
        <Side title="You get" entries={get} setEntries={setGet} />
      </div>

      {games.length > 0 && (
        <div className="compare">
          <table>
            <thead>
              <tr>
                <th>Game</th>
                <th>You give</th>
                <th>You get</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td>
                    <GameBadge game={game.id} /> {game.name}
                  </td>
                  <td>{fmt(g.find((t) => t.game.id === game.id)?.total ?? 0)}</td>
                  <td>{fmt(r.find((t) => t.game.id === game.id)?.total ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {verdict && <p className="verdict">{verdict}</p>}
          {!sameGame && (
            <p className="note">
              This is a crosstrade. AA, AV and GPO values aren't on the same scale, so there's no single win/loss number. Weigh demand and
              what each side actually needs.
            </p>
          )}
          {unpriced && <p className="note">Some items have no price yet, so totals undercount them. Check recent trades first.</p>}
        </div>
      )}
    </section>
  );
}
