const toCents = (s: number | string): number => Math.round(Number(s) * 100);
const fromCents = (c: number): number => c / 100;

const formatPEN = (cents: number): string => {
  if (cents == null || isNaN(cents)) return 'S/ 0.00';
  const n = fromCents(cents);
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPENShort = (cents: number): string => {
  if (cents == null || isNaN(cents)) return 'S/ 0';
  const n = fromCents(cents);
  return 'S/ ' + (n % 1 === 0
    ? n.toLocaleString('es-PE')
    : n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
};

export const Money = { toCents, fromCents, formatPEN, formatPENShort };
