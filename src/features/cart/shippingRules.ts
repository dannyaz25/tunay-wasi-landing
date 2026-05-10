import type { ShippingZone } from '@/shared/types/checkout';

export interface ShippingRule {
  label: string;
  flatCents: number;
  freeThresholdCents: number;
  carrier?: string;
  transitDays?: string;
  recojoFlatCents?: number;
  domicilioFlatCents?: number;
}

export const SHIPPING_RULES: Record<ShippingZone, ShippingRule> = {
  lima:      { label: 'Delivery a domicilio',       flatCents:  800, freeThresholdCents: 10000 },
  limaExt:  { label: 'Olva Courier · Lima',         flatCents: 1200, freeThresholdCents: 12000, carrier: 'Olva Courier', transitDays: '2-3', recojoFlatCents: 1000, domicilioFlatCents: 1200 },
  provincia: { label: 'Olva Courier · Nacional',    flatCents: 1500, freeThresholdCents: 15000, carrier: 'Olva Courier', transitDays: '3-5', recojoFlatCents: 1200, domicilioFlatCents: 1500 },
  recojo:    { label: 'Recojo en Olva · Barranca',  flatCents:    0, freeThresholdCents:     0 },
};
