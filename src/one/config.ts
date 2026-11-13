// TunayWasi ONE — constantes del modelo
// Modelo: caficultor tuesta, empaca y envía directo al negocio.
// TW es plataforma de conexión + pagos. No toca el café físicamente.

export const ONE_CONFIG = {
  // El caficultor fija su precioBaseKgCents ya incluyendo tueste y empaque.
  // TW no agrega costos de producción — ese costo es responsabilidad del caficultor.
  COMISION_PORCENTAJE: 0,           // Sin comisión en fase 1 (gratis usar la plataforma)
  DELIVERY_CENTS: 0,                // Envío coordina el caficultor directo al negocio

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

// Precio al negocio = exactamente lo que fija el caficultor por kg × cantidad
// El caficultor ya incluyó tueste, empaque y su margen en precioBaseKgCents.
export function calcularPrecioFinal(precioBaseKgCents: number, formato: '250g' | '500g' | '1kg' | '5kg' | '10kg' | '25kg'): number {
  const kgs: Record<string, number> = { '250g': 0.25, '500g': 0.5, '1kg': 1, '5kg': 5, '10kg': 10, '25kg': 25 }
  return Math.round(precioBaseKgCents * (kgs[formato] ?? 1))
}

// Colecciones Firestore
export const ONE_COLLECTIONS = {
  CAFICULTORES: 'one_caficultores',
  PRODUCTOS: 'one_productos',
  PEDIDOS: 'one_pedidos',
  USUARIOS: 'one_usuarios',
  KITS: 'one_kits',
  CALIFICACIONES_CAFICULTOR: 'one_calificaciones_caficultor',
  CALIFICACIONES_CAFETERIA: 'one_calificaciones_cafeteria',
  MENUS: 'one_menus',
  MENSAJES: 'one_mensajes',
  UBIGEOS: 'ubigeos',
} as const

// ─── Design system dark unificado ───────────────────────────────────────────
// Netflix-style: bg oscuro #0a0a0a, cards #141414, crema, terra, sage
export const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1e1e1e',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  creamMuted: '#c4b297',
  terra: '#c96e4b',
  terraHover: '#b85d3a',
  sage: '#8faf8a',
  green: '#1f3028',
  white: '#ffffff',
  muted: '#666666',
  yellow: '#f39c12',
  red: '#e74c3c',
  blue: '#4a90c4',
  purple: '#9b59b6',
  text: '#e8e0d8',
  textSub: '#a09080',
} as const

// ─── Etiquetas de proceso para UI
export const PROCESO_LABELS: Record<string, string> = {
  lavado: 'Lavado',
  natural: 'Natural',
  honey: 'Honey',
  anaerobico: 'Anaeróbico',
}

// Etiquetas de formato para UI
export const FORMATO_LABELS: Record<string, string> = {
  '250g': '250 g',
  '500g': '500 g',
  '1kg': '1 kg',
  '5kg': '5 kg',
  '10kg': '10 kg',
  '25kg': '25 kg',
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
