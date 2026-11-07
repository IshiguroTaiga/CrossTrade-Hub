import { useMemo, useState } from 'react';
import { useStore } from '../lib/store';
import { buildPost, discordText, postUrl } from '../lib/share';
import { PostView } from './PostView';

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareTab() {
  const { profile, setProfile, inventory, wants, byId } = useStore();
  const [copied, setCopied] = useState<'' | 'link' | 'text' | 'fail'>('');
  const post = useMemo(() => buildPost(profile, inventory, wants, byId), [profile, inventory, wants, byId]);
  const url = useMemo(() => postUrl(post), [post]);
  const empty = !post.have.length && !post.want.length;

  const doCopy = async (kind: 'link' | 'text') => {
    const ok = await copy(kind === 'link' ? url : discordText(post, url));
    setCopied(ok ? kind : 'fail');
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <h2>Share your trade post</h2>
          <p className="muted">
            Your list is packed into the link itself, so there's no account and nothing is stored on a server. Paste it in a Discord trading
            channel.
          </p>
        </div>
      </header>

      <div className="form">
        <label>
          <span>Display name</span>
          <input value={profile.name} maxLength={40} placeholder="e.g. Taiga" onChange={(e) => setProfile({ name: e.target.value })} />
        </label>
        <label>
          <span>Discord username (optional)</span>
          <input value={profile.contact} maxLength={40} placeholder="e.g. taiga.trades" onChange={(e) => setProfile({ contact: e.target.value })} />
        </label>
        <label className="wide">
          <span>Note (optional)</span>
          <textarea
            value={profile.note}
            maxLength={280}
            rows={2}
            placeholder="e.g. Open to crosstrades AA ↔ GPO, overpay for Shiny Rin"
            onChange={(e) => setProfile({ note: e.target.value })}
          />
        </label>
      </div>
      <p className="muted small">Don't put your real name, age, location or Roblox password in a post. Nobody legit will ever ask for your password or cookie.</p>

      <div className="actions">
        <button className="primary" disabled={empty} onClick={() => doCopy('link')}>
          {copied === 'link' ? 'Link copied!' : 'Copy link'}
        </button>
        <button disabled={empty} onClick={() => doCopy('text')}>
          {copied === 'text' ? 'Copied!' : 'Copy Discord message'}
        </button>
        {copied === 'fail' && <span className="note">Couldn't copy automatically. Select the link below instead.</span>}
      </div>
      {empty ? (
        <p className="empty">Tick some inventory items "For trade" or add wants, and your post will appear here.</p>
      ) : (
        <>
          <input className="url" readOnly value={url} onFocus={(e) => e.target.select()} />
          <h3 className="preview-title">Preview</h3>
          <PostView post={post} />
        </>
      )}
    </section>
  );
}
