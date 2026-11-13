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
  MenuONE,
  CreateMenuInput,
  MensajePedidoONE,
  SendMensajeInput,
  UbigeoONE,
  LogisticaCaficultorONE,
  SaveLogisticaInput,
} from './types'
import seedPedidos from './seed/one_pedidos.json'
import seedKits from './seed/one_kits.json'
import seedProductos from './seed/one_productos.json'
import seedCaficultores from './seed/one_caficultores.json'
import seedUsuarios from './seed/one_usuarios.json'
import seedMenus from './seed/one_menus.json'

// ─── Estado local mutable (simula Firestore en memoria) ──────────────────────

let pedidosDemo: PedidoONE[] = (seedPedidos as unknown as PedidoONE[]).map(p => ({ ...p, calificado: false }))
let kitsDemo: KitIdentidadONE[] = (seedKits as unknown as KitIdentidadONE[]).map(k => ({ ...k }))
let nextPedidoIdx = 9000

// ─── Usuario demo ─────────────────────────────────────────────────────────────

export const DEMO_USER = {
  uid: 'demo-user',
  nombre: 'Carlos Mendoza',
  email: 'carlos@cafeelorigenmiraflores.pe',
  telefono: '+51987654321',
  rol: 'negocio' as const,
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export function demoFetchPedidosByNegocio(negocioId: string): Promise<PedidoONE[]> {
  const resultado = negocioId === 'demo-user'
    ? pedidosDemo.filter(p => p.negocioId === 'user-negocio-001')
    : pedidosDemo.filter(p => p.negocioId === negocioId)
  return Promise.resolve(resultado.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export function demoFetchPedidosAdmin(): Promise<PedidoONE[]> {
  return Promise.resolve([...pedidosDemo].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export function demoCreatePedido(input: CreatePedidoInput): Promise<string> {
  const id = `ONE-2026-${nextPedidoIdx++}`
  const subtotal = input.items.reduce((s, item) => s + item.unitCents * item.qty, 0)
  const nuevoPedido: PedidoONE = {
    id,
    negocioId: input.negocioId,
    negocioNombre: input.negocioNombre,
    negocioEmail: input.negocioEmail,
    negocioTelefono: input.negocioTelefono,
    nombreLocal: input.nombreLocal,
    distritoLocal: input.distritoLocal,
    items: input.items.map(item => ({
      ...item,
      subtotalCents: item.unitCents * item.qty,
    })),
    subtotalCents: subtotal,
    deliveryCents: 0,
    totalCents: subtotal,
    metodoPago: input.metodoPago,
    pagoStatus: 'pendiente',
    voucherUrl: undefined,
    direccionEntrega: input.direccionEntrega,
    logisticaStatus: 'preparando',
    kitGenerado: false,
    calificado: false,
    recepcionConfirmada: false,
    esKitProveedor: input.esKitProveedor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
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

export function demoDespacharAgencia(
  pedidoId: string,
  data: { codigoAgencia: string; fotoDespacho?: string }
): Promise<void> {
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId
      ? { ...p, logisticaStatus: 'en_agencia' as const, codigoAgencia: data.codigoAgencia, fotoDespacho: data.fotoDespacho, updatedAt: new Date().toISOString() }
      : p
  )
  return Promise.resolve()
}

export function demoConfirmarRecepcion(pedidoId: string): Promise<void> {
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId
      ? { ...p, logisticaStatus: 'entregado' as const, recepcionConfirmada: true, updatedAt: new Date().toISOString() }
      : p
  )
  return Promise.resolve()
}

// ─── Kits ─────────────────────────────────────────────────────────────────────

export function demoFetchKitByPedido(pedidoId: string): Promise<KitIdentidadONE | null> {
  return Promise.resolve(kitsDemo.find(k => k.pedidoId === pedidoId) ?? null)
}

export function demoFetchPedidosByCaficultor(caficultorId: string): Promise<PedidoONE[]> {
  const productos = (seedProductos as unknown as ProductoONE[]).filter(p => p.caficultorId === caficultorId)
  const nombresCaficultor = new Set(productos.map(p => p.caficultorNombre))
  const resultado = pedidosDemo.filter(p =>
    p.items.some(item => nombresCaficultor.has(item.caficultorNombre))
  )
  return Promise.resolve(resultado)
}

export function demoFetchProductosByCaficultor(caficultorId: string): Promise<ProductoONE[]> {
  return Promise.resolve((seedProductos as unknown as ProductoONE[]).filter(p => p.caficultorId === caficultorId))
}

let caficultoresDemo: CaficultorONE[] = (seedCaficultores as CaficultorONE[]).map(c => ({ ...c }))

export function demoFetchCaficultor(caficultorId: string): Promise<CaficultorONE | null> {
  return Promise.resolve(caficultoresDemo.find(c => c.id === caficultorId) ?? null)
}

export function demoUpdateCaficultor(caficultorId: string, data: Partial<CaficultorONE>): Promise<void> {
  caficultoresDemo = caficultoresDemo.map(c => c.id === caficultorId ? { ...c, ...data } : c)
  return Promise.resolve()
}

export function demoGenerarKit(pedidoId: string): Promise<string> {
  const pedido = pedidosDemo.find(p => p.id === pedidoId)
  if (!pedido) return Promise.reject(new Error('Pedido no encontrado'))
  const kitId = `kit-demo-${Date.now()}`

  const primerItem = pedido.items[0]
  const productoMatch = (seedProductos as unknown as ProductoONE[]).find(p => p.nombre === primerItem?.productoNombre)
  const caficultorId = productoMatch?.caficultorId ?? 'cafemanuel'
  const qrUrl = `${window.location.origin}${window.location.pathname}#/caficultor/${caficultorId}`

  const nuevoKit: KitIdentidadONE = {
    id: kitId,
    pedidoId,
    negocioId: pedido.negocioId,
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
    qrUrl,
    instagramPackUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-kit.pdf',
    createdAt: new Date().toISOString(),
  }
  kitsDemo = [nuevoKit, ...kitsDemo]
  pedidosDemo = pedidosDemo.map(p =>
    p.id === pedidoId ? { ...p, kitGenerado: true, kitId } : p
  )
  return Promise.resolve(kitId)
}

export function demoActualizarUrlsKit(
  kitId: string,
  urls: Partial<Pick<KitIdentidadONE, 'menuPdfUrl' | 'fichasUrl' | 'qrUrl' | 'instagramPackUrl'>>
): Promise<void> {
  kitsDemo = kitsDemo.map(k => k.id === kitId ? { ...k, ...urls } : k)
  return Promise.resolve()
}

// ─── Voucher upload mock ──────────────────────────────────────────────────────

export async function demoUploadVoucher(_file: File): Promise<string> {
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

export function demoScoreCaficultor(caficultorId: string): { score: number; total: number } {
  const cals = calificacionesCaficultorDemo.filter(c => c.caficultorId === caficultorId)
  if (cals.length === 0) return { score: 0, total: 0 }
  const promedio = cals.reduce((acc, c) => acc + c.estrellas, 0) / cals.length
  return { score: Math.round(promedio * 10) / 10, total: cals.length }
}

// ─── Directorio de negocios (clientes) ───────────────────────────────────────

export function demoFetchNegocios(): Promise<UsuarioONE[]> {
  const negocios = (seedUsuarios as UsuarioONE[]).filter(u => u.rol === 'negocio')
  return Promise.resolve(negocios)
}

export function demoFetchNegocio(uid: string): Promise<UsuarioONE | null> {
  const negocio = (seedUsuarios as UsuarioONE[]).find(u => u.uid === uid && u.rol === 'negocio') ?? null
  return Promise.resolve(negocio)
}

export function demoFetchUsuario(uid: string): Promise<UsuarioONE | null> {
  const id = uid === 'demo-user' ? 'user-negocio-001' : uid
  const usuario = (seedUsuarios as UsuarioONE[]).find(u => u.uid === id) ?? null
  return Promise.resolve(usuario)
}

export function demoFetchMenuNegocio(negocioId: string): Promise<ProductoONE[]> {
  const pedidos = (seedPedidos as unknown as PedidoONE[]).filter(p => p.negocioId === negocioId)
  const productoIds = new Set(pedidos.flatMap(p => p.items.map(i => i.productoId)))
  const productos = (seedProductos as unknown as ProductoONE[]).filter(p => productoIds.has(p.id))
  return Promise.resolve(productos)
}

// ─── Stock ────────────────────────────────────────────────────────────────────

let productosDemo: ProductoONE[] = (seedProductos as unknown as ProductoONE[]).map(p => ({ ...p }))

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

// ─── Menús ────────────────────────────────────────────────────────────────────

let menusDemo: MenuONE[] = (seedMenus as MenuONE[]).map(m => ({ ...m }))

export function demoFetchMenusByNegocio(negocioId: string): Promise<MenuONE[]> {
  const uid = negocioId === 'demo-user' ? 'user-negocio-001' : negocioId
  return Promise.resolve(
    menusDemo.filter(m => m.negocioId === uid).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  )
}

export function demoFetchMenuActivo(negocioId: string): Promise<MenuONE | null> {
  const uid = negocioId === 'demo-user' ? 'user-negocio-001' : negocioId
  return Promise.resolve(menusDemo.find(m => m.negocioId === uid && m.activo) ?? null)
}

export function demoCreateMenu(input: CreateMenuInput): Promise<string> {
  const id = `menu-demo-${Date.now()}`
  const uid = input.negocioId === 'demo-user' ? 'user-negocio-001' : input.negocioId
  const qrUrl = `#/negocio/${uid}?menu=${id}`
  const nuevo: MenuONE = {
    id,
    negocioId: uid,
    nombre: input.nombre,
    descripcion: input.descripcion,
    cafesIds: input.cafesIds,
    preparaciones: input.preparaciones ?? [],
    activo: false,
    qrUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  menusDemo = [...menusDemo, nuevo]
  return Promise.resolve(id)
}

export function demoUpdateMenu(menuId: string, data: Partial<Omit<MenuONE, 'id' | 'createdAt'>>): Promise<void> {
  menusDemo = menusDemo.map(m =>
    m.id === menuId ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
  )
  return Promise.resolve()
}

export function demoDeleteMenu(menuId: string): Promise<void> {
  menusDemo = menusDemo.filter(m => m.id !== menuId)
  return Promise.resolve()
}

export function demoSetMenuActivo(negocioId: string, menuId: string): Promise<void> {
  const uid = negocioId === 'demo-user' ? 'user-negocio-001' : negocioId
  menusDemo = menusDemo.map(m => {
    if (m.negocioId !== uid) return m
    return { ...m, activo: m.id === menuId, updatedAt: new Date().toISOString() }
  })
  return Promise.resolve()
}

// ─── Chat / Mensajes ──────────────────────────────────────────────────────────

let mensajesDemo: MensajePedidoONE[] = []

export function demoSendMensaje(input: SendMensajeInput): Promise<string> {
  const id = `msg-demo-${Date.now()}`
  const nuevo: MensajePedidoONE = {
    id,
    pedidoId: input.pedidoId,
    autorId: input.autorId,
    autorNombre: input.autorNombre,
    autorRol: input.autorRol,
    texto: input.texto,
    tipo: input.tipo ?? 'texto',
    createdAt: new Date().toISOString(),
  }
  mensajesDemo = [...mensajesDemo, nuevo]
  return Promise.resolve(id)
}

export function demoFetchMensajesByPedido(pedidoId: string): Promise<MensajePedidoONE[]> {
  return Promise.resolve(mensajesDemo.filter(m => m.pedidoId === pedidoId))
}

// ─── Logística caficultor ────────────────────────────────────────────────────

const DEMO_UBIGEOS: UbigeoONE[] = [
  {
    id: 'ubigeo-cajamarca-001',
    departamento: 'Cajamarca',
    provincia: 'Cajamarca',
    distrito: 'Cajamarca',
    agencias: [
      { id: 'olva', nombre: 'Olva Courier', direccion: 'Jr. Del Comercio 123', horario: 'Lun-Sáb 8-18h' },
      { id: 'shalom', nombre: 'Shalom', direccion: 'Av. Atahualpa 456', horario: 'Lun-Sáb 8-19h' },
      { id: 'servientrega', nombre: 'Servientrega', direccion: 'Jr. Lima 78', horario: 'Lun-Vie 9-18h' },
    ],
  },
  {
    id: 'ubigeo-cajamarca-002',
    departamento: 'Cajamarca',
    provincia: 'Jaén',
    distrito: 'Jaén',
    agencias: [
      { id: 'olva', nombre: 'Olva Courier', direccion: 'Av. Mesones Muro 220', horario: 'Lun-Sáb 8-18h' },
      { id: 'shalom', nombre: 'Shalom', direccion: 'Jr. Bolognesi 110', horario: 'Lun-Sáb 8-19h' },
    ],
  },
  {
    id: 'ubigeo-amazonas-001',
    departamento: 'Amazonas',
    provincia: 'Bagua Grande',
    distrito: 'Bagua Grande',
    agencias: [
      { id: 'olva', nombre: 'Olva Courier', direccion: 'Jr. Chachapoyas 45', horario: 'Lun-Sáb 8-17h' },
      { id: 'gj', nombre: 'GJ Courier', direccion: 'Av. Héroes 12', horario: 'Lun-Vie 8-18h' },
    ],
  },
  {
    id: 'ubigeo-cusco-001',
    departamento: 'Cusco',
    provincia: 'La Convención',
    distrito: 'Quillabamba',
    agencias: [
      { id: 'shalom', nombre: 'Shalom', direccion: 'Av. Libertad 33', horario: 'Lun-Sáb 8-18h' },
      { id: 'cruzdelSur', nombre: 'Cruz del Sur', direccion: 'Av. Centenario 67', horario: 'Lun-Vie 9-17h' },
    ],
  },
]

let logisticaDemo: LogisticaCaficultorONE | null = null

export function demoFetchUbigeos(): Promise<UbigeoONE[]> {
  return Promise.resolve(DEMO_UBIGEOS)
}

export function demoFetchLogisticaCaficultor(_caficultorId: string): Promise<LogisticaCaficultorONE | null> {
  return Promise.resolve(logisticaDemo)
}

export function demoSaveLogisticaCaficultor(input: SaveLogisticaInput): Promise<void> {
  logisticaDemo = {
    ubigeo: input.ubigeo,
    departamento: input.departamento,
    provincia: input.provincia,
    distrito: input.distrito,
    origenTexto: `${input.distrito}, ${input.provincia}, ${input.departamento}`,
    agencias: input.agencias,
    agenciasMap: input.agenciasMap,
    agenciasActivas: input.agenciasActivas,
    agenciasPermiteDomicilio: input.agenciasPermiteDomicilio,
  }
  return Promise.resolve()
}
