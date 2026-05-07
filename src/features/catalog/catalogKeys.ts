export const catalogKeys = {
  all: ['catalog'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  caficultores: () => [...catalogKeys.all, 'caficultores'] as const,
  activeCycle: () => [...catalogKeys.all, 'activeCycle'] as const,
};
