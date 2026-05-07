export type WeightOption = '250g' | '1kg' | '3kg';
export type GrindOption =
  | 'Grano'
  | 'V60'
  | 'Chemex'
  | 'Espresso'
  | 'Moka'
  | 'French Press'
  | 'AeroPress';

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  weight: WeightOption;
  grind: GrindOption;
  unitCents: number;
  qty: number;
  maxQty: number;
  caficultor: string;
  finca: string;
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
