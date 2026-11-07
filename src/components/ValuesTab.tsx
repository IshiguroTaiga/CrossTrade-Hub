import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { GAMES, SOURCES, makeId, type GameId } from '../data/values';
import { daysAgo, fmt } from '../lib/format';
import { GameBadge, GameFilter, TrendChip, type GameFilterValue } from './ui';

function parseValue(s: string): number | null | undefined {
  const t = s.trim().toLowerCase().replace(/,/g, '');
  if (!t) return null;
  const m = t.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return undefined;
  return Math.round(parseFloat(m[1]) * (m[2] === 'k' ? 1e3 : m[2] === 'm' ? 1e6 : 1));
}

function ValueCell({ id, value, overridden }: { id: string; value: number | null; overridden?: boolean }) {
  const { setOverride } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (!editing)
    return (
      <span className="value-cell">
        <button className="link" title="Set your own value" onClick={() => (setDraft(value == null ? '' : String(value)), setEditing(true))}>
          {fmt(value)}
        </button>
        {overridden && (
          <button className="link small muted" title="Back to source value" onClick={() => setOverride(id, undefined)}>
            reset
          </button>
        )}
      </span>
    );
  const save = () => {
    const v = parseValue(draft);
    if (v !== undefined) setOverride(id, v);
    setEditing(false);
  };
  return (
    <input
      className="value-input"
      autoFocus
      value={draft}
      placeholder="e.g. 12k"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') setEditing(false);
      }}
    />
  );
}

function AddCustom() {
  const { addCustom, byId } = useStore();
  const [game, setGame] = useState<GameId>('aa');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    const n = name.trim().slice(0, 80);
    const v = parseValue(value);
    if (!n) return setErr('Give it a name.');
    if (v === undefined) return setErr('Value should be a number like 1500 or 12k.');
    const id = makeId(game, n) + ':custom';
    if (byId.has(makeId(game, n)) || byId.has(id)) return setErr('That item is already in the list. Click its value to change it.');
    addCustom({ id, game, name: n, value: v, source: 'you', custom: true, trend: 'unknown' });
    setName('');
    setValue('');
    setErr('');
  };

  return (
    <div className="add-custom">
      <h3>Add a missing item</h3>
      <div className="inline-form">
        <select value={game} onChange={(e) => setGame(e.target.value as GameId)} aria-label="Game">
          {GAMES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <input value={name} placeholder="Item / unit name" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <input value={value} placeholder="Value (optional)" onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button className="primary" onClick={submit}>
          Add
        </button>
      </div>
      {err && <p className="note">{err}</p>}
    </div>
  );
}

export function ValuesTab() {
  const { items, removeCustom } = useStore();
  const [game, setGame] = useState<GameFilterValue>('all');
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((i) => (game === 'all' || i.game === game) && (!s || i.name.toLowerCase().includes(s)))
      .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  }, [items, game, q]);

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h2>Value list</h2>
          <p className="muted">
            Community estimates, not guaranteed prices. Click any value to set your own. Your values only change your copy.
          </p>
        </div>
      </header>
      <GameFilter value={game} onChange={setGame} />
      <input className="search" value={q} placeholder="Filter…" onChange={(e) => setQ(e.target.value)} />

      <div className="table-wrap">
        <table className="values">
          <thead>
            <tr>
              <th>Item</th>
              <th>Value</th>
              <th className="hide-sm">Demand</th>
              <th>Trend</th>
              <th className="hide-sm">Source</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((i) => {
              const src = SOURCES[i.overridden || i.custom ? 'you' : i.source];
              return (
                <tr key={i.id}>
                  <td>
                    <div className="cell-item">
                      <GameBadge game={i.game} />
                      <div>
                        <div className="name">{i.name}</div>
                        {i.rarity && <div className="muted small">{i.rarity}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <ValueCell id={i.id} value={i.value} overridden={i.overridden} />
                  </td>
                  <td className="hide-sm">{i.demand != null ? `${i.demand}/10` : '—'}</td>
                  <td>
                    <TrendChip trend={i.trend} />
                  </td>
                  <td className="hide-sm small">
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noreferrer">
                        {src.label}
                      </a>
                    ) : (
                      src.label
                    )}
                    <div className="muted">{daysAgo(src.asOf)}</div>
                    {i.custom && (
                      <button className="link danger small" onClick={() => removeCustom(i.id)}>
                        delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddCustom />

      <div className="sources">
        <h3>Sources</h3>
        <ul>
          {Object.values(SOURCES)
            .filter((s) => s.url)
            .map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>{' '}
                <span className="muted small">
                  · {s.asOf ?? 'no date shown'}
                  {s.note ? ` · ${s.note}` : ''}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
