import type { Post, SharedItem } from '../lib/share';
import { fmt, totalsByGame } from '../lib/format';
import { GameBadge, Totals } from './ui';

function Column({ title, list }: { title: string; list: SharedItem[] }) {
  return (
    <div className="side">
      <h3>{title}</h3>
      {list.length ? (
        <ul className="rows compact">
          {list.map((i, n) => (
            <li key={n} className="row">
              <GameBadge game={i.game} />
              <div className="grow name">{i.name}</div>
              {i.qty > 1 && <span className="muted">×{i.qty}</span>}
              <span className="muted small">{fmt(i.value)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small pad">Nothing listed.</p>
      )}
      <Totals rows={totalsByGame(list, (i) => i)} label="Total" />
    </div>
  );
}

export function PostView({ post }: { post: Post }) {
  return (
    <div className="post">
      <div className="post-head">
        <div>
          <h2>{post.name || 'Anonymous trader'}</h2>
          {post.contact && (
            <p>
              Discord: <strong>{post.contact}</strong>
            </p>
          )}
        </div>
        {post.at && <span className="muted small">Posted {post.at}</span>}
      </div>
      {post.note && <p className="post-note">{post.note}</p>}
      <div className="sides">
        <Column title="Has for trade" list={post.have} />
        <Column title="Looking for" list={post.want} />
      </div>
      <p className="muted small">Values are what the poster's list showed when the link was made.</p>
    </div>
  );
}
