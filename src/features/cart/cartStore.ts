import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/shared/types/cart';
import { CartItemSchema } from './cartSchema';

interface CartState {
  items: CartItem[];
  totalQuantity: number;
  subtotalCents: number;
  isOpen: boolean;
  isCheckoutOpen: boolean;
  checkoutStep: 'datos' | 'pago';
}

interface CartActions {
  open: () => void;
  close: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  setCheckoutStep: (step: 'datos' | 'pago') => void;
  add: (rawItem: unknown) => void;
  setQty: (id: string, qty: number) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

function computeTotals(items: CartItem[]) {
  return {
    subtotalCents: items.reduce((acc, i) => acc + i.unitCents * i.qty, 0),
    totalQuantity: items.reduce((acc, i) => acc + i.qty, 0),
  };
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      totalQuantity: 0,
      subtotalCents: 0,
      isOpen: false,
      isCheckoutOpen: false,
      checkoutStep: 'datos',

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      openCheckout: () => set({ isCheckoutOpen: true, checkoutStep: 'datos' }),
      closeCheckout: () => set({ isCheckoutOpen: false }),
      setCheckoutStep: (step) => set({ checkoutStep: step }),

      add: (rawItem) => {
        const item = CartItemSchema.parse(rawItem);
        const items = [...get().items];
        const idx = items.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          items[idx] = {
            ...items[idx],
            qty: Math.min(items[idx].qty + item.qty, items[idx].maxQty),
          };
        } else {
          items.push(item);
        }
        set({ items, ...computeTotals(items), isOpen: true });
      },

      setQty: (id, qty) => {
        const items = get().items.map((i) =>
          i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.maxQty)) } : i,
        );
        set({ items, ...computeTotals(items) });
      },

      inc: (id) => {
        const items = get().items.map((i) =>
          i.id === id ? { ...i, qty: Math.min(i.qty + 1, i.maxQty) } : i,
        );
        set({ items, ...computeTotals(items) });
      },

      dec: (id) => {
        const items = get().items
          .map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
          .filter((i) => i.qty > 0);
        set({ items, ...computeTotals(items) });
      },

      remove: (id) => {
        const items = get().items.filter((i) => i.id !== id);
        set({ items, ...computeTotals(items) });
      },

      clear: () => set({ items: [], totalQuantity: 0, subtotalCents: 0 }),
    }),
    { name: 'tw_cart_v1' },
  ),
);
