import { useState } from 'react';
import { useStore, type ListName } from '../lib/store';
import { fmt, totalsByGame } from '../lib/format';
import { GameBadge, GameFilter, ItemPicker, Qty, Totals, TrendChip, type GameFilterValue } from './ui';

const COPY: Record<ListName, { title: string; blurb: string; empty: string }> = {
  inventory: {
    title: 'My inventory',
    blurb: 'Add what you own in each game. Items ticked "For trade" go on your shareable trade list.',
    empty: 'Nothing here yet. Search above to add your first unit.',
  },
  wants: {
    title: 'Looking for',
    blurb: 'Add what you want from any game. This is the "Looking for" side of your trade post.',
    empty: 'No wants yet. Search above to add what you want.',
  },
};

export function ListTab({ list }: { list: ListName }) {
  const store = useStore();
  const [game, setGame] = useState<GameFilterValue>('all');
  const entries = store[list];
  const shown = entries.filter((e) => {
    const it = store.byId.get(e.itemId);
    return it && (game === 'all' || it.game === game);
  });

  const totals = totalsByGame(entries, (e) => {
    const it = store.byId.get(e.itemId);
    return it ? { game: it.game, value: it.value, qty: e.qty } : null;
  });
  const tradeTotals =
    list === 'inventory'
      ? totalsByGame(
          entries.filter((e) => e.forTrade),
          (e) => {
            const it = store.byId.get(e.itemId);
            return it ? { game: it.game, value: it.value, qty: e.qty } : null;
          },
        )
      : [];

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h2>{COPY[list].title}</h2>
          <p className="muted">{COPY[list].blurb}</p>
        </div>
      </header>

      <GameFilter value={game} onChange={setGame} />
      <ItemPicker game={game} onPick={(id) => store.add(list, id)} />

      {shown.length === 0 ? (
        <p className="empty">{COPY[list].empty}</p>
      ) : (
        <ul className="rows">
          {shown.map((e) => {
            const it = store.byId.get(e.itemId)!;
            return (
              <li key={e.itemId} className="row">
                <GameBadge game={it.game} />
                <div className="grow">
                  <div className="name">{it.name}</div>
                  <div className="muted small">
                    {it.rarity ? `${it.rarity} · ` : ''}
                    {it.value == null ? 'No price yet' : `${fmt(it.value)} each`}
                    {it.overridden ? ' (your value)' : ''}
                    {it.demand != null ? ` · demand ${it.demand}/10` : ''}
                  </div>
                </div>
                <TrendChip trend={it.trend} />
                <Qty value={e.qty} onChange={(n) => store.setQty(list, e.itemId, n)} />
                {list === 'inventory' && (
                  <label className="toggle" title="Show on your trade list">
                    <input type="checkbox" checked={!!e.forTrade} onChange={() => store.toggleTrade(e.itemId)} />
                    <span>For trade</span>
                  </label>
                )}
                <button className="icon danger" aria-label={`Remove ${it.name}`} onClick={() => store.remove(list, e.itemId)}>
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Totals rows={totals} label={list === 'inventory' ? 'Total' : 'Total wanted'} />
      {list === 'inventory' && <Totals rows={tradeTotals} label="For trade" />}
    </section>
  );
}
