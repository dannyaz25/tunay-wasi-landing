// TunayWasi ONE — constantes del modelo

export const ONE_CONFIG = {
  // Precios de delivery en centavos
  DELIVERY_LIMA_CENTS: 1000,        // S/ 10
  DELIVERY_PROVINCIA_CENTS: 2000,   // S/ 20

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
