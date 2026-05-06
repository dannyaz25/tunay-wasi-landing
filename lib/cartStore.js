// lib/cartStore.js — Zustand-shaped store with localStorage persist middleware.
// In a real codebase: `import { create } from 'zustand'` + `persist` middleware.
// Here we inline a faithful, minimal version with the same external API.

const STORAGE_KEY = 'tw_cart_v1';

// --- micro store: setState/getState/subscribe + persist ---
const createStore = (init, opts = {}) => {
  let state = {};
  const listeners = new Set();
  const setState = (partial) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
    if (opts.name) {
      try { localStorage.setItem(opts.name, JSON.stringify(state)); } catch {}
    }
    listeners.forEach((fn) => fn(state));
  };
  const getState = () => state;
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

  // hydrate
  let hydrated = {};
  if (opts.name) {
    try { hydrated = JSON.parse(localStorage.getItem(opts.name) || '{}') || {}; } catch {}
  }
  state = { ...init({ setState, getState }), ...hydrated };

  return { setState, getState, subscribe };
};

// React binding: useStore(store, selector)
const useStore = (store, selector = (s) => s) => {
  const [val, setVal] = React.useState(() => selector(store.getState()));
  React.useEffect(() => store.subscribe((s) => setVal(selector(s))), []);
  return val;
};

// --- the actual cart ---
const cartStore = createStore(({ setState, getState }) => ({
  items: [],            // CartItem[]
  totalQuantity: 0,
  subtotalCents: 0,
  discountCents: 0,
  isOpen: false,
  isCheckoutOpen: false,
  checkoutStep: 'datos', // 'datos' | 'pago'
  cycle: { closeAt: '06 may.', deliverLima: '07 may.', deliverProv: '10 may.' },

  open:  () => setState({ isOpen: true }),
  close: () => setState({ isOpen: false }),
  openCheckout:  () => setState({ isCheckoutOpen: true, checkoutStep: 'datos' }),
  closeCheckout: () => setState({ isCheckoutOpen: false }),
  setCheckoutStep: (step) => setState({ checkoutStep: step }),

  add: (rawItem) => {
    const item = window.CartSchema.CartItemSchema(rawItem);
    const items = [...getState().items];
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], qty: Math.min(items[idx].qty + item.qty, items[idx].maxQty) };
    } else {
      items.push(item);
    }
    setState({ items });
    recompute();
    setState({ isOpen: true });
  },

  setQty: (id, qty) => {
    const items = getState().items.map((i) =>
      i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty)) } : i,
    );
    setState({ items });
    recompute();
  },

  inc: (id) => {
    const items = getState().items.map((i) =>
      i.id === id ? { ...i, qty: Math.min(i.qty + 1, i.maxQty) } : i,
    );
    setState({ items });
    recompute();
  },

  dec: (id) => {
    const items = getState().items
      .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
      .filter((i) => i.qty > 0);
    setState({ items });
    recompute();
  },

  remove: (id) => {
    setState({ items: getState().items.filter((i) => i.id !== id) });
    recompute();
  },

  clear: () => {
    setState({ items: [], totalQuantity: 0, subtotalCents: 0, discountCents: 0 });
  },
}), { name: STORAGE_KEY });

const recompute = () => {
  const { items, setState } = (() => ({ ...cartStore.getState(), setState: cartStore.setState }))();
  const subtotalCents = items.reduce((acc, i) => acc + i.unitCents * i.qty, 0);
  const totalQuantity = items.reduce((acc, i) => acc + i.qty, 0);
  cartStore.setState({ subtotalCents, totalQuantity });
};

window.cartStore = cartStore;
window.useCart = (selector) => useStore(cartStore, selector);
