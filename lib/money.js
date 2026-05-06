// lib/money.js — integer-cents arithmetic to avoid float rounding.
// All prices internally stored as INTEGER cents (céntimos).
// PEN: 1 sol = 100 céntimos.

const toCents = (s) => Math.round(Number(s) * 100);
const fromCents = (c) => c / 100;

// "S/ 1,234.56"
const formatPEN = (cents) => {
  if (cents == null || isNaN(cents)) return 'S/ 0.00';
  const n = fromCents(cents);
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Short variant for small UI: "S/ 25" if integer, "S/ 25.30" otherwise
const formatPENShort = (cents) => {
  if (cents == null || isNaN(cents)) return 'S/ 0';
  const n = fromCents(cents);
  return 'S/ ' + (n % 1 === 0
    ? n.toLocaleString('es-PE')
    : n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
};

window.Money = { toCents, fromCents, formatPEN, formatPENShort };
