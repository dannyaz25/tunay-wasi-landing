/**
 * PortalCaficultor.tsx — Dashboard del caficultor
 * Dark mode Netflix-style con sidebar navigation, CRUD de productos, toast
 */
import React, { useEffect, useState } from 'react'
import {
  fetchPedidosByCaficultor, fetchProductos, fetchCaficultor,
  fetchCalificacionesByCaficultor, updateLogistica, updateStock,
  crearProducto, updateProducto,
} from '../service'
import {
  demoFetchPedidosByCaficultor, demoFetchProductosByCaficultorLive,
  demoFetchCaficultor, demoUpdateLogistica, demoUpdateStock,
  demoCrearProducto, demoUpdateProducto,
} from '../demoService'
import { logout } from '../authService'
import { PROCESO_LABELS } from '../config'
import type { PedidoONE, ProductoONE, CaficultorONE, CalificacionCaficultor } from '../types'

// ─── Design system dark ───────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1e1e1e',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  creamMuted: '#a09080',
  terra: '#c96e4b',
  sage: '#8faf8a',
  white: '#ffffff',
  yellow: '#f39c12',
  red: '#e74c3c',
  blue: '#4a90c4',
  text: '#e8e0d8',
  textSub: '#888888',
  muted: '#555555',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: C.blue, natural: C.terra, honey: C.yellow, anaerobico: '#9b59b6',
}

type Tab = 'inicio' | 'pedidos' | 'productos' | 'calificaciones' | 'historial'

function formatCents(cents: number): string { return `S/ ${(cents / 100).toFixed(0)}` }
function formatFecha(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) }
  catch { return iso }
}
function colorStock(kg: number): string {
  if (kg > 20) return C.sage
  if (kg > 10) return C.yellow
  return C.red
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; tipo: 'ok' | 'error' | 'info' }

const Toast: React.FC<{ msgs: ToastMsg[]; onRemove: (id: number) => void }> = ({ msgs, onRemove }) => (
  <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(90vw, 360px)' }}>
    {msgs.map(m => (
      <div key={m.id} onClick={() => onRemove(m.id)} style={{
        padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: m.tipo === 'ok' ? C.sage : m.tipo === 'error' ? C.red : C.yellow,
        color: m.tipo === 'info' ? '#000' : C.white,
        pointerEvents: 'all', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {m.tipo === 'ok' ? '✓ ' : m.tipo === 'error' ? '✕ ' : 'ℹ '}{m.text}
      </div>
    ))}
  </div>
)

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{ titulo: string; children: React.ReactNode; accion?: React.ReactNode }> = ({ titulo, children, accion }) => (
  <div style={{ background: C.card, borderRadius: 16, padding: '20px', marginBottom: 16, border: `1px solid ${C.border}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{titulo}</p>
      {accion}
    </div>
    {children}
  </div>
)

// ─── Modal producto (crear/editar) ────────────────────────────────────────────

interface ProductoFormData {
  nombre: string; variedad: string; proceso: string; altitudMsnm: string; cosecha: string
  notasSabor: string; descripcion: string; puntajeReferencial: string
  precioBaseKgCents: string; kgDisponibles: string; foto: string
}

const PROCESOS: { value: string; label: string }[] = [
  { value: 'lavado', label: 'Lavado' },
  { value: 'natural', label: 'Natural' },
  { value: 'honey', label: 'Honey' },
  { value: 'anaerobico', label: 'Anaeróbico' },
]

const ModalProducto: React.FC<{
  caficultorId: string; caficultorNombre: string; producto?: ProductoONE; isDemo: boolean
  onClose: () => void
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
  onGuardado: (p: ProductoONE) => void
}> = ({ caficultorId, caficultorNombre, producto, isDemo, onClose, onToast, onGuardado }) => {
  const esEdicion = !!producto

  const [form, setForm] = useState<ProductoFormData>({
    nombre: producto?.nombre ?? '',
    variedad: producto?.variedad ?? '',
    proceso: producto?.proceso ?? 'lavado',
    altitudMsnm: String(producto?.altitudMsnm ?? ''),
    cosecha: producto?.cosecha ?? '',
    notasSabor: producto?.notasSabor?.join(', ') ?? '',
    descripcion: producto?.descripcion ?? '',
    puntajeReferencial: String(producto?.puntajeReferencial ?? ''),
    precioBaseKgCents: producto ? String(producto.precioBaseKgCents) : '',
    kgDisponibles: String(producto?.kgDisponibles ?? ''),
    foto: producto?.foto ?? '',
  })
  const [guardando, setGuardando] = useState(false)

  function set(field: keyof ProductoFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.variedad.trim() || !form.precioBaseKgCents) {
      onToast('Nombre, variedad y precio base son obligatorios', 'error')
      return
    }
    const precioBase = parseInt(form.precioBaseKgCents)
    const kg = parseInt(form.kgDisponibles) || 0
    if (isNaN(precioBase) || precioBase <= 0) { onToast('Precio base inválido', 'error'); return }

    setGuardando(true)
    try {
      const notasSabor = form.notasSabor.split(',').map(s => s.trim()).filter(Boolean)
      const data: Omit<ProductoONE, 'id' | 'createdAt' | 'updatedAt'> = {
        caficultorId, caficultorNombre,
        nombre: form.nombre.trim(),
        variedad: form.variedad.trim(),
        proceso: form.proceso as ProductoONE['proceso'],
        altitudMsnm: parseInt(form.altitudMsnm) || 0,
        cosecha: form.cosecha.trim(),
        notasSabor,
        descripcion: form.descripcion.trim(),
        puntajeReferencial: form.puntajeReferencial ? parseInt(form.puntajeReferencial) : undefined,
        notaReferencial: 'Puntaje referencial declarado por el caficultor',
        precioBaseKgCents: precioBase,
        precios: {
          g250: Math.round(precioBase * 0.25),
          kg1: precioBase,
          kg5: precioBase * 5,
        },
        kgDisponibles: kg,
        kgReservados: producto?.kgReservados ?? 0,
        status: producto?.status ?? 'activo',
        foto: form.foto.trim() || 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-cafe.jpg',
      }

      if (esEdicion && producto) {
        if (isDemo) await demoUpdateProducto(producto.id, data)
        else await updateProducto(producto.id, data)
        onGuardado({ ...data, id: producto.id, createdAt: producto.createdAt, updatedAt: new Date().toISOString() })
        onToast('Producto actualizado', 'ok')
      } else {
        const id = isDemo ? await demoCrearProducto(data) : await crearProducto(data)
        onGuardado({ ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        onToast('Producto creado', 'ok')
      }
      onClose()
    } catch {
      onToast('Error al guardar el producto', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: '#0f0f0f',
    fontSize: 13, fontFamily: 'Montserrat, sans-serif', color: C.cream,
    outline: 'none', boxSizing: 'border-box', marginBottom: 12,
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 520, border: `1px solid ${C.border}`, borderBottom: 'none', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Montserrat, sans-serif' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>
          {esEdicion ? 'Editar producto' : 'Nuevo producto'}
        </h2>
        <label style={labelStyle}>Nombre del café *</label>
        <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} placeholder="Bourbon Lavado — Finca La Coipa" maxLength={80} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Variedad *</label>
            <input value={form.variedad} onChange={e => set('variedad', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="Bourbon" />
          </div>
          <div>
            <label style={labelStyle}>Proceso *</label>
            <select value={form.proceso} onChange={e => set('proceso', e.target.value)} style={{ ...inputStyle, marginBottom: 0, cursor: 'pointer' }}>
              {PROCESOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ height: 12 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Altitud (msnm)</label>
            <input type="number" value={form.altitudMsnm} onChange={e => set('altitudMsnm', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="1800" />
          </div>
          <div>
            <label style={labelStyle}>Cosecha</label>
            <input value={form.cosecha} onChange={e => set('cosecha', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="Junio 2026" />
          </div>
        </div>
        <div style={{ height: 12 }} />

        <label style={labelStyle}>Notas de sabor (separadas por coma)</label>
        <input value={form.notasSabor} onChange={e => set('notasSabor', e.target.value)} style={inputStyle} placeholder="chocolate negro, avellana, mandarina" />

        <label style={labelStyle}>Descripción breve</label>
        <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} maxLength={200} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Perfil del café, origen, proceso..." />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Precio base/kg (centavos) *</label>
            <input type="number" value={form.precioBaseKgCents} onChange={e => set('precioBaseKgCents', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="6600" />
            {form.precioBaseKgCents && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.textSub }}>= S/ {(parseInt(form.precioBaseKgCents)/100).toFixed(0)} /kg</p>}
          </div>
          <div>
            <label style={labelStyle}>Stock disponible (kg)</label>
            <input type="number" value={form.kgDisponibles} onChange={e => set('kgDisponibles', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="100" />
          </div>
          <div>
            <label style={labelStyle}>Puntaje ref.</label>
            <input type="number" value={form.puntajeReferencial} onChange={e => set('puntajeReferencial', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="85" min="0" max="100" />
          </div>
        </div>
        <div style={{ height: 12 }} />

        <label style={labelStyle}>URL foto</label>
        <input value={form.foto} onChange={e => set('foto', e.target.value)} style={inputStyle} placeholder="https://..." maxLength={300} />

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', fontSize: 14, fontWeight: 600, color: C.textSub, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: C.terra, fontSize: 14, fontWeight: 700, color: C.white, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
            {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'inicio',         emoji: '🏠', label: 'Inicio' },
  { id: 'pedidos',        emoji: '📦', label: 'Pedidos' },
  { id: 'productos',      emoji: '🌱', label: 'Mis productos' },
  { id: 'calificaciones', emoji: '★',  label: 'Calificaciones' },
  { id: 'historial',      emoji: '📋', label: 'Historial' },
]

const Sidebar: React.FC<{ tab: Tab; onChange: (t: Tab) => void; nombre: string; caficultorId: string; onLogout: () => void }> = ({ tab, onChange, nombre, caficultorId, onLogout }) => (
  <nav style={{
    position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
    background: '#0d0d0d', borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', zIndex: 100,
    fontFamily: 'Montserrat, sans-serif',
  }}>
    <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
      <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TUNAY WASI</p>
      <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{nombre}</p>
      <a href={`#/caficultor/${caficultorId}`} style={{ fontSize: 11, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>Ver perfil →</a>
    </div>
    <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px',
          background: tab === item.id ? C.terra + '18' : 'none',
          border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
        }}>
          <span style={{ fontSize: 16 }}>{item.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub }}>{item.label}</span>
        </button>
      ))}
    </div>
    <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
      <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Cerrar sesión</button>
    </div>
  </nav>
)

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  caficultorId: string
  isDemo?: boolean
}

const PortalCaficultor: React.FC<Props> = ({ usuarioId: _usuarioId, caficultorId, isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('inicio')
  const [caficultor, setCaficultor] = useState<CaficultorONE | null>(null)
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [calificaciones, setCalificaciones] = useState<CalificacionCaficultor[]>([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState<string | null>(null)
  const [stockEditando, setStockEditando] = useState<string | null>(null)
  const [stockValor, setStockValor] = useState<Record<string, string>>({})
  const [modalProducto, setModalProducto] = useState<{ abierto: boolean; editar?: ProductoONE }>({ abierto: false })
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function toast(text: string, tipo: 'ok' | 'error' | 'info' = 'ok') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, text, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    async function cargar() {
      try {
        const [cafic, peds, prods] = await Promise.all([
          isDemo ? demoFetchCaficultor(caficultorId) : fetchCaficultor(caficultorId).catch(() => null),
          isDemo ? demoFetchPedidosByCaficultor(caficultorId) : fetchPedidosByCaficultor(caficultorId),
          isDemo ? demoFetchProductosByCaficultorLive(caficultorId) : fetchProductos().then(all => all.filter(p => p.caficultorId === caficultorId)),
        ])
        setCaficultor(cafic)
        setPedidos(peds)
        setProductos(prods)
        if (!isDemo) {
          const cals = await fetchCalificacionesByCaficultor(caficultorId).catch(() => [])
          setCalificaciones(cals)
        }
      } catch (e) {
        toast('Error al cargar datos', 'error')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [caficultorId, isDemo])

  const productoIds = new Set(productos.map(p => p.id))
  function misItems(pedido: PedidoONE) {
    return pedido.items.filter(i => productoIds.has(i.productoId) || i.caficultorId === caficultorId)
  }

  const paraDespachar = pedidos.filter(p => p.pagoStatus === 'verificado' && p.logisticaStatus === 'preparando')
  const enCamino = pedidos.filter(p => p.logisticaStatus === 'despachado')
  const entregados = pedidos.filter(p => p.logisticaStatus === 'entregado')

  const ahora = new Date()
  const gananciasMes = pedidos
    .filter(p => p.pagoStatus === 'verificado' && new Date(p.createdAt).getMonth() === ahora.getMonth())
    .reduce((acc, p) => acc + misItems(p).reduce((s, i) => s + i.subtotalCents, 0), 0)
  const kgVendidosMes = pedidos
    .filter(p => p.pagoStatus === 'verificado' && new Date(p.createdAt).getMonth() === ahora.getMonth())
    .reduce((acc, p) => acc + misItems(p).reduce((s, i) => {
      const kg = i.formato === '250g' ? 0.25 * i.cantidad : i.formato === '1kg' ? i.cantidad : 5 * i.cantidad
      return s + kg
    }, 0), 0)

  const scorePromedio = calificaciones.length > 0
    ? Math.round(calificaciones.reduce((s, c) => s + c.estrellas, 0) / calificaciones.length * 10) / 10
    : caficultor?.scoreConfianza ?? 0

  async function despachar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      if (isDemo) await demoUpdateLogistica(pedidoId, 'despachado')
      else await updateLogistica(pedidoId, 'despachado')
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, logisticaStatus: 'despachado' } : p))
      toast('Pedido marcado como despachado', 'ok')
    } catch {
      toast('Error al despachar', 'error')
    } finally { setAccionando(null) }
  }

  async function marcarEntregado(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      if (isDemo) await demoUpdateLogistica(pedidoId, 'entregado')
      else await updateLogistica(pedidoId, 'entregado')
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, logisticaStatus: 'entregado' } : p))
      toast('Pedido marcado como entregado ✓', 'ok')
    } catch {
      toast('Error al marcar entregado', 'error')
    } finally { setAccionando(null) }
  }

  async function guardarStock(productoId: string) {
    const val = parseInt(stockValor[productoId] ?? '')
    if (isNaN(val) || val < 0) { toast('Valor de stock inválido', 'error'); return }
    setAccionando(productoId)
    try {
      if (isDemo) await demoUpdateStock(productoId, val)
      else await updateStock(productoId, val)
      setProductos(prev => prev.map(p => p.id === productoId ? { ...p, kgDisponibles: val } : p))
      setStockEditando(null)
      toast('Stock actualizado', 'ok')
    } catch {
      toast('Error al actualizar stock', 'error')
    } finally { setAccionando(null) }
  }

  async function toggleStatus(producto: ProductoONE) {
    const nuevoStatus = producto.status === 'activo' ? 'pausado' : 'activo'
    setAccionando(producto.id)
    try {
      if (isDemo) await demoUpdateProducto(producto.id, { status: nuevoStatus })
      else await updateProducto(producto.id, { status: nuevoStatus })
      setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, status: nuevoStatus } : p))
      toast(`Producto ${nuevoStatus === 'activo' ? 'activado' : 'pausado'}`, 'info')
    } catch {
      toast('Error al cambiar estado', 'error')
    } finally { setAccionando(null) }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textSub, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>Cargando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const nombreCaficultor = caficultor?.nombre ?? 'Mi portal'

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  function renderInicio() {
    return (
      <div>
        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Ganancias mes', value: gananciasMes > 0 ? formatCents(gananciasMes) : '—', color: C.sage },
            { label: 'Por despachar', value: String(paraDespachar.length), color: paraDespachar.length > 0 ? C.yellow : C.textSub },
            { label: 'Kg vendidos', value: kgVendidosMes > 0 ? `${kgVendidosMes.toFixed(1)}` : '—', color: C.terra },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Para despachar destacado */}
        {paraDespachar.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.yellow, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🚨 Para despachar ({paraDespachar.length})</p>
            {paraDespachar.map(p => (
              <div key={p.id} style={{ background: C.card, borderRadius: 14, padding: 18, marginBottom: 10, border: `1px solid ${C.yellow}44` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textSub }}>{p.distritoLocal} · {p.id}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.sage }}>{formatCents(misItems(p).reduce((s, i) => s + i.subtotalCents, 0))}</p>
                </div>
                {misItems(p).map((item, i) => (
                  <p key={i} style={{ margin: '3px 0', fontSize: 12, color: C.textSub }}>
                    {item.cantidad} × {item.formato} — {item.productoNombre}
                  </p>
                ))}
                {p.direccionEntrega && (
                  <p style={{ margin: '8px 0 12px', fontSize: 11, color: C.textSub, padding: '6px 10px', background: C.border + '55', borderRadius: 6 }}>📍 {p.direccionEntrega}</p>
                )}
                <button onClick={() => despachar(p.id)} disabled={accionando === p.id} style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: accionando === p.id ? C.muted : C.terra,
                  color: C.white, fontSize: 13, fontWeight: 700, cursor: accionando === p.id ? 'not-allowed' : 'pointer',
                }}>
                  {accionando === p.id ? 'Guardando...' : '🚚 Marcar despachado →'}
                </button>
              </div>
            ))}
          </div>
        )}

        {pedidos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🌱</p>
            <p style={{ fontSize: 20, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Aún no hay pedidos</p>
            <p style={{ fontSize: 13, color: C.textSub }}>Los pedidos aparecerán cuando los emprendedores compren tus cafés</p>
          </div>
        )}
      </div>
    )
  }

  function renderPedidos() {
    return (
      <div>
        <Section titulo={`Para despachar (${paraDespachar.length})`}>
          {paraDespachar.length === 0 ? (
            <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin pedidos pendientes</p>
          ) : paraDespachar.map(p => (
            <div key={p.id} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px', marginBottom: 12, border: `1px solid ${C.yellow}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub }}>{p.distritoLocal} · {p.id}</p>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.sage }}>{formatCents(misItems(p).reduce((s, i) => s + i.subtotalCents, 0))}</p>
              </div>
              {misItems(p).map((item, i) => (
                <p key={i} style={{ margin: '3px 0', fontSize: 12, color: C.textSub }}>{item.cantidad} × {item.formato} — {item.productoNombre}</p>
              ))}
              {p.direccionEntrega && (
                <p style={{ margin: '8px 0 10px', fontSize: 11, color: C.textSub, padding: '6px 10px', background: C.border + '55', borderRadius: 6 }}>📍 {p.direccionEntrega}</p>
              )}
              <button onClick={() => despachar(p.id)} disabled={accionando === p.id} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.terra, color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: accionando === p.id ? 0.6 : 1 }}>
                {accionando === p.id ? '...' : '🚚 Marcar despachado →'}
              </button>
            </div>
          ))}
        </Section>

        {enCamino.length > 0 && (
          <Section titulo={`En camino (${enCamino.length})`}>
            {enCamino.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.cream }}>{p.nombreLocal}</p>
                  <p style={{ margin: '2px 0', fontSize: 11, color: C.textSub }}>{p.distritoLocal} · {misItems(p).map(i => `${i.cantidad}×${i.formato}`).join(', ')}</p>
                  <a href={`#/cafeteria/${p.emprendedorId}`} style={{ fontSize: 11, color: C.terra, textDecoration: 'none' }}>Ver cafetería →</a>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 20 }}>🚚</span>
                  <div style={{ marginTop: 6 }}>
                    <button onClick={() => marcarEntregado(p.id)} disabled={accionando === p.id} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: C.sage, color: '#000', fontSize: 10, fontWeight: 700, cursor: 'pointer', opacity: accionando === p.id ? 0.6 : 1 }}>
                      ✓ Entregado
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    )
  }

  function renderProductos() {
    const activos = productos.filter(p => p.status !== 'pausado')
    const pausados = productos.filter(p => p.status === 'pausado')
    return (
      <Section titulo={`Mis productos (${productos.length})`}
        accion={
          <button onClick={() => setModalProducto({ abierto: true })} style={{ fontSize: 12, color: C.white, background: C.terra, border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}>+ Nuevo</button>
        }
      >
        {productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🌱</p>
            <p style={{ fontSize: 14, color: C.textSub, marginBottom: 16 }}>Aún no tienes productos registrados</p>
            <button onClick={() => setModalProducto({ abierto: true })} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: C.terra, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Agregar primer producto
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...activos, ...pausados].map(p => {
              const editando = stockEditando === p.id
              const stockColor = colorStock(p.kgDisponibles)
              const pct = Math.min(100, (p.kgDisponibles / Math.max(p.kgDisponibles + p.kgReservados, 1)) * 100)
              const isPaused = p.status === 'pausado'
              return (
                <div key={p.id} style={{ background: C.bg, borderRadius: 12, padding: '16px', border: `1px solid ${isPaused ? C.muted + '44' : C.border}`, opacity: isPaused ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{p.nombre}</p>
                        {isPaused && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: C.muted + '33', color: C.muted, fontWeight: 700 }}>PAUSADO</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: (PROCESO_COLORS[p.proceso] ?? C.terra) + '22', color: PROCESO_COLORS[p.proceso] ?? C.terra, fontWeight: 700 }}>{PROCESO_LABELS[p.proceso]}</span>
                        <span style={{ fontSize: 11, color: C.textSub }}>{p.variedad}</span>
                        {p.puntajeReferencial && <span style={{ fontSize: 11, color: C.textSub }}>~{p.puntajeReferencial}pts</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setModalProducto({ abierto: true, editar: p })} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => toggleStatus(p)} disabled={accionando === p.id} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${isPaused ? C.sage + '44' : C.muted + '44'}`, background: 'none', color: isPaused ? C.sage : C.muted, fontSize: 11, cursor: 'pointer' }}>
                        {isPaused ? 'Activar' : 'Pausar'}
                      </button>
                    </div>
                  </div>

                  {/* Precios */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    {[
                      { fmt: '250g', val: p.precios.g250 },
                      { fmt: '1kg', val: p.precios.kg1 },
                      { fmt: '5kg', val: p.precios.kg5 },
                    ].map(({ fmt, val }) => (
                      <div key={fmt} style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 9, color: C.textSub, textTransform: 'uppercase' }}>{fmt}</p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.terra }}>{formatCents(val)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Stock inline edit */}
                  {editando ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input type="number" value={stockValor[p.id] ?? String(p.kgDisponibles)}
                        onChange={e => setStockValor(prev => ({ ...prev, [p.id]: e.target.value }))}
                        style={{ width: 72, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.cream, fontSize: 13, textAlign: 'right' }}
                      />
                      <span style={{ fontSize: 12, color: C.textSub }}>kg disponibles</span>
                      <button onClick={() => guardarStock(p.id)} disabled={accionando === p.id} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: C.sage, color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {accionando === p.id ? '...' : '✓ Guardar'}
                      </button>
                      <button onClick={() => setStockEditando(null)} style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: C.border, color: C.textSub, fontSize: 11, cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: stockColor, borderRadius: 2, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: stockColor, fontWeight: 700, flexShrink: 0 }}>{p.kgDisponibles} kg</span>
                      <button onClick={() => { setStockEditando(p.id); setStockValor(prev => ({ ...prev, [p.id]: String(p.kgDisponibles) })) }}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 10, cursor: 'pointer' }}>
                        Editar stock
                      </button>
                    </div>
                  )}

                  {p.kgDisponibles <= 10 && p.status === 'activo' && (
                    <p style={{ margin: 0, fontSize: 11, color: C.red }}>⚠ Stock bajo — actualiza disponibilidad</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>
    )
  }

  function renderCalificaciones() {
    return (
      <Section titulo="Mis calificaciones">
        {calificaciones.length === 0 && !caficultor?.scoreConfianza ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>★</p>
            <p style={{ margin: 0, fontSize: 14, color: C.textSub }}>Aún no tienes calificaciones. Se generan cuando un emprendedor califica tu café.</p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ margin: '0 0 6px', fontSize: 48, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
                {scorePromedio > 0 ? scorePromedio.toFixed(1) : '—'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 20, color: n <= Math.round(scorePromedio) ? C.yellow : C.border }}>★</span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>
                {calificaciones.length || caficultor?.totalCalificaciones || 0} calificaciones de emprendedores
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {calificaciones.slice(0, 8).map(c => (
                <div key={c.id} style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.comentario ? 6 : 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.cream }}>{c.nombreLocal}</p>
                    <span style={{ fontSize: 14, color: C.yellow }}>{'★'.repeat(c.estrellas)}{'☆'.repeat(5 - c.estrellas)}</span>
                  </div>
                  {c.comentario && <p style={{ margin: 0, fontSize: 12, color: C.textSub, fontStyle: 'italic' }}>"{c.comentario}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    )
  }

  function renderHistorial() {
    return (
      <Section titulo={`Entregas completadas (${entregados.length})`}>
        {entregados.length === 0 ? (
          <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin entregas completadas aún</p>
        ) : entregados.map((p, idx) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx < entregados.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.cream }}>{p.nombreLocal}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub }}>{p.id} · {formatFecha(p.updatedAt)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: C.sage, fontWeight: 700 }}>✓ Entregado</span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.terra, fontWeight: 600 }}>{formatCents(misItems(p).reduce((s, i) => s + i.subtotalCents, 0))}</p>
            </div>
          </div>
        ))}
      </Section>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 700px) { .caf-sidebar { display: none !important; } .caf-main { margin-left: 0 !important; } .caf-mobile-header { display: flex !important; } }
        @media (min-width: 701px) { .caf-sidebar { display: flex !important; } .caf-main { margin-left: 220px !important; } .caf-mobile-header { display: none !important; } }
      `}</style>

      {/* Sidebar desktop */}
      <div className="caf-sidebar" style={{ display: 'none' }}>
        <Sidebar tab={tab} onChange={setTab} nombre={nombreCaficultor} caficultorId={caficultorId} onLogout={() => logout().then(() => { window.location.hash = '#/' })} />
      </div>

      {/* Mobile header */}
      <div className="caf-mobile-header" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{nombreCaficultor}</p>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>☰</button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: '#0d0d0d', borderRight: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{nombreCaficultor}</p>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 20, padding: 0 }}>✕</button>
            </div>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                background: tab === item.id ? C.terra + '18' : 'none',
                border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub }}>{item.label}</span>
              </button>
            ))}
            <div style={{ padding: '16px 20px' }}>
              <button onClick={() => logout().then(() => { window.location.hash = '#/' })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="caf-main" style={{ flex: 1, marginLeft: 220, minHeight: '100vh' }}>
        <div style={{ padding: '20px 28px 0', paddingTop: 'clamp(60px, 8vw, 20px)' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {NAV_ITEMS.find(n => n.id === tab)?.emoji} {NAV_ITEMS.find(n => n.id === tab)?.label}
                </p>
                <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>{nombreCaficultor}</h1>
                {caficultor && <p style={{ margin: '2px 0 0', fontSize: 13, color: C.textSub }}>{caficultor.region} · {caficultor.altitudMsnm.toLocaleString()} msnm</p>}
              </div>
              {paraDespachar.length > 0 && (
                <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, background: C.yellow + '22', color: C.yellow, fontWeight: 700, border: `1px solid ${C.yellow}44` }}>
                  {paraDespachar.length} por despachar
                </span>
              )}
            </div>

            {tab === 'inicio' && renderInicio()}
            {tab === 'pedidos' && renderPedidos()}
            {tab === 'productos' && renderProductos()}
            {tab === 'calificaciones' && renderCalificaciones()}
            {tab === 'historial' && renderHistorial()}
          </div>
        </div>
      </div>

      {/* Modal producto */}
      {modalProducto.abierto && (
        <ModalProducto
          caficultorId={caficultorId}
          caficultorNombre={nombreCaficultor}
          producto={modalProducto.editar}
          isDemo={isDemo}
          onClose={() => setModalProducto({ abierto: false })}
          onToast={toast}
          onGuardado={(p) => {
            setProductos(prev => {
              const idx = prev.findIndex(x => x.id === p.id)
              if (idx >= 0) return prev.map(x => x.id === p.id ? p : x)
              return [p, ...prev]
            })
          }}
        />
      )}

      <Toast msgs={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}

export default PortalCaficultor
