import type { CheckoutPayload, CheckoutResult } from '@/shared/types/checkout';

export async function yapePlinAdapter(_payload: CheckoutPayload): Promise<CheckoutResult> {
  // TODO: replace with real Yape/Plin flow (deep link or QR generation)
  await new Promise((r) => setTimeout(r, 800));
  return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
}
