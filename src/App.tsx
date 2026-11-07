import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import { decodePost } from './lib/share';
import { ListTab } from './components/ListTab';
import { CalculatorTab } from './components/CalculatorTab';
import { ShareTab } from './components/ShareTab';
import { ValuesTab } from './components/ValuesTab';
import { PostView } from './components/PostView';

const TABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'wants', label: 'Looking for' },
  { id: 'calc', label: 'Calculator' },
  { id: 'share', label: 'Share' },
  { id: 'values', label: 'Values' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const TAB_KEY = 'crosstrade-hub:tab';
function initialTab(): TabId {
  try {
    const t = localStorage.getItem(TAB_KEY);
    if (TABS.some((x) => x.id === t)) return t as TabId;
  } catch {
    /* ignore */
  }
  return 'inventory';
}

function useHash() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  const [tab, setTab] = useState<TabId>(initialTab);
  const { inventory, wants } = useStore();

  useEffect(() => {
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* ignore */
    }
  }, [tab]);

  const shared = hash.startsWith('#/p/') ? decodePost(hash.slice(4)) : undefined;
  const leaveShared = () => {
    history.pushState('', '', location.pathname);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#" onClick={(e) => (e.preventDefault(), leaveShared())}>
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>
            CrossTrade <b>Hub</b>
          </span>
        </a>
        <span className="tagline muted small">One trade list for AA · Anime Vanguards · GPO</span>
      </header>

      {shared !== undefined ? (
        <main>
          {shared ? (
            <section className="card">
              <PostView post={shared} />
            </section>
          ) : (
            <section className="card">
              <h2>That link looks broken</h2>
              <p className="muted">It may have been cut off when it was pasted. Ask the trader to send it again.</p>
            </section>
          )}
          <div className="safety">
            <strong>Trade safely:</strong> crosstrades need one person to go first, and this site can't enforce the other side. Use a trusted
            middleman for big trades, and never share your password or cookie.
          </div>
          <button className="primary block" onClick={leaveShared}>
            Make your own trade list
          </button>
        </main>
      ) : (
        <main>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t) => (
              <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
                {t.id === 'inventory' && inventory.length > 0 && <span className="count">{inventory.length}</span>}
                {t.id === 'wants' && wants.length > 0 && <span className="count">{wants.length}</span>}
              </button>
            ))}
          </nav>
          {tab === 'inventory' && <ListTab list="inventory" />}
          {tab === 'wants' && <ListTab list="wants" />}
          {tab === 'calc' && <CalculatorTab />}
          {tab === 'share' && <ShareTab />}
          {tab === 'values' && <ValuesTab />}
        </main>
      )}

      <footer className="foot muted small">
        <p>
          Fan-made and not affiliated with Roblox or any game's developers. Values are community estimates that go stale fast, so check recent trades
          before you agree. Item-for-item trades only: selling in-game items for real money can break Roblox's rules and get accounts banned.
        </p>
        <p>Your lists are saved in this browser only.</p>
      </footer>
    </div>
  );
}
