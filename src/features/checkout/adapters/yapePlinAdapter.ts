import type { CheckoutPayload, CheckoutResult } from '@/shared/types/checkout';

export async function yapeAdapter(_payload: CheckoutPayload): Promise<CheckoutResult> {
  // TODO: replace with real Yape flow (deep link or QR generation)
  await new Promise((r) => setTimeout(r, 800));
  return { ok: true, orderId: '' };
}

export async function plinAdapter(_payload: CheckoutPayload): Promise<CheckoutResult> {
  await new Promise((r) => setTimeout(r, 800));
  return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
}

export async function transferenciaAdapter(_payload: CheckoutPayload): Promise<CheckoutResult> {
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true, orderId: 'TW-' + Math.floor(Math.random() * 9000 + 1000) };
}
