import type { CheckoutPayload, CheckoutResult } from '@/shared/types/checkout';

export async function stripeAdapter(_payload: CheckoutPayload): Promise<CheckoutResult> {
  // TODO: replace with real Stripe SDK integration
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true, orderId: '' };
}
