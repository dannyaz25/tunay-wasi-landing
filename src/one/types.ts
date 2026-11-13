// TunayWasi ONE — tipos de datos
// Noviembre 2026 — alineado al esquema Android

// ─── CAFICULTOR ─────────────────────────────────────────────────────────────
// El perfil del caficultor ahora vive dentro de one_usuarios (rol='caficultor')
// CaficultorONE es la vista pública del caficultor para el catálogo

export interface CaficultorONE {
  id: string
  nombre: string
  foto: string                    // URL Firebase Storage o Cloudinary
  region: string                  // "Cajamarca"
  distrito: string                // "San Ignacio"
  altitudMsnm: number             // 1800
  historia: string                // Texto corto ~100 palabras
  coordenadas?: {
    lat: number
    lng: number
  }
  activo: boolean
  createdAt: string

  // Score de confianza — agregado de calificaciones de negocios
  scoreConfianza?: number         // Promedio 1-5, calculado al guardar calificación
  totalCalificaciones?: number    // Conteo total para mostrar "basado en N pedidos"
}

// ─── PRODUCTO ────────────────────────────────────────────────────────────────

export type ProcesoONE = 'lavado' | 'natural' | 'honey' | 'anaerobico'
export type StatusProductoONE = 'activo' | 'agotado' | 'pausado'
export type PresentacionONE = 'tostado_grano' | 'tostado_molido'
export type NivelTuesteONE = 'claro' | 'medio' | 'oscuro'

// Costos privados del caficultor — no se exponen al comprador
export interface CostosProductoONE {
  precioVerdeKgCents: number      // Lo que paga al productor por kg verde
  costoTuesteKgCents: number      // Cobro de tostadora por kg
  costoBolsaUndCents: number      // Costo de bolsa/empaque por unidad
  margenPct: number               // 10 | 20 | 30 | 40 | 50
}

export interface ProductoONE {
  id: string
  caficultorId: string            // FK → one_usuarios (rol=caficultor)
  caficultorNombre: string        // Desnormalizado para queries rápidas

  // Identidad del café
  nombre: string                  // "Bourbon Lavado — Los Alisos"
  variedad: string                // "Bourbon"
  proceso: ProcesoONE
  presentacion: PresentacionONE  // 'tostado_grano' | 'tostado_molido'
  nivelTueste: NivelTuesteONE    // definido por el caficultor según variedad/proceso
  altitudMsnm: number
  cosecha: string                 // "06/2026"
  notasSabor: string[]            // ["durazno", "panela", "chocolate"] — verificados post-tueste
  descripcion: string             // Texto libre ~50 palabras

  // Calidad (referencial, sin Q-Grader por ahora)
  puntajeReferencial?: number     // ~86 pts — declarado por caficultor
  notaReferencial: string         // "Puntaje referencial — certificación independiente próximamente"

  // Costos privados — solo visibles para el caficultor en su portal
  costos: CostosProductoONE

  // Precio base por kg en centavos (ej: 5000 = S/50.00/kg)
  // Los formatos (250g, 500g, 1kg, 5kg) se calculan en el frontend desde este valor
  precioBaseKgCents: number

  // Stock
  kgDisponibles: number
  kgReservados: number

  status: StatusProductoONE
  fotos: string[]                 // URLs Firebase Storage (hasta 5)
  foto: string                    // Foto principal (primera de fotos o legacy)

  createdAt: string
  updatedAt: string
}

// Helper: calcula precio de una presentación a partir de precioBaseKgCents
export function calcPrecio(precioBaseKgCents: number, presentacionKg: number, descuentoPct = 0): number {
  const precio = precioBaseKgCents * presentacionKg
  return Math.round(precio * (1 - descuentoPct / 100))
}

// Presentaciones disponibles con sus kg equivalentes
export const PRESENTACIONES = [
  { label: '250g', kg: 0.25, presentacion: '250g' },
  { label: '500g', kg: 0.5,  presentacion: '500g' },
  { label: '1kg',  kg: 1.0,  presentacion: '1kg'  },
  { label: '5kg',  kg: 5.0,  presentacion: '5kg'  },
] as const

export type FormatoONE = '250g' | '500g' | '1kg' | '5kg' | '10kg' | '25kg'

// ─── PEDIDO ──────────────────────────────────────────────────────────────────

export type PagoStatusONE = 'pendiente' | 'voucher_subido' | 'verificado' | 'rechazado'
export type LogisticaStatusONE = 'preparando' | 'en_agencia' | 'entregado'
export type AgenciaONE = 'olva' | 'shalom' | 'servientrega' | 'otra'

export interface ItemPedidoONE {
  productoId: string
  productoNombre: string
  caficultorId: string            // FK → one_usuarios (rol=caficultor)
  caficultorNombre: string
  presentacion: FormatoONE        // '250g' | '500g' | '1kg' | '5kg' (alineado con Android)
  qty: number                     // Número de unidades de la presentación
  unitCents: number               // Precio unitario en centavos
  subtotalCents: number
  menuId?: string                 // FK → one_menus (si viene de "Reponer menú")
}

export interface PedidoONE {
  id: string                      // ONE-{año}-{4 dígitos random}

  // Comprador (negocio)
  negocioId: string               // FK → one_usuarios (rol=negocio)
  negocioNombre: string
  negocioEmail: string
  negocioTelefono: string

  // Datos del local
  nombreLocal: string             // "Café El Origen"
  distritoLocal: string           // "Miraflores"

  items: ItemPedidoONE[]

  // Totales
  subtotalCents: number
  deliveryCents: number
  totalCents: number

  // Pago
  metodoPago: 'yape' | 'transferencia'
  pagoStatus: PagoStatusONE
  voucherUrl?: string

  // Logística
  direccionEntrega: string
  logisticaStatus: LogisticaStatusONE
  notasEntrega?: string

  // Envío por agencia
  agencia?: AgenciaONE
  codigoAgencia?: string
  fotoDespacho?: string
  recepcionConfirmada: boolean

  // Kit de identidad
  kitGenerado: boolean
  kitId?: string                  // FK → one_kits

  // Calificación post-entrega
  calificado: boolean
  calificacionId?: string

  esKitProveedor: boolean

  createdAt: string
  updatedAt: string
}

// ─── USUARIO ─────────────────────────────────────────────────────────────────

export type RolONE = 'negocio' | 'caficultor' | 'admin'
export type EtapaNegocio = 'planificando' | 'proxima_apertura' | 'abierto'

export interface UsuarioONE {
  uid: string
  rol: RolONE
  nombre: string
  email?: string
  telefono?: string

  // Solo para negocios (compradores)
  negocio?: {
    nombreLocal: string
    distritoLocal: string
    fotoLocal?: string
    descripcion?: string
    etapa: EtapaNegocio
    fechaAperturaEstimada?: string
    pedidoIds: string[]
    scoreConfianza?: number
    totalCalificaciones?: number
  }

  // Solo para caficultores
  caficultor?: {
    region: string
    distrito: string
    altitudMsnm?: number
    historia?: string
    foto?: string
    coordenadas?: { lat: number; lng: number }
    activo: boolean
  }

  createdAt: string
}

// ─── KIT DE IDENTIDAD ────────────────────────────────────────────────────────

export interface ProductoEnKitONE {
  caficultorNombre: string
  caficultorFoto: string
  caficultorRegion: string
  caficultorAltitud: number
  caficultorHistoria: string
  productoNombre: string
  variedad: string
  proceso: string
  notasSabor: string[]
  puntajeReferencial?: number
}

export interface KitIdentidadONE {
  id: string
  pedidoId: string                // FK → one_pedidos
  negocioId: string
  nombreLocal: string

  productos: ProductoEnKitONE[]

  menuPdfUrl?: string
  fichasUrl?: string
  qrUrl?: string
  instagramPackUrl?: string

  createdAt: string
}

// ─── INPUTS PARA CREAR ───────────────────────────────────────────────────────

export interface CreatePedidoInput {
  negocioId: string
  negocioNombre: string
  negocioEmail: string
  negocioTelefono: string
  nombreLocal: string
  distritoLocal: string
  items: Omit<ItemPedidoONE, 'subtotalCents'>[]
  metodoPago: 'yape' | 'transferencia'
  direccionEntrega: string
  agencia?: AgenciaONE
  esKitProveedor: boolean
}

export interface CreateUsuarioInput {
  uid: string
  rol: RolONE
  nombre: string
  email?: string
  telefono?: string
  negocio?: UsuarioONE['negocio']
  caficultor?: UsuarioONE['caficultor']
}

// ─── CALIFICACIONES ──────────────────────────────────────────────────────────

// Negocio califica al caficultor después de recibir el pedido
export interface CalificacionCaficultor {
  id: string
  pedidoId: string                // FK → one_pedidos (1 calificación por pedido)
  caficultorId: string            // FK → one_usuarios (rol=caficultor)
  negocioId: string               // FK → one_usuarios (rol=negocio)
  negocioNombre: string           // Desnormalizado
  nombreLocal: string             // Negocio que califica
  estrellas: 1 | 2 | 3 | 4 | 5
  comentario?: string
  createdAt: string
}

// Cliente final califica la cafetería desde PerfilCaficultor (QR en la mesa)
export interface CalificacionCafeteria {
  id: string
  caficultorId: string
  productoId?: string
  nombreLocal: string
  distritoLocal: string
  estrellas: 1 | 2 | 3 | 4 | 5
  comentario?: string
  createdAt: string
}

export interface CreateCalificacionCaficultorInput {
  pedidoId: string
  caficultorId: string
  negocioId: string
  negocioNombre: string
  nombreLocal: string
  estrellas: 1 | 2 | 3 | 4 | 5
  comentario?: string
}

export interface CreateCalificacionCafeteriaInput {
  caficultorId: string
  productoId?: string
  nombreLocal: string
  distritoLocal: string
  estrellas: 1 | 2 | 3 | 4 | 5
  comentario?: string
}

// ─── CHAT / MENSAJES ─────────────────────────────────────────────────────────

export type AutorMensajeONE = 'negocio' | 'caficultor'

export interface MensajePedidoONE {
  id: string
  pedidoId: string
  autorId: string                 // uid del remitente
  autorNombre: string
  autorRol: AutorMensajeONE
  texto: string
  tipo: 'texto' | 'tracking'     // tracking = mensaje automático al despachar
  createdAt: string
}

export interface SendMensajeInput {
  pedidoId: string
  autorId: string
  autorNombre: string
  autorRol: AutorMensajeONE
  texto: string
  tipo?: MensajePedidoONE['tipo']
}

// ─── LOGÍSTICA CAFICULTOR ─────────────────────────────────────────────────────

export interface AgenciaLogisticaONE {
  id: string
  nombre: string
  direccion?: string
  horario?: string
}

export interface UbigeoONE {
  id: string
  departamento: string
  provincia: string
  distrito: string
  agencias: AgenciaLogisticaONE[]
}

export interface LogisticaCaficultorONE {
  ubigeo: string          // ID del doc en Firestore 'ubigeos'
  departamento: string
  provincia: string
  distrito: string
  origenTexto: string     // "Distrito, Provincia, Departamento"
  agencias: string[]                          // IDs de agencias activas
  agenciasMap: Record<string, string>         // id → nombre
  agenciasActivas: Record<string, boolean>
  agenciasPermiteDomicilio: Record<string, boolean>
}

export interface SaveLogisticaInput {
  caficultorId: string
  ubigeo: string
  departamento: string
  provincia: string
  distrito: string
  agencias: string[]
  agenciasMap: Record<string, string>
  agenciasActivas: Record<string, boolean>
  agenciasPermiteDomicilio: Record<string, boolean>
}



export interface PreparacionMenu {
  nombre: string                        // "Espresso", "V60", "Cold Brew"
  precio: number                        // En soles (ej: 12)
  metodo: string                        // "Espresso", "Filtrado V60", etc.
  categoria: 'ESPRESSO' | 'FILTER' | 'FRÍO'
  caficultorNombre: string              // "Aydé Lloclla Díaz"
  origen: string                        // "Geisha Natural · Aydé Lloclla · Cajamarca"
  notas: string[]                       // ["durazno", "panela", "jazmín"]
}

export interface MenuONE {
  id: string
  negocioId: string               // FK → one_usuarios (rol=negocio)
  nombre: string
  descripcion?: string
  cafesIds: string[]
  preparaciones: PreparacionMenu[]
  activo: boolean
  qrUrl: string
  createdAt: string
  updatedAt: string
}

export interface CreateMenuInput {
  negocioId: string
  nombre: string
  descripcion?: string
  cafesIds: string[]
  preparaciones?: PreparacionMenu[]
}
