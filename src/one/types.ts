// TunayWasi ONE — tipos de datos
// Septiembre 2026 — modelo simplificado para validar el negocio

// ─── CAFICULTOR ─────────────────────────────────────────────────────────────

export interface CaficultorONE {
  id: string
  nombre: string
  foto: string                    // URL Cloudinary
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
}

// ─── PRODUCTO ────────────────────────────────────────────────────────────────

export type ProcesoONE = 'lavado' | 'natural' | 'honey' | 'anaerobico'
export type StatusProductoONE = 'activo' | 'agotado' | 'pausado'

export interface ProductoONE {
  id: string
  caficultorId: string            // FK → one_caficultores
  caficultorNombre: string        // Desnormalizado para queries rápidas

  // Identidad del café
  nombre: string                  // "Bourbon Lavado — Los Alisos"
  variedad: string                // "Bourbon"
  proceso: ProcesoONE
  altitudMsnm: number
  cosecha: string                 // "Junio 2026"
  notasSabor: string[]            // ["durazno", "panela", "chocolate"]
  descripcion: string             // Texto libre ~50 palabras

  // Calidad (referencial, sin Q-Grader por ahora)
  puntajeReferencial?: number     // ~86 pts — declarado por caficultor
  notaReferencial: string         // "Puntaje referencial — certificación independiente próximamente"

  // Precios en centavos
  precios: {
    g250: number
    kg1: number
    kg5: number
  }

  // Stock
  kgDisponibles: number
  kgReservados: number

  status: StatusProductoONE
  foto: string                    // URL Cloudinary

  createdAt: string
  updatedAt: string
}

// ─── PEDIDO ──────────────────────────────────────────────────────────────────

export type FormatoONE = '250g' | '1kg' | '5kg'
export type PagoStatusONE = 'pendiente' | 'voucher_subido' | 'verificado' | 'rechazado'
export type LogisticaStatusONE = 'preparando' | 'despachado' | 'entregado'

export interface ItemPedidoONE {
  productoId: string
  productoNombre: string
  caficultorNombre: string
  formato: FormatoONE
  cantidad: number                // Número de unidades del formato
  precioUnitarioCents: number
  subtotalCents: number
}

export interface PedidoONE {
  id: string                      // ONE-{año}-{4 dígitos random}

  // Comprador
  emprendedorId: string           // FK → one_usuarios
  emprendedorNombre: string
  emprendedorEmail: string
  emprendedorTelefono: string

  // Negocio del emprendedor
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
  voucherUrl?: string             // Cloudinary

  // Logística
  direccionEntrega: string
  logisticaStatus: LogisticaStatusONE
  notasEntrega?: string

  // Kit de identidad
  kitGenerado: boolean
  kitId?: string                  // FK → one_kits

  // Compromiso mensual (modelo atado)
  esKitProveedor: boolean
  compromisoMeses?: number        // 3 meses mínimo si esKitProveedor

  createdAt: string
  updatedAt: string
}

// ─── USUARIO ─────────────────────────────────────────────────────────────────

export type RolONE = 'emprendedor' | 'caficultor' | 'admin'
export type EtapaEmprendedor = 'planificando' | 'proxima_apertura' | 'abierto'

export interface UsuarioONE {
  uid: string
  rol: RolONE
  nombre: string
  email?: string
  telefono?: string

  // Solo para emprendedores
  emprendedor?: {
    nombreLocal: string
    distritoLocal: string
    etapa: EtapaEmprendedor
    fechaAperturaEstimada?: string
    pedidoIds: string[]
  }

  // Solo para caficultores
  caficultor?: {
    caficultorId: string          // FK → one_caficultores
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
  emprendedorId: string
  nombreLocal: string

  productos: ProductoEnKitONE[]

  // URLs de descarga
  menuPdfUrl?: string
  fichasUrl?: string
  qrUrl?: string
  instagramPackUrl?: string

  createdAt: string
}

// ─── INPUTS PARA CREAR ───────────────────────────────────────────────────────

export interface CreatePedidoInput {
  emprendedorId: string
  emprendedorNombre: string
  emprendedorEmail: string
  emprendedorTelefono: string
  nombreLocal: string
  distritoLocal: string
  items: Omit<ItemPedidoONE, 'subtotalCents'>[]
  metodoPago: 'yape' | 'transferencia'
  direccionEntrega: string
  esKitProveedor: boolean
  compromisoMeses?: number
}

export interface CreateUsuarioInput {
  uid: string
  rol: RolONE
  nombre: string
  email?: string
  telefono?: string
  emprendedor?: UsuarioONE['emprendedor']
  caficultor?: UsuarioONE['caficultor']
}
