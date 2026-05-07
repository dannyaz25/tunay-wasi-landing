// lib/useCartTotals.js — reactive totals: subtotal, shipping, tax, discount, grand total.
// All values are integer cents.

const SHIPPING_RULES = {
  // Lima Metropolitana
  lima: {
    label: 'Delivery Lima',
    flatCents: 800,           // S/ 8
    freeThresholdCents: 10000, // S/ 100
  },
  // Lima extendida (Olva)
  limaExt: {
    label: 'Lima ext. (Olva)',
    flatCents: 1200,           // S/ 12 (mid of 10-12)
    freeThresholdCents: 12000, // S/ 120
  },
  // Provincia (Olva)
  provincia: {
    label: 'Provincia (Olva)',
    flatCents: 1500,           // S/ 15
    freeThresholdCents: 15000, // S/ 150
  },
  recojo: {
    label: 'Recojo en Olva · Barranca',
    flatCents: 0,
    freeThresholdCents: 0,
  },
};

// IGV in Peru is 18% but coffee retail is normally inclusive.
// We represent it informationally only.
const IGV_INCLUDED_RATE = 0.18;

const useCartTotals = (zone = 'lima', couponCode = null) => {
  const subtotalCents = window.useCart((s) => s.subtotalCents);
  const totalQuantity = window.useCart((s) => s.totalQuantity);

  return React.useMemo(() => {
    const rule = SHIPPING_RULES[zone] || SHIPPING_RULES.lima;
    const shippingFlat = rule.flatCents;
    const isFree = rule.freeThresholdCents > 0 && subtotalCents >= rule.freeThresholdCents;
    const shippingCents = isFree ? 0 : shippingFlat;
    const remainingForFree = isFree ? 0 : Math.max(0, rule.freeThresholdCents - subtotalCents);

    let discountCents = 0;
    if (couponCode === 'PRIMERA10') discountCents = Math.round(subtotalCents * 0.10);
    if (couponCode === 'CAFICULTOR15') discountCents = Math.round(subtotalCents * 0.15);

    const totalCents = subtotalCents - discountCents + shippingCents;
    // tax (informational, IGV included in price)
    const taxIncludedCents = Math.round(subtotalCents - subtotalCents / (1 + IGV_INCLUDED_RATE));
    // 50% to producer (transparency)
    const producerShareCents = Math.round((subtotalCents - discountCents) * 0.421);

    return {
      subtotalCents,
      shippingCents,
      shippingLabel: rule.label,
      shippingFlat,
      isFreeShipping: isFree,
      remainingForFreeCents: remainingForFree,
      freeThresholdCents: rule.freeThresholdCents,
      discountCents,
      taxIncludedCents,
      totalCents,
      totalQuantity,
      producerShareCents,
    };
  }, [subtotalCents, totalQuantity, zone, couponCode]);
};

window.useCartTotals = useCartTotals;
window.SHIPPING_RULES = SHIPPING_RULES;
