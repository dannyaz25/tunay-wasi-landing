import { useCartStore } from './cartStore';

export const useCartItems = () => useCartStore((s) => s.items);
export const useCartIsOpen = () => useCartStore((s) => s.isOpen);
export const useCartIsCheckoutOpen = () => useCartStore((s) => s.isCheckoutOpen);
export const useCartCheckoutStep = () => useCartStore((s) => s.checkoutStep);
export const useCartTotalQuantity = () => useCartStore((s) => s.totalQuantity);
export const useCartSubtotalCents = () => useCartStore((s) => s.subtotalCents);

export const useCartActions = () =>
  useCartStore((s) => ({
    add: s.add,
    inc: s.inc,
    dec: s.dec,
    remove: s.remove,
    setQty: s.setQty,
    clear: s.clear,
    open: s.open,
    close: s.close,
    openCheckout: s.openCheckout,
    closeCheckout: s.closeCheckout,
    setCheckoutStep: s.setCheckoutStep,
  }));
