/**
 * PortalEmprendedor.tsx — Dashboard del emprendedor (cafetería)
 * Dark mode Netflix-style con sidebar navigation y CRUD completo
 */
import React, { useEffect, useState } from 'react'
import {
  fetchPedidosByNegocio,
  crearCalificacionCaficultor,
  fetchUsuario,
  updateUsuario,
  confirmarRecepcion,
} from '../service'
import {
  demoFetchPedidosByNegocio,
  demoCrearCalificacionCaficultor,
  demoConfirmarRecepcion,
  demoFetchUsuario,
} from '../demoService'
import { logout } from '../authService'
import { ONE_CONFIG } from '../config'
import type { PedidoONE, UsuarioONE } from '../types'
import MenusEmprendedor from './MenusEmprendedor'
import CatalogoPublico from './CatalogoPublico'
import ChatPedido from './ChatPedido'

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
  if (p.logisticaStatus === 'entregado') return 4
  if (p.recepcionConfirmada) return 3
  if (p.logisticaStatus === 'en_agencia') return 2
  if (p.pagoStatus === 'verificado') return 1
  return 0
}

const STEPS = ['Pendiente', 'Pago verificado', 'En agencia', 'Recibido', 'Calificado ✓']

type Tab = 'catalogo' | 'pedidos' | 'menus' | 'historial' | 'calculadora' | 'guia' | 'perfil'

// ─── Filter bar shared ─────────────────────────────────────────────────────────

const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, padding: '12px 14px', background: '#0d0d0d', borderRadius: 12, border: `1px solid ${C.border}`, alignItems: 'center' }}>
    {children}
  </div>
)

const FilterChip: React.FC<{ label: string; active: boolean; color?: string; onClick: () => void }> = ({ label, active, color, onClick }) => {
  const col = color ?? C.terra
  return (
    <button onClick={onClick} style={{
      padding: '5px 13px', borderRadius: 20, border: `1px solid ${active ? col : C.border}`,
      background: active ? col + '22' : 'none', color: active ? col : C.textSub,
      fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
      fontFamily: 'Montserrat, sans-serif', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder ?? 'Buscar...'}
    style={{
      padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
      background: '#141414', color: C.cream, fontSize: 12,
      fontFamily: 'Montserrat, sans-serif', outline: 'none', width: 200,
    }}
  />
)

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
        negocioId: usuarioId,
        negocioNombre: pedido.negocioNombre,
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
  const emp = usuario?.negocio
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
        negocio: {
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'catalogo',     emoji: '☕', label: 'Catálogo' },
  { id: 'pedidos',      emoji: '📦', label: 'Mis pedidos' },
  { id: 'menus',        emoji: '📋', label: 'Mis menús' },
  { id: 'historial',    emoji: '🕓', label: 'Historial' },
  { id: 'calculadora',  emoji: '📊', label: 'Calculadora' },
  { id: 'guia',         emoji: '☕', label: 'Guía café' },
  { id: 'perfil',       emoji: '⚙️', label: 'Perfil' },
]

const Sidebar: React.FC<{ tab: Tab; onChange: (t: Tab) => void; nombreLocal: string; onLogout: () => void; collapsed?: boolean; onToggle: () => void }> = ({ tab, onChange, nombreLocal, onLogout, collapsed = false, onToggle }) => (
  <nav style={{
    position: 'fixed', left: 0, top: 0, bottom: 0, width: collapsed ? 56 : 220,
    background: '#0d0d0d', borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', zIndex: 100,
    fontFamily: 'Montserrat, sans-serif', transition: 'width 0.2s ease', overflow: 'hidden',
  }}>
    {/* Toggle button */}
    <button onClick={onToggle} style={{
      padding: '8px', background: 'transparent', border: `1px solid ${C.border}`,
      color: C.textSub, borderRadius: 6, cursor: 'pointer',
      width: collapsed ? 40 : '100%', alignSelf: collapsed ? 'center' : undefined,
      margin: collapsed ? '8px auto 0' : '0',
      fontSize: 16, textAlign: 'center',
    }}>
      {collapsed ? '→' : '←'}
    </button>
    {/* Header */}
    {!collapsed && (
      <div style={{ padding: '12px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TUNAY WASI</p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{nombreLocal}</p>
      </div>
    )}
    <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '11px 0' : '11px 20px',
          background: tab === item.id ? C.terra + '18' : 'none',
          border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', textAlign: collapsed ? 'center' : 'left',
        }}>
          <span style={{ fontSize: 16 }}>{item.emoji}</span>
          {!collapsed && <span style={{ fontSize: 13, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub }}>{item.label}</span>}
        </button>
      ))}
    </div>
    {!collapsed && (
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
        <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
          Cerrar sesión
        </button>
      </div>
    )}
    {collapsed && (
      <div style={{ padding: '12px 0', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center' }}>
        <button onClick={onLogout} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px', cursor: 'pointer', fontSize: 14, width: 36, textAlign: 'center' }}>
          ⏻
        </button>
      </div>
    )}
  </nav>
)

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  nombreUsuario: string
  isDemo?: boolean
}

const PortalEmprendedor: React.FC<Props> = ({ usuarioId, nombreUsuario, isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('catalogo')
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [usuario, setUsuario] = useState<UsuarioONE | null>(null)
  const [loading, setLoading] = useState(true)
  const [pedidoACalificar, setPedidoACalificar] = useState<PedidoONE | null>(null)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [accionando, setAccionando] = useState<string | null>(null)

  // Filtros pedidos
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState<'todos' | 'pendiente' | 'voucher_subido' | 'verificado' | 'en_agencia'>('todos')
  const [busquedaPedido, setBusquedaPedido] = useState('')
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoONE | null>(null)

  // Filtros historial
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [historialDesde, setHistorialDesde] = useState('')
  const [historialOrden, setHistorialOrden] = useState<'desc' | 'asc'>('desc')

  // Calculadora rentabilidad
  const [calcKgMes, setCalcKgMes] = useState(5)
  const [calcPrecioKg, setCalcPrecioKg] = useState(18900)
  const [calcPrecioTaza, setCalcPrecioTaza] = useState(1200)
  const [calcGrTaza, setCalcGrTaza] = useState(12)

  // Guía preparaciones
  const [guiaMetodo, setGuiaMetodo] = useState<'espresso' | 'v60' | 'prensa' | 'chemex'>('espresso')

  function toast(text: string, tipo: 'ok' | 'error' | 'info' = 'ok') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, text, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  async function handleConfirmarRecepcion(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      if (isDemo) await demoConfirmarRecepcion(pedidoId)
      else await confirmarRecepcion(pedidoId)
      setPedidos(prev => prev.map(p => p.id === pedidoId
        ? { ...p, logisticaStatus: 'entregado', recepcionConfirmada: true }
        : p
      ))
      toast('¡Pedido recibido! Pasó a tu historial. Ya puedes calificarlo ★', 'ok')
      setTimeout(() => setTab('historial'), 1800)
    } catch {
      toast('Error al confirmar recepción', 'error')
    } finally { setAccionando(null) }
  }

  useEffect(() => {
    async function cargar() {
      try {
        const data = await (isDemo ? demoFetchPedidosByNegocio(usuarioId) : fetchPedidosByNegocio(usuarioId))
        setPedidos(data)

        try {
          const u = isDemo ? await demoFetchUsuario(usuarioId) : await fetchUsuario(usuarioId)
          setUsuario(u)
        } catch { /* ok */ }

        const sinCalificar = data.find(p => p.logisticaStatus === 'entregado' && !p.calificado && p.recepcionConfirmada)
        if (sinCalificar) setPedidoACalificar(sinCalificar)

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
  const nombreLocal = usuario?.negocio?.nombreLocal ?? pedidos[0]?.nombreLocal ?? nombreUsuario
  const distritoLocal = usuario?.negocio?.distritoLocal ?? pedidos[0]?.distritoLocal ?? ''

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

  function renderCatalogo() {
    return <CatalogoPublico isDemo={isDemo} sidebarOffset={sidebarCollapsed ? 56 : 220} />
  }

  function renderPedidos() {
    const countPend = pedidos.filter(p => p.pagoStatus === 'pendiente').length
    const countVoucher = pedidos.filter(p => p.pagoStatus === 'voucher_subido').length
    const countVerif = pedidos.filter(p => p.pagoStatus === 'verificado' && p.logisticaStatus === 'preparando').length
    const countCamino = pedidos.filter(p => p.logisticaStatus === 'en_agencia').length

    const filtrados = pedidosActivos.filter(p => {
      if (filtroPedidoEstado === 'pendiente') return p.pagoStatus === 'pendiente'
      if (filtroPedidoEstado === 'voucher_subido') return p.pagoStatus === 'voucher_subido'
      if (filtroPedidoEstado === 'verificado') return p.pagoStatus === 'verificado' && p.logisticaStatus === 'preparando'
      if (filtroPedidoEstado === 'en_agencia') return p.logisticaStatus === 'en_agencia'
      return true
    }).filter(p => !busquedaPedido || p.id.toLowerCase().includes(busquedaPedido.toLowerCase()))

    return (
      <div>
        <FilterBar>
          <SearchInput value={busquedaPedido} onChange={setBusquedaPedido} placeholder="Buscar por ID de pedido..." />
          <FilterChip label={`Todos (${pedidosActivos.length})`} active={filtroPedidoEstado === 'todos'} onClick={() => setFiltroPedidoEstado('todos')} />
          <FilterChip label={`Sin pago (${countPend})`} color={C.yellow} active={filtroPedidoEstado === 'pendiente'} onClick={() => setFiltroPedidoEstado('pendiente')} />
          <FilterChip label={`Voucher enviado (${countVoucher})`} color={C.yellow} active={filtroPedidoEstado === 'voucher_subido'} onClick={() => setFiltroPedidoEstado('voucher_subido')} />
          <FilterChip label={`Verificado (${countVerif})`} color={C.sage} active={filtroPedidoEstado === 'verificado'} onClick={() => setFiltroPedidoEstado('verificado')} />
          <FilterChip label={`En agencia (${countCamino})`} color={C.blue} active={filtroPedidoEstado === 'en_agencia'} onClick={() => setFiltroPedidoEstado('en_agencia')} />
        </FilterBar>

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            {pedidosActivos.length === 0 ? (
              <>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📦</p>
                <p style={{ fontSize: 16, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Sin pedidos activos</p>
                <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>Cuando realices un pedido aparecerá aquí</p>
                <a href="#/" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: C.terra, color: C.white, textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Ver catálogo →</a>
              </>
            ) : (
              <p style={{ fontSize: 13, color: C.textSub }}>Sin pedidos con este filtro</p>
            )}
          </div>
        ) : (
          <div className="grid-pedidos-emp">
            {filtrados.map(pedido => {
              const statusColor = pedido.pagoStatus === 'pendiente' ? C.yellow
                : pedido.pagoStatus === 'voucher_subido' ? C.yellow
                : pedido.logisticaStatus === 'en_agencia' ? C.blue : C.sage
              const statusLabel = pedido.pagoStatus === 'pendiente' ? '⏳ Sin pago'
                : pedido.pagoStatus === 'voucher_subido' ? '🔎 Verificando pago'
                : pedido.pagoStatus === 'rechazado' ? '✕ Rechazado'
                : pedido.logisticaStatus === 'en_agencia' ? '🚚 En agencia'
                : '✓ Pago OK — preparando'

              return (
                <div key={pedido.id} style={{
                  background: C.card, borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${statusColor}33`,
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Cabecera coloreada */}
                  <div style={{ padding: '10px 14px', background: statusColor + '11', borderBottom: `1px solid ${statusColor}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, padding: '2px 8px', borderRadius: 10, background: statusColor + '22', border: `1px solid ${statusColor}44` }}>
                      {statusLabel}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.terra }}>{formatCents(pedido.totalCents)}</span>
                  </div>

                  {/* Contenido */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <p style={{ margin: '0 0 1px', fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>{pedido.id}</p>
                      <p style={{ margin: '0 0 2px', fontSize: 11, color: C.textSub }}>{formatFecha(pedido.createdAt)}</p>
                    </div>

                    {/* Items compactos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {pedido.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: C.bg, borderRadius: 6 }}>
                          <div>
                            <p style={{ margin: '0 0 1px', fontSize: 12, fontWeight: 600, color: C.cream }}>{item.productoNombre}</p>
                            <p style={{ margin: 0, fontSize: 10, color: C.textSub }}>{item.qty}×{item.presentacion} · {item.caficultorNombre}</p>
                          </div>
                          <span style={{ fontSize: 11, color: C.terra, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{formatCents(item.subtotalCents)}</span>
                        </div>
                      ))}
                    </div>

                    {pedido.logisticaStatus === 'en_agencia' && pedido.codigoAgencia && (
                      <p style={{ margin: 0, fontSize: 11, color: C.blue, fontWeight: 600 }}>
                        📦 {pedido.agencia?.toUpperCase()} · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{pedido.codigoAgencia}</span>
                      </p>
                    )}

                    <StepperPedido pedido={pedido} />

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      <button
                        onClick={() => setPedidoDetalle(pedido)}
                        style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Ver detalle
                      </button>
                      {pedido.pagoStatus === 'pendiente' && (
                        <a href="#/" style={{ flex: 2, padding: '7px', borderRadius: 6, border: 'none', background: C.yellow, color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>
                          Subir voucher →
                        </a>
                      )}
                      {pedido.logisticaStatus === 'en_agencia' && (
                        <button
                          onClick={() => handleConfirmarRecepcion(pedido.id)}
                          disabled={accionando === pedido.id}
                          style={{ flex: 2, padding: '7px', borderRadius: 6, border: 'none', background: C.sage, color: '#000', fontSize: 11, fontWeight: 700, cursor: accionando === pedido.id ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {accionando === pedido.id ? '...' : '✓ Confirmar recepción'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Drawer detalle pedido */}
        {pedidoDetalle && (() => {
          const p = pedidoDetalle
          const isAgencia = p.logisticaStatus === 'en_agencia'
          const pagoOk = p.pagoStatus === 'verificado'
          const statusColor = p.pagoStatus === 'pendiente' ? C.yellow
            : p.pagoStatus === 'voucher_subido' ? C.yellow
            : isAgencia ? C.blue : C.sage

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex' }} onClick={() => setPedidoDetalle(null)}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)' }} />
              <div
                style={{ width: 'min(480px, 100vw)', background: C.card, borderLeft: `1px solid ${C.border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>{p.id}</p>
                    <h2 style={{ margin: '0 0 2px', fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>{p.nombreLocal}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>{p.distritoLocal} · {formatFecha(p.createdAt)}</p>
                  </div>
                  <button onClick={() => setPedidoDetalle(null)} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 22, cursor: 'pointer', padding: '0 0 0 16px', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Stepper */}
                  <StepperPedido pedido={p} />

                  {/* Estado pago */}
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: statusColor + '11', border: `1px solid ${statusColor}33` }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: statusColor }}>
                      {p.pagoStatus === 'pendiente' ? '⏳ Pago pendiente'
                        : p.pagoStatus === 'voucher_subido' ? '🔎 Voucher enviado — verificando'
                        : p.pagoStatus === 'rechazado' ? '✕ Pago rechazado'
                        : pagoOk ? '✓ Pago verificado'
                        : '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>
                      Método: {p.metodoPago?.toUpperCase() ?? '—'}
                      {p.voucherUrl ? <> · <a href={p.voucherUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.terra }}>Ver voucher →</a></> : null}
                    </p>
                  </div>

                  {/* Items */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Productos</p>
                    {p.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: C.bg, borderRadius: 8, marginBottom: 6 }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>{item.productoNombre}</p>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: C.textSub }}>{item.qty} × {item.presentacion}</span>
                            <a href={`#/caficultor/${item.caficultorId}`} style={{ fontSize: 11, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>{item.caficultorNombre} →</a>
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.terra, flexShrink: 0, marginLeft: 12 }}>{formatCents(item.subtotalCents)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: C.textSub }}>Envío</span>
                      <span style={{ fontSize: 12, color: C.textSub }}>{formatCents(p.deliveryCents)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.cream }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: C.terra }}>{formatCents(p.totalCents)}</span>
                    </div>
                  </div>

                  {/* Dirección */}
                  {p.direccionEntrega && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dirección de entrega</p>
                      <p style={{ margin: 0, fontSize: 13, color: C.cream, padding: '10px 12px', background: C.bg, borderRadius: 8 }}>📍 {p.direccionEntrega}</p>
                    </div>
                  )}

                  {/* Chat con el caficultor */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Chat con el caficultor
                    </p>
                    <ChatPedido
                      pedidoId={p.id}
                      usuarioId={usuarioId}
                      usuarioNombre={p.negocioNombre}
                      usuarioRol="negocio"
                      isDemo={isDemo}
                      codigoTracking={p.codigoAgencia}
                    />
                  </div>

                  {/* Código agencia */}
                  {isAgencia && p.codigoAgencia && (
                    <div style={{ padding: '12px 14px', background: C.blue + '11', border: `1px solid ${C.blue}33`, borderRadius: 10 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.blue }}>🚚 En agencia {p.agencia?.toUpperCase()}</p>
                      <p style={{ margin: 0, fontSize: 14, color: C.cream, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{p.codigoAgencia}</p>
                    </div>
                  )}

                  {/* Pago rechazado */}
                  {p.pagoStatus === 'rechazado' && (
                    <a href={`https://wa.me/${ONE_CONFIG.ADMIN_WHATSAPP.replace(/\s/g, '')}?text=Hola, mi pedido ${p.id} fue rechazado`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: C.red + '18', border: `1px solid ${C.red}44`, textDecoration: 'none' }}>
                      <span>💬</span>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.red }}>Contactar soporte →</p>
                    </a>
                  )}
                </div>

                {/* Footer acción */}
                {(p.pagoStatus === 'pendiente' || isAgencia) && (
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                    {p.pagoStatus === 'pendiente' && (
                      <a href="#/" style={{ display: 'block', padding: '14px', borderRadius: 10, background: C.yellow, color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}
                        onClick={() => setPedidoDetalle(null)}>
                        Subir comprobante de pago →
                      </a>
                    )}
                    {isAgencia && (
                      <button
                        onClick={() => { setPedidoDetalle(null); handleConfirmarRecepcion(p.id) }}
                        disabled={accionando === p.id}
                        style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: C.sage, color: '#000', fontSize: 14, fontWeight: 700, cursor: accionando === p.id ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {accionando === p.id ? 'Procesando...' : '✓ Confirmar que recibí el pedido'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  function renderHistorial() {
    let histFiltrado = [...historial]
    if (busquedaHistorial) {
      histFiltrado = histFiltrado.filter(p =>
        p.items.some(i => i.productoNombre.toLowerCase().includes(busquedaHistorial.toLowerCase()) || i.caficultorNombre.toLowerCase().includes(busquedaHistorial.toLowerCase())) ||
        p.id.includes(busquedaHistorial)
      )
    }
    if (historialDesde) {
      const desde = new Date(historialDesde).getTime()
      histFiltrado = histFiltrado.filter(p => new Date(p.updatedAt).getTime() >= desde)
    }
    histFiltrado.sort((a, b) => {
      const diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return historialOrden === 'desc' ? -diff : diff
    })

    const totalFiltrado = histFiltrado.reduce((s, p) => s + p.totalCents, 0)
    const sinCalificar = histFiltrado.filter(p => !p.calificado).length

    return (
      <div>
        {/* Resumen */}
        {historial.length > 0 && (
          <div className="grid-kpis-3" style={{ marginBottom: 16 }}>
            {[
              { label: 'Entregas', value: String(historial.length), color: C.sage },
              { label: histFiltrado.length < historial.length ? 'Total filtrado' : 'Total invertido', value: formatCents(totalFiltrado), color: C.terra },
              { label: 'Por calificar', value: String(sinCalificar), color: sinCalificar > 0 ? C.yellow : C.muted },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.card, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <p style={{ margin: '0 0 3px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <FilterBar>
          <SearchInput value={busquedaHistorial} onChange={setBusquedaHistorial} placeholder="Buscar producto o caficultor..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: C.textSub }}>Desde:</label>
            <input type="date" value={historialDesde} onChange={e => setHistorialDesde(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#141414', color: C.cream, fontSize: 12, fontFamily: 'Montserrat, sans-serif', outline: 'none' }}
            />
          </div>
          {historialDesde && (
            <button onClick={() => setHistorialDesde('')} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>✕</button>
          )}
          <button onClick={() => setHistorialOrden(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>
            {historialOrden === 'desc' ? '↓ Recientes' : '↑ Antiguos'}
          </button>
        </FilterBar>

        {historial.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📦</p>
            <p style={{ fontSize: 16, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Aún no tienes entregas</p>
            <p style={{ fontSize: 13, color: C.textSub }}>Las entregas completadas aparecerán aquí</p>
          </div>
        ) : histFiltrado.length === 0 ? (
          <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Sin resultados para estos filtros</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {histFiltrado.map(p => (
              <div key={p.id} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>
                      {p.items.map(i => i.caficultorNombre).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{p.id} · {formatFecha(p.updatedAt)}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 11, color: C.sage, fontWeight: 700, display: 'block', marginBottom: 2 }}>✓ Entregado</span>
                    <span style={{ fontSize: 15, color: C.terra, fontWeight: 700 }}>{formatCents(p.totalCents)}</span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {p.items.map((item, i) => (
                    <span key={i} style={{ fontSize: 10, color: C.textSub, padding: '3px 8px', background: C.bg, borderRadius: 6, border: `1px solid ${C.border}` }}>
                      {item.productoNombre} · {item.qty}×{item.presentacion}
                    </span>
                  ))}
                </div>

                {/* Calificación */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {p.calificado ? (
                    <span style={{ fontSize: 11, color: C.sage }}>★ Calificado — gracias por tu reseña</span>
                  ) : !p.recepcionConfirmada ? (
                    <span style={{ fontSize: 11, color: C.muted }}>Confirma la recepción para calificar</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>Sin calificar aún</span>
                      <button onClick={() => setPedidoACalificar(p)} style={{
                        padding: '4px 12px', borderRadius: 6,
                        border: `1px solid ${C.terra}`, background: 'none',
                        fontSize: 11, fontWeight: 700, color: C.terra, cursor: 'pointer',
                      }}>★ Calificar</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderPerfil() {
    const emp = usuario?.negocio ?? {
      nombreLocal: pedidos[0]?.nombreLocal ?? nombreUsuario,
      distritoLocal: pedidos[0]?.distritoLocal ?? '',
      etapa: 'abierto' as const,
      pedidoIds: [],
    }
    const etapaColor = emp.etapa === 'abierto' ? C.sage : C.yellow
    const etapaLabel = emp.etapa === 'abierto' ? '● Abierto' : emp.etapa === 'proxima_apertura' ? '◐ Próxima apertura' : '○ Planificando'

    return (
      <div>
        {/* Foto del local */}
        {emp.fotoLocal && (
          <div style={{ width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: `1px solid ${C.border}` }}>
            <img src={emp.fotoLocal} alt={emp.nombreLocal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Info principal */}
        <div style={{ background: C.card, borderRadius: 16, padding: '20px', marginBottom: 14, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{emp.nombreLocal}</h2>
              {emp.distritoLocal && <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>{emp.distritoLocal} · Lima</p>}
              {emp.scoreConfianza && emp.totalCalificaciones ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <span style={{ color: '#f39c12', fontSize: 14 }}>
                    {'★'.repeat(Math.round(emp.scoreConfianza))}{'☆'.repeat(5 - Math.round(emp.scoreConfianza))}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.cream }}>{emp.scoreConfianza.toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: C.textSub }}>· {emp.totalCalificaciones} reseñas de clientes</span>
                </div>
              ) : null}
            </div>
            <button onClick={() => setEditandoPerfil(true)} style={{ fontSize: 12, color: C.terra, background: 'none', border: `1px solid ${C.terra}44`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flexShrink: 0 }}>Editar</button>
          </div>

          {emp.descripcion && <p style={{ margin: '0 0 14px', fontSize: 13, color: C.creamMuted, lineHeight: 1.6 }}>{emp.descripcion}</p>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: etapaColor + '22', color: etapaColor, fontWeight: 700, border: `1px solid ${etapaColor}44` }}>
              {etapaLabel}
            </span>
            {emp.etapa === 'abierto' && (
              <a href={`#/cafeteria/${usuarioId === 'demo-user' ? 'user-emprendedor-001' : usuarioId}`}
                style={{ fontSize: 12, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>
                Ver perfil público →
              </a>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid-kpis-3" style={{ marginBottom: 14 }}>
          {[
            { label: 'Pedidos totales', value: String(pedidos.length) },
            { label: 'Entregas recibidas', value: String(historial.length) },
            { label: 'Calificaciones', value: String(historial.filter(p => p.calificado).length) },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.card, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Mis reseñas a caficultores */}
        {historial.length > 0 && (
          <div style={{ background: C.card, borderRadius: 14, padding: '18px', marginBottom: 14, border: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ★ Mis calificaciones a caficultores
            </p>
            {historial.filter(p => p.calificado).length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>Aún no has calificado ningún pedido. Hazlo desde el Historial.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historial.filter(p => p.calificado).map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: C.bg, borderRadius: 8 }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>
                        {p.items.map(i => i.caficultorNombre).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>
                        {p.items.map(i => i.productoNombre).join(' · ')} · {p.id}
                      </p>
                    </div>
                    <span style={{ color: C.yellow, fontSize: 14, flexShrink: 0 }}>★ Calificado</span>
                  </div>
                ))}
                {historial.filter(p => !p.calificado && p.recepcionConfirmada).length > 0 && (
                  <div style={{ padding: '10px 12px', background: C.yellow + '11', borderRadius: 8, border: `1px solid ${C.yellow}33` }}>
                    <p style={{ margin: 0, fontSize: 12, color: C.yellow }}>
                      Tienes {historial.filter(p => !p.calificado && p.recepcionConfirmada).length} entrega(s) sin calificar —{' '}
                      <button onClick={() => setTab('historial')} style={{ background: 'none', border: 'none', color: C.terra, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                        ir al historial →
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ayuda */}
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>¿Necesitas ayuda?</p>
          <a href={`https://wa.me/${ONE_CONFIG.ADMIN_WHATSAPP.replace(/\s/g, '')}?text=Hola, soy ${emp.nombreLocal} y necesito ayuda con mi portal`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#25D36622', border: `1px solid #25D36644`, textDecoration: 'none' }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream }}>Hablar con el equipo</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub }}>WhatsApp directo con TunayWasi</p>
            </div>
          </a>
        </div>
      </div>
    )
  }

  // ─── Calculadora de rentabilidad ─────────────────────────────────────────────

  function renderCalculadora() {
    const kgMes = calcKgMes
    const precioKg = calcPrecioKg
    const precioTaza = calcPrecioTaza
    const grTaza = calcGrTaza

    const tazasPorKg = Math.floor(1000 / grTaza)
    const tazasMes = tazasPorKg * kgMes
    const ingresoBruto = tazasMes * precioTaza
    const costoCafe = kgMes * precioKg
    const ganancia = ingresoBruto - costoCafe
    const margen = ingresoBruto > 0 ? Math.round((ganancia / ingresoBruto) * 100) : 0
    const kgParaPuntoCero = precioTaza * tazasPorKg > 0 ? costoCafe / (precioTaza * tazasPorKg) : 0

    function SliderRow({ label, sub, value, min, max, step, format, onChange }: {
      label: string; sub: string; value: number; min: number; max: number; step: number
      format: (v: number) => string; onChange: (v: number) => void
    }) {
      return (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.cream }}>{label}</span>
              <span style={{ fontSize: 11, color: C.textSub, marginLeft: 8 }}>{sub}</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif' }}>{format(value)}</span>
          </div>
          <input type="range" min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: C.terra, height: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
            <span style={{ fontSize: 10, color: C.muted }}>{format(min)}</span>
            <span style={{ fontSize: 10, color: C.muted }}>{format(max)}</span>
          </div>
        </div>
      )
    }

    return (
      <div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: C.textSub }}>
          Ajusta los parámetros de tu cafetería para ver la rentabilidad estimada.
        </p>
        <div className="grid-calc">
          {/* Sliders */}
          <div style={{ background: C.card, borderRadius: 14, padding: '24px 20px', border: `1px solid ${C.border}` }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: C.cream }}>Parámetros de tu negocio</h3>
            <SliderRow label="Café / mes" sub="kilogramos" value={kgMes} min={1} max={30} step={0.5}
              format={v => `${v} kg`} onChange={setCalcKgMes} />
            <SliderRow label="Precio del café" sub="por kg (S/)" value={precioKg} min={12000} max={35000} step={500}
              format={v => `S/ ${Math.round(v/100)}`} onChange={setCalcPrecioKg} />
            <SliderRow label="Precio por taza" sub="lo que cobras" value={precioTaza} min={500} max={2500} step={50}
              format={v => `S/ ${(v/100).toFixed(0)}`} onChange={setCalcPrecioTaza} />
            <SliderRow label="Gramos por taza" sub="extracción" value={grTaza} min={8} max={22} step={1}
              format={v => `${v} g`} onChange={setCalcGrTaza} />
          </div>

          {/* Resultados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Tazas al mes', value: tazasMes.toLocaleString(), sub: `${tazasPorKg} tazas/kg`, color: C.cream },
              { label: 'Ingreso bruto', value: `S/ ${Math.round(ingresoBruto/100).toLocaleString()}`, sub: 'ventas de café', color: C.sage },
              { label: 'Costo del café', value: `S/ ${Math.round(costoCafe/100).toLocaleString()}`, sub: `${kgMes} kg × S/ ${Math.round(precioKg/100)}`, color: C.terra },
              { label: 'Ganancia neta', value: `S/ ${Math.round(ganancia/100).toLocaleString()}`, sub: `margen ${margen}%`, color: ganancia > 0 ? '#4caf50' : C.red },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ background: C.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{sub}</p>
                </div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', color }}>{value}</p>
              </div>
            ))}
            <div style={{ background: `${C.terra}11`, border: `1px solid ${C.terra}44`, borderRadius: 12, padding: '14px 18px' }}>
              <p style={{ margin: 0, fontSize: 12, color: C.terra, fontWeight: 700 }}>
                Punto de equilibrio: {kgParaPuntoCero.toFixed(1)} kg
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textSub }}>
                Necesitas vender {Math.ceil(kgParaPuntoCero * tazasPorKg)} tazas para cubrir el café de este mes
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Guía de preparaciones ────────────────────────────────────────────────────

  function renderGuia() {
    const metodo = guiaMetodo

    const METODOS = [
      { id: 'espresso' as const, label: 'Espresso', emoji: '☕' },
      { id: 'v60'      as const, label: 'V60',      emoji: '▽' },
      { id: 'prensa'   as const, label: 'Prensa',   emoji: '⬇' },
      { id: 'chemex'   as const, label: 'Chemex',   emoji: '⌛' },
    ]

    const FICHAS: Record<typeof metodo, {
      ratio: string; agua: string; tiempo: string; temperatura: string; molido: string
      pasos: string[]; tazasKg: number; precioSugerido: number
    }> = {
      espresso: {
        ratio: '1:2', agua: '36 ml', tiempo: '25–30 s', temperatura: '92–94 °C', molido: 'Fino',
        pasos: [
          'Muele 18 g en fino. Distribuye parejo en el portafiltro.',
          'Tampa con 15–20 kg de presión.',
          'Pre-infusión 5 s a baja presión.',
          'Extrae 36 ml en 25–30 s.',
          'Control visual: flujo miel dorada uniforme.',
        ],
        tazasKg: 55, precioSugerido: 1200,
      },
      v60: {
        ratio: '1:15', agua: '300 ml', tiempo: '3:00–3:30 min', temperatura: '93–96 °C', molido: 'Medio–grueso',
        pasos: [
          'Muele 20 g en medio–grueso. Pre-humedece el filtro.',
          'Bloom: vierte 40 ml, espera 45 s.',
          'Vierte en espiral hasta 200 ml (1:30 min).',
          'Termina con 300 ml en versiones lentas, uniforme.',
          'Tiempo total: 3:00–3:30 min.',
        ],
        tazasKg: 50, precioSugerido: 1000,
      },
      prensa: {
        ratio: '1:12', agua: '480 ml', tiempo: '4:00 min', temperatura: '96 °C', molido: 'Grueso',
        pasos: [
          'Muele 40 g grueso. Precalienta la prensa.',
          'Vierte 480 ml de agua a 96 °C.',
          'Revuelve suavemente 10 s.',
          'Tapa sin presionar. Espera 4 minutos.',
          'Presiona lento (20 s) hasta el fondo.',
        ],
        tazasKg: 25, precioSugerido: 900,
      },
      chemex: {
        ratio: '1:16', agua: '480 ml', tiempo: '3:30–4:00 min', temperatura: '94–96 °C', molido: 'Medio',
        pasos: [
          'Muele 30 g en medio. Pre-humedece el filtro grueso.',
          'Bloom: 60 ml, espera 45 s.',
          'Vierte en espiral continua hasta 480 ml.',
          'Controla que gotee parejo, sin corrientes fuertes.',
          'Tiempo total: 3:30–4:00 min.',
        ],
        tazasKg: 33, precioSugerido: 1000,
      },
    }

    const ficha = FICHAS[metodo]
    const rentTaza = ficha.precioSugerido
    const costoCafeTaza = Math.round(18900 / ficha.tazasKg)
    const margenTaza = rentTaza - costoCafeTaza
    const margenPct = Math.round((margenTaza / rentTaza) * 100)

    return (
      <div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: C.textSub }}>
          Fichas técnicas por método de extracción con rentabilidad estimada para tu carta.
        </p>

        {/* Selector método */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {METODOS.map(m => (
            <button key={m.id} onClick={() => setGuiaMetodo(m.id)} style={{
              padding: '9px 18px', borderRadius: 20,
              background: metodo === m.id ? C.terra : 'transparent',
              border: `1px solid ${metodo === m.id ? C.terra : C.border}`,
              color: metodo === m.id ? C.white : C.textSub,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
            }}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>

        <div className="grid-guia">
          {/* Ficha técnica + pasos */}
          <div>
            <div style={{ background: C.card, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.cream }}>Parámetros técnicos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Ratio', value: ficha.ratio },
                  { label: 'Agua', value: ficha.agua },
                  { label: 'Tiempo', value: ficha.tiempo },
                  { label: 'Temperatura', value: ficha.temperatura },
                  { label: 'Molido', value: ficha.molido },
                  { label: 'Tazas/kg', value: `~${ficha.tazasKg}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#0d0d0d', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ margin: 0, fontSize: 10, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 700, color: C.cream }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.card, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: C.cream }}>Pasos de extracción</h3>
              {ficha.pasos.map((paso, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < ficha.pasos.length - 1 ? 12 : 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.terra, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{i + 1}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{paso}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rentabilidad */}
          <div style={{ background: C.card, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.cream }}>Rentabilidad por taza</h3>
            {[
              { label: 'Precio sugerido', value: `S/ ${(rentTaza/100).toFixed(0)}`, color: C.sage },
              { label: 'Costo café', value: `S/ ${(costoCafeTaza/100).toFixed(2)}`, color: C.terra },
              { label: 'Ganancia/taza', value: `S/ ${(margenTaza/100).toFixed(2)}`, color: '#4caf50' },
              { label: 'Margen', value: `${margenPct}%`, color: C.cream },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.textSub }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '12px', background: `${C.sage}11`, borderRadius: 8, border: `1px solid ${C.sage}33` }}>
              <p style={{ margin: 0, fontSize: 12, color: C.sage, fontWeight: 600 }}>
                A {ficha.tazasKg} tazas/kg con café Tunay Wasi (S/ 189/kg)
              </p>
            </div>

            <div style={{ marginTop: 20 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: C.cream }}>Precios sugeridos para tu carta</h4>
              {[
                { size: 'Pequeño', ml: metodo === 'espresso' ? '30 ml' : '150 ml', precio: Math.round(rentTaza * 0.8) },
                { size: 'Estándar', ml: metodo === 'espresso' ? '60 ml' : '250 ml', precio: rentTaza },
                { size: 'Grande',   ml: metodo === 'espresso' ? '90 ml' : '350 ml', precio: Math.round(rentTaza * 1.3) },
              ].map(({ size, ml, precio }) => (
                <div key={size} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize: 13, color: C.cream, fontWeight: 600 }}>{size}</span>
                    <span style={{ fontSize: 11, color: C.textSub, marginLeft: 8 }}>{ml}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.terra }}>S/ {(precio/100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* ── Sidebar / main ── */
        @media (max-width: 700px) {
          .sidebar-desktop { display: none !important; }
          .mobile-header   { display: flex !important; }
          .main-content    { margin-left: 0 !important; }
          .emp-bottom-nav  { display: flex !important; }
        }
        @media (min-width: 701px) {
          .sidebar-desktop { display: flex !important; }
          .mobile-header   { display: none !important; }
          .main-content    { margin-left: ${sidebarCollapsed ? 56 : 220}px !important; }
        }

        /* ── Grids responsive ── */

        /* KPIs inicio: 4 col desktop, 2×2 tablet/mobile */
        .grid-kpis-emp { display: grid; gap: 10px; }
        @media (min-width: 701px)  { .grid-kpis-emp { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 700px)  { .grid-kpis-emp { grid-template-columns: repeat(2, 1fr); } }

        /* KPIs historial/perfil (3 col): 3 col desktop, 3 col tablet, 1 col mobile */
        .grid-kpis-3 { display: grid; gap: 10px; }
        @media (min-width: 480px)  { .grid-kpis-3 { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 479px)  { .grid-kpis-3 { grid-template-columns: repeat(2, 1fr); } }

        /* Pedidos activos: 2 col en desktop ancho, 1 col resto */
        .grid-pedidos-emp { display: grid; gap: 14px; }
        @media (min-width: 1000px) { .grid-pedidos-emp { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 701px) and (max-width: 999px) { .grid-pedidos-emp { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px)  { .grid-pedidos-emp { grid-template-columns: 1fr; } }

        /* Calculadora: 2 col desktop, 1 col mobile */
        .grid-calc { display: grid; gap: 20px; align-items: start; }
        @media (min-width: 800px) { .grid-calc { grid-template-columns: 1fr minmax(240px,360px); } }
        @media (max-width: 799px) { .grid-calc { grid-template-columns: 1fr; } }

        /* Guía: 2 col desktop, 1 col mobile */
        .grid-guia { display: grid; gap: 20px; align-items: start; }
        @media (min-width: 800px) { .grid-guia { grid-template-columns: 1fr minmax(200px,320px); } }
        @media (max-width: 799px) { .grid-guia { grid-template-columns: 1fr; } }
      `}</style>

      {/* Sidebar desktop */}
      <div className="sidebar-desktop" style={{ display: 'none' }}>
        <Sidebar tab={tab} onChange={setTab} nombreLocal={nombreLocal} onLogout={logout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
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
      <div className="main-content" style={{ flex: 1, marginLeft: sidebarCollapsed ? 56 : 220, minHeight: '100vh' }}>
        {tab === 'catalogo' ? (
          renderCatalogo()
        ) : (
        <div style={{ padding: '16px 24px 40px', paddingTop: 'clamp(60px, 8vw, 16px)' }}>
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
          {tab === 'pedidos' && renderPedidos()}
          {tab === 'menus' && (
            <MenusEmprendedor
              usuarioId={usuarioId}
              isDemo={isDemo}
              onPedirReposicion={(menuId, cafesIds) => {
                sessionStorage.setItem('one_reposicion', JSON.stringify({ menuId, cafesIds }))
                window.location.hash = '#/checkout'
              }}
            />
          )}
          {tab === 'historial' && renderHistorial()}
          {tab === 'calculadora' && renderCalculadora()}
          {tab === 'guia' && renderGuia()}
          {tab === 'perfil' && renderPerfil()}
        </div>
        )}

        {/* Bottom nav mobile */}
        <nav style={{
          display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0d0d0d', borderTop: `1px solid ${C.border}`,
          overflowX: 'auto', padding: '8px 8px 12px',
          zIndex: 100, gap: 0,
        }} className="emp-bottom-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px',
              flexShrink: 0,
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
