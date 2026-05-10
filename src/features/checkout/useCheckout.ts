import { useState, useCallback } from 'react';
import type { AdapterName, ShippingData } from '@/shared/types/checkout';
import { useCartItems, useCartActions } from '@/features/cart/useCart';
import { useCartTotals } from '@/features/cart/useCartTotals';
import { startCheckout } from './checkoutService';

export function isValidPeruvianPhone(raw: string): boolean {
  const digits = raw.replace(/[\s\-+()]/g, '');
  const local = digits.startsWith('51') && digits.length === 11 ? digits.slice(2) : digits;
  return /^9\d{8}$/.test(local);
}

const DEFAULT_DATA: ShippingData = {
  departamento: 'Lima Metropolitana',
  provincia: 'Lima',
  distrito: 'Miraflores',
  direccion: '',
  referencia: '',
  nombre: '',
  telefono: '',
  zone: 'lima',
  acepta: false,
  olvaMode: 'domicilio',
  dni: '',
  ciudad: '',
};

export type CheckoutStatus = 'idle' | 'paying' | 'done';

export function useCheckout() {
  const [data, setData] = useState<ShippingData>(DEFAULT_DATA);
  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);

  const items = useCartItems();
  const { clear, closeCheckout } = useCartActions();
  const totals = useCartTotals(data.zone, data.olvaMode);

  const isOlvaZone = data.zone === 'limaExt' || data.zone === 'provincia';
  const isNationalZone = data.zone === 'provincia';

  const canContinue =
    (isOlvaZone || data.direccion.trim().length > 3) &&
    (isOlvaZone ? data.dni.trim().length >= 8 : true) &&
    (!isNationalZone || data.ciudad.trim().length > 1) &&
    data.nombre.trim().length > 1 &&
    isValidPeruvianPhone(data.telefono) &&
    data.acepta;

  const submitPayment = useCallback(
    async (adapter: AdapterName) => {
      setStatus('paying');
      const res = await startCheckout(adapter, { cart: { items }, shipping: data, totals });
      if (res.ok) {
        setOrderId(res.orderId ?? null);
        setStatus('done');
      } else {
        setStatus('idle');
        alert('Hubo un problema: ' + (res.error ?? 'desconocido'));
      }
    },
    [items, data, totals],
  );

  const reset = useCallback(() => {
    clear();
    closeCheckout();
    setData(DEFAULT_DATA);
    setStatus('idle');
    setOrderId(null);
  }, [clear, closeCheckout]);

  return { data, setData, status, orderId, totals, canContinue, submitPayment, reset };
}
