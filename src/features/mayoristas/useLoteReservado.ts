import { useState, useEffect } from 'react';

export interface LoteReservado {
  id: string;
  variedad: string;
  origen: string;
  sca: number;
  precioKg: number;
}

let _current: LoteReservado | null = null;
const _subs = new Set<() => void>();

export function setLoteReservado(lote: LoteReservado | null): void {
  _current = lote;
  _subs.forEach(fn => fn());
}

export function useLoteReservado(): LoteReservado | null {
  const [lote, setLote] = useState<LoteReservado | null>(_current);
  useEffect(() => {
    const sync = () => setLote(_current);
    _subs.add(sync);
    return () => { _subs.delete(sync); };
  }, []);
  return lote;
}
