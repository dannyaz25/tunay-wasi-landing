// TunayWasi ONE — operaciones Firestore
// Noviembre 2026 — alineado al esquema Android
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '../shared/firebase'
import { ONE_COLLECTIONS, ONE_CONFIG } from './config'
import type {
  CaficultorONE,
  ProductoONE,
  PedidoONE,
  UsuarioONE,
  KitIdentidadONE,
  CalificacionCaficultor,
  CalificacionCafeteria,
  CreatePedidoInput,
  CreateUsuarioInput,
  CreateCalificacionCaficultorInput,
  CreateCalificacionCafeteriaInput,
  MenuONE,
  CreateMenuInput,
  FormatoONE,
  MensajePedidoONE,
  SendMensajeInput,
  UbigeoONE,
  LogisticaCaficultorONE,
  SaveLogisticaInput,
} from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomDigits(n: number): string {
  return Math.floor(Math.random() * Math.pow(10, n))
    .toString()
    .padStart(n, '0')
}

function generarIdPedido(): string {
  const year = ONE_CONFIG.PEDIDO_YEAR
  return `${ONE_CONFIG.PEDIDO_PREFIX}-${year}-${randomDigits(4)}`
}

function calcularSubtotalCents(
  unitCents: number,
  qty: number
): number {
  return unitCents * qty
}

// Convierte Timestamp de Firestore a string ISO o devuelve el string tal cual
function normalizeDate(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

// Convierte presentación a kg equivalente para cálculo de stock
function parseKgFromPresentacion(presentacion: FormatoONE, qty: number): number {
  switch (presentacion) {
    case '250g':  return 0.25 * qty
    case '500g':  return 0.5  * qty
    case '1kg':   return 1.0  * qty
    case '5kg':   return 5.0  * qty
    case '10kg':  return 10.0 * qty
    case '25kg':  return 25.0 * qty
    default:      return 0
  }
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
// Los caficultores ahora viven en one_usuarios con rol='caficultor'
// CaficultorONE se construye desde el sub-documento caficultor del usuario

function usuarioToCaficultor(snap: { id: string; data: () => any }): CaficultorONE {
  const data = snap.data()
  const c = data.caficultor ?? {}
  return {
    id: snap.id,
    nombre: data.nombre ?? '',
    foto: c.foto ?? data.foto ?? '',
    region: c.region ?? '',
    distrito: c.distrito ?? '',
    altitudMsnm: c.altitudMsnm ?? 0,
    historia: c.historia ?? '',
    coordenadas: c.coordenadas,
    activo: c.activo ?? true,
    createdAt: normalizeDate(data.createdAt),
    scoreConfianza: c.scoreConfianza,
    totalCalificaciones: c.totalCalificaciones,
  }
}

export async function fetchCaficultores(): Promise<CaficultorONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.USUARIOS),
      where('rol', '==', 'caficultor')
    )
  )
  return snap.docs
    .map((d) => usuarioToCaficultor({ id: d.id, data: d.data.bind(d) }))
    .filter((c) => c.activo)
}

export async function fetchCaficultor(id: string): Promise<CaficultorONE> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.USUARIOS, id))
  if (!snap.exists()) throw new Error(`Caficultor ${id} no encontrado`)
  return usuarioToCaficultor({ id: snap.id, data: snap.data.bind(snap) })
}

export async function fetchProductos(): Promise<ProductoONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.PRODUCTOS),
      where('status', '==', 'activo')
    )
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: normalizeDate(data.createdAt),
      updatedAt: normalizeDate(data.updatedAt),
    } as ProductoONE
  })
}

export async function fetchProducto(id: string): Promise<ProductoONE> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.PRODUCTOS, id))
  if (!snap.exists()) throw new Error(`Producto ${id} no encontrado`)
  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    createdAt: normalizeDate(data.createdAt),
    updatedAt: normalizeDate(data.updatedAt),
  } as ProductoONE
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

export async function createPedido(input: CreatePedidoInput): Promise<string> {
  const pedidoId = generarIdPedido()

  // Calcular items con subtotales — omitir menuId si es undefined
  const items = input.items.map((item) => ({
    productoId: item.productoId,
    productoNombre: item.productoNombre,
    caficultorId: item.caficultorId,
    caficultorNombre: item.caficultorNombre,
    presentacion: item.presentacion,
    qty: item.qty,
    unitCents: item.unitCents,
    subtotalCents: calcularSubtotalCents(item.unitCents, item.qty),
    ...(item.menuId ? { menuId: item.menuId } : {}),
  }))

  const subtotalCents = items.reduce((acc, item) => acc + item.subtotalCents, 0)
  const deliveryCents = ONE_CONFIG.DELIVERY_CENTS
  const totalCents = subtotalCents + deliveryCents

  // Construir pedido omitiendo campos undefined
  const pedido = {
    negocioId: input.negocioId,
    negocioNombre: input.negocioNombre,
    negocioEmail: input.negocioEmail,
    negocioTelefono: input.negocioTelefono,
    nombreLocal: input.nombreLocal,
    distritoLocal: input.distritoLocal,
    items,
    subtotalCents,
    deliveryCents,
    totalCents,
    metodoPago: input.metodoPago,
    pagoStatus: 'pendiente' as const,
    logisticaStatus: 'preparando' as const,
    kitGenerado: false,
    calificado: false,
    recepcionConfirmada: false,
    esKitProveedor: input.esKitProveedor ?? false,
    ...(input.direccionEntrega ? { direccionEntrega: input.direccionEntrega } : {}),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Usar transacción para reservar kg de cada producto y guardar el pedido
  await runTransaction(db, async (tx) => {
    // ── FASE 1: todas las lecturas ──────────────────────────────────────────
    const prodRefs = items.map(item => doc(db, ONE_COLLECTIONS.PRODUCTOS, item.productoId))
    const prodSnaps = await Promise.all(prodRefs.map(ref => tx.get(ref)))

    const negocioRef = doc(db, ONE_COLLECTIONS.USUARIOS, input.negocioId)
    const negocioSnap = await tx.get(negocioRef)

    // ── FASE 2: validaciones ────────────────────────────────────────────────
    for (let i = 0; i < items.length; i++) {
      const snap = prodSnaps[i]
      const item = items[i]
      if (!snap.exists()) throw new Error(`Producto ${item.productoId} no existe`)
      const prod = snap.data() as ProductoONE
      const kgSolicitados = parseKgFromPresentacion(item.presentacion as FormatoONE, item.qty)
      const disponibles = prod.kgDisponibles - prod.kgReservados
      if (disponibles < kgSolicitados) throw new Error(`Stock insuficiente para ${item.productoNombre}`)
    }

    // ── FASE 3: todas las escrituras ────────────────────────────────────────
    for (let i = 0; i < items.length; i++) {
      const snap = prodSnaps[i]
      const item = items[i]
      const prod = snap.data() as ProductoONE
      const kgSolicitados = parseKgFromPresentacion(item.presentacion as FormatoONE, item.qty)
      tx.update(prodRefs[i], {
        kgReservados: prod.kgReservados + kgSolicitados,
        updatedAt: serverTimestamp(),
      })
    }

    const pedidoRef = doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId)
    tx.set(pedidoRef, { ...pedido, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

    if (negocioSnap.exists()) {
      const negocioData = negocioSnap.data() as UsuarioONE
      const pedidoIds = negocioData.negocio?.pedidoIds ?? []
      tx.update(negocioRef, { 'negocio.pedidoIds': [...pedidoIds, pedidoId] })
    }
  })

  return pedidoId
}

export async function fetchPedido(id: string): Promise<PedidoONE> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, id))
  if (!snap.exists()) throw new Error(`Pedido ${id} no encontrado`)
  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    createdAt: normalizeDate(data.createdAt),
    updatedAt: normalizeDate(data.updatedAt),
  } as PedidoONE
}

export async function fetchPedidosByNegocio(uid: string): Promise<PedidoONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.PEDIDOS),
      where('negocioId', '==', uid),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: normalizeDate(data.createdAt),
      updatedAt: normalizeDate(data.updatedAt),
    } as PedidoONE
  })
}

export async function fetchPedidosByCaficultor(caficultorId: string): Promise<PedidoONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.PEDIDOS),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs
    .map((d) => {
      const data = d.data()
      return { id: d.id, ...data, createdAt: normalizeDate(data.createdAt), updatedAt: normalizeDate(data.updatedAt) } as PedidoONE
    })
    .filter((p) => p.items.some((item) => item.caficultorId === caficultorId))
}

export async function fetchPedidosAdmin(): Promise<PedidoONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.PEDIDOS),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: normalizeDate(data.createdAt),
      updatedAt: normalizeDate(data.updatedAt),
    } as PedidoONE
  })
}

export async function subirVoucher(pedidoId: string, url: string): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    voucherUrl: url,
    pagoStatus: 'voucher_subido',
    updatedAt: serverTimestamp(),
  })
}

export async function verificarPago(pedidoId: string): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    pagoStatus: 'verificado',
    updatedAt: serverTimestamp(),
  })
}

export async function rechazarPago(pedidoId: string): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    pagoStatus: 'rechazado',
    updatedAt: serverTimestamp(),
  })
}

export async function updateLogistica(
  pedidoId: string,
  status: PedidoONE['logisticaStatus']
): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    logisticaStatus: status,
    updatedAt: serverTimestamp(),
  })
}

export async function despacharAgencia(
  pedidoId: string,
  data: { codigoAgencia: string; fotoDespacho?: string }
): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    logisticaStatus: 'en_agencia',
    codigoAgencia: data.codigoAgencia,
    ...(data.fotoDespacho ? { fotoDespacho: data.fotoDespacho } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function confirmarRecepcion(pedidoId: string): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    logisticaStatus: 'entregado',
    recepcionConfirmada: true,
    updatedAt: serverTimestamp(),
  })
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export async function fetchNegocios(): Promise<UsuarioONE[]> {
  const snap = await getDocs(
    query(collection(db, ONE_COLLECTIONS.USUARIOS), where('rol', '==', 'negocio'))
  )
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UsuarioONE))
}

export async function fetchNegocio(uid: string): Promise<UsuarioONE | null> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.USUARIOS, uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as UsuarioONE
}

export async function fetchMenuNegocio(negocioId: string): Promise<ProductoONE[]> {
  const pedidosSnap = await getDocs(
    query(collection(db, ONE_COLLECTIONS.PEDIDOS), where('negocioId', '==', negocioId))
  )
  const productoIds = new Set(
    pedidosSnap.docs.flatMap(d => (d.data().items as { productoId: string }[]).map(i => i.productoId))
  )
  if (productoIds.size === 0) return []
  const productos: ProductoONE[] = []
  for (const id of productoIds) {
    const snap = await getDoc(doc(db, ONE_COLLECTIONS.PRODUCTOS, id))
    if (snap.exists()) {
      const data = snap.data()
      productos.push({ id: snap.id, ...data, createdAt: normalizeDate(data.createdAt), updatedAt: normalizeDate(data.updatedAt) } as ProductoONE)
    }
  }
  return productos
}

export async function updateStock(productoId: string, kgDisponibles: number): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PRODUCTOS, productoId), {
    kgDisponibles,
    updatedAt: serverTimestamp(),
  })
}

export async function crearProducto(
  data: Omit<ProductoONE, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.PRODUCTOS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateProducto(
  productoId: string,
  data: Partial<Omit<ProductoONE, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.PRODUCTOS, productoId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function crearUsuario(
  uid: string,
  data: CreateUsuarioInput
): Promise<void> {
  await setDoc(doc(db, ONE_COLLECTIONS.USUARIOS, uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function fetchUsuario(uid: string): Promise<UsuarioONE> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.USUARIOS, uid))
  if (!snap.exists()) throw new Error(`Usuario ${uid} no encontrado`)
  return { uid: snap.id, ...snap.data() } as UsuarioONE
}

export async function updateUsuario(
  uid: string,
  data: Partial<UsuarioONE>
): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.USUARIOS, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateCaficultor(
  caficultorId: string,
  data: Partial<UsuarioONE['caficultor']>
): Promise<void> {
  // Los datos del caficultor ahora viven en one_usuarios sub-doc caficultor
  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data ?? {})) {
    updates[`caficultor.${key}`] = value
  }
  await updateDoc(doc(db, ONE_COLLECTIONS.USUARIOS, caficultorId), updates)
}

// ─── KITS ─────────────────────────────────────────────────────────────────────

const PLACEHOLDER_PDF = 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-kit.pdf'

export async function generarKit(
  pedidoId: string,
  nombreLocal: string,
  negocioId: string,
  productos: KitIdentidadONE['productos'],
  caficultorId?: string
): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  const qrUrl = caficultorId ? `${origin}#/caficultor/${caficultorId}` : undefined

  const kitData: Omit<KitIdentidadONE, 'id'> = {
    pedidoId,
    negocioId,
    nombreLocal,
    productos,
    menuPdfUrl: PLACEHOLDER_PDF,
    fichasUrl: PLACEHOLDER_PDF,
    qrUrl,
    instagramPackUrl: PLACEHOLDER_PDF,
    createdAt: new Date().toISOString(),
  }

  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.KITS), {
    ...kitData,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId), {
    kitGenerado: true,
    kitId: docRef.id,
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function fetchKit(kitId: string): Promise<KitIdentidadONE> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.KITS, kitId))
  if (!snap.exists()) throw new Error(`Kit ${kitId} no encontrado`)
  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    createdAt: normalizeDate(data.createdAt),
  } as KitIdentidadONE
}

export async function fetchKitByPedido(
  pedidoId: string
): Promise<KitIdentidadONE | null> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.KITS),
      where('pedidoId', '==', pedidoId)
    )
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  const data = d.data()
  return {
    id: d.id,
    ...data,
    createdAt: normalizeDate(data.createdAt),
  } as KitIdentidadONE
}

export async function actualizarUrlsKit(
  kitId: string,
  urls: Partial<Pick<KitIdentidadONE, 'menuPdfUrl' | 'fichasUrl' | 'qrUrl' | 'instagramPackUrl'>>
): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.KITS, kitId), urls)
}

// ─── SOLICITUD CAFICULTOR (sin auth) ─────────────────────────────────────────

export interface SolicitudCaficultorInput {
  nombre: string
  region: string
  distrito: string
  altitudMsnm: number
  variedadPrincipal: string
  kgDisponibles: number
  email: string
  telefono: string
  fotoUrl?: string
}

export async function enviarSolicitudCaficultor(
  data: SolicitudCaficultorInput
): Promise<string> {
  const docRef = await addDoc(collection(db, 'one_solicitudes_caficultor'), {
    ...data,
    activo: false,
    solicitudPendiente: true,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

// ─── CALIFICACIONES ──────────────────────────────────────────────────────────

export async function crearCalificacionCaficultor(
  input: CreateCalificacionCaficultorInput
): Promise<string> {
  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.CALIFICACIONES_CAFICULTOR), {
    ...input,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, input.pedidoId), {
    calificado: true,
    calificacionId: docRef.id,
    updatedAt: serverTimestamp(),
  })

  await recalcularScoreCaficultor(input.caficultorId)

  return docRef.id
}

async function recalcularScoreCaficultor(caficultorId: string): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.CALIFICACIONES_CAFICULTOR),
      where('caficultorId', '==', caficultorId)
    )
  )
  if (snap.empty) return
  const total = snap.docs.reduce((acc, d) => acc + (d.data().estrellas as number), 0)
  const promedio = Math.round((total / snap.docs.length) * 10) / 10
  // Actualizar score en sub-doc caficultor del usuario
  await updateDoc(doc(db, ONE_COLLECTIONS.USUARIOS, caficultorId), {
    'caficultor.scoreConfianza': promedio,
    'caficultor.totalCalificaciones': snap.docs.length,
  })
}

export async function fetchCalificacionesByCaficultor(
  caficultorId: string
): Promise<CalificacionCaficultor[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.CALIFICACIONES_CAFICULTOR),
      where('caficultorId', '==', caficultorId),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) } as CalificacionCaficultor))
}

export async function crearCalificacionCafeteria(
  input: CreateCalificacionCafeteriaInput
): Promise<string> {
  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.CALIFICACIONES_CAFETERIA), {
    ...input,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function fetchCalificacionesCafeteria(
  caficultorId: string
): Promise<CalificacionCafeteria[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.CALIFICACIONES_CAFETERIA),
      where('caficultorId', '==', caficultorId),
      orderBy('createdAt', 'desc')
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: normalizeDate(d.data().createdAt) } as CalificacionCafeteria))
}

// ─── Menús ────────────────────────────────────────────────────────────────────

export async function fetchMenuActivo(negocioId: string): Promise<MenuONE | null> {
  const menus = await fetchMenusByNegocio(negocioId)
  return menus.find((m) => m.activo) ?? null
}

export async function fetchMenusByNegocio(negocioId: string): Promise<MenuONE[]> {  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.MENUS),
      where('negocioId', '==', negocioId),
      orderBy('createdAt', 'asc')
    )
  )
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: normalizeDate(d.data().createdAt),
    updatedAt: normalizeDate(d.data().updatedAt),
  } as MenuONE))
}

export async function createMenu(input: CreateMenuInput): Promise<string> {
  const qrUrl = `${window.location.origin}${window.location.pathname}#/negocio/${input.negocioId}?menu=`
  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.MENUS), {
    negocioId: input.negocioId,
    nombre: input.nombre,
    descripcion: input.descripcion ?? null,
    cafesIds: input.cafesIds,
    activo: false,
    qrUrl: qrUrl + 'PLACEHOLDER',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(docRef, { qrUrl: qrUrl + docRef.id })
  return docRef.id
}

export async function updateMenu(
  menuId: string,
  data: Partial<Omit<MenuONE, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, ONE_COLLECTIONS.MENUS, menuId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMenu(menuId: string): Promise<void> {
  await deleteDoc(doc(db, ONE_COLLECTIONS.MENUS, menuId))
}

export async function setMenuActivo(negocioId: string, menuId: string): Promise<void> {
  const menus = await fetchMenusByNegocio(negocioId)
  await Promise.all(
    menus.map((m) =>
      updateDoc(doc(db, ONE_COLLECTIONS.MENUS, m.id), {
        activo: m.id === menuId,
        updatedAt: serverTimestamp(),
      })
    )
  )
}

// ─── CHAT / MENSAJES ─────────────────────────────────────────────────────────

export async function sendMensaje(input: SendMensajeInput): Promise<string> {
  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.MENSAJES), {
    pedidoId: input.pedidoId,
    autorId: input.autorId,
    autorNombre: input.autorNombre,
    autorRol: input.autorRol,
    texto: input.texto,
    tipo: input.tipo ?? 'texto',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function fetchMensajesByPedido(pedidoId: string): Promise<MensajePedidoONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.MENSAJES),
      where('pedidoId', '==', pedidoId),
      orderBy('createdAt', 'asc')
    )
  )
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: normalizeDate(d.data().createdAt),
  } as MensajePedidoONE))
}

// ─── LOGÍSTICA CAFICULTOR ────────────────────────────────────────────────────

export async function fetchUbigeos(): Promise<UbigeoONE[]> {
  const snap = await getDocs(collection(db, ONE_COLLECTIONS.UBIGEOS))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UbigeoONE))
}

export async function fetchLogisticaCaficultor(caficultorId: string): Promise<LogisticaCaficultorONE | null> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.USUARIOS, caficultorId))
  if (!snap.exists()) return null
  const data = snap.data()
  // Soporte para estructura nueva (caficultor.logistica) y legacy (caficultor.direccion)
  const logistica = data?.caficultor?.logistica ?? data?.caficultor?.direccion ?? null
  if (!logistica?.ubigeo) return null
  return logistica as LogisticaCaficultorONE
}

export async function saveLogisticaCaficultor(input: SaveLogisticaInput): Promise<void> {
  const origenTexto = `${input.distrito}, ${input.provincia}, ${input.departamento}`
  await updateDoc(doc(db, ONE_COLLECTIONS.USUARIOS, input.caficultorId), {
    'caficultor.logistica': {
      ubigeo: input.ubigeo,
      departamento: input.departamento,
      provincia: input.provincia,
      distrito: input.distrito,
      origenTexto,
      agencias: input.agencias,
      agenciasMap: input.agenciasMap,
      agenciasActivas: input.agenciasActivas,
      agenciasPermiteDomicilio: input.agenciasPermiteDomicilio,
    },
  })
}
