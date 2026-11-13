/**
 * AdminONE.tsx — Panel de administración TunayWasi ONE
 * Dark mode Netflix-style
 *
 * Tab 1 — Pedidos: kanban visual (pendiente → verificado → despachado → entregado)
 * Tab 2 — Pagos: vouchers pendientes de verificar con foto
 * Tab 3 — Kits: pedidos entregados sin kit generado
 * Tab 4 — Métricas: semana y mes
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchPedidosAdmin,
  verificarPago,
  rechazarPago,
  updateLogistica,
  generarKit,
  actualizarUrlsKit,
  fetchKitByPedido,
  fetchCaficultor,
  fetchProducto,
} from '../service'
import {
  demoFetchPedidosAdmin,
  demoVerificarPago,
  demoRechazarPago,
  demoUpdateLogistica,
  demoGenerarKit,
  demoActualizarUrlsKit,
  demoFetchKitByPedido,
} from '../demoService'
import type { PedidoONE, KitIdentidadONE } from '../types'
import { PAGO_STATUS_LABELS } from '../config'
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

type Tab = 'pedidos' | 'pagos' | 'kits' | 'metricas'

const NAV_ITEMS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'pedidos',  label: 'Pedidos',  emoji: '📦' },
  { id: 'pagos',    label: 'Pagos',    emoji: '💳' },
  { id: 'kits',     label: 'Kits',     emoji: '🎨' },
  { id: 'metricas', label: 'Métricas', emoji: '📊' },
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

// ─── Tab Pedidos (kanban) ─────────────────────────────────────────────────────

const TabPedidos: React.FC<{
  pedidos: PedidoONE[]; onAccion: () => void; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedidos, onAccion, isDemo, onToast }) => {
  const [accionando, setAccionando] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  async function despachar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoUpdateLogistica(pedidoId, 'en_agencia') : updateLogistica(pedidoId, 'en_agencia'))
      onToast('Pedido marcado como despachado', 'ok')
      onAccion()
    } catch { onToast('Error al despachar pedido', 'error') }
    finally { setAccionando(null) }
  }

  async function entregar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoUpdateLogistica(pedidoId, 'entregado') : updateLogistica(pedidoId, 'entregado'))
      onToast('Pedido marcado como entregado ✓', 'ok')
      onAccion()
    } catch { onToast('Error al marcar entregado', 'error') }
    finally { setAccionando(null) }
  }

  function estadoPedido(p: PedidoONE): string {
    if (p.logisticaStatus === 'entregado') return 'entregado'
    if (p.logisticaStatus === 'en_agencia') return 'en_camino'
    if (p.pagoStatus === 'verificado') return 'pago_ok'
    return 'sin_pago'
  }

  const filtrados = pedidos.filter(p => {
    const estado = estadoPedido(p)
    if (filtroEstado !== 'todos' && estado !== filtroEstado) return false
    if (busqueda && !p.nombreLocal.toLowerCase().includes(busqueda.toLowerCase()) && !p.id.includes(busqueda)) return false
    return true
  })

  const counts = {
    sin_pago: pedidos.filter(p => estadoPedido(p) === 'sin_pago').length,
    pago_ok:  pedidos.filter(p => estadoPedido(p) === 'pago_ok').length,
    en_camino: pedidos.filter(p => estadoPedido(p) === 'en_camino').length,
    entregado: pedidos.filter(p => estadoPedido(p) === 'entregado').length,
  }

  return (
    <div>
      <FilterBar>
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cafetería o ID..." />
        <FilterChip label={`Todos (${pedidos.length})`} active={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} />
        <FilterChip label={`Sin pago (${counts.sin_pago})`} color={C.muted} active={filtroEstado === 'sin_pago'} onClick={() => setFiltroEstado('sin_pago')} />
        <FilterChip label={`Pago OK (${counts.pago_ok})`} color={C.yellow} active={filtroEstado === 'pago_ok'} onClick={() => setFiltroEstado('pago_ok')} />
        <FilterChip label={`En camino (${counts.en_camino})`} color={C.terra} active={filtroEstado === 'en_camino'} onClick={() => setFiltroEstado('en_camino')} />
        <FilterChip label={`Entregado (${counts.entregado})`} color={C.sage} active={filtroEstado === 'entregado'} onClick={() => setFiltroEstado('entregado')} />
      </FilterBar>

      {filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 13, color: C.textSub }}>Sin pedidos para este filtro</p>
        </div>
      ) : (
        <div className="adm-grid-cards">
          {filtrados.map(p => {
          const estado = estadoPedido(p)
          const colorBorde = estado === 'sin_pago' ? C.muted + '44' : estado === 'pago_ok' ? C.yellow + '44' : estado === 'en_camino' ? C.terra + '44' : C.sage + '44'
          const colorChip  = estado === 'sin_pago' ? C.muted : estado === 'pago_ok' ? C.yellow : estado === 'en_camino' ? C.terra : C.sage
          const labelChip  = estado === 'sin_pago' ? '⏳ Sin pago' : estado === 'pago_ok' ? '✓ Pago OK' : estado === 'en_camino' ? '🚚 En camino' : '✓ Entregado'

          return (
            <div key={p.id} style={{ background: C.card, borderRadius: 14, padding: '18px', border: `1px solid ${colorBorde}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: colorChip + '22', color: colorChip }}>{labelChip}</span>
                    {p.metodoPago === 'yape' && <span style={{ fontSize: 10, color: C.textSub }}>📱 Yape</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{p.id} · {formatFecha(p.createdAt)}</p>
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.terra, flexShrink: 0 }}>{formatCents(p.totalCents)}</p>
              </div>

              <div style={{ marginBottom: 10 }}>
                {p.items.map((i, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: C.bg, borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.text }}>{i.qty} × {i.presentacion} — {i.productoNombre}</span>
                    <span style={{ fontSize: 12, color: C.terra, fontWeight: 600 }}>{formatCents(i.subtotalCents)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {estado === 'pago_ok' && (
                  <BtnAccion label="→ Despachar" onClick={() => despachar(p.id)} disabled={accionando === p.id} />
                )}
                {estado === 'en_camino' && (
                  <BtnAccion label="✓ Entregado" onClick={() => entregar(p.id)} color={C.sage} disabled={accionando === p.id} />
                )}
              </div>
            </div>
          )
        })}
        </div>
      )}
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

// ─── Tab Kits ─────────────────────────────────────────────────────────────────

// Sub-componente: formulario inline de URLs para un kit ya generado
const FormUrls: React.FC<{
  kit: KitIdentidadONE; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
  onGuardado: () => void
}> = ({ kit, isDemo, onToast, onGuardado }) => {
  const [urls, setUrls] = useState({
    menuPdfUrl: kit.menuPdfUrl ?? '',
    fichasUrl: kit.fichasUrl ?? '',
    qrUrl: kit.qrUrl ?? '',
    instagramPackUrl: kit.instagramPackUrl ?? '',
  })
  const [guardando, setGuardando] = useState(false)

  const campos: { key: keyof typeof urls; label: string; emoji: string }[] = [
    { key: 'menuPdfUrl', label: 'Menú PDF', emoji: '📄' },
    { key: 'fichasUrl', label: 'Fichas de mesa', emoji: '🃏' },
    { key: 'qrUrl', label: 'QR trazabilidad', emoji: '📱' },
    { key: 'instagramPackUrl', label: 'Pack Instagram', emoji: '📸' },
  ]

  async function handleGuardar() {
    setGuardando(true)
    try {
      if (isDemo) {
        await demoActualizarUrlsKit(kit.id, urls)
      } else {
        await actualizarUrlsKit(kit.id, urls)
      }
      onToast('URLs guardadas correctamente', 'ok')
      onGuardado()
    } catch {
      onToast('Error al guardar URLs', 'error')
    } finally { setGuardando(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12,
    border: `1px solid ${C.border}`, background: '#1a1a1a', color: C.cream,
    fontFamily: 'Montserrat, sans-serif', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
      <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cargar materiales del kit</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {campos.map(({ key, label, emoji }) => (
          <div key={key}>
            <label style={{ display: 'block', fontSize: 11, color: C.textSub, marginBottom: 3 }}>
              {emoji} {label} {urls[key] && <span style={{ color: C.sage }}>✓</span>}
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={urls[key]}
              onChange={e => setUrls(prev => ({ ...prev, [key]: e.target.value }))}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleGuardar}
        disabled={guardando}
        style={{
          marginTop: 12, padding: '10px 20px', borderRadius: 8,
          background: guardando ? C.border : C.terra, color: C.white,
          border: 'none', fontSize: 13, fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {guardando ? 'Guardando...' : 'Guardar URLs →'}
      </button>
    </div>
  )
}

const TabKits: React.FC<{
  pedidos: PedidoONE[]; onAccion: () => void; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedidos, onAccion, isDemo, onToast }) => {
  const sinKit = pedidos.filter((p) => p.logisticaStatus === 'entregado' && !p.kitGenerado && p.esKitProveedor)
  const conKit = pedidos.filter((p) => p.kitGenerado)
  const [generando, setGenerando] = useState<string | null>(null)
  const [kitsMap, setKitsMap] = useState<Map<string, KitIdentidadONE>>(new Map())

  useEffect(() => {
    async function cargarKits() {
      const entries = await Promise.all(
        conKit.map(async (p) => {
          const k = isDemo
            ? await demoFetchKitByPedido(p.id)
            : await fetchKitByPedido(p.id)
          return k ? ([p.id, k] as [string, KitIdentidadONE]) : null
        })
      )
      setKitsMap(new Map(entries.filter((e): e is [string, KitIdentidadONE] => e !== null)))
    }
    if (conKit.length > 0) cargarKits()
  }, [pedidos, isDemo]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerarKit(pedido: PedidoONE) {
    setGenerando(pedido.id)
    try {
      if (isDemo) {
        await demoGenerarKit(pedido.id)
      } else {
        const productosKit = await Promise.all(
          pedido.items.map(async (item) => {
            const prod = await fetchProducto(item.productoId)
            const cafic = await fetchCaficultor(prod.caficultorId)
            return {
              caficultorNombre: cafic.nombre, caficultorFoto: cafic.foto,
              caficultorRegion: cafic.region, caficultorAltitud: cafic.altitudMsnm,
              caficultorHistoria: cafic.historia, productoNombre: prod.nombre,
              variedad: prod.variedad, proceso: prod.proceso,
              notasSabor: prod.notasSabor, puntajeReferencial: prod.puntajeReferencial,
            }
          })
        )
        const primerCaficultorId = (await fetchProducto(pedido.items[0].productoId)).caficultorId
        await generarKit(pedido.id, pedido.nombreLocal, pedido.negocioId, productosKit, primerCaficultorId)
      }
      onToast(`Kit generado para ${pedido.nombreLocal}`, 'ok')
      onAccion()
    } catch (e: unknown) {
      onToast(e instanceof Error ? e.message : 'Error al generar kit', 'error')
    } finally { setGenerando(null) }
  }

  if (sinKit.length === 0 && conKit.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🎨</p>
        <p style={{ color: C.textSub, fontSize: 14 }}>No hay kits pendientes</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Pedidos entregados sin kit → botón Generar */}
      {sinKit.map((p) => (
        <div key={p.id} style={{
          background: C.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${C.yellow}44`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSub }}>{p.items.map(i => i.productoNombre).join(', ')}</p>
            <p style={{ margin: '3px 0 0', fontSize: 10, color: C.yellow }}>Entregado · esperando kit</p>
          </div>
          <BtnAccion
            label={generando === p.id ? 'Generando...' : 'Generar Kit →'}
            onClick={() => handleGenerarKit(p)}
            disabled={generando === p.id}
          />
        </div>
      ))}

      {/* Kits generados → formulario de URLs */}
      {conKit.map((p) => {
        const kit = kitsMap.get(p.id)
        if (!kit) return null
        const tieneUrls = kit.menuPdfUrl && kit.fichasUrl && kit.qrUrl && kit.instagramPackUrl
        return (
          <div key={p.id} style={{
            background: C.card, borderRadius: 12, padding: '16px 18px',
            border: `1px solid ${tieneUrls ? C.sage + '55' : C.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSub }}>{p.items.map(i => i.productoNombre).join(', ')}</p>
              </div>
              <span style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 8, fontWeight: 700,
                background: tieneUrls ? C.sage + '22' : C.yellow + '22',
                color: tieneUrls ? C.sage : C.yellow,
              }}>
                {tieneUrls ? '✓ Listo' : 'Sin URLs'}
              </span>
            </div>
            {!tieneUrls && (
              <FormUrls kit={kit} isDemo={isDemo} onToast={onToast} onGuardado={onAccion} />
            )}
            {tieneUrls && (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { emoji: '📄', label: 'Menú PDF', url: kit.menuPdfUrl },
                  { emoji: '🃏', label: 'Fichas', url: kit.fichasUrl },
                  { emoji: '📱', label: 'QR', url: kit.qrUrl },
                  { emoji: '📸', label: 'Instagram', url: kit.instagramPackUrl },
                ].map(m => (
                  <a key={m.label} href={m.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, background: C.bg, border: `1px solid ${C.sage}33`, textDecoration: 'none', fontSize: 11, color: C.sage }}>
                    <span>{m.emoji}</span> {m.label} →
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab Métricas ─────────────────────────────────────────────────────────────

const TabMetricas: React.FC<{ pedidos: PedidoONE[] }> = ({ pedidos }) => {
  const [periodo, setPeriodo] = useState<'semana' | 'mes' | 'todo'>('mes')

  const ahora = new Date()
  const inicioSemana = new Date(ahora); inicioSemana.setDate(ahora.getDate() - ahora.getDay()); inicioSemana.setHours(0, 0, 0, 0)
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  function calcular(lista: PedidoONE[]) {
    const facturacion = lista.filter(p => p.pagoStatus === 'verificado').reduce((acc, p) => acc + p.totalCents, 0)
    const clientesIds = new Set(lista.map(p => p.negocioId))
    const clientesNuevos = new Set(
      lista.filter(p => pedidos.filter(o => o.negocioId === p.negocioId && new Date(o.createdAt) < new Date(p.createdAt)).length === 0).map(p => p.negocioId)
    ).size
    return { total: lista.length, facturacion, clientes: clientesIds.size, clientesNuevos, recurrentes: clientesIds.size - clientesNuevos }
  }

  const lista = periodo === 'semana'
    ? pedidos.filter(p => new Date(p.createdAt) >= inicioSemana)
    : periodo === 'mes'
    ? pedidos.filter(p => new Date(p.createdAt) >= inicioMes)
    : pedidos

  const m = calcular(lista)

  const StatCard: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color = C.cream }) => (
    <div style={{ background: C.card, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      <FilterBar>
        <FilterChip label="Esta semana" active={periodo === 'semana'} onClick={() => setPeriodo('semana')} />
        <FilterChip label="Este mes"    active={periodo === 'mes'}    onClick={() => setPeriodo('mes')} />
        <FilterChip label="Todo"        active={periodo === 'todo'}   onClick={() => setPeriodo('todo')} />
      </FilterBar>

      <div className="adm-grid-kpis" style={{ marginBottom: 24 }}>
        <StatCard label="Pedidos"         value={String(m.total)}             color={C.blue} />
        <StatCard label="Facturación"     value={formatCents(m.facturacion)}  sub="pagos verificados" color={C.terra} />
        <StatCard label="Clientes nuevos" value={String(m.clientesNuevos)}    color={C.sage} />
        <StatCard label="Recurrentes"     value={String(m.recurrentes)}       color={C.cream} />
      </div>

      {lista.length > 0 && (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Últimos pedidos</p>
          <div className="adm-grid-cards">
            {lista.slice(0, 20).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.card, borderRadius: 8, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.cream }}>{p.nombreLocal}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{p.id} · {formatFecha(p.createdAt)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.terra }}>{formatCents(p.totalCents)}</p>
                  <Chip label={PAGO_STATUS_LABELS[p.pagoStatus] ?? p.pagoStatus} color={colorPago(p.pagoStatus)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
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
  const [tab, setTab] = useState<Tab>('pedidos')
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
      <div className="adm-sidebar" style={{ display: 'none' }}>
        <Sidebar
          tab={tab} onChange={setTab}
          vouchersCount={vouchersCount}
          onLogout={() => logout().then(() => { window.location.hash = '#/' })}
          collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)}
        />
      </div>

      {/* Mobile header */}
      <div className="adm-mobile-header" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center' }}>
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
              {tab === 'pedidos' && <TabPedidos pedidos={pedidos} onAccion={cargar} isDemo={isDemo} onToast={toast} />}
              {tab === 'pagos' && <TabPagos pedidos={pedidos} onAccion={cargar} isDemo={isDemo} onToast={toast} />}
              {tab === 'kits' && <TabKits pedidos={pedidos} onAccion={cargar} isDemo={isDemo} onToast={toast} />}
              {tab === 'metricas' && <TabMetricas pedidos={pedidos} />}
            </>
          )}
        </div>
      </div>

      <Toast msgs={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}

export default AdminONE
