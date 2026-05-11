import type { AdapterName, CheckoutPayload, CheckoutResult } from '@/shared/types/checkout';
import type { CartItem } from '@/shared/types/cart';
import { niubizAdapter } from './adapters/niubizAdapter';
import { stripeAdapter } from './adapters/stripeAdapter';
import { yapePlinAdapter } from './adapters/yapePlinAdapter';
import { saveOrder } from './orderService';

interface StockCheckResult {
  ok: boolean;
  oversold: string[];
}

async function checkStock(_items: CartItem[]): Promise<StockCheckResult> {
  // TODO: replace with real POST /api/stock/check { items: [{ sku, qty }] }
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true, oversold: [] };
}

const adapterMap: Record<AdapterName, (p: CheckoutPayload, orderId: string) => Promise<CheckoutResult>> = {
  niubiz: niubizAdapter,
  stripe: stripeAdapter,
  yapePlin: yapePlinAdapter,
};

export async function startCheckout(
  adapter: AdapterName,
  payload: CheckoutPayload,
): Promise<CheckoutResult> {
  const stock = await checkStock(payload.cart.items);
  if (!stock.ok) return { ok: false, error: 'oversold', oversold: stock.oversold };

  const fn = adapterMap[adapter];
  if (!fn) return { ok: false, error: 'unknown_adapter' };
  const result = await fn(payload);
  if (result.ok && result.orderId) {
    await saveOrder(result.orderId, adapter, payload).catch((err) => {
      console.error('[orderService] saveOrder failed:', err);
    });
  }
  return result;
}
