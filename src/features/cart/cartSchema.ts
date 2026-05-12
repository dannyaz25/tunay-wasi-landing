import { z } from 'zod';
import type { CartItem } from '@/shared/types/cart';
import { WEIGHT_OPTIONS, GRIND_OPTIONS } from '@/shared/constants';

const schema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  productoId: z.string().min(1),
  name: z.string().min(1),
  weight: z.enum(WEIGHT_OPTIONS),
  grind: z.enum(GRIND_OPTIONS),
  unitCents: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
  maxQty: z.number().int().positive(),
  caficultor: z.string().min(1),
  finca: z.string().min(1),
  producerPct: z.number().nonnegative(),
  badge: z.string().default('Selección'),
});

export const CartItemSchema = {
  parse: (raw: unknown): CartItem => schema.parse(raw) as CartItem,
};
