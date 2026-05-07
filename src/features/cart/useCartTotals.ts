import { useMemo } from 'react';
import type { CartTotals } from '@/shared/types/cart';
import type { ShippingZone } from '@/shared/types/checkout';
import { useCartStore } from './cartStore';
import { SHIPPING_RULES } from './shippingRules';

const IGV_INCLUDED_RATE = 0.18;

export function useCartTotals(zone: ShippingZone = 'lima', couponCode: string | null = null): CartTotals {
  const subtotalCents = useCartStore((s) => s.subtotalCents);
  const totalQuantity = useCartStore((s) => s.totalQuantity);

  return useMemo(() => {
    const rule = SHIPPING_RULES[zone] ?? SHIPPING_RULES.lima;
    const isFree = rule.freeThresholdCents > 0 && subtotalCents >= rule.freeThresholdCents;
    const shippingCents = isFree ? 0 : rule.flatCents;
    const remainingForFree = isFree ? 0 : Math.max(0, rule.freeThresholdCents - subtotalCents);

    let discountCents = 0;
    if (couponCode === 'PRIMERA10') discountCents = Math.round(subtotalCents * 0.1);
    if (couponCode === 'CAFICULTOR15') discountCents = Math.round(subtotalCents * 0.15);

    const totalCents = subtotalCents - discountCents + shippingCents;
    const taxIncludedCents = Math.round(subtotalCents - subtotalCents / (1 + IGV_INCLUDED_RATE));
    const producerShareCents = Math.round((subtotalCents - discountCents) * 0.421);

    return {
      subtotalCents,
      shippingCents,
      shippingLabel: rule.label,
      shippingFlat: rule.flatCents,
      isFreeShipping: isFree,
      remainingForFreeCents: remainingForFree,
      freeThresholdCents: rule.freeThresholdCents,
      discountCents,
      taxIncludedCents,
      totalCents,
      totalQuantity,
      producerShareCents,
    };
  }, [subtotalCents, totalQuantity, zone, couponCode]);
}
