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
import { ONE_CONFIG, calcularPrecioFinal } from '../config'
import type { PedidoONE, UsuarioONE, FormatoONE } from '../types'
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

type Tab = 'catalogo' | 'mis_compras' | 'carrito' | 'perfil'
type SubTab = 'pedidos' | 'mensajes' | 'resenias'

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
  { id: 'catalogo',    emoji: '☕', label: 'Catálogo' },
  { id: 'mis_compras', emoji: '📦', label: 'Mis Compras' },
  { id: 'carrito',     emoji: '🛒', label: 'Carrito' },
  { id: 'perfil',      emoji: '⚙️', label: 'Perfil' },
]

const Sidebar: React.FC<{ tab: Tab; onChange: (t: Tab) => void; nombreLocal: string; onLogout: () => void; collapsed?: boolean; onToggle: () => void; pedidosPendientes?: number; carritoCount?: number }> = ({ tab, onChange, nombreLocal, onLogout, collapsed = false, onToggle, pedidosPendientes = 0, carritoCount = 0 }) => (
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
      {NAV_ITEMS.map(item => {
        const badge = item.id === 'mis_compras' ? pedidosPendientes : item.id === 'carrito' ? carritoCount : 0
        return (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '11px 0' : '11px 20px',
            background: tab === item.id ? C.terra + '18' : 'none',
            border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s', textAlign: collapsed ? 'center' : 'left',
            position: 'relative',
          }}>
            <span style={{ fontSize: 16 }}>{item.emoji}</span>
            {!collapsed && <span style={{ fontSize: 13, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub }}>{item.label}</span>}
            {badge > 0 && (
              <span style={{
                marginLeft: collapsed ? 0 : 'auto',
                position: collapsed ? 'absolute' : 'static',
                top: collapsed ? 6 : undefined, right: collapsed ? 6 : undefined,
                padding: '1px 6px', borderRadius: 10,
                background: item.id === 'carrito' ? C.terra : C.yellow,
                color: item.id === 'carrito' ? '#fff' : '#000',
                fontSize: 10, fontWeight: 700, lineHeight: '16px',
                minWidth: 16, textAlign: 'center',
              }}>{badge}</span>
            )}
          </button>
        )
      })}
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

// ─── Carrito local (sincronizado con localStorage) ───────────────────────────

interface ItemCarritoLocal {
  producto: { id: string; nombre: string; precioBaseKgCents: number }
  formato: FormatoONE
  qty: number
}

const CARRITO_KEY = 'one_carrito_items'

function leerCarrito(): ItemCarritoLocal[] {
  try {
    const s = localStorage.getItem(CARRITO_KEY)
    if (s) return JSON.parse(s) as ItemCarritoLocal[]
  } catch { /* ok */ }
  return []
}

function guardarCarrito(items: ItemCarritoLocal[]) {
  try {
    if (items.length > 0) localStorage.setItem(CARRITO_KEY, JSON.stringify(items))
    else localStorage.removeItem(CARRITO_KEY)
  } catch { /* ok */ }
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  nombreUsuario: string
  isDemo?: boolean
}

// ─── MensajesTab — subcomponente para evitar hooks en función normal ──────────
const MensajesTab: React.FC<{
  pedidos: import('../types').PedidoONE[]
  C: Record<string, string>
  setPedidoDetalle: (p: import('../types').PedidoONE | null) => void
}> = ({ pedidos, C, setPedidoDetalle }) => {
  const [catMensajes, setCatMensajes] = React.useState<'pedidos' | 'promos'>('pedidos')

  type EventoNotif = {
    pedidoId: string; orderId: string; titulo: string; descripcion: string
    fotoUrl: string; timestamp: number; accion: string | null
  }

  function generarEventos(p: import('../types').PedidoONE): EventoNotif[] {
    const foto = (p.items[0] as any)?.fotoUrl ?? ''
    const ts = new Date(p.createdAt).getTime() || Date.now()
    if (p.logisticaStatus === 'entregado')
      return [{ pedidoId: p.id, orderId: p.id, titulo: '✅ Pedido entregado', descripcion: 'Tu pedido fue entregado. ¡Esperamos que disfrutes el café!', fotoUrl: foto, timestamp: ts, accion: 'Ver pedido' }]
    if (p.logisticaStatus === 'en_agencia')
      return [{ pedidoId: p.id, orderId: p.id, titulo: '📦 Pedido en camino', descripcion: 'El caficultor envió tu pedido. Confirma la recepción cuando llegue.', fotoUrl: foto, timestamp: ts, accion: 'Confirmar recepción' }]
    if (['verificado', 'confirmado_auto', 'confirmado_manual'].includes(p.pagoStatus))
      return [{ pedidoId: p.id, orderId: p.id, titulo: '✓ Pago confirmado', descripcion: 'Tu pago fue verificado. El caficultor está preparando tu pedido.', fotoUrl: foto, timestamp: ts, accion: 'Ver pedido' }]
    if (p.pagoStatus === 'voucher_subido')
      return [{ pedidoId: p.id, orderId: p.id, titulo: '⏳ Verificando pago', descripcion: 'Recibimos tu voucher. Estamos verificando el pago.', fotoUrl: foto, timestamp: ts, accion: null }]
    return [{ pedidoId: p.id, orderId: p.id, titulo: '🆕 Pedido creado', descripcion: 'Tu pedido fue registrado. Sube el voucher de pago para continuar.', fotoUrl: foto, timestamp: ts, accion: 'Subir voucher' }]
  }

  const eventos = pedidos.flatMap(generarEventos).sort((a, b) => b.timestamp - a.timestamp)
  const chipActive: React.CSSProperties = { padding: '6px 16px', borderRadius: 20, border: 'none', background: C.terra, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }
  const chipInactive: React.CSSProperties = { ...chipActive, background: 'transparent', border: `1px solid ${C.border}`, color: C.textSub, fontWeight: 500 }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {(['pedidos', 'promos'] as const).map(s => (
          <button key={s} onClick={() => setCatMensajes(s)} style={catMensajes === s ? chipActive : chipInactive}>
            {s === 'pedidos' ? 'Pedidos y envíos' : 'Promociones'}
          </button>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderRadius: 10, background: `${C.sage}11`, border: `1px solid ${C.sage}22`, marginBottom: 16, fontSize: 12, color: C.sage }}>
        🛡️ Nunca pagues fuera de la app. Ignora mensajes que soliciten pagos extra.
      </div>
      {catMensajes === 'promos' ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🎁</p>
          <p style={{ fontSize: 15, color: C.textSub }}>No hay promociones disponibles</p>
        </div>
      ) : eventos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
          <p style={{ fontSize: 15, color: C.textSub }}>Sin notificaciones por ahora</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {eventos.map((ev, idx) => (
            <div key={idx} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px 0', fontSize: 11, color: C.textSub }}>
                {new Date(ev.timestamp).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{ev.titulo}</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {ev.fotoUrl
                    ? <img src={ev.fotoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 64, height: 64, borderRadius: 8, background: C.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>☕</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: C.textSub, lineHeight: 1.4 }}>{ev.descripcion}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>#{ev.orderId}</p>
                    {ev.accion && (
                      <button onClick={() => setPedidoDetalle(pedidos.find(p => p.id === ev.pedidoId) ?? null)}
                        style={{ marginTop: 8, padding: '5px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.cream, fontSize: 12, cursor: 'pointer' }}>
                        {ev.accion}
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={() => setPedidoDetalle(pedidos.find(p => p.id === ev.pedidoId) ?? null)}
                  style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: '6px 0 0', borderTop: `1px solid ${C.border}` }}>
                  Ver detalles del pedido  ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PortalEmprendedor: React.FC<Props> = ({ usuarioId, nombreUsuario, isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('catalogo')
  const [subTab, setSubTab] = useState<SubTab>('pedidos')
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [usuario, setUsuario] = useState<UsuarioONE | null>(null)
  const [loading, setLoading] = useState(true)
  const [pedidoACalificar, setPedidoACalificar] = useState<PedidoONE | null>(null)
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [accionando, setAccionando] = useState<string | null>(null)

  // Carrito — sincronizado con localStorage
  const [carritoItems, setCarritoItems] = useState<ItemCarritoLocal[]>(leerCarrito)
  useEffect(() => { guardarCarrito(carritoItems) }, [carritoItems])

  // Sincronizar cuando el usuario vuelve al tab catálogo (carrito puede haber cambiado afuera)
  useEffect(() => {
    if (tab === 'catalogo' || tab === 'carrito') setCarritoItems(leerCarrito())
  }, [tab])

  function agregarAlCarrito(producto: { id: string; nombre: string; precioBaseKgCents: number }, formato: FormatoONE = '1kg') {
    setCarritoItems(prev => {
      const idx = prev.findIndex(i => i.producto.id === producto.id && i.formato === formato)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
        return next
      }
      return [...prev, { producto, formato, qty: 1 }]
    })
  }

  // Filtros pedidos
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState<'todos' | 'pendiente' | 'voucher_subido' | 'verificado' | 'en_agencia'>('todos')
  const [busquedaPedido, setBusquedaPedido] = useState('')
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoONE | null>(null)

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
      toast('¡Pedido recibido! Ya puedes calificarlo ★', 'ok')
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
    const totalCarritoCents = carritoItems.reduce((s, i) => {
      return s + calcularPrecioFinal(i.producto.precioBaseKgCents, i.formato) * i.qty
    }, 0)
    const carritoProductoIds = new Set(carritoItems.map(i => i.producto.id))
    const countPendientePago = pedidos.filter(p => p.pagoStatus === 'pendiente' && p.logisticaStatus !== 'entregado').length
    const countEnCamino = pedidos.filter(p => p.logisticaStatus === 'en_agencia').length

    return (
      <>
        {/* Banner re-engagement pedidos activos */}
        {(countPendientePago > 0 || countEnCamino > 0) && (
          <div style={{
            position: 'fixed', top: 0, left: sidebarCollapsed ? 56 : 220, right: 0, zIndex: 90,
            background: countPendientePago > 0 ? C.yellow + 'ee' : C.blue + 'ee',
            color: countPendientePago > 0 ? '#000' : C.white,
            padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backdropFilter: 'blur(6px)', gap: 12,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {countPendientePago > 0
                ? `⏳ ${countPendientePago} pedido${countPendientePago > 1 ? 's' : ''} esperando tu voucher de pago`
                : `🚚 ${countEnCamino} pedido${countEnCamino > 1 ? 's' : ''} en camino`
              }
            </span>
            <button
              onClick={() => setTab('mis_compras')}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)', background: 'rgba(0,0,0,0.15)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: 'inherit' }}
            >
              Ver mis pedidos →
            </button>
          </div>
        )}
        <CatalogoPublico
          isDemo={isDemo}
          sidebarOffset={sidebarCollapsed ? 56 : 220}
          onSeleccionar={(producto, fmt) => agregarAlCarrito(producto, fmt ?? '1kg')}
          carritoCount={carritoItems.length}
          totalCarritoCents={totalCarritoCents}
          carritoProductoIds={carritoProductoIds}
          carritoLineas={carritoItems}
          onIrAlCheckout={() => { window.location.hash = '#/checkout' }}
        />
      </>
    )
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

    function getStatusInfo(pedido: PedidoONE): { label: string; sublabel: string; color: string; icon: string } {
      if (pedido.logisticaStatus === 'entregado')
        return { label: 'Entregado', sublabel: 'Pedido recibido', color: C.sage, icon: '✅' }
      if (pedido.recepcionConfirmada)
        return { label: 'Recibido', sublabel: 'Confirmaste la recepción', color: C.sage, icon: '✓' }
      if (pedido.logisticaStatus === 'en_agencia')
        return { label: 'En camino', sublabel: pedido.agencia ? `Enviado por ${pedido.agencia.toUpperCase()}` : 'En agencia de envío', color: C.blue, icon: '🚚' }
      if (pedido.pagoStatus === 'verificado')
        return { label: 'Pago confirmado', sublabel: 'El caficultor prepara tu pedido', color: C.sage, icon: '✓' }
      if (pedido.pagoStatus === 'voucher_subido')
        return { label: 'Verificando pago', sublabel: 'Recibimos tu voucher', color: C.yellow, icon: '🔎' }
      if (pedido.pagoStatus === 'rechazado')
        return { label: 'Pago rechazado', sublabel: 'Contáctanos para resolver', color: '#e05c5c', icon: '✕' }
      return { label: 'Pendiente de pago', sublabel: 'Sube el voucher para continuar', color: C.yellow, icon: '⏳' }
    }

    function getFechaEstimada(pedido: PedidoONE): string | null {
      const created = new Date(pedido.createdAt)
      if (isNaN(created.getTime())) return null
      if (pedido.logisticaStatus === 'entregado') return null
      const diasMin = pedido.pagoStatus === 'verificado' ? 3 : 5
      const diasMax = pedido.pagoStatus === 'verificado' ? 7 : 10
      const desde = new Date(created); desde.setDate(desde.getDate() + diasMin)
      const hasta = new Date(created); hasta.setDate(hasta.getDate() + diasMax)
      const fmt = (d: Date) => d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
      return `${fmt(desde)} – ${fmt(hasta)}`
    }

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtrados.map(pedido => {
              const st = getStatusInfo(pedido)
              const fechaEst = getFechaEstimada(pedido)
              const fechaPedido = new Date(pedido.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })

              return (
                <div key={pedido.id} style={{
                  background: C.card, borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${C.border}`,
                }}>
                  {/* ── Header: estado + meta del pedido ── */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: 12, flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: st.color,
                        padding: '3px 10px', borderRadius: 20,
                        background: st.color + '20', border: `1px solid ${st.color}40`,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {st.icon} {st.label}
                      </span>
                      <span style={{ fontSize: 11, color: C.textSub }}>{st.sublabel}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: C.textSub }}>
                        Pedido: <span style={{ color: C.cream, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{pedido.id.slice(-12).toUpperCase()}</span>
                      </span>
                      <span style={{ fontSize: 11, color: C.textSub }}>{fechaPedido}</span>
                      {fechaEst && (
                        <span style={{ fontSize: 11, color: C.cream }}>
                          📅 Entrega: <strong>{fechaEst}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Tracking si aplica ── */}
                  {pedido.logisticaStatus === 'en_agencia' && pedido.codigoAgencia && (
                    <div style={{ padding: '8px 16px', background: C.blue + '10', borderBottom: `1px solid ${C.blue}25`, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>📦 {pedido.agencia?.toUpperCase()}</span>
                      <span style={{ width: 1, height: 12, background: C.border }} />
                      <span style={{ fontSize: 11, color: C.blue, fontFamily: 'JetBrains Mono, monospace' }}>{pedido.codigoAgencia}</span>
                    </div>
                  )}

                  {/* ── Layout principal: productos + acciones ── */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 0 }}>

                    {/* Lista de productos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {pedido.items.map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 12, padding: '14px 16px',
                          borderBottom: i < pedido.items.length - 1 ? `1px solid ${C.border}` : 'none',
                          alignItems: 'flex-start',
                        }}>
                          {/* Foto */}
                          <div style={{
                            width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                            background: '#111', border: `1px solid ${C.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {(item as any).fotoUrl
                              ? <img src={(item as any).fotoUrl} alt={item.productoNombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: 32 }}>☕</span>
                            }
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: C.cream, lineHeight: 1.3 }}>
                              {item.productoNombre}
                            </p>
                            <p style={{ margin: '0 0 2px', fontSize: 12, color: C.textSub }}>
                              {item.presentacion} · {item.caficultorNombre}
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>
                              Cantidad: <strong style={{ color: C.cream }}>{item.qty}</strong>
                            </p>
                          </div>
                          {/* Precio */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: C.terra }}>
                              {formatCents(item.subtotalCents)}
                            </p>
                            {item.qty > 1 && (
                              <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>
                                {formatCents(item.unitCents)} c/u
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Total */}
                      <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: C.textSub }}>
                          {pedido.items.reduce((s, i) => s + i.qty, 0)} unidad{pedido.items.reduce((s, i) => s + i.qty, 0) !== 1 ? 'es' : ''}
                        </span>
                        <span style={{ fontSize: 14, color: C.textSub }}>Total del pedido:</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: C.terra }}>{formatCents(pedido.totalCents)}</span>
                      </div>
                    </div>

                    {/* ── Columna acciones (desktop) / fila acciones (mobile) ── */}
                    <div style={{
                      width: isMobile ? '100%' : 160, flexShrink: 0, padding: isMobile ? '10px 16px 14px' : '14px 12px',
                      borderLeft: isMobile ? 'none' : `1px solid ${C.border}`,
                      borderTop: isMobile ? `1px solid ${C.border}` : 'none',
                      display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                      gap: 8, flexWrap: 'wrap',
                    }}>
                      {/* Acción primaria */}
                      {pedido.pagoStatus === 'pendiente' && (
                        <a href="#/" style={{ display: 'block', padding: '10px 0', borderRadius: 8, border: 'none', background: C.yellow, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', flex: isMobile ? 1 : undefined, minWidth: isMobile ? 120 : undefined }}>
                          Subir voucher →
                        </a>
                      )}
                      {pedido.logisticaStatus === 'en_agencia' && (
                        <button
                          onClick={() => handleConfirmarRecepcion(pedido.id)}
                          disabled={accionando === pedido.id}
                          style={{ padding: '10px 0', borderRadius: 8, border: 'none', background: C.sage, color: '#000', fontSize: 12, fontWeight: 700, cursor: accionando === pedido.id ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : '100%', minWidth: isMobile ? 120 : undefined }}
                        >
                          {accionando === pedido.id ? '...' : '✓ Confirmar recepción'}
                        </button>
                      )}
                      {pedido.logisticaStatus === 'entregado' && !pedido.calificado && (
                        <button
                          onClick={() => setPedidoACalificar(pedido)}
                          style={{ padding: '10px 0', borderRadius: 8, border: 'none', background: C.terra, color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : '100%', minWidth: isMobile ? 100 : undefined }}
                        >
                          ⭐ Calificar
                        </button>
                      )}
                      {/* Acciones secundarias */}
                      <button
                        onClick={() => {
                          pedido.items.forEach(item => {
                            const kgPorUnidad: Record<string, number> = { '250g': 0.25, '500g': 0.5, '1kg': 1.0, '5kg': 5.0 }
                            const kg = kgPorUnidad[item.presentacion] ?? 1.0
                            const precioBaseKgCents = kg > 0 ? Math.round(item.unitCents / kg) : item.unitCents
                            agregarAlCarrito({ id: item.productoId, nombre: item.productoNombre, precioBaseKgCents }, item.presentacion)
                          })
                          setTab('carrito')
                        }}
                        style={{ padding: '9px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.cream, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : '100%' }}
                      >
                        Comprar de nuevo
                      </button>
                      <button
                        onClick={() => setPedidoDetalle(pedido)}
                        style={{ padding: '9px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', flex: isMobile ? 1 : undefined, width: isMobile ? undefined : '100%' }}
                      >
                        Ver detalle
                      </button>
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
              <div className="detalle-overlay" style={{ flex: 1, background: 'rgba(0,0,0,0.7)' }} />
              <div
                className="detalle-panel"
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

  // ─── Nuevas funciones: Mensajes, Reseñas, Carrito, Mis Compras ──────────────

  function renderResenias() {
    const entregados = pedidos.filter(p => p.logisticaStatus === 'entregado')
    const pendientes = entregados.filter(p => !p.calificado && p.recepcionConfirmada)
    const yaResenados = entregados.filter(p => p.calificado)

    return (
      <div>
        {pendientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>⭐</p>
            <p style={{ fontSize: 16, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Todo calificado</p>
            <p style={{ fontSize: 13, color: C.textSub }}>No tienes pedidos pendientes de reseña</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: `${C.yellow}22`, color: C.yellow, fontSize: 12, fontWeight: 700, border: `1px solid ${C.yellow}44` }}>
                {pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {pendientes.map(p => {
                const item = p.items[0]
                return (
                  <div key={p.id} style={{ background: C.card, borderRadius: 14, padding: '16px', border: `1px solid ${C.border}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 10, background: C.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>☕</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.cream }}>{item?.productoNombre ?? 'Producto'}</p>
                      <p style={{ margin: '0 0 2px', fontSize: 12, color: C.textSub }}>{item?.presentacion} · {item?.caficultorNombre}</p>
                      <p style={{ margin: '0 0 10px', fontSize: 11, color: C.muted }}>{formatFecha(p.updatedAt)}</p>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
                        {[1,2,3,4,5].map(n => (
                          <button key={n} onClick={() => setPedidoACalificar(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: C.yellow, opacity: 0.35, padding: 0 }}>★</button>
                        ))}
                      </div>
                      <button onClick={() => setPedidoACalificar(p)} style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: C.terra, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Reseñar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
        {yaResenados.length > 0 && (
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ya reseñados</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {yaResenados.map(p => (
                <div key={p.id} style={{ padding: '12px 14px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>{p.items[0]?.productoNombre ?? '—'}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{p.items[0]?.caficultorNombre} · {formatFecha(p.updatedAt)}</p>
                  </div>
                  <span style={{ color: C.yellow, fontSize: 14, flexShrink: 0 }}>★ Calificado</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderCarrito() {
    const subtotalCents = carritoItems.reduce((s, i) =>
      s + calcularPrecioFinal(i.producto.precioBaseKgCents, i.formato) * i.qty, 0)
    const faltaCents = 8000 - subtotalCents

    function quitarItem(idx: number) { setCarritoItems(prev => prev.filter((_, i) => i !== idx)) }
    function cambiarQty(idx: number, delta: number) {
      setCarritoItems(prev => {
        const next = [...prev]
        const nuevo = next[idx].qty + delta
        if (nuevo <= 0) return prev.filter((_, i) => i !== idx)
        next[idx] = { ...next[idx], qty: nuevo }
        return next
      })
    }

    return (
      <div style={{ maxWidth: 600 }}>
        <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 20, background: faltaCents <= 0 ? `${C.sage}18` : `${C.terra}11`, border: `1px solid ${faltaCents <= 0 ? C.sage : C.terra}33`, fontSize: 13, color: faltaCents <= 0 ? C.sage : C.creamMuted, fontWeight: 600 }}>
          {faltaCents <= 0 ? '🚚 ¡Envío gratis en tu pedido!' : `🚚 Agrega S/ ${(faltaCents / 100).toFixed(0)} más para envío gratis`}
        </div>

        {carritoItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🛒</p>
            <p style={{ fontSize: 16, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Tu carrito está vacío</p>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>Explora el catálogo y agrega cafés</p>
            <button onClick={() => setTab('catalogo')} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: C.terra, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Ver catálogo →</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {carritoItems.map((item, idx) => {
                const precioCents = calcularPrecioFinal(item.producto.precioBaseKgCents, item.formato)
                return (
                  <div key={idx} style={{ background: C.card, borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.border}`, display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: C.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>☕</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.cream, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.producto.nombre}</p>
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textSub }}>{item.formato}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                          <button onClick={() => cambiarQty(idx, -1)} style={{ width: 28, height: 28, background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 16, lineHeight: '1' }}>−</button>
                          <span style={{ width: 24, textAlign: 'center', fontSize: 14, fontWeight: 700, color: C.cream }}>{item.qty}</span>
                          <button onClick={() => cambiarQty(idx, +1)} style={{ width: 28, height: 28, background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 16, lineHeight: '1' }}>+</button>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.terra }}>{formatCents(precioCents * item.qty)}</span>
                      </div>
                    </div>
                    <button onClick={() => quitarItem(idx)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, flexShrink: 0, padding: '4px' }}>✕</button>
                  </div>
                )
              })}
            </div>
            <div style={{ position: 'sticky', bottom: 0, background: C.bg, padding: '16px 0 8px', borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.textSub }}>Subtotal ({carritoItems.reduce((s, i) => s + i.qty, 0)} productos)</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif' }}>{formatCents(subtotalCents)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11 }}>🚚</span>
                <span style={{ fontSize: 11, color: C.textSub, fontFamily: 'Montserrat, sans-serif' }}>
                  Entrega estimada: 3–7 días hábiles desde confirmación de pago
                </span>
              </div>
              <a href="#/checkout" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 12, background: C.terra, color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
                Confirmar pedido →
              </a>
            </div>
          </>
        )}

        <div style={{ marginTop: 32 }}>
          <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Más cafés disponibles</p>
          <div style={{ padding: '16px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <button onClick={() => setTab('catalogo')} style={{ background: 'none', border: 'none', color: C.terra, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Explorar catálogo completo →
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderMisCompras() {
    const SUB_TABS: { id: SubTab; label: string }[] = [
      { id: 'pedidos',  label: 'Tus pedidos' },
      { id: 'mensajes', label: 'Mensajes' },
      { id: 'resenias', label: 'Reseñas' },
    ]
    const pendientesReseña = pedidos.filter(p => p.logisticaStatus === 'entregado' && !p.calificado && p.recepcionConfirmada).length

    const tabStyle = (active: boolean): React.CSSProperties => ({
      padding: '8px 16px', borderRadius: 0, border: 'none',
      borderBottom: active ? `2px solid ${C.terra}` : '2px solid transparent',
      background: 'none', color: active ? C.cream : C.textSub,
      fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer',
      fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap',
    })

    return (
      <div>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 24, overflowX: 'auto' }}>
          {SUB_TABS.map(s => (
            <button key={s.id} onClick={() => setSubTab(s.id)} style={tabStyle(subTab === s.id)}>
              {s.label}
              {s.id === 'mensajes' && pedidos.length > 0 && (
                <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: C.terra, color: '#fff', fontSize: 10, fontWeight: 700 }}>{pedidos.length}</span>
              )}
              {s.id === 'resenias' && pendientesReseña > 0 && (
                <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10, background: C.yellow, color: '#000', fontSize: 10, fontWeight: 700 }}>{pendientesReseña}</span>
              )}
            </button>
          ))}
        </div>
        {subTab === 'pedidos'  && renderPedidos()}
        {subTab === 'mensajes' && <MensajesTab pedidos={pedidos} C={C} setPedidoDetalle={setPedidoDetalle} />}
        {subTab === 'resenias' && renderResenias()}
      </div>
    )
  }

  function renderPerfil() {
    const historial = pedidos.filter(p => p.logisticaStatus === 'entregado')
    const emp = usuario?.negocio ?? {
      nombreLocal: pedidos[0]?.nombreLocal ?? nombreUsuario,
      distritoLocal: pedidos[0]?.distritoLocal ?? '',
      etapa: 'abierto' as const,
      pedidoIds: [],
    }
    const etapaColor = emp.etapa === 'abierto' ? C.sage : C.yellow
    const etapaLabel = emp.etapa === 'abierto' ? '● Abierto' : emp.etapa === 'proxima_apertura' ? '◐ Próxima apertura' : '○ Planificando'

    const menuItemStyle: React.CSSProperties = {
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px', background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
      color: C.cream, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 14,
      textAlign: 'left',
    }

    return (
      <div>
        {/* Foto banner + info */}
        <div style={{ background: C.card, borderRadius: 16, overflow: 'hidden', marginBottom: 14, border: `1px solid ${C.border}` }}>
          {emp.fotoLocal ? (
            <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
              <img src={emp.fotoLocal} alt={emp.nombreLocal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '100%', height: 100, background: `linear-gradient(135deg, ${C.terra}22, ${C.sage}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              ☕
            </div>
          )}
          <div style={{ padding: '16px 18px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{emp.nombreLocal}</h2>
            {emp.distritoLocal && <p style={{ margin: '0 0 6px', fontSize: 12, color: C.textSub }}>{emp.distritoLocal} · Lima</p>}
            {emp.descripcion && <p style={{ margin: '0 0 10px', fontSize: 12, color: C.creamMuted, lineHeight: 1.5 }}>{emp.descripcion}</p>}
            <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, background: etapaColor + '22', color: etapaColor, fontWeight: 700, border: `1px solid ${etapaColor}44` }}>{etapaLabel}</span>
          </div>
        </div>

        {/* KPIs */}
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

        {/* Alerta reseñas pendientes */}
        {historial.filter(p => !p.calificado && p.recepcionConfirmada).length > 0 && (
          <div style={{ padding: '12px 14px', background: C.yellow + '11', borderRadius: 10, border: `1px solid ${C.yellow}33`, marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: C.yellow }}>
              Tienes {historial.filter(p => !p.calificado && p.recepcionConfirmada).length} entrega(s) sin calificar —{' '}
              <button onClick={() => { setTab('mis_compras'); setSubTab('resenias') }} style={{ background: 'none', border: 'none', color: C.terra, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                ir a reseñas →
              </button>
            </p>
          </div>
        )}

        {/* Menú estilo Android */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 14, overflow: 'hidden' }}>
          <button style={menuItemStyle} onClick={() => setEditandoPerfil(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>🏪</span>
              <span>Editar mi local</span>
            </span>
            <span style={{ color: C.textSub, fontSize: 16 }}>›</span>
          </button>
          <button style={{ ...menuItemStyle, borderBottom: 'none' }} onClick={() => setEditandoPerfil(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <span>Mis direcciones</span>
            </span>
            <span style={{ color: C.textSub, fontSize: 16 }}>›</span>
          </button>
        </div>

        {/* Soporte */}
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>¿Necesitas ayuda?</p>
          <a href={`https://wa.me/${ONE_CONFIG.ADMIN_WHATSAPP.replace(/\s/g, '')}?text=Hola, soy ${emp.nombreLocal} y necesito ayuda`}
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

        /* Detalle pedido: en mobile ocupa pantalla completa */
        @media (max-width: 700px) {
          .detalle-overlay { display: none !important; }
          .detalle-panel { border-left: none !important; }
        }

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
        <Sidebar tab={tab} onChange={setTab} nombreLocal={nombreLocal} onLogout={logout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} pedidosPendientes={pedidos.filter(p => p.pagoStatus === 'pendiente' && p.logisticaStatus !== 'entregado').length} carritoCount={carritoItems.length} />
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
          {tab === 'mis_compras' && renderMisCompras()}
          {tab === 'carrito'     && renderCarrito()}
          {tab === 'perfil'      && renderPerfil()}
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
