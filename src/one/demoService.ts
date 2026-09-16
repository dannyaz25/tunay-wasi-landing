/**
 * demoService.ts — Implementaciones mock para modo demo (?demo=1)
 * Reemplaza todas las llamadas a Firestore/Cloudinary/Auth con datos locales.
 * No toca producción ni requiere emulador.
 */
import type {
  PedidoONE,
  KitIdentidadONE,
  CreatePedidoInput,
  ProductoONE,
  CaficultorONE,
  UsuarioONE,
  CalificacionCaficultor,
  CalificacionCafeteria,
  CreateCalificacionCaficultorInput,
  CreateCalificacionCafeteriaInput,
} from './types'
import seedPedidos from './seed/one_pedidos.json'
import seedKits from './seed/one_kits.json'
import seedProductos from './seed/one_productos.json'
import seedCaficultores from './seed/one_caficultores.json'
import seedUsuarios from './seed/one_usuarios.json'

// ─── Estado local mutable (simula Firestore en memoria) ──────────────────────

let pedidosDemo: PedidoONE[] = (seedPedidos as PedidoONE[]).map(p => ({ ...p, calificado: false }))
let kitsDemo: KitIdentidadONE[] = (seedKits as unknown as KitIdentidadONE[]).map(k => ({ ...k }))
let nextPedidoIdx = 9000

// ─── Usuario demo ─────────────────────────────────────────────────────────────

export const DEMO_USER = {
  uid: 'demo-user',
  nombre: 'Carlos Mendoza',
  email: 'carlos@cafeelorigenmiraflores.pe',
  telefono: '+51987654321',
  rol: 'emprendedor' as const,
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export function demoFetchPedidosByEmprendedor(emprendedorId: string): Promise<PedidoONE[]> {
  const resultado = emprendedorId === 'demo-user'
    ? pedidosDemo.filter(p => p.emprendedorId === 'user-emprendedor-001')
    : pedidosDemo.filter(p => p.emprendedorId === emprendedorId)
  return Promise.resolve(resultado.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export function demoFetchPedidosAdmin(): Promise<PedidoONE[]> {
  return Promise.resolve([...pedidosDemo].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export function demoCreatePedido(input: CreatePedidoInput): Promise<string> {
  const id = `ONE-2026-${nextPedidoIdx++}`
  const precioUnitario = input.items[0]?.precioUnitarioCents ?? 0
  const subtotal = input.items.reduce((s, item) => s + item.precioUnitarioCents * item.cantidad, 0)
  const nuevoPedido: PedidoONE = {
    id,
    emprendedorId: input.emprendedorId,
    emprendedorNombre: input.emprendedorNombre,
    emprendedorEmail: input.emprendedorEmail,
    emprendedorTelefono: input.emprendedorTelefono,
    nombreLocal: input.nombreLocal,
    distritoLocal: input.distritoLocal,
    items: input.items.map(item => ({
      ...item,
      subtotalCents: item.precioUnitarioCents * item.cantidad,
    })),
    subtotalCents: subtotal,
    deliveryCents: 1000,
    totalCents: subtotal + 1000,
    metodoPago: input.metodoPago,
    pagoStatus: 'pendiente',
    voucherUrl: undefined,
    direccionEntrega: input.direccionEntrega,
    logisticaStatus: 'preparando',
    kitGenerado: false,
    calificado: false,
    esKitProveedor: input.esKitProveedor,
    compromisoMeses: input.compromisoMeses,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  // Suprimir warning de variable no usada
  void precioUnitario
  pedidosDemo = [nuevoPedido, ...pedidosDemo]
  return Promise.resolve(id)
}

export function demoSubirVoucher(pedidoId: string, _voucherUrl: string): Promise<void> {
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId
      ? { ...p, pagoStatus: 'voucher_subido', voucherUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-voucher.jpg', updatedAt: new Date().toISOString() }
      : p
  )
  return Promise.resolve()
}

export function demoVerificarPago(pedidoId: string): Promise<void> {
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId ? { ...p, pagoStatus: 'verificado', updatedAt: new Date().toISOString() } : p
  )
  return Promise.resolve()
}

export function demoRechazarPago(pedidoId: string): Promise<void> {
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId ? { ...p, pagoStatus: 'rechazado', updatedAt: new Date().toISOString() } : p
  )
  return Promise.resolve()
}

export function demoUpdateLogistica(pedidoId: string, status: PedidoONE['logisticaStatus']): Promise<void> {
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId ? { ...p, logisticaStatus: status, updatedAt: new Date().toISOString() } : p
  )
  return Promise.resolve()
}

// ─── Kits ─────────────────────────────────────────────────────────────────────

export function demoFetchKitByPedido(pedidoId: string): Promise<KitIdentidadONE | null> {
  return Promise.resolve(kitsDemo.find(k => k.pedidoId === pedidoId) ?? null)
}

export function demoFetchPedidosByCaficultor(caficultorId: string): Promise<PedidoONE[]> {
  // Obtener nombres de productos del caficultor
  const productos = (seedProductos as ProductoONE[]).filter(p => p.caficultorId === caficultorId)
  const nombresCaficultor = new Set(productos.map(p => p.caficultorNombre))
  const resultado = pedidosDemo.filter(p =>
    p.items.some(item => nombresCaficultor.has(item.caficultorNombre))
  )
  return Promise.resolve(resultado)
}

export function demoFetchProductosByCaficultor(caficultorId: string): Promise<ProductoONE[]> {
  return Promise.resolve((seedProductos as ProductoONE[]).filter(p => p.caficultorId === caficultorId))
}

export function demoFetchCaficultor(caficultorId: string): Promise<CaficultorONE | null> {
  return Promise.resolve((seedCaficultores as CaficultorONE[]).find(c => c.id === caficultorId) ?? null)
}

export function demoGenerarKit(pedidoId: string): Promise<string> {
  const pedido = pedidosDemo.find(p => p.id === pedidoId)
  if (!pedido) return Promise.reject(new Error('Pedido no encontrado'))
  const kitId = `kit-demo-${Date.now()}`
  const nuevoKit: KitIdentidadONE = {
    id: kitId,
    pedidoId,
    emprendedorId: pedido.emprendedorId,
    nombreLocal: pedido.nombreLocal,
    productos: pedido.items.map(item => ({
      caficultorNombre: item.caficultorNombre,
      caficultorFoto: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-caficultor.jpg',
      caficultorRegion: 'Cajamarca',
      caficultorAltitud: 1800,
      caficultorHistoria: 'Caficultor de tercera generación en los Andes peruanos.',
      productoNombre: item.productoNombre,
      variedad: 'Bourbon',
      proceso: 'lavado',
      notasSabor: ['chocolate negro', 'avellana', 'mandarina'],
      puntajeReferencial: 85,
    })),
    menuPdfUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-kit.pdf',
    fichasUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-kit.pdf',
    qrUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-qr.png',
    instagramPackUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-kit.pdf',
    createdAt: new Date().toISOString(),
  }
  kitsDemo = [nuevoKit, ...kitsDemo]
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId ? { ...p, kitGenerado: true, kitId } : p
  )
  return Promise.resolve(kitId)
}

// ─── Voucher upload mock ──────────────────────────────────────────────────────

export async function demoUploadVoucher(_file: File): Promise<string> {
  // Simula 800ms de upload
  await new Promise(r => setTimeout(r, 800))
  return 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-voucher.jpg'
}

// ─── Calificaciones ───────────────────────────────────────────────────────────

let calificacionesCaficultorDemo: CalificacionCaficultor[] = []
let calificacionesCafeteriaDemo: CalificacionCafeteria[] = []

export function demoCrearCalificacionCaficultor(
  input: CreateCalificacionCaficultorInput
): Promise<string> {
  const id = `cal-caf-${Date.now()}`
  const nueva: CalificacionCaficultor = {
    id,
    ...input,
    createdAt: new Date().toISOString(),
  }
  calificacionesCaficultorDemo = [nueva, ...calificacionesCaficultorDemo]
  // Marcar pedido como calificado
  pedidosDemo = pedidosDemo.map(p =>
    p.id === input.pedidoId ? { ...p, calificado: true, calificacionId: id } : p
  )
  return Promise.resolve(id)
}

export function demoFetchCalificacionesByCaficultor(
  caficultorId: string
): Promise<CalificacionCaficultor[]> {
  return Promise.resolve(
    calificacionesCaficultorDemo.filter(c => c.caficultorId === caficultorId)
  )
}

export function demoCrearCalificacionCafeteria(
  input: CreateCalificacionCafeteriaInput
): Promise<string> {
  const id = `cal-caf-${Date.now()}`
  const nueva: CalificacionCafeteria = {
    id,
    ...input,
    createdAt: new Date().toISOString(),
  }
  calificacionesCafeteriaDemo = [nueva, ...calificacionesCafeteriaDemo]
  return Promise.resolve(id)
}

export function demoFetchCalificacionesCafeteria(
  caficultorId: string
): Promise<CalificacionCafeteria[]> {
  return Promise.resolve(
    calificacionesCafeteriaDemo.filter(c => c.caficultorId === caficultorId)
  )
}

// Score agregado de demo (calcula sobre el estado actual en memoria)
export function demoScoreCaficultor(caficultorId: string): { score: number; total: number } {
  const cals = calificacionesCaficultorDemo.filter(c => c.caficultorId === caficultorId)
  if (cals.length === 0) return { score: 0, total: 0 }
  const promedio = cals.reduce((acc, c) => acc + c.estrellas, 0) / cals.length
  return { score: Math.round(promedio * 10) / 10, total: cals.length }
}

// ─── Directorio de cafeterías (cliente final) ─────────────────────────────────

export function demoFetchCafeterias(): Promise<UsuarioONE[]> {
  const cafeterias = (seedUsuarios as UsuarioONE[]).filter(u => u.rol === 'emprendedor')
  return Promise.resolve(cafeterias)
}

export function demoFetchCafeteria(uid: string): Promise<UsuarioONE | null> {
  const cafeteria = (seedUsuarios as UsuarioONE[]).find(u => u.uid === uid && u.rol === 'emprendedor') ?? null
  return Promise.resolve(cafeteria)
}

// Obtiene los productos del menú de una cafetería a partir de sus pedidos
export function demoFetchMenuCafeteria(emprendedorId: string): Promise<ProductoONE[]> {
  const pedidos = (seedPedidos as PedidoONE[]).filter(p => p.emprendedorId === emprendedorId)
  const productoIds = new Set(pedidos.flatMap(p => p.items.map(i => i.productoId)))
  const productos = (seedProductos as ProductoONE[]).filter(p => productoIds.has(p.id))
  return Promise.resolve(productos)
}

// ─── Stock ────────────────────────────────────────────────────────────────────

let productosDemo: ProductoONE[] = (seedProductos as ProductoONE[]).map(p => ({ ...p }))

export function demoUpdateStock(productoId: string, kgDisponibles: number): Promise<void> {
  productosDemo = productosDemo.map(p =>
    p.id === productoId ? { ...p, kgDisponibles, updatedAt: new Date().toISOString() } : p
  )
  return Promise.resolve()
}

export function demoFetchProductosByCaficultorLive(caficultorId: string): Promise<ProductoONE[]> {
  return Promise.resolve(productosDemo.filter(p => p.caficultorId === caficultorId))
}

export function demoCrearProducto(data: Omit<ProductoONE, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `producto-demo-${Date.now()}`
  const nuevo: ProductoONE = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  productosDemo = [nuevo, ...productosDemo]
  return Promise.resolve(id)
}

export function demoUpdateProducto(productoId: string, data: Partial<Omit<ProductoONE, 'id' | 'createdAt'>>): Promise<void> {
  productosDemo = productosDemo.map(p =>
    p.id === productoId ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
  )
  return Promise.resolve()
}
