import type { CartItem, CartTotals } from './cart';

export type AdapterName = 'niubiz' | 'stripe' | 'yape' | 'plin' | 'transferencia';
export type ShippingZone = 'lima' | 'limaExt' | 'provincia' | 'recojo';

export interface ShippingData {
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  referencia: string;
  nombre: string;
  email: string;
  telefono: string;
  zone: ShippingZone;
  acepta: boolean;
  olvaMode: 'recojo' | 'domicilio';
  dni: string;
  ciudad: string;
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
