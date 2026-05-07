import { z } from 'zod';
import type { CartItem } from '@/shared/types/cart';

const schema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  weight: z.enum(['250g', '1kg', '3kg']),
  grind: z.enum(['Grano', 'V60', 'Chemex', 'Espresso', 'Moka', 'French Press', 'AeroPress']),
  unitCents: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
  maxQty: z.number().int().positive(),
  caficultor: z.string().min(1),
  finca: z.string().min(1),
  badge: z.string().default('Selección'),
});

export const CartItemSchema = {
  parse: (raw: unknown): CartItem => schema.parse(raw) as CartItem,
};
