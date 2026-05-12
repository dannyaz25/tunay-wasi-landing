import { WEIGHT_OPTIONS, GRIND_OPTIONS } from '../constants';

export type WeightOption = (typeof WEIGHT_OPTIONS)[number];
export type GrindOption  = (typeof GRIND_OPTIONS)[number];

export interface CartItem {
  id: string;
  sku: string;
  productoId: string;
  name: string;
  weight: WeightOption;
  grind: GrindOption;
  unitCents: number;
  qty: number;
  maxQty: number;
  caficultor: string;
  finca: string;
  producerPct: number;
  badge: string;
}

export interface CartTotals {
  subtotalCents: number;
  shippingCents: number;
  shippingLabel: string;
  shippingFlat: number;
  isFreeShipping: boolean;
  remainingForFreeCents: number;
  freeThresholdCents: number;
  discountCents: number;
  taxIncludedCents: number;
  totalCents: number;
  totalQuantity: number;
  producerShareCents: number;
}
