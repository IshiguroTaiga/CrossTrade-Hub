import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BUILTIN_ITEMS, type ItemDef } from '../data/values';

export type ListName = 'inventory' | 'wants';

export interface Entry {
  itemId: string;
  qty: number;
  forTrade?: boolean;
}

export interface Override {
  value: number | null;
}

export interface Profile {
  name: string;
  contact: string;
  note: string;
}

interface State {
  inventory: Entry[];
  wants: Entry[];
  custom: ItemDef[];
  overrides: Record<string, Override>;
  profile: Profile;
}

const KEY = 'crosstrade-hub:v1';
const EMPTY: State = {
  inventory: [],
  wants: [],
  custom: [],
  overrides: {},
  profile: { name: '', contact: '', note: '' },
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* storage blocked or corrupt — start fresh */
  }
  return EMPTY;
}

interface Store extends State {
  items: ItemDef[];
  byId: Map<string, ItemDef>;
  add: (list: ListName, itemId: string) => void;
  setQty: (list: ListName, itemId: string, qty: number) => void;
  remove: (list: ListName, itemId: string) => void;
  toggleTrade: (itemId: string) => void;
  addCustom: (item: ItemDef) => void;
  removeCustom: (id: string) => void;
  setOverride: (id: string, value: number | null | undefined) => void;
  setProfile: (p: Partial<Profile>) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const items = useMemo(() => {
    const all = [...BUILTIN_ITEMS, ...state.custom];
    return all.map((i) => {
      const ov = state.overrides[i.id];
      return ov ? { ...i, value: ov.value, overridden: true } : i;
    });
  }, [state.custom, state.overrides]);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const updateList = useCallback((list: ListName, fn: (l: Entry[]) => Entry[]) => {
    setState((s) => ({ ...s, [list]: fn(s[list]) }));
  }, []);

  const store: Store = {
    ...state,
    items,
    byId,
    add: (list, itemId) =>
      updateList(list, (l) =>
        l.some((e) => e.itemId === itemId)
          ? l.map((e) => (e.itemId === itemId ? { ...e, qty: e.qty + 1 } : e))
          : [...l, { itemId, qty: 1, forTrade: list === 'inventory' ? true : undefined }],
      ),
    setQty: (list, itemId, qty) =>
      updateList(list, (l) => l.map((e) => (e.itemId === itemId ? { ...e, qty: Math.max(1, Math.min(9999, qty)) } : e))),
    remove: (list, itemId) => updateList(list, (l) => l.filter((e) => e.itemId !== itemId)),
    toggleTrade: (itemId) =>
      updateList('inventory', (l) => l.map((e) => (e.itemId === itemId ? { ...e, forTrade: !e.forTrade } : e))),
    addCustom: (item) => setState((s) => ({ ...s, custom: [...s.custom.filter((c) => c.id !== item.id), item] })),
    removeCustom: (id) =>
      setState((s) => ({
        ...s,
        custom: s.custom.filter((c) => c.id !== id),
        inventory: s.inventory.filter((e) => e.itemId !== id),
        wants: s.wants.filter((e) => e.itemId !== id),
      })),
    setOverride: (id, value) =>
      setState((s) => {
        const overrides = { ...s.overrides };
        if (value === undefined) delete overrides[id];
        else overrides[id] = { value };
        return { ...s, overrides };
      }),
    setProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    reset: () => setState(EMPTY),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
