import type { WeightLabel } from '@/shared/types/firestore';

export const KG_PER_UNIT: Record<WeightLabel, number> = {
  '250g': 0.301,
  '1kg':  1.205,
  '3kg':  3.614,
};

export function disponibleKg(stockKg: number, stockReservedKg: number = 0): number {
  return Math.max(0, stockKg - stockReservedKg);
}

export function maxQtyForWeight(stockDisponibleKg: number, weight: WeightLabel): number {
  return Math.floor(stockDisponibleKg / KG_PER_UNIT[weight]);
}
