/**
 * demoService.ts — Implementaciones mock para modo demo (?demo=1)
 * Reemplaza todas las llamadas a Firestore/Cloudinary/Auth con datos locales.
 * No toca producción ni requiere emulador.
 */
import type {
  PedidoONE,
  KitIdentidadONE,
  CreatePedidoInput,
} from './types'
import seedPedidos from './seed/one_pedidos.json'
import seedKits from './seed/one_kits.json'

// ─── Estado local mutable (simula Firestore en memoria) ──────────────────────

let pedidosDemo: PedidoONE[] = (seedPedidos as PedidoONE[]).map(p => ({ ...p }))
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
