import type { ShippingZone } from '@/shared/types/checkout';

export interface ShippingRule {
  label: string;
  flatCents: number;
  freeThresholdCents: number;
}

export const SHIPPING_RULES: Record<ShippingZone, ShippingRule> = {
  lima: {
    label: 'Delivery Lima',
    flatCents: 800,
    freeThresholdCents: 10000,
  },
  limaExt: {
    label: 'Lima ext. (Olva)',
    flatCents: 1200,
    freeThresholdCents: 12000,
  },
  provincia: {
    label: 'Provincia (Olva)',
    flatCents: 1500,
    freeThresholdCents: 15000,
  },
  recojo: {
    label: 'Recojo en Olva · Barranca',
    flatCents: 0,
    freeThresholdCents: 0,
  },
};
