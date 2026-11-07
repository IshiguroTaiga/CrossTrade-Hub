import { useMemo, useState, type CSSProperties } from 'react';
import { GAMES, gameById, type GameId, type Trend } from '../data/values';
import { useStore } from '../lib/store';
import { fmt, totalsByGame } from '../lib/format';

export function GameBadge({ game }: { game: GameId }) {
  const g = gameById(game);
  return (
    <span className="badge" style={{ '--c': g.color } as CSSProperties} title={g.name}>
      {g.short}
    </span>
  );
}

const TREND_LABEL: Record<Trend, string> = {
  stable: 'Stable',
  rising: 'Rising',
  falling: 'Falling',
  unstable: 'Unstable',
  overpriced: 'Overpriced',
  unknown: 'Unknown',
};

export function TrendChip({ trend }: { trend?: Trend }) {
  const t = trend ?? 'unknown';
  return <span className={`trend trend-${t}`}>{TREND_LABEL[t]}</span>;
}

export type GameFilterValue = GameId | 'all';

export function GameFilter({ value, onChange }: { value: GameFilterValue; onChange: (v: GameFilterValue) => void }) {
  return (
    <div className="chips" role="tablist" aria-label="Filter by game">
      <button className={`chip ${value === 'all' ? 'on' : ''}`} onClick={() => onChange('all')}>
        All games
      </button>
      {GAMES.map((g) => (
        <button
          key={g.id}
          className={`chip ${value === g.id ? 'on' : ''}`}
          style={{ '--c': g.color } as CSSProperties}
          onClick={() => onChange(g.id)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}

export function Totals({ rows, label }: { rows: ReturnType<typeof totalsByGame>; label: string }) {
  if (!rows.length) return null;
  return (
    <div className="totals">
      <span className="muted small">{label}</span>
      {rows.map((r) => (
        <div key={r.game.id} className="total">
          <GameBadge game={r.game.id} />
          <strong>{fmt(r.total)}</strong>
          <span className="muted small">
            {r.count} item{r.count === 1 ? '' : 's'}
            {r.unpriced ? ` · ${r.unpriced} unpriced` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ItemPicker({ onPick, game = 'all', placeholder = 'Search units / items…' }: {
  onPick: (id: string) => void;
  game?: GameFilterValue;
  placeholder?: string;
}) {
  const { items } = useStore();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((i) => (game === 'all' || i.game === game) && (!s || i.name.toLowerCase().includes(s)))
      .slice(0, 12);
  }, [q, items, game]);

  const pick = (id: string) => {
    onPick(id);
    setQ('');
  };

  return (
    <div className="picker">
      <input
        value={q}
        placeholder={placeholder}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) pick(results[0].id);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && (
        <ul className="picker-list">
          {results.map((i) => (
            <li key={i.id}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(i.id);
                }}
              >
                <GameBadge game={i.game} />
                <span className="grow">{i.name}</span>
                <span className="muted small">{fmt(i.value)}</span>
              </button>
            </li>
          ))}
          {!results.length && <li className="muted small pad">No match. Add it yourself in the Values tab.</li>}
        </ul>
      )}
    </div>
  );
}

export function Qty({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="qty">
      <button aria-label="Less" onClick={() => onChange(value - 1)} disabled={value <= 1}>
        −
      </button>
      <input
        aria-label="Quantity"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
      <button aria-label="More" onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
