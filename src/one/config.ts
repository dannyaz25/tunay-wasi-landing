// TunayWasi ONE — constantes del modelo

export const ONE_CONFIG = {
  // Costos de producción (se suman al precio del caficultor)
  TUESTE_POR_KG_CENTS: 500,         // S/ 5 por kg tostado
  BOLSA_POR_UNIDAD_CENTS: 100,      // S/ 1 por bolsa

  // Sin delivery (corre por cuenta del emprendedor) ni comisión en fase 1
  DELIVERY_CENTS: 0,
  COMISION_PORCENTAJE: 0,

  // Compromiso mínimo Kit Proveedor
  COMPROMISO_MESES_MIN: 3,

  // Datos de pago (completar antes de lanzar)
  YAPE_NUMERO: '+51 XXX XXX XXX',
  BCP_CCI: 'XXX XXX XXX XXX',
  BCP_TITULAR: 'Tunay Wasi SAC',
  BCP_CUENTA: 'XXX-XXXXXXXX-X-XX',

  // WhatsApp admin para notificaciones
  ADMIN_WHATSAPP: '+51 XXX XXX XXX',

  // Generador de IDs de pedido
  PEDIDO_PREFIX: 'ONE',
  PEDIDO_YEAR: new Date().getFullYear(),
} as const

// Unidades por formato (para calcular costo de bolsas)
export const UNIDADES_POR_FORMATO: Record<string, number> = {
  '250g': 4,   // 4 bolsas de 250g = 1kg
  '1kg': 1,    // 1 bolsa por kg
  '5kg': 5,    // 5 bolsas de 1kg (o 1 saco, según empaque)
}

// Calcula el precio final al emprendedor dado el precio base del caficultor
// precioBaseCents: precio del caficultor por kg en centavos
// formato: '250g' | '1kg' | '5kg'
export function calcularPrecioFinal(precioBaseKgCents: number, formato: '250g' | '1kg' | '5kg'): number {
  const kgs = formato === '250g' ? 0.25 : formato === '1kg' ? 1 : 5
  const unidades = UNIDADES_POR_FORMATO[formato]
  const costoTueste = Math.round(ONE_CONFIG.TUESTE_POR_KG_CENTS * kgs)
  const costoBolsas = ONE_CONFIG.BOLSA_POR_UNIDAD_CENTS * unidades
  return Math.round(precioBaseKgCents * kgs) + costoTueste + costoBolsas
}

// Colecciones Firestore
export const ONE_COLLECTIONS = {
  CAFICULTORES: 'one_caficultores',
  PRODUCTOS: 'one_productos',
  PEDIDOS: 'one_pedidos',
  USUARIOS: 'one_usuarios',
  KITS: 'one_kits',
} as const

// Etiquetas de proceso para UI
export const PROCESO_LABELS: Record<string, string> = {
  lavado: 'Lavado',
  natural: 'Natural',
  honey: 'Honey',
  anaerobico: 'Anaeróbico',
}

// Etiquetas de formato para UI
export const FORMATO_LABELS: Record<string, string> = {
  '250g': '250 g',
  '1kg': '1 kg',
  '5kg': '5 kg',
}

// Etiquetas de estado de pago para UI
export const PAGO_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente de pago',
  voucher_subido: 'Voucher enviado',
  verificado: 'Pago verificado',
  rechazado: 'Pago rechazado',
}

// Etiquetas de estado de logística para UI
export const LOGISTICA_STATUS_LABELS: Record<string, string> = {
  preparando: 'Preparando',
  despachado: 'En camino',
  entregado: 'Entregado',
}
