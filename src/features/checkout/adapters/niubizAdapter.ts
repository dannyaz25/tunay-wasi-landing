import type { CheckoutPayload, CheckoutResult } from '@/shared/types/checkout';

export async function niubizAdapter(_payload: CheckoutPayload): Promise<CheckoutResult> {
  // TODO: replace with real Niubiz SDK integration
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
}
