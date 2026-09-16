/**
 * PortalEmprendedor.tsx — Dashboard del emprendedor (cafetería)
 * Dark mode Netflix-style con sidebar navigation y CRUD completo
 */
import React, { useEffect, useState } from 'react'
import {
  fetchPedidosByEmprendedor,
  fetchKitByPedido,
  fetchMenuCafeteria,
  crearCalificacionCaficultor,
  fetchUsuario,
  updateUsuario,
} from '../service'
import {
  demoFetchPedidosByEmprendedor,
  demoFetchKitByPedido,
  demoFetchMenuCafeteria,
  demoCrearCalificacionCaficultor,
} from '../demoService'
import { logout } from '../authService'
import { ONE_CONFIG } from '../config'
import type { PedidoONE, KitIdentidadONE, ProductoONE, UsuarioONE } from '../types'

// ─── Design system ────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1e1e1e',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  creamMuted: '#a09080',
  terra: '#c96e4b',
  terraHover: '#b85d3a',
  sage: '#8faf8a',
  green: '#1f3028',
  white: '#ffffff',
  muted: '#555555',
  yellow: '#f39c12',
  red: '#e74c3c',
  blue: '#4a90c4',
  text: '#e8e0d8',
  textSub: '#888888',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: '#4a90c4',
  natural: '#c96e4b',
  honey: '#f39c12',
  anaerobico: '#9b59b6',
}

const DISTRITOS_LIMA = [
  'Barranco', 'Chorrillos', 'La Molina', 'La Victoria', 'Lince',
  'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'San Borja',
  'San Isidro', 'San Miguel', 'Santiago de Surco', 'Surquillo',
  'Jesús María', 'Breña', 'Lima Cercado', 'Ate', 'San Juan de Miraflores',
  'Villa María del Triunfo', 'Comas', 'Los Olivos',
]

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

function stepDePedido(p: PedidoONE): number {
  if (p.logisticaStatus === 'entregado') return 3
  if (p.logisticaStatus === 'despachado') return 2
  if (p.pagoStatus === 'verificado') return 1
  return 0
}

const STEPS = ['Pendiente', 'Verificado', 'En camino', 'Entregado ✓']

type Tab = 'inicio' | 'pedidos' | 'carta' | 'kit' | 'historial' | 'perfil'

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; tipo: 'ok' | 'error' | 'info' }

const Toast: React.FC<{ msgs: ToastMsg[]; onRemove: (id: number) => void }> = ({ msgs, onRemove }) => (
  <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(90vw, 360px)' }}>
    {msgs.map(m => (
      <div key={m.id} onClick={() => onRemove(m.id)} style={{
        padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: m.tipo === 'ok' ? C.sage : m.tipo === 'error' ? C.red : C.yellow,
        color: m.tipo === 'info' ? '#000' : C.white,
        pointerEvents: 'all', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {m.tipo === 'ok' ? '✓ ' : m.tipo === 'error' ? '✕ ' : 'ℹ '}{m.text}
      </div>
    ))}
  </div>
)

// ─── Stepper ──────────────────────────────────────────────────────────────────

const StepperPedido: React.FC<{ pedido: PedidoONE }> = ({ pedido }) => {
  const step = stepDePedido(pedido)
  return (
    <div style={{ margin: '16px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: step >= i ? C.terra : C.border,
                border: step === i ? `2px solid ${C.terra}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step > i
                  ? <span style={{ color: C.white, fontSize: 12 }}>✓</span>
                  : <span style={{ width: 6, height: 6, borderRadius: '50%', background: step === i ? C.white : C.muted, display: 'block' }} />
                }
              </div>
              <p style={{
                margin: '4px 0 0', fontSize: 9, textAlign: 'center', lineHeight: 1.3,
                color: step >= i ? C.terra : C.muted,
                fontWeight: step === i ? 700 : 400,
                fontFamily: 'Montserrat, sans-serif',
              }}>{label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: step > i ? C.terra : C.border, marginBottom: 18 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Modal calificación ───────────────────────────────────────────────────────

const ModalCalificacion: React.FC<{
  pedido: PedidoONE; usuarioId: string; isDemo: boolean
  onDone: () => void; onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedido, usuarioId, isDemo, onDone, onToast }) => {
  const [estrellas, setEstrellas] = useState<1|2|3|4|5>(5)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    setEnviando(true)
    try {
      const input = {
        pedidoId: pedido.id,
        caficultorId: pedido.items[0]?.caficultorId ?? '',
        emprendedorId: usuarioId,
        emprendedorNombre: pedido.emprendedorNombre,
        nombreLocal: pedido.nombreLocal,
        estrellas,
        comentario: comentario.trim() || undefined,
      }
      if (isDemo) await demoCrearCalificacionCaficultor(input)
      else await crearCalificacionCaficultor(input)
      onToast('Calificación enviada. ¡Gracias!', 'ok')
      onDone()
    } catch {
      onToast('No se pudo enviar la calificación', 'error')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480, fontFamily: 'Montserrat, sans-serif', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pedido.id} · {pedido.items[0]?.caficultorNombre}</p>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>¿Cómo fue el café?</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>Tu calificación ayuda a mantener la calidad y da visibilidad al caficultor.</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'center' }}>
          {([1,2,3,4,5] as const).map(n => (
            <button key={n} onClick={() => setEstrellas(n)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, padding: 0,
              opacity: n <= estrellas ? 1 : 0.2, color: C.yellow, transition: 'opacity 0.15s',
            }}>★</button>
          ))}
        </div>
        <textarea
          placeholder="Comentario opcional (calidad, consistencia, presentación...)"
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          maxLength={200}
          style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'Montserrat, sans-serif', color: C.cream, background: '#0f0f0f', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16, outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDone} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', fontSize: 14, fontWeight: 600, color: C.textSub, cursor: 'pointer' }}>Ahora no</button>
          <button onClick={enviar} disabled={enviando} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: C.terra, fontSize: 14, fontWeight: 700, color: C.white, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.7 : 1 }}>
            {enviando ? 'Enviando...' : 'Enviar calificación →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal editar perfil ───────────────────────────────────────────────────────

const ModalEditarPerfil: React.FC<{
  usuario: UsuarioONE | null; usuarioId: string; isDemo: boolean
  onClose: () => void; onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
  onUpdate: (u: Partial<UsuarioONE>) => void
}> = ({ usuario, usuarioId, isDemo, onClose, onToast, onUpdate }) => {
  const emp = usuario?.emprendedor
  const [nombreLocal, setNombreLocal] = useState(emp?.nombreLocal ?? '')
  const [distrito, setDistrito] = useState(emp?.distritoLocal ?? '')
  const [descripcion, setDescripcion] = useState(emp?.descripcion ?? '')
  const [fotoLocal, setFotoLocal] = useState(emp?.fotoLocal ?? '')
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    if (!nombreLocal.trim()) { onToast('El nombre del local es obligatorio', 'error'); return }
    setGuardando(true)
    try {
      const updates: Partial<UsuarioONE> = {
        emprendedor: {
          ...emp!,
          nombreLocal: nombreLocal.trim(),
          distritoLocal: distrito,
          descripcion: descripcion.trim() || undefined,
          fotoLocal: fotoLocal.trim() || undefined,
        }
      }
      if (!isDemo) await updateUsuario(usuarioId, updates)
      onUpdate(updates)
      onToast('Perfil actualizado', 'ok')
      onClose()
    } catch {
      onToast('No se pudo guardar el perfil', 'error')
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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: C.card, borderRadius: '16px 16px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480, fontFamily: 'Montserrat, sans-serif', border: `1px solid ${C.border}`, borderBottom: 'none', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>Editar perfil</h2>

        <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }}>Nombre del local *</label>
        <input value={nombreLocal} onChange={e => setNombreLocal(e.target.value)} style={inputStyle} placeholder="Café El Origen" maxLength={60} />

        <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }}>Distrito</label>
        <select value={distrito} onChange={e => setDistrito(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Seleccionar...</option>
          {DISTRITOS_LIMA.sort().map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }}>Descripción breve</label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={120} placeholder="Cafetería especializada en la Av. Larco..." style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />

        <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }}>URL foto del local</label>
        <input value={fotoLocal} onChange={e => setFotoLocal(e.target.value)} style={inputStyle} placeholder="https://..." maxLength={300} />

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', fontSize: 14, fontWeight: 600, color: C.textSub, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: C.terra, fontSize: 14, fontWeight: 700, color: C.white, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Kit de identidad ─────────────────────────────────────────────────────────

const KitSection: React.FC<{ kit: KitIdentidadONE }> = ({ kit }) => {
  const items = [
    { emoji: '📄', label: 'Menú PDF', sub: 'Para tu carta', url: kit.menuPdfUrl },
    { emoji: '🃏', label: 'Fichas de mesa', sub: 'Imprimibles A6', url: kit.fichasUrl },
    { emoji: '📱', label: 'QR trazabilidad', sub: 'Para tus mesas', url: kit.qrUrl },
    { emoji: '📸', label: 'Pack Instagram', sub: '3 fotos + caption', url: kit.instagramPackUrl },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map(item => (
        <a key={item.label} href={item.url ?? '#'} target={item.url ? '_blank' : undefined} rel="noopener noreferrer"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 10px',
            borderRadius: 12, textDecoration: 'none',
            background: item.url ? C.terra + '18' : C.border + '44',
            border: `1px solid ${item.url ? C.terra + '44' : C.border}`,
            opacity: item.url ? 1 : 0.5, cursor: item.url ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}>
          <span style={{ fontSize: 28, marginBottom: 8 }}>{item.emoji}</span>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: item.url ? C.cream : C.textSub, textAlign: 'center' }}>{item.label}</p>
          <p style={{ margin: '3px 0 0', fontSize: 10, color: item.url ? C.sage : C.muted, textAlign: 'center' }}>{item.url ? item.sub : 'Próximamente'}</p>
        </a>
      ))}
    </div>
  )
}

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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'inicio',    emoji: '🏠', label: 'Inicio' },
  { id: 'pedidos',   emoji: '📦', label: 'Pedidos' },
  { id: 'carta',     emoji: '☕', label: 'Mi carta' },
  { id: 'kit',       emoji: '🎨', label: 'Kit' },
  { id: 'historial', emoji: '📋', label: 'Historial' },
  { id: 'perfil',    emoji: '⚙️', label: 'Perfil' },
]

const Sidebar: React.FC<{ tab: Tab; onChange: (t: Tab) => void; nombreLocal: string; onLogout: () => void }> = ({ tab, onChange, nombreLocal, onLogout }) => (
  <nav style={{
    position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
    background: '#0d0d0d', borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', zIndex: 100,
    fontFamily: 'Montserrat, sans-serif',
  }}>
    <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
      <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TUNAY WASI</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{nombreLocal}</p>
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
      <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
        Cerrar sesión
      </button>
    </div>
  </nav>
)

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  nombreUsuario: string
  isDemo?: boolean
}

const PortalEmprendedor: React.FC<Props> = ({ usuarioId, nombreUsuario, isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('inicio')
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [kits, setKits] = useState<Map<string, KitIdentidadONE>>(new Map())
  const [menuCafes, setMenuCafes] = useState<ProductoONE[]>([])
  const [usuario, setUsuario] = useState<UsuarioONE | null>(null)
  const [loading, setLoading] = useState(true)
  const [pedidoACalificar, setPedidoACalificar] = useState<PedidoONE | null>(null)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
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
        const uid = usuarioId === 'demo-user' ? 'user-emprendedor-001' : usuarioId
        const [data, menu] = await Promise.all([
          isDemo ? demoFetchPedidosByEmprendedor(usuarioId) : fetchPedidosByEmprendedor(usuarioId),
          isDemo ? demoFetchMenuCafeteria(uid) : fetchMenuCafeteria(usuarioId),
        ])
        setPedidos(data)
        setMenuCafes(menu)

        if (!isDemo) {
          try {
            const u = await fetchUsuario(usuarioId)
            setUsuario(u)
          } catch { /* ok */ }
        }

        const sinCalificar = data.find(p => p.logisticaStatus === 'entregado' && !p.calificado)
        if (sinCalificar) setPedidoACalificar(sinCalificar)

        const kitsMap = new Map<string, KitIdentidadONE>()
        await Promise.all(
          data.filter(p => p.kitGenerado && p.kitId).map(async p => {
            const kit = isDemo ? await demoFetchKitByPedido(p.id) : await fetchKitByPedido(p.id)
            if (kit) kitsMap.set(p.id, kit)
          })
        )
        setKits(kitsMap)
      } catch (e) {
        toast('No se pudo cargar tu portal.', 'error')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [usuarioId, isDemo])

  const pedidosActivos = pedidos.filter(p => p.logisticaStatus !== 'entregado')
  const historial = pedidos.filter(p => p.logisticaStatus === 'entregado')
  const nombreLocal = usuario?.emprendedor?.nombreLocal ?? pedidos[0]?.nombreLocal ?? nombreUsuario
  const distritoLocal = usuario?.emprendedor?.distritoLocal ?? pedidos[0]?.distritoLocal ?? ''

  const ahora = new Date()
  const gastoMes = pedidos
    .filter(p => p.pagoStatus === 'verificado' && new Date(p.createdAt).getMonth() === ahora.getMonth())
    .reduce((s, p) => s + p.totalCents, 0)
  const pedidoEnCamino = pedidos.find(p => p.logisticaStatus === 'despachado')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textSub, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>Cargando tu portal...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ─── Contenido por tab ───────────────────────────────────────────────────────

  function renderInicio() {
    return (
      <div>
        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Este mes', value: gastoMes > 0 ? formatCents(gastoMes) : '—', sub: 'gastado', color: C.terra },
            { label: 'Activos', value: String(pedidosActivos.length), sub: 'pedidos', color: C.blue },
            { label: 'En camino', value: pedidoEnCamino ? '🚚' : '—', sub: pedidoEnCamino ? pedidoEnCamino.id : 'ninguno', color: C.sage },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: C.card, borderRadius: 14, padding: '16px 14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
              <p style={{ margin: 0, fontSize: 10, color: C.muted }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Pedido activo destacado */}
        {pedidosActivos.length > 0 && pedidosActivos.map(pedido => (
          <div key={pedido.id} style={{ background: C.card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${C.terra}33` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pedido activo</p>
              <span style={{ fontSize: 10, color: C.muted }}>{pedido.id}</span>
            </div>

            {pedido.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < pedido.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.cream }}>{item.productoNombre}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: C.textSub }}>{item.cantidad} × {item.formato}</span>
                    <a href={`#/caficultor/${item.caficultorId}`} style={{ fontSize: 11, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>{item.caficultorNombre} →</a>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.terra }}>{formatCents(item.subtotalCents)}</p>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 13, color: C.textSub, fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.cream }}>{formatCents(pedido.totalCents)}</span>
            </div>

            <StepperPedido pedido={pedido} />

            {pedido.direccionEntrega && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: C.border + '55', borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>📍 {pedido.direccionEntrega}</p>
              </div>
            )}

            {pedido.pagoStatus === 'pendiente' && (
              <a href="#/" style={{ display: 'block', marginTop: 14, padding: '13px 0', borderRadius: 10, background: C.terra, color: C.white, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                Subir comprobante de pago →
              </a>
            )}

            {pedido.pagoStatus === 'rechazado' && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: C.red + '18', borderRadius: 8, border: `1px solid ${C.red}44` }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: C.red, fontWeight: 700 }}>Pago rechazado</p>
                <a
                  href={`https://wa.me/${ONE_CONFIG.ADMIN_WHATSAPP.replace(/\s/g, '')}?text=Hola, mi pedido ${pedido.id} fue rechazado`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>
                  Contactar soporte →
                </a>
              </div>
            )}
          </div>
        ))}

        {pedidos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>☕</p>
            <p style={{ fontSize: 20, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Aún no tienes pedidos</p>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 24 }}>Explora el catálogo y haz tu primer pedido</p>
            <a href="#/" style={{ display: 'inline-block', padding: '13px 32px', borderRadius: 10, background: C.terra, color: C.white, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
              Ver catálogo →
            </a>
          </div>
        )}

        <a href="#/" style={{ display: 'block', padding: '16px 0', borderRadius: 14, background: C.terra + '18', border: `1px solid ${C.terra}44`, color: C.terra, textDecoration: 'none', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
          + Pedir más café
        </a>
      </div>
    )
  }

  function renderPedidos() {
    return (
      <div>
        <Section titulo={`Activos (${pedidosActivos.length})`}>
          {pedidosActivos.length === 0 ? (
            <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin pedidos activos</p>
          ) : pedidosActivos.map(pedido => (
            <div key={pedido.id} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.textSub }}>{pedido.id}</span>
                <span style={{ fontSize: 12, color: C.terra, fontWeight: 600 }}>{formatCents(pedido.totalCents)}</span>
              </div>
              {pedido.items.map((item, i) => (
                <p key={i} style={{ margin: '0 0 2px', fontSize: 13, color: C.cream }}>{item.productoNombre} — {item.cantidad}×{item.formato}</p>
              ))}
              <StepperPedido pedido={pedido} />
              {pedido.pagoStatus === 'pendiente' && (
                <a href="#/" style={{ display: 'inline-block', marginTop: 10, padding: '8px 20px', borderRadius: 8, background: C.terra, color: C.white, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                  Subir voucher →
                </a>
              )}
            </div>
          ))}
        </Section>
      </div>
    )
  }

  function renderCarta() {
    return (
      <Section titulo="Mis cafés en carta"
        accion={menuCafes.length > 0 ? <a href="#/cafeterias" style={{ fontSize: 11, color: C.terra, textDecoration: 'none' }}>Ver perfil público →</a> : undefined}
      >
        {menuCafes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>☕</p>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: C.textSub }}>Aún no tienes cafés en carta.</p>
            <a href="#/" style={{ fontSize: 13, color: C.terra, textDecoration: 'none', fontWeight: 700 }}>Explorar catálogo →</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {menuCafes.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px', background: C.bg, borderRadius: 12, border: `1px solid ${C.border}` }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: PROCESO_COLORS[p.proceso] ?? C.terra, marginTop: 4 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{p.nombre}</p>
                  <p style={{ margin: '0 0 3px', fontSize: 11, color: C.textSub }}>{p.variedad} · {p.proceso} · {p.cosecha}</p>
                  <p style={{ margin: '0 0 6px', fontSize: 11, color: C.muted, fontStyle: 'italic' }}>{p.notasSabor.join(' · ')}</p>
                  <a href={`#/caficultor/${p.caficultorId}`} style={{ fontSize: 11, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>{p.caficultorNombre} →</a>
                </div>
                <span style={{
                  flexShrink: 0, fontSize: 10, padding: '3px 8px', borderRadius: 6,
                  background: PROCESO_COLORS[p.proceso] + '22', color: PROCESO_COLORS[p.proceso],
                  fontWeight: 700, textTransform: 'capitalize',
                }}>{p.proceso}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    )
  }

  function renderKit() {
    const pedidoConKit = pedidos.find(p => p.kitGenerado)
    const kit = pedidoConKit ? kits.get(pedidoConKit.id) : undefined

    if (!pedidoConKit) {
      return (
        <Section titulo="Kit de Identidad">
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🎨</p>
            <p style={{ fontSize: 15, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Kit de identidad</p>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>Haz tu primer pedido con Kit Proveedor para recibir tu menú, fichas de mesa, QR y pack de Instagram.</p>
            <a href="#/" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 10, background: C.terra, color: C.white, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Ver catálogo →</a>
          </div>
        </Section>
      )
    }

    return (
      <Section titulo="Kit de Identidad">
        {kit ? <KitSection kit={kit} /> : <p style={{ color: C.textSub, fontSize: 13 }}>Cargando...</p>}
      </Section>
    )
  }

  function renderHistorial() {
    return (
      <Section titulo={`Historial (${historial.length})`}>
        {historial.length === 0 ? (
          <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin entregas aún</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {historial.map((p, idx) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: idx < historial.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.cream }}>{p.id}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textSub }}>
                    {p.items.map(i => `${i.cantidad}×${i.formato}`).join(', ')} · {formatFecha(p.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.terra }}>{formatCents(p.totalCents)}</p>
                  {p.calificado ? (
                    <span style={{ fontSize: 10, color: C.sage }}>★ Calificado</span>
                  ) : (
                    <button onClick={() => setPedidoACalificar(p)} style={{
                      marginTop: 4, padding: '3px 10px', borderRadius: 6,
                      border: `1px solid ${C.terra}`, background: 'none',
                      fontSize: 10, fontWeight: 700, color: C.terra, cursor: 'pointer',
                    }}>Calificar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    )
  }

  function renderPerfil() {
    const emp = usuario?.emprendedor ?? {
      nombreLocal: pedidos[0]?.nombreLocal ?? nombreUsuario,
      distritoLocal: pedidos[0]?.distritoLocal ?? '',
      etapa: 'abierto' as const,
      pedidoIds: [],
    }
    return (
      <Section titulo="Mi perfil"
        accion={<button onClick={() => setEditandoPerfil(true)} style={{ fontSize: 12, color: C.terra, background: 'none', border: `1px solid ${C.terra}44`, borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Editar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {emp.fotoLocal && (
            <img src={emp.fotoLocal} alt={emp.nombreLocal} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12, border: `1px solid ${C.border}` }} />
          )}
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{emp.nombreLocal}</p>
            {emp.distritoLocal && <p style={{ margin: '0 0 8px', fontSize: 13, color: C.textSub }}>{emp.distritoLocal} · Lima</p>}
            {emp.descripcion && <p style={{ margin: '0 0 12px', fontSize: 13, color: C.creamMuted, lineHeight: 1.5 }}>{emp.descripcion}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: emp.etapa === 'abierto' ? C.sage + '22' : C.yellow + '22',
                color: emp.etapa === 'abierto' ? C.sage : C.yellow,
                fontWeight: 700, border: `1px solid ${emp.etapa === 'abierto' ? C.sage + '44' : C.yellow + '44'}`,
              }}>{emp.etapa === 'abierto' ? '● Abierto' : emp.etapa === 'proxima_apertura' ? '◐ Próxima apertura' : '○ Planificando'}</span>
            </div>
          </div>
          {emp.etapa === 'abierto' && (
            <a href={`#/cafeteria/${usuarioId === 'demo-user' ? 'user-emprendedor-001' : usuarioId}`} style={{ fontSize: 13, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>
              Ver mi perfil público →
            </a>
          )}
        </div>
      </Section>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 700px) { .sidebar-desktop { display: none !important; } .mobile-header { display: flex !important; } .main-content { margin-left: 0 !important; } }
        @media (min-width: 701px) { .sidebar-desktop { display: flex !important; } .mobile-header { display: none !important; } .main-content { margin-left: 220px !important; } }
      `}</style>

      {/* Sidebar desktop */}
      <div className="sidebar-desktop" style={{ display: 'none' }}>
        <Sidebar tab={tab} onChange={setTab} nombreLocal={nombreLocal} onLogout={logout} />
      </div>

      {/* Mobile header */}
      <div className="mobile-header" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{nombreLocal}</p>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>☰</button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: '#0d0d0d', borderRight: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{nombreLocal}</p>
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
              <button onClick={logout} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="main-content" style={{ flex: 1, marginLeft: 220, minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ padding: '20px 28px 0', paddingTop: 'clamp(60px, 8vw, 20px)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', paddingTop: 16 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {NAV_ITEMS.find(n => n.id === tab)?.emoji} {NAV_ITEMS.find(n => n.id === tab)?.label}
                </p>
                <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>{nombreLocal}</h1>
                {distritoLocal && <p style={{ margin: '2px 0 0', fontSize: 13, color: C.textSub }}>{distritoLocal}</p>}
              </div>
              <a href="#/" style={{ fontSize: 12, padding: '8px 16px', borderRadius: 8, background: C.terra, color: C.white, textDecoration: 'none', fontWeight: 700, flexShrink: 0 }}>+ Pedido</a>
            </div>

            {/* Tabs */}
            {tab === 'inicio' && renderInicio()}
            {tab === 'pedidos' && renderPedidos()}
            {tab === 'carta' && renderCarta()}
            {tab === 'kit' && renderKit()}
            {tab === 'historial' && renderHistorial()}
            {tab === 'perfil' && renderPerfil()}
          </div>
        </div>

        {/* Bottom nav mobile */}
        <nav style={{
          display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0d0d0d', borderTop: `1px solid ${C.border}`,
          justifyContent: 'space-around', padding: '8px 0 12px',
          zIndex: 100,
        }} className="mobile-bottom-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            }}>
              <span style={{ fontSize: 18, opacity: tab === item.id ? 1 : 0.4 }}>{item.emoji}</span>
              <span style={{ fontSize: 9, color: tab === item.id ? C.terra : C.muted, fontWeight: tab === item.id ? 700 : 400 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Modales */}
      {pedidoACalificar && (
        <ModalCalificacion
          pedido={pedidoACalificar}
          usuarioId={usuarioId}
          isDemo={isDemo}
          onToast={toast}
          onDone={() => {
            setPedidos(prev => prev.map(p => p.id === pedidoACalificar!.id ? { ...p, calificado: true } : p))
            setPedidoACalificar(null)
          }}
        />
      )}

      {editandoPerfil && (
        <ModalEditarPerfil
          usuario={usuario}
          usuarioId={usuarioId}
          isDemo={isDemo}
          onClose={() => setEditandoPerfil(false)}
          onToast={toast}
          onUpdate={(updates) => setUsuario(prev => prev ? { ...prev, ...updates } : prev)}
        />
      )}

      {/* Toast */}
      <Toast msgs={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}

export default PortalEmprendedor
