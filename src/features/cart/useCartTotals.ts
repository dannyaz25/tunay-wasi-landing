import { useMemo } from 'react';
import type { CartTotals } from '@/shared/types/cart';
import type { ShippingZone } from '@/shared/types/checkout';
import { useCartStore } from './cartStore';
import { SHIPPING_RULES } from './shippingRules';
import { useComisiones } from '@/features/catalog/useComisiones';
import { useShipping } from '@/features/catalog/useShipping';

const IGV_INCLUDED_RATE = 0.18;

export function useCartTotals(
  zone: ShippingZone = 'lima',
  olvaMode: 'recojo' | 'domicilio' = 'domicilio',
  couponCode: string | null = null,
): CartTotals {
  const subtotalCents = useCartStore((s) => s.subtotalCents);
  const totalQuantity = useCartStore((s) => s.totalQuantity);
  const { data: comisiones } = useComisiones();
  const { data: liveZones } = useShipping();

  return useMemo(() => {
    const producerShareFactor = comisiones?.producerShareFactor ?? 0.421;

    const liveZone = liveZones?.find((z) => z.key === zone);
    const fallbackRule = SHIPPING_RULES[zone] ?? SHIPPING_RULES.lima;
    const rule = liveZone ?? fallbackRule;

    const effectiveFlatCents = (() => {
      if (zone === 'recojo') return 0;
      if (rule.recojoFlatCents !== undefined && rule.domicilioFlatCents !== undefined) {
        return olvaMode === 'recojo' ? rule.recojoFlatCents : rule.domicilioFlatCents;
      }
      return rule.flatCents;
    })();

    const shippingLabel = (() => {
      if (zone === 'recojo') return rule.label;
      if (rule.recojoFlatCents !== undefined) {
        const modeName = olvaMode === 'recojo' ? 'Recojo en agencia' : 'A domicilio';
        return `${modeName} · ${rule.carrier ?? 'Olva'}`;
      }
      return rule.label;
    })();

    const isFree = rule.freeThresholdCents > 0 && subtotalCents >= rule.freeThresholdCents;
    const shippingCents = isFree ? 0 : effectiveFlatCents;
    const remainingForFree = isFree ? 0 : Math.max(0, rule.freeThresholdCents - subtotalCents);

    let discountCents = 0;
    if (couponCode === 'PRIMERA10') discountCents = Math.round(subtotalCents * 0.1);
    if (couponCode === 'CAFICULTOR15') discountCents = Math.round(subtotalCents * 0.15);

    const totalCents = subtotalCents - discountCents + shippingCents;
    const taxIncludedCents = Math.round(subtotalCents - subtotalCents / (1 + IGV_INCLUDED_RATE));
    const producerShareCents = Math.round((subtotalCents - discountCents) * producerShareFactor);

    return {
      subtotalCents,
      shippingCents,
      shippingLabel,
      shippingFlat: effectiveFlatCents,
      isFreeShipping: isFree,
      remainingForFreeCents: remainingForFree,
      freeThresholdCents: rule.freeThresholdCents,
      discountCents,
      taxIncludedCents,
      totalCents,
      totalQuantity,
      producerShareCents,
    };
  }, [subtotalCents, totalQuantity, zone, olvaMode, couponCode, comisiones, liveZones]);
}
