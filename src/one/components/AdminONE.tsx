/**
 * AdminONE.tsx — Panel de administración TunayWasi ONE
 * Dark mode Netflix-style
 *
 * Tab 1 — Dashboard: métricas Hoy/Semana/Mes/Todo + conteos de estado
 * Tab 2 — Pagos: vouchers pendientes de verificar con foto
 * Tab 3 — Soporte: pedidos por día con filtros
 * Tab 4 — Perfil: identidad + detección de pagos + cerrar sesión
 */
import React, { useState, useEffect, useCallback } from 'react'
import { auth } from '@/shared/firebase'
import {
  fetchPedidosAdmin,
  verificarPago,
  rechazarPago,
} from '../service'
import {
  demoFetchPedidosAdmin,
  demoVerificarPago,
  demoRechazarPago,
} from '../demoService'
import type { PedidoONE } from '../types'
import { logout } from '../authService'

// ─── Design system dark ───────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  terra: '#c96e4b',
  sage: '#8faf8a',
  white: '#ffffff',
  red: '#e74c3c',
  yellow: '#f39c12',
  blue: '#4a90c4',
  text: '#e8e0d8',
  textSub: '#888888',
  muted: '#555555',
}

type Tab = 'dashboard' | 'pagos' | 'soporte' | 'perfil'

const NAV_ITEMS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'pagos',     label: 'Pagos',     emoji: '💳' },
  { id: 'soporte',   label: 'Soporte',   emoji: '💬' },
  { id: 'perfil',    label: 'Perfil',    emoji: '👤' },
]

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; tipo: 'ok' | 'error' | 'info' }

const Toast: React.FC<{ msgs: ToastMsg[]; onRemove: (id: number) => void }> = ({ msgs, onRemove }) => (
  <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(90vw, 360px)' }}>
    {msgs.map(m => (
      <div key={m.id} onClick={() => onRemove(m.id)} style={{
        padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: m.tipo === 'ok' ? C.sage : m.tipo === 'error' ? C.red : C.yellow,
        color: m.tipo === 'info' ? '#000' : C.white,
        pointerEvents: 'all', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {m.tipo === 'ok' ? '✓ ' : m.tipo === 'error' ? '✕ ' : 'ℹ '}{m.text}
      </div>
    ))}
  </div>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, padding: '14px 16px', background: '#0d0d0d', borderRadius: 12, border: `1px solid ${C.border}`, alignItems: 'center' }}>
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

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function colorPago(status: string) {
  return status === 'verificado' ? C.sage
    : status === 'rechazado' ? C.red
    : status === 'voucher_subido' ? C.yellow
    : C.muted
}

// ─── Chip de estado ───────────────────────────────────────────────────────────

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    background: color + '22', color, fontSize: 10,
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.04em',
    border: `1px solid ${color}44`,
  }}>
    {label}
  </span>
)

// ─── Botón de acción ──────────────────────────────────────────────────────────

const BtnAccion: React.FC<{
  label: string; onClick: () => void; color?: string; disabled?: boolean
}> = ({ label, onClick, color = C.terra, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: color, color: C.white,
    fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
  }}>
    {label}
  </button>
)

// ─── Tab Dashboard ────────────────────────────────────────────────────────────

type FiltroDash = 'hoy' | 'semana' | 'mes' | 'todo'

const TabDashboard: React.FC<{ pedidos: PedidoONE[] }> = ({ pedidos }) => {
  const [filtro, setFiltro] = useState<FiltroDash>('hoy')

  function inicioFiltro(): Date | null {
    const cal = new Date()
    if (filtro === 'hoy') {
      cal.setHours(0, 0, 0, 0); return cal
    }
    if (filtro === 'semana') {
      cal.setDate(cal.getDate() - 7); cal.setHours(0, 0, 0, 0); return cal
    }
    if (filtro === 'mes') {
      cal.setDate(1); cal.setHours(0, 0, 0, 0); return cal
    }
    return null
  }

  const desde = inicioFiltro()
  const lista = desde ? pedidos.filter(p => new Date(p.createdAt) >= desde) : pedidos

  const pagados = lista.filter(p => p.pagoStatus === 'verificado')
  const totalCents = pagados.reduce((acc, p) => acc + p.totalCents, 0)
  const totalSoles = totalCents / 100
  const numPedidos = pagados.length
  const ticket     = numPedidos > 0 ? totalSoles / numPedidos : 0
  const comision   = totalSoles * 0.05

  let revisar = 0, preparacion = 0, camino = 0, liberar = 0, entregados = 0
  lista.forEach(p => {
    const ps = p.pagoStatus; const ls = p.logisticaStatus
    if (ps === 'voucher_subido')                              revisar++
    else if (ps === 'verificado' && ls !== 'entregado')      preparacion++
    else if (ls === 'en_agencia')                            camino++
    else if (ls === 'entregado' && ps !== 'rechazado')       liberar++
    if (ps === 'rechazado')                                  entregados++ // reutilizamos como "liberados"
  })

  const StatCard: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color = C.cream }) => (
    <div style={{ background: C.card, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  )

  const CountRow: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: C.card, borderRadius: 8, border: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: C.textSub }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{count}</span>
    </div>
  )

  return (
    <div>
      <FilterBar>
        {(['hoy','semana','mes','todo'] as FiltroDash[]).map(f => (
          <FilterChip key={f} label={f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Semana' : f === 'mes' ? 'Mes' : 'Todo'} active={filtro === f} onClick={() => setFiltro(f)} />
        ))}
      </FilterBar>

      <div className="adm-grid-kpis" style={{ marginBottom: 24 }}>
        <StatCard label="Ventas"       value={`S/ ${totalSoles.toFixed(2)}`}   color={C.terra} />
        <StatCard label="Pedidos"      value={`${numPedidos}`}                 sub={`${numPedidos !== 1 ? 'pedidos' : 'pedido'}`} color={C.blue} />
        <StatCard label="Ticket prom." value={`S/ ${ticket.toFixed(2)}`}       color={C.cream} />
        <StatCard label="Comisión TW"  value={`S/ ${comision.toFixed(2)}`}     sub="5%" color={C.sage} />
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estados</p>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}>
        <CountRow label="🔍 Por revisar"    count={revisar}     color={C.yellow} />
        <CountRow label="📦 Preparación"    count={preparacion} color={C.cream} />
        <CountRow label="🚚 En camino"      count={camino}      color={C.terra} />
        <CountRow label="🔓 Por liberar"    count={liberar}     color={C.blue} />
        <CountRow label="✅ Entregados"     count={entregados}  color={C.sage} />
      </div>
    </div>
  )
}

// ─── Tab Pagos ────────────────────────────────────────────────────────────────

const TabPagos: React.FC<{
  pedidos: PedidoONE[]; onAccion: () => void; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedidos, onAccion, isDemo, onToast }) => {
  const [accionando, setAccionando] = useState<string | null>(null)
  const [ampliada, setAmpliada] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<string>('voucher_subido')
  const [busqueda, setBusqueda] = useState('')

  async function verificar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoVerificarPago(pedidoId) : verificarPago(pedidoId))
      onToast('Pago verificado', 'ok')
      onAccion()
    } catch { onToast('Error al verificar pago', 'error') }
    finally { setAccionando(null) }
  }

  async function rechazar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoRechazarPago(pedidoId) : rechazarPago(pedidoId))
      onToast('Pago rechazado', 'info')
      onAccion()
    } catch { onToast('Error al rechazar pago', 'error') }
    finally { setAccionando(null) }
  }

  const conPago = pedidos.filter(p => p.pagoStatus !== 'pendiente')
  const counts = {
    voucher_subido: pedidos.filter(p => p.pagoStatus === 'voucher_subido').length,
    verificado:     pedidos.filter(p => p.pagoStatus === 'verificado').length,
    rechazado:      pedidos.filter(p => p.pagoStatus === 'rechazado').length,
  }

  const filtrados = conPago.filter(p => {
    if (filtro !== 'todos' && p.pagoStatus !== filtro) return false
    if (busqueda && !p.nombreLocal.toLowerCase().includes(busqueda.toLowerCase()) && !p.id.includes(busqueda)) return false
    return true
  })

  return (
    <div>
      <FilterBar>
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cafetería o ID..." />
        <FilterChip label={`Vouchers (${counts.voucher_subido})`} color={C.yellow} active={filtro === 'voucher_subido'} onClick={() => setFiltro('voucher_subido')} />
        <FilterChip label={`Verificados (${counts.verificado})`} color={C.sage} active={filtro === 'verificado'} onClick={() => setFiltro('verificado')} />
        <FilterChip label={`Rechazados (${counts.rechazado})`} color={C.red} active={filtro === 'rechazado'} onClick={() => setFiltro('rechazado')} />
        <FilterChip label={`Todos (${conPago.length})`} active={filtro === 'todos'} onClick={() => setFiltro('todos')} />
      </FilterBar>

      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>✓</p>
          <p style={{ color: C.textSub, fontSize: 14 }}>No hay pagos para este filtro</p>
        </div>
      ) : (
        <div className="adm-grid-cards">
          {filtrados.map(p => (
          <div key={p.id} style={{
            background: C.card, borderRadius: 14, padding: '18px',
            border: `1px solid ${p.pagoStatus === 'voucher_subido' ? C.yellow + '44' : p.pagoStatus === 'verificado' ? C.sage + '44' : C.red + '44'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSub }}>
                  {p.id} · {p.metodoPago === 'yape' ? '📱 Yape/Plin' : '🏦 Transferencia'} · {formatFecha(p.createdAt)}
                </p>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.terra, flexShrink: 0 }}>{formatCents(p.totalCents)}</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              {p.items.map((i, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: C.bg, borderRadius: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.text }}>{i.qty} × {i.presentacion} — {i.productoNombre}</span>
                  <span style={{ fontSize: 12, color: C.terra, fontWeight: 600 }}>{formatCents(i.subtotalCents)}</span>
                </div>
              ))}
            </div>

            {p.voucherUrl && (
              <div style={{ marginBottom: 14 }}>
                <img
                  src={p.voucherUrl} alt="Voucher"
                  onClick={() => setAmpliada(ampliada === p.id ? null : p.id)}
                  style={{
                    width: '100%', maxHeight: ampliada === p.id ? 400 : 120,
                    objectFit: ampliada === p.id ? 'contain' : 'cover',
                    borderRadius: 8, cursor: 'pointer', transition: 'max-height 0.25s',
                    background: C.border, border: `1px solid ${C.border}`,
                  }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 10, color: C.muted, textAlign: 'center' }}>
                  Toca para {ampliada === p.id ? 'reducir' : 'ampliar'}
                </p>
              </div>
            )}

            {p.pagoStatus === 'voucher_subido' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <BtnAccion label="✓ Verificar" onClick={() => verificar(p.id)} color={C.sage} disabled={accionando === p.id} />
                <BtnAccion label="✕ Rechazar" onClick={() => rechazar(p.id)} color={C.red} disabled={accionando === p.id} />
              </div>
            )}
            {p.pagoStatus === 'verificado' && (
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: C.sage + '22', color: C.sage, fontWeight: 700 }}>✓ Pago verificado</span>
            )}
            {p.pagoStatus === 'rechazado' && (
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: C.red + '22', color: C.red, fontWeight: 700 }}>✕ Rechazado</span>
            )}
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Soporte ─────────────────────────────────────────────────────────────

type FiltroSoporte = 'todos' | 'pendiente' | 'voucher_subido' | 'verificado' | 'rechazado' | 'preparando' | 'en_agencia' | 'entregado' | 'cancelado'

const CHIPS_SOPORTE: { id: FiltroSoporte; label: string }[] = [
  { id: 'todos',        label: 'Todos' },
  { id: 'pendiente',    label: 'Pendiente' },
  { id: 'voucher_subido', label: 'Comprobante' },
  { id: 'verificado',   label: 'Verificado' },
  { id: 'preparando',   label: 'Preparando' },
  { id: 'en_agencia',   label: 'Enviado' },
  { id: 'entregado',    label: 'Entregado' },
  { id: 'rechazado',    label: 'Rechazado' },
  { id: 'cancelado',    label: 'Cancelado' },
]

const PAGO_LABEL: Record<string, string> = {
  pendiente:       '⏳ Pendiente',
  voucher_subido:  '📎 Comprobante',
  verificado:      '✓ Verificado',
  rechazado:       '✗ Rechazado',
}

const LOGISTICA_LABEL: Record<string, string> = {
  preparando: '📦 Preparando',
  en_agencia: '📦 Enviado',
  entregado:  '✅ Entregado',
}

function sumarDias(base: Date, dias: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + dias)
  return d
}

function esMismoOAntes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    || a < b
}

const TabSoporte: React.FC<{ pedidos: PedidoONE[] }> = ({ pedidos }) => {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroSoporte>('todos')
  const [dia, setDia] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const esHoy = esMismoOAntes(hoy, dia) && esMismoOAntes(dia, hoy)

  const inicioDia = new Date(dia); inicioDia.setHours(0, 0, 0, 0)
  const finDia    = new Date(dia); finDia.setHours(23, 59, 59, 999)

  const filtrados = pedidos.filter(p => {
    const fecha = new Date(p.createdAt)
    if (fecha < inicioDia || fecha > finDia) return false
    if (filtro !== 'todos') {
      if (filtro === 'preparando' || filtro === 'en_agencia' || filtro === 'entregado') {
        if (p.logisticaStatus !== filtro) return false
      } else if (filtro === 'cancelado') {
        // no hay cancelado en los tipos actuales — mostrar vacío
        return false
      } else {
        if (p.pagoStatus !== filtro) return false
      }
    }
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (
        !p.negocioEmail.toLowerCase().includes(q) &&
        !p.negocioNombre.toLowerCase().includes(q) &&
        !p.nombreLocal.toLowerCase().includes(q) &&
        !p.id.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const labelDia = dia.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div>
      <FilterBar>
        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por email, nombre o # pedido..."
        />
      </FilterBar>

      {/* Chips de estado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {CHIPS_SOPORTE.map(c => (
          <FilterChip
            key={c.id}
            label={c.label}
            active={filtro === c.id}
            onClick={() => setFiltro(c.id)}
          />
        ))}
      </div>

      {/* Paginación por día */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '10px 14px', background: '#0d0d0d', borderRadius: 10, border: `1px solid ${C.border}`, width: 'fit-content' }}>
        <button
          onClick={() => setDia(d => sumarDias(d, -1))}
          style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 16 }}
        >‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.cream, minWidth: 130, textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>
          {esHoy ? 'Hoy — ' : ''}{labelDia}
        </span>
        <button
          onClick={() => setDia(d => sumarDias(d, 1))}
          disabled={esHoy}
          style={{ background: 'none', border: `1px solid ${C.border}`, color: esHoy ? C.muted : C.textSub, borderRadius: 6, padding: '4px 10px', cursor: esHoy ? 'not-allowed' : 'pointer', fontSize: 16, opacity: esHoy ? 0.4 : 1 }}
        >›</button>
        <span style={{ fontSize: 12, color: C.textSub, marginLeft: 4 }}>{filtrados.length} pedido{filtrados.length !== 1 ? 's' : ''}</span>
      </div>

      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 13, color: C.textSub }}>Sin pedidos para este filtro</p>
        </div>
      ) : (
        <div className="adm-grid-cards">
          {filtrados.map(p => (
            <div key={p.id} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.cream }}>{p.id}</span>
                    <Chip label={PAGO_LABEL[p.pagoStatus] ?? p.pagoStatus} color={colorPago(p.pagoStatus)} />
                    {LOGISTICA_LABEL[p.logisticaStatus] && (
                      <Chip label={LOGISTICA_LABEL[p.logisticaStatus]} color={C.textSub} />
                    )}
                  </div>
                  <p style={{ margin: '0 0 2px', fontSize: 11, color: C.textSub }}>
                    📅 {formatFecha(p.createdAt)}
                  </p>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: C.sage, fontWeight: 600 }}>
                    Negocio: {p.nombreLocal}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>
                    {p.negocioEmail}
                  </p>
                </div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.terra, flexShrink: 0, marginLeft: 12 }}>
                  {formatCents(p.totalCents)}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href={`#/soporte-chat/${p.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    background: C.terra + '18', border: `1px solid ${C.terra}44`,
                    color: C.terra, fontSize: 12, fontWeight: 700,
                    textDecoration: 'none', cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  💬 Ver chat
                </a>
                <a
                  href={`#/historial/${p.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    background: '#1a1a1a', border: `1px solid ${C.border}`,
                    color: C.textSub, fontSize: 12, fontWeight: 600,
                    textDecoration: 'none', cursor: 'pointer',
                    fontFamily: 'Montserrat, sans-serif',
                  }}
                >
                  📋 Historial
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Perfil ───────────────────────────────────────────────────────────────

const TabPerfil: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [confirmando, setConfirmando] = useState(false)
  const [nombre, setNombre] = useState<string>('')
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    const u = auth.currentUser
    if (u) {
      setNombre(u.displayName ?? 'Administrador')
      setEmail(u.email ?? '')
    }
  }, [])

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Identidad */}
      <div style={{ background: C.card, borderRadius: 14, padding: '24px', border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: C.textSub, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
          ADMINISTRADOR
        </p>
        <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
          {nombre || 'Admin'}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: C.textSub, fontFamily: 'Montserrat, sans-serif' }}>
          {email}
        </p>
      </div>

      {/* Detección de pagos */}
      <div style={{ background: C.card, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 10, color: C.textSub, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
          Detección de pagos
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: C.text, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
          La detección automática de pagos Yape/Plin funciona desde la app Android. Actívala en el dispositivo desde Ajustes → Notificaciones o Accesibilidad.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: C.sage + '18', border: `1px solid ${C.sage}44` }}>
          <span style={{ fontSize: 14 }}>📱</span>
          <span style={{ fontSize: 12, color: C.sage, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>Configurable en app Android</span>
        </div>
      </div>

      {/* Cerrar sesión */}
      <div style={{ background: C.card, borderRadius: 14, padding: '20px', border: `1px solid ${C.border}` }}>
        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: 8,
              border: `1px solid ${C.red}44`, background: C.red + '11',
              color: C.red, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Cerrar sesión
          </button>
        ) : (
          <div>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
              ¿Seguro que quieres cerrar sesión?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onLogout}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: 'none', background: C.red,
                  color: C.white, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                }}
              >
                Sí, cerrar sesión
              </button>
              <button
                onClick={() => setConfirmando(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: 'none',
                  color: C.textSub, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC<{
  tab: Tab; onChange: (t: Tab) => void
  vouchersCount: number
  onLogout: () => void
  collapsed: boolean; onToggle: () => void
}> = ({ tab, onChange, vouchersCount, onLogout, collapsed, onToggle }) => (
  <nav style={{
    position: 'fixed', left: 0, top: 0, bottom: 0, width: collapsed ? 56 : 220,
    background: '#0d0d0d', borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', zIndex: 100,
    fontFamily: 'Montserrat, sans-serif', transition: 'width 0.2s ease', overflow: 'hidden',
  }}>
    {/* Toggle */}
    <div style={{ padding: collapsed ? '14px 0' : '14px 16px 10px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onToggle} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
        {collapsed ? '☰' : '←'}
      </button>
    </div>

    {/* Header */}
    {!collapsed && (
      <div style={{ padding: '10px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TUNAY WASI</p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>Admin Panel</p>
      </div>
    )}

    {/* Nav items */}
    <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 12,
          padding: collapsed ? '11px 0' : '11px 20px',
          background: tab === item.id ? C.terra + '18' : 'none',
          border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', position: 'relative',
        }}>
          <span style={{ fontSize: 16 }}>{item.emoji}</span>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub, flex: 1 }}>
              {item.label}
            </span>
          )}
          {/* Badge vouchers en tab Pagos */}
          {item.id === 'pagos' && vouchersCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, borderRadius: 9,
              background: C.terra, color: C.white, fontSize: 10, fontWeight: 700, padding: '0 4px',
              position: collapsed ? 'absolute' : 'relative',
              top: collapsed ? 6 : undefined, right: collapsed ? 6 : undefined,
            }}>{vouchersCount}</span>
          )}
        </button>
      ))}
    </div>

    {/* Logout */}
    <div style={{ padding: collapsed ? '16px 8px' : '16px 20px', borderTop: `1px solid ${C.border}` }}>
      {collapsed ? (
        <button onClick={onLogout} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 14, cursor: 'pointer', display: 'flex', justifyContent: 'center' }} title="Cerrar sesión">⏻</button>
      ) : (
        <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Cerrar sesión</button>
      )}
    </div>
  </nav>
)

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminONE: React.FC<{ isDemo?: boolean }> = ({ isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function toast(text: string, tipo: 'ok' | 'error' | 'info' = 'ok') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, text, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  const cargar = useCallback(async () => {
    try {
      const data = isDemo ? await demoFetchPedidosAdmin() : await fetchPedidosAdmin()
      setPedidos(data)
    } catch (e) {
      toast('No se pudieron cargar los pedidos.', 'error')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => { cargar() }, [cargar])

  const vouchersCount = pedidos.filter((p) => p.pagoStatus === 'voucher_subido').length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 700px) {
          .adm-sidebar       { display: none !important; }
          .adm-main          { margin-left: 0 !important; }
          .adm-mobile-header { display: flex !important; }
        }
        @media (min-width: 701px) {
          .adm-sidebar       { display: flex !important; }
          .adm-main          { margin-left: ${sidebarCollapsed ? 56 : 220}px !important; }
          .adm-mobile-header { display: none !important; }
        }
        .adm-grid-cards { display: grid; gap: 14px; }
        @media (min-width: 1100px) { .adm-grid-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 1099px) { .adm-grid-cards { grid-template-columns: 1fr; } }
        .adm-grid-kpis { display: grid; gap: 10px; }
        @media (min-width: 701px)  { .adm-grid-kpis { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 700px)  { .adm-grid-kpis { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      {/* Sidebar desktop */}
      <div className="adm-sidebar">
        <Sidebar
          tab={tab} onChange={setTab}
          vouchersCount={vouchersCount}
          onLogout={() => logout().then(() => { window.location.hash = '#/' })}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Mobile header */}
      <div className="adm-mobile-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>Admin Panel</p>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>☰</button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: '#0d0d0d', borderRight: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>Admin Panel</p>
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
          </div>
        </div>
      )}

      {/* Main */}
      <div className="adm-main" style={{ flex: 1, marginLeft: sidebarCollapsed ? 56 : 220, minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, position: 'sticky', top: 0, zIndex: 50 }}>
          {isDemo && (
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 12, background: C.yellow + '22', color: C.yellow, fontWeight: 700 }}>DEMO</span>
          )}
          <button onClick={cargar} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>↻ Actualizar</button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '24px 20px 80px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: C.textSub, fontSize: 13 }}>Cargando...</p>
            </div>
          )}
          {!loading && (
            <>
              {tab === 'dashboard' && <TabDashboard pedidos={pedidos} />}
              {tab === 'pagos'     && <TabPagos     pedidos={pedidos} onAccion={cargar} isDemo={isDemo} onToast={toast} />}
              {tab === 'soporte'   && <TabSoporte   pedidos={pedidos} />}
              {tab === 'perfil'    && <TabPerfil    onLogout={() => logout().then(() => { window.location.hash = '#/' })} />}
            </>
          )}
        </div>
      </div>

      <Toast msgs={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}

export default AdminONE
