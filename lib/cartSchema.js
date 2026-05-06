// lib/cartSchema.js — minimal Zod-like validator.
// Mirrors the API of zod's z.object().parse(); in a real codebase this file
// would be replaced by `import { z } from 'zod'` with the same shape.

const fail = (msg) => { const e = new Error(msg); e.name = 'CartValidationError'; throw e; };

// Each schema fn validates and returns the value, throws on failure.
const v = {
  string: (min = 1) => (val) => {
    if (typeof val !== 'string') fail('expected string');
    if (val.length < min) fail(`string < ${min} chars`);
    return val;
  },
  intCents: (val) => {
    if (!Number.isInteger(val)) fail('expected integer cents');
    if (val < 0) fail('negative cents');
    return val;
  },
  posInt: (val) => {
    if (!Number.isInteger(val) || val < 1) fail('expected positive integer');
    return val;
  },
  enumOf: (opts) => (val) => {
    if (!opts.includes(val)) fail(`not in [${opts.join(',')}]`);
    return val;
  },
  any: (val) => val,
};

const CartItemSchema = (raw) => ({
  id:        v.string()(raw.id),                 // unique key (sku + grind)
  sku:       v.string()(raw.sku),                // product sku
  name:      v.string()(raw.name),
  weight:    v.enumOf(['250g', '1kg', '3kg'])(raw.weight),
  grind:     v.enumOf(['Grano', 'V60', 'Chemex', 'Espresso', 'Moka', 'French Press', 'AeroPress'])(raw.grind),
  unitCents: v.intCents(raw.unitCents),
  qty:       v.posInt(raw.qty),
  maxQty:    v.posInt(raw.maxQty),
  // metadata
  caficultor: v.string()(raw.caficultor),
  finca:      v.string()(raw.finca),
  badge:      raw.badge ?? 'Selección',
});

window.CartSchema = { CartItemSchema };
