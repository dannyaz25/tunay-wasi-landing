// TunayWasi ONE — operaciones Firestore
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
  precioUnitarioCents: number,
  cantidad: number
): number {
  return precioUnitarioCents * cantidad
}

// Convierte Timestamp de Firestore a string ISO o devuelve el string tal cual
function normalizeDate(value: unknown): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────

export async function fetchCaficultores(): Promise<CaficultorONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.CAFICULTORES),
      where('activo', '==', true)
    )
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CaficultorONE))
}

export async function fetchCaficultor(id: string): Promise<CaficultorONE> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.CAFICULTORES, id))
  if (!snap.exists()) throw new Error(`Caficultor ${id} no encontrado`)
  return { id: snap.id, ...snap.data() } as CaficultorONE
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

  // Calcular items con subtotales
  const items = input.items.map((item) => ({
    ...item,
    subtotalCents: calcularSubtotalCents(item.precioUnitarioCents, item.cantidad),
  }))

  const subtotalCents = items.reduce((acc, item) => acc + item.subtotalCents, 0)
  const deliveryCents = ONE_CONFIG.DELIVERY_CENTS
  const totalCents = subtotalCents + deliveryCents

  const pedido: Omit<PedidoONE, 'id'> = {
    emprendedorId: input.emprendedorId,
    emprendedorNombre: input.emprendedorNombre,
    emprendedorEmail: input.emprendedorEmail,
    emprendedorTelefono: input.emprendedorTelefono,
    nombreLocal: input.nombreLocal,
    distritoLocal: input.distritoLocal,
    items,
    subtotalCents,
    deliveryCents,
    totalCents,
    metodoPago: input.metodoPago,
    pagoStatus: 'pendiente',
    voucherUrl: undefined,
    direccionEntrega: input.direccionEntrega,
    logisticaStatus: 'preparando',
    notasEntrega: undefined,
    kitGenerado: false,
    kitId: undefined,
    calificado: false,
    calificacionId: undefined,
    esKitProveedor: input.esKitProveedor,
    compromisoMeses: input.esKitProveedor ? (input.compromisoMeses ?? ONE_CONFIG.COMPROMISO_MESES_MIN) : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Usar transacción para reservar kg de cada producto y guardar el pedido
  await runTransaction(db, async (tx) => {
    // Verificar y reservar stock por cada producto
    for (const item of items) {
      const prodRef = doc(db, ONE_COLLECTIONS.PRODUCTOS, item.productoId)
      const prodSnap = await tx.get(prodRef)
      if (!prodSnap.exists()) throw new Error(`Producto ${item.productoId} no existe`)

      const prod = prodSnap.data() as ProductoONE
      const kgSolicitados = parseKgFromFormato(item.formato, item.cantidad)
      const disponibles = prod.kgDisponibles - prod.kgReservados

      if (disponibles < kgSolicitados) {
        throw new Error(`Stock insuficiente para ${item.productoNombre}`)
      }

      tx.update(prodRef, {
        kgReservados: prod.kgReservados + kgSolicitados,
        updatedAt: serverTimestamp(),
      })
    }

    // Guardar pedido con ID personalizado
    const pedidoRef = doc(db, ONE_COLLECTIONS.PEDIDOS, pedidoId)
    tx.set(pedidoRef, { ...pedido, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

    // Agregar pedidoId al array del usuario
    const usuarioRef = doc(db, ONE_COLLECTIONS.USUARIOS, input.emprendedorId)
    const usuarioSnap = await tx.get(usuarioRef)
    if (usuarioSnap.exists()) {
      const usuarioData = usuarioSnap.data() as UsuarioONE
      const pedidoIds = usuarioData.emprendedor?.pedidoIds ?? []
      tx.update(usuarioRef, {
        'emprendedor.pedidoIds': [...pedidoIds, pedidoId],
      })
    }
  })

  return pedidoId
}

function parseKgFromFormato(formato: string, cantidad: number): number {
  switch (formato) {
    case '250g': return 0.25 * cantidad
    case '1kg': return 1 * cantidad
    case '5kg': return 5 * cantidad
    default: return 0
  }
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

export async function fetchPedidosByEmprendedor(uid: string): Promise<PedidoONE[]> {
  const snap = await getDocs(
    query(
      collection(db, ONE_COLLECTIONS.PEDIDOS),
      where('emprendedorId', '==', uid),
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

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export async function fetchCafeterias(): Promise<UsuarioONE[]> {
  const snap = await getDocs(
    query(collection(db, ONE_COLLECTIONS.USUARIOS), where('rol', '==', 'emprendedor'))
  )
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UsuarioONE))
}

export async function fetchCafeteria(uid: string): Promise<UsuarioONE | null> {
  const snap = await getDoc(doc(db, ONE_COLLECTIONS.USUARIOS, uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as UsuarioONE
}

export async function fetchMenuCafeteria(emprendedorId: string): Promise<ProductoONE[]> {
  const pedidosSnap = await getDocs(
    query(collection(db, ONE_COLLECTIONS.PEDIDOS), where('emprendedorId', '==', emprendedorId))
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

// ─── KITS ─────────────────────────────────────────────────────────────────────

export async function generarKit(
  pedidoId: string,
  nombreLocal: string,
  emprendedorId: string,
  productos: KitIdentidadONE['productos']
): Promise<string> {
  const kitData: Omit<KitIdentidadONE, 'id'> = {
    pedidoId,
    emprendedorId,
    nombreLocal,
    productos,
    createdAt: new Date().toISOString(),
  }

  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.KITS), {
    ...kitData,
    createdAt: serverTimestamp(),
  })

  // Marcar el pedido como kit generado
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

// ─── CALIFICACIONES ──────────────────────────────────────────────────────────

export async function crearCalificacionCaficultor(
  input: CreateCalificacionCaficultorInput
): Promise<string> {
  // Guardar la calificación
  const docRef = await addDoc(collection(db, ONE_COLLECTIONS.CALIFICACIONES_CAFICULTOR), {
    ...input,
    createdAt: serverTimestamp(),
  })

  // Marcar pedido como calificado
  await updateDoc(doc(db, ONE_COLLECTIONS.PEDIDOS, input.pedidoId), {
    calificado: true,
    calificacionId: docRef.id,
    updatedAt: serverTimestamp(),
  })

  // Recalcular score del caficultor (promedio simple)
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
  await updateDoc(doc(db, ONE_COLLECTIONS.CAFICULTORES, caficultorId), {
    scoreConfianza: promedio,
    totalCalificaciones: snap.docs.length,
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
