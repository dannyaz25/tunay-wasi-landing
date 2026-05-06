// lib/checkout.js — async stock check + payment adapters.

// Placeholder for serverless stock check. Replace with real API call:
//   POST /api/stock/check { items: [{ sku, qty }] } → { ok, oversold: [...] }
const checkStock = async (items) => {
  await new Promise((r) => setTimeout(r, 700)); // simulate network
  // For demo: every item passes. In real life this returns oversold list.
  return { ok: true, oversold: [] };
};

// Adapter pattern — the same interface for Stripe / Niubiz / Yape-Plin.
// Each returns { ok, redirectUrl?, orderId? }.
const adapters = {
  niubiz: async (payload) => {
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
  },
  stripe: async (payload) => {
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
  },
  yapePlin: async (payload) => {
    await new Promise((r) => setTimeout(r, 800));
    return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
  },
};

const startCheckout = async ({ adapter = 'niubiz', cart, shipping, totals }) => {
  const stock = await checkStock(cart.items);
  if (!stock.ok) return { ok: false, error: 'oversold', oversold: stock.oversold };
  const fn = adapters[adapter];
  if (!fn) return { ok: false, error: 'unknown_adapter' };
  return await fn({ cart, shipping, totals });
};

window.checkout = { checkStock, startCheckout, adapters };
