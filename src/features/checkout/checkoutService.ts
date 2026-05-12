import { doc, increment, runTransaction } from 'firebase/firestore';
import type { AdapterName, CheckoutPayload, CheckoutResult } from '@/shared/types/checkout';
import type { CartItem } from '@/shared/types/cart';
import type { WeightLabel } from '@/shared/types/firestore';
import { db } from '@/shared/firebase';
import { niubizAdapter } from './adapters/niubizAdapter';
import { stripeAdapter } from './adapters/stripeAdapter';
import { yapeAdapter, plinAdapter, transferenciaAdapter } from './adapters/yapePlinAdapter';
import { saveOrder } from './orderService';
import { KG_PER_UNIT } from '@/features/catalog/stockUtils';
import { sendMail } from '@/services/mailService';
import { emailPedidoRecibido } from '@/services/emailTemplates';

interface StockCheckResult {
  ok: boolean;
  oversold: string[];
}

async function checkStock(items: CartItem[]): Promise<StockCheckResult> {
  return runTransaction(db, async (tx) => {
    const oversold: string[] = [];

    for (const item of items) {
      const ref = doc(db, 'productos', item.productoId);
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        oversold.push(`${item.name} (${item.weight})`);
        continue;
      }
      const data = snap.data() as { stockKg?: number; stockReservedKg?: number };
      const disponible = (data.stockKg ?? 0) - (data.stockReservedKg ?? 0);
      const kgNeeded = KG_PER_UNIT[item.weight as WeightLabel] * item.qty;

      if (kgNeeded > disponible) {
        oversold.push(`${item.name} (${item.weight})`);
      }
    }

    if (oversold.length > 0) return { ok: false, oversold };

    for (const item of items) {
      const ref = doc(db, 'productos', item.productoId);
      const kgNeeded = KG_PER_UNIT[item.weight as WeightLabel] * item.qty;
      tx.update(ref, { stockReservedKg: increment(kgNeeded) });
    }

    return { ok: true, oversold: [] };
  });
}

const adapterMap: Record<AdapterName, (p: CheckoutPayload) => Promise<CheckoutResult>> = {
  niubiz: niubizAdapter,
  stripe: stripeAdapter,
  yape: yapeAdapter,
  plin: plinAdapter,
  transferencia: transferenciaAdapter,
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
  if (result.ok) {
    const orderId = await saveOrder(adapter, payload).catch((err) => {
      console.error('[orderService] saveOrder failed:', err);
      return null;
    });
    if (orderId) {
      result.orderId = orderId;
      const email = payload.shipping.email;
      if (email) {
        const { subject, html } = emailPedidoRecibido({
          nombre: payload.shipping.nombre,
          orderId,
          items: payload.cart.items.map(i => ({
            name: i.name, weight: i.weight, grind: i.grind,
            qty: i.qty, unitCents: i.unitCents,
          })),
          totalCents: payload.totals.totalCents,
          adapter,
        });
        sendMail({ to: email, subject, html }).catch(err =>
          console.error('[checkoutService] sendMail failed:', err),
        );
      }
    }
  }
  return result;
}
