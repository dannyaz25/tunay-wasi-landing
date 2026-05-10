import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/shared/firebase';
import type { PedidoDoc, PedidoItem, PedidoShipping, PedidoTotals } from '@/shared/types/firestore';
import type { AdapterName, CheckoutPayload } from '@/shared/types/checkout';
import type { CartItem } from '@/shared/types/cart';

// Firestore rejects undefined values — strip them before write.
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function toItem(item: CartItem): PedidoItem {
  return {
    // item.productoId / item.producerPct may be undefined on old localStorage items
    productoId: (item as CartItem).productoId ?? item.sku,
    caficultorId: item.caficultor,
    sku: item.sku,
    name: item.name,
    weight: item.weight,
    grind: item.grind,
    unitCents: item.unitCents,
    qty: item.qty,
    caficultor: item.caficultor,
    finca: item.finca,
    producerPct: (item as CartItem).producerPct ?? 0,
  };
}

function deliverEstimate(zone: string, cycle?: { deliverLima: string; deliverProv: string }): string {
  const lima = cycle?.deliverLima ?? 'ago. (1a semana)';
  const prov = cycle?.deliverProv ?? 'ago. (2a semana)';
  return zone === 'provincia' ? prov : lima;
}

export async function saveOrder(
  orderId: string,
  adapter: AdapterName,
  payload: CheckoutPayload,
  cycle?: { cicloCloseAt: string; deliverLima: string; deliverProv: string },
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const { cart, shipping, totals } = payload;

  const pedidoShipping: PedidoShipping = {
    nombre: shipping.nombre,
    telefono: shipping.telefono,
    departamento: shipping.departamento,
    distrito: shipping.distrito,
    direccion: shipping.direccion,
    referencia: shipping.referencia,
    zone: shipping.zone,
  };

  const pedidoTotals: PedidoTotals = {
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    discountCents: totals.discountCents,
    taxIncludedCents: totals.taxIncludedCents,
    totalCents: totals.totalCents,
    producerShareCents: totals.producerShareCents,
  };

  const pedido: PedidoDoc = {
    id,
    orderId,
    status: 'pendiente_pago',
    adapter,
    items: cart.items.map(toItem),
    shipping: pedidoShipping,
    totals: pedidoTotals,
    cicloCloseAt: cycle?.cicloCloseAt ?? '31 may.',
    deliverEstimate: deliverEstimate(shipping.zone, cycle),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'pedidos', id), stripUndefined(pedido));
}
