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
  fetchCaficultor,
  fetchProducto,
} from '../service'
import {
  demoFetchPedidosAdmin,
  demoVerificarPago,
  demoRechazarPago,
  demoUpdateLogistica,
  demoGenerarKit,
} from '../demoService'
import type { PedidoONE } from '../types'
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

const COLUMNAS: { key: string; label: string; color: string }[] = [
  { key: 'pendiente_pago', label: 'Sin pago', color: C.muted },
  { key: 'pago_verificado', label: 'Pago OK', color: C.yellow },
  { key: 'en_camino', label: 'En camino', color: C.terra },
  { key: 'entregado', label: 'Entregado', color: C.sage },
]

function columnaDePedido(p: PedidoONE): string {
  if (p.logisticaStatus === 'entregado') return 'entregado'
  if (p.logisticaStatus === 'despachado') return 'en_camino'
  if (p.pagoStatus === 'verificado') return 'pago_verificado'
  return 'pendiente_pago'
}

const TabPedidos: React.FC<{
  pedidos: PedidoONE[]; onAccion: () => void; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedidos, onAccion, isDemo, onToast }) => {
  const [accionando, setAccionando] = useState<string | null>(null)

  async function despachar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoUpdateLogistica(pedidoId, 'despachado') : updateLogistica(pedidoId, 'despachado'))
      onToast('Pedido marcado como despachado', 'ok')
      onAccion()
    } catch {
      onToast('Error al despachar pedido', 'error')
    } finally { setAccionando(null) }
  }

  async function entregar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoUpdateLogistica(pedidoId, 'entregado') : updateLogistica(pedidoId, 'entregado'))
      onToast('Pedido marcado como entregado ✓', 'ok')
      onAccion()
    } catch {
      onToast('Error al marcar entregado', 'error')
    } finally { setAccionando(null) }
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, minWidth: 640, padding: '4px 0 16px' }}>
        {COLUMNAS.map((col) => {
          const items = pedidos.filter((p) => columnaDePedido(p) === col.key)
          return (
            <div key={col.key} style={{ flex: 1, minWidth: 150 }}>
              <div style={{
                padding: '7px 12px', borderRadius: '8px 8px 0 0',
                background: col.color + '18', borderBottom: `2px solid ${col.color}`,
                marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.color, textTransform: 'uppercase' }}>
                  {col.label}
                </span>
                <span style={{ fontSize: 12, color: col.color, fontWeight: 700 }}>{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((p) => (
                  <div key={p.id} style={{
                    background: C.card, borderRadius: 8,
                    padding: '10px 12px', border: `1px solid ${C.border}`,
                  }}>
                    <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: C.textSub }}>
                      {p.items.map(i => `${i.cantidad}×${i.formato}`).join(', ')} · {formatCents(p.totalCents)}
                    </p>
                    <p style={{ margin: '0 0 8px', fontSize: 10, color: C.muted }}>{p.id}</p>
                    {col.key === 'pago_verificado' && (
                      <BtnAccion label="→ Despachar" onClick={() => despachar(p.id)} disabled={accionando === p.id} />
                    )}
                    {col.key === 'en_camino' && (
                      <BtnAccion label="✓ Entregado" onClick={() => entregar(p.id)} color={C.sage} disabled={accionando === p.id} />
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '16px 0' }}>—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab Pagos ────────────────────────────────────────────────────────────────

const TabPagos: React.FC<{
  pedidos: PedidoONE[]; onAccion: () => void; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedidos, onAccion, isDemo, onToast }) => {
  const pendientes = pedidos.filter((p) => p.pagoStatus === 'voucher_subido')
  const [accionando, setAccionando] = useState<string | null>(null)
  const [ampliada, setAmpliada] = useState<string | null>(null)

  async function verificar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoVerificarPago(pedidoId) : verificarPago(pedidoId))
      onToast('Pago verificado', 'ok')
      onAccion()
    } catch {
      onToast('Error al verificar pago', 'error')
    } finally { setAccionando(null) }
  }

  async function rechazar(pedidoId: string) {
    setAccionando(pedidoId)
    try {
      await (isDemo ? demoRechazarPago(pedidoId) : rechazarPago(pedidoId))
      onToast('Pago rechazado', 'info')
      onAccion()
    } catch {
      onToast('Error al rechazar pago', 'error')
    } finally { setAccionando(null) }
  }

  if (pendientes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>✓</p>
        <p style={{ color: C.textSub, fontSize: 14 }}>No hay vouchers pendientes</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {pendientes.map((p) => (
        <div key={p.id} style={{ background: C.card, borderRadius: 12, padding: '18px', border: `1px solid ${C.yellow}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSub }}>{p.id} · {p.metodoPago === 'yape' ? '📱 Yape' : '🏦 Transferencia'}</p>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.terra }}>{formatCents(p.totalCents)}</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: C.textSub }}>{p.items.map(i => `${i.cantidad}×${i.formato} ${i.productoNombre}`).join(', ')}</p>

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

          <div style={{ display: 'flex', gap: 10 }}>
            <BtnAccion label="✓ Verificar" onClick={() => verificar(p.id)} color={C.sage} disabled={accionando === p.id} />
            <BtnAccion label="✕ Rechazar" onClick={() => rechazar(p.id)} color={C.red} disabled={accionando === p.id} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab Kits ─────────────────────────────────────────────────────────────────

const TabKits: React.FC<{
  pedidos: PedidoONE[]; onAccion: () => void; isDemo: boolean
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
}> = ({ pedidos, onAccion, isDemo, onToast }) => {
  const sinKit = pedidos.filter((p) => p.logisticaStatus === 'entregado' && !p.kitGenerado)
  const [generando, setGenerando] = useState<string | null>(null)

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
        await generarKit(pedido.id, pedido.nombreLocal, pedido.emprendedorId, productosKit)
      }
      onToast(`Kit generado para ${pedido.nombreLocal}`, 'ok')
      onAccion()
    } catch (e: unknown) {
      onToast(e instanceof Error ? e.message : 'Error al generar kit', 'error')
    } finally { setGenerando(null) }
  }

  if (sinKit.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🎨</p>
        <p style={{ color: C.textSub, fontSize: 14 }}>No hay kits pendientes</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sinKit.map((p) => (
        <div key={p.id} style={{
          background: C.card, borderRadius: 12, padding: '16px 18px', border: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{p.nombreLocal}</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textSub }}>{p.items.map(i => i.productoNombre).join(', ')}</p>
          </div>
          <BtnAccion
            label={generando === p.id ? 'Generando...' : 'Generar Kit →'}
            onClick={() => handleGenerarKit(p)}
            disabled={generando === p.id}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Tab Métricas ─────────────────────────────────────────────────────────────

const TabMetricas: React.FC<{ pedidos: PedidoONE[] }> = ({ pedidos }) => {
  const ahora = new Date()
  const inicioSemana = new Date(ahora)
  inicioSemana.setDate(ahora.getDate() - ahora.getDay())
  inicioSemana.setHours(0, 0, 0, 0)
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  function calcular(lista: PedidoONE[]) {
    const facturacion = lista.filter((p) => p.pagoStatus === 'verificado').reduce((acc, p) => acc + p.totalCents, 0)
    const clientesIds = new Set(lista.map((p) => p.emprendedorId))
    const clientesNuevos = new Set(
      lista.filter((p) => {
        return pedidos.filter((o) => o.emprendedorId === p.emprendedorId && new Date(o.createdAt) < new Date(p.createdAt)).length === 0
      }).map((p) => p.emprendedorId)
    ).size
    return { pedidos: lista.length, facturacion, clientes: clientesIds.size, clientesNuevos, clientesRecurrentes: clientesIds.size - clientesNuevos }
  }

  const semana = calcular(pedidos.filter((p) => new Date(p.createdAt) >= inicioSemana))
  const mes = calcular(pedidos.filter((p) => new Date(p.createdAt) >= inicioMes))

  const StatCard: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({ label, value, sub, color = C.cream }) => (
    <div style={{ background: C.card, borderRadius: 12, padding: '16px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
      {sub && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Esta semana</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Pedidos" value={String(semana.pedidos)} color={C.blue} />
        <StatCard label="Facturación" value={formatCents(semana.facturacion)} sub="pagos verificados" color={C.terra} />
        <StatCard label="Clientes nuevos" value={String(semana.clientesNuevos)} color={C.sage} />
        <StatCard label="Recurrentes" value={String(semana.clientesRecurrentes)} color={C.cream} />
      </div>

      <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Este mes</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Pedidos" value={String(mes.pedidos)} color={C.blue} />
        <StatCard label="Facturación" value={formatCents(mes.facturacion)} sub="pagos verificados" color={C.terra} />
        <StatCard label="Clientes totales" value={String(mes.clientes)} color={C.sage} />
        <StatCard label="Nuevos este mes" value={String(mes.clientesNuevos)} color={C.cream} />
      </div>

      {pedidos.length > 0 && (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Últimos pedidos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pedidos.slice(0, 10).map((p) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: C.card, borderRadius: 8, padding: '12px 14px', border: `1px solid ${C.border}`,
              }}>
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

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminONE: React.FC<{ isDemo?: boolean }> = ({ isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('pedidos')
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastMsg[]>([])

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
  const kitsCount = pedidos.filter((p) => p.logisticaStatus === 'entregado' && !p.kitGenerado).length

  const TABS: { key: Tab; label: string; badge?: number; emoji: string }[] = [
    { key: 'pedidos', label: 'Pedidos', emoji: '📦' },
    { key: 'pagos', label: 'Pagos', badge: vouchersCount, emoji: '💳' },
    { key: 'kits', label: 'Kits', badge: kitsCount, emoji: '🎨' },
    { key: 'metricas', label: 'Métricas', emoji: '📊' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: '#0d0d0d', padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: C.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TUNAY WASI</p>
          <h1 style={{ margin: 0, color: C.cream, fontSize: 18, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Admin Panel</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isDemo && (
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 12, background: C.yellow + '22', color: C.yellow, fontWeight: 700 }}>DEMO</span>
          )}
          <button onClick={cargar} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>↻ Actualizar</button>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12 }}>Salir</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        background: '#0d0d0d', display: 'flex',
        borderBottom: `1px solid ${C.border}`, paddingLeft: 4,
      }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '13px 4px', border: 'none',
            background: 'none', cursor: 'pointer',
            borderBottom: tab === t.key ? `2px solid ${C.terra}` : '2px solid transparent',
            color: tab === t.key ? C.cream : C.textSub,
            fontSize: 12, fontWeight: tab === t.key ? 700 : 500,
            transition: 'all 0.15s', position: 'relative',
          }}>
            <span style={{ marginRight: 4 }}>{t.emoji}</span>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9,
                background: C.terra, color: C.white, fontSize: 10, fontWeight: 700, padding: '0 4px',
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px 80px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: C.textSub, fontSize: 13 }}>Cargando...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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

      <Toast msgs={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}

export default AdminONE
