export const catalogKeys = {
  all: ['catalog'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  caficultores: () => [...catalogKeys.all, 'caficultores'] as const,
  activeCycle: () => [...catalogKeys.all, 'activeCycle'] as const,
  comisiones: () => [...catalogKeys.all, 'comisiones'] as const,
  shippingZones: () => [...catalogKeys.all, 'shippingZones'] as const,
  landingConfig: () => [...catalogKeys.all, 'landingConfig'] as const,
  yapePlin: () => [...catalogKeys.all, 'yapePlin'] as const,
  transferencia: () => [...catalogKeys.all, 'transferencia'] as const,
  pricing: () => [...catalogKeys.all, 'pricing'] as const,
  cafiLandingConfig: () => [...catalogKeys.all, 'cafiLandingConfig'] as const,
};
