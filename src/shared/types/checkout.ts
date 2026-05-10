import type { CartItem, CartTotals } from './cart';

export type AdapterName = 'niubiz' | 'stripe' | 'yapePlin';
export type ShippingZone = 'lima' | 'provincia';

export interface ShippingData {
  departamento: string;
  distrito: string;
  direccion: string;
  referencia: string;
  nombre: string;
  telefono: string;
  zone: ShippingZone;
  acepta: boolean;
}

export interface CheckoutPayload {
  cart: { items: CartItem[] };
  shipping: ShippingData;
  totals: CartTotals;
}

export interface CheckoutResult {
  ok: boolean;
  orderId?: string;
  redirectUrl?: string;
  error?: string;
  oversold?: string[];
}
