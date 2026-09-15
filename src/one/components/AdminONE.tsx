/**
 * AdminONE.tsx — Panel de administración TunayWasi ONE
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

const C = {
  cream: '#f2e0cc',
  green: '#1f3028',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  brown: '#533b22',
  white: '#ffffff',
  red: '#c0392b',
  yellow: '#f39c12',
}

type Tab = 'pedidos' | 'pagos' | 'kits' | 'metricas'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Chip de estado ───────────────────────────────────────────────────────────

const ChipEstado: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: 12,
    background: color + '22', color, fontSize: 11,
    fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }}>
    {label}
  </span>
)

function colorPago(status: string) {
  return status === 'verificado' ? C.sage
    : status === 'rechazado' ? C.red
    : status === 'voucher_subido' ? C.yellow
    : C.tan
}


// ─── Botón de acción ──────────────────────────────────────────────────────────

const BtnAccion: React.FC<{
  label: string
  onClick: () => void
  color?: string
  disabled?: boolean
}> = ({ label, onClick, color = C.terra, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: '7px 14px', borderRadius: 7, border: 'none',
      background: color, color: C.white,
      fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {label}
  </button>
)

// ─── Tab Pedidos (kanban) ─────────────────────────────────────────────────────

const COLUMNAS: { key: string; label: string; color: string }[] = [
  { key: 'pendiente_pago', label: 'Pendiente pago', color: C.tan },
  { key: 'pago_verificado', label: 'Pago verificado', color: C.yellow },
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
  pedidos: PedidoONE[]
  onAccion: () => void
  isDemo: boolean
}> = ({ pedidos, onAccion, isDemo }) => {
  const [accionando, setAccionando] = useState<string | null>(null)

  async function despachar(pedidoId: string) {
    setAccionando(pedidoId)
    try { await (isDemo ? demoUpdateLogistica(pedidoId, 'despachado') : updateLogistica(pedidoId, 'despachado')); onAccion() }
    finally { setAccionando(null) }
  }

  async function entregar(pedidoId: string) {
    setAccionando(pedidoId)
    try { await (isDemo ? demoUpdateLogistica(pedidoId, 'entregado') : updateLogistica(pedidoId, 'entregado')); onAccion() }
    finally { setAccionando(null) }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 12, minWidth: 700, padding: '4px 0 16px' }}>
        {COLUMNAS.map((col) => {
          const items = pedidos.filter((p) => columnaDePedido(p) === col.key)
          return (
            <div key={col.key} style={{ flex: 1, minWidth: 160 }}>
              <div style={{
                padding: '6px 10px', borderRadius: '8px 8px 0 0',
                background: col.color + '22',
                borderBottom: `2px solid ${col.color}`,
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.color, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>
                  {col.label}
                </span>
                <span style={{ marginLeft: 6, fontSize: 11, color: C.tan }}>({items.length})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((p) => (
                  <div key={p.id} style={{
                    background: C.white, borderRadius: 8,
                    padding: '10px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
                      {p.nombreLocal}
                    </p>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                      {p.items.map(i => `${i.cantidad}×${i.formato}`).join(', ')} · {formatCents(p.totalCents)}
                    </p>
                    <p style={{ margin: '0 0 8px', fontSize: 10, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                      {p.id} · {formatFecha(p.createdAt)}
                    </p>
                    {col.key === 'pago_verificado' && (
                      <BtnAccion label="Marcar despachado →" onClick={() => despachar(p.id)} disabled={accionando === p.id} />
                    )}
                    {col.key === 'en_camino' && (
                      <BtnAccion label="Marcar entregado ✓" onClick={() => entregar(p.id)} color={C.sage} disabled={accionando === p.id} />
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <p style={{ fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif', textAlign: 'center', padding: '12px 0' }}>
                    —
                  </p>
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
  pedidos: PedidoONE[]
  onAccion: () => void
  isDemo: boolean
}> = ({ pedidos, onAccion, isDemo }) => {
  const pendientes = pedidos.filter((p) => p.pagoStatus === 'voucher_subido')
  const [accionando, setAccionando] = useState<string | null>(null)
  const [ampliada, setAmpliada] = useState<string | null>(null)

  async function verificar(pedidoId: string) {
    setAccionando(pedidoId)
    try { await (isDemo ? demoVerificarPago(pedidoId) : verificarPago(pedidoId)); onAccion() }
    finally { setAccionando(null) }
  }

  async function rechazar(pedidoId: string) {
    setAccionando(pedidoId)
    try { await (isDemo ? demoRechazarPago(pedidoId) : rechazarPago(pedidoId)); onAccion() }
    finally { setAccionando(null) }
  }

  if (pendientes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
        No hay vouchers pendientes de verificar ✓
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {pendientes.map((p) => (
        <div key={p.id} style={{
          background: C.white, borderRadius: 10,
          padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
                {p.nombreLocal}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                {p.id} · {p.metodoPago === 'yape' ? '📱 Yape' : '🏦 Transferencia'}
              </p>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
              {formatCents(p.totalCents)}
            </span>
          </div>

          <p style={{ margin: '0 0 10px', fontSize: 12, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>
            {p.items.map(i => `${i.cantidad}×${i.formato} ${i.productoNombre}`).join(', ')}
          </p>

          {/* Foto del voucher */}
          {p.voucherUrl && (
            <div style={{ marginBottom: 14 }}>
              <img
                src={p.voucherUrl}
                alt="Voucher"
                onClick={() => setAmpliada(ampliada === p.id ? null : p.id)}
                style={{
                  width: '100%',
                  maxHeight: ampliada === p.id ? 400 : 120,
                  objectFit: ampliada === p.id ? 'contain' : 'cover',
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'max-height 0.2s',
                  background: C.cream,
                }}
              />
              <p style={{ margin: '4px 0 0', fontSize: 10, color: C.tan, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
                Toca para {ampliada === p.id ? 'reducir' : 'ampliar'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <BtnAccion label="✓ Verificar pago" onClick={() => verificar(p.id)} color={C.sage} disabled={accionando === p.id} />
            <BtnAccion label="✕ Rechazar" onClick={() => rechazar(p.id)} color={C.red} disabled={accionando === p.id} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab Kits ─────────────────────────────────────────────────────────────────

const TabKits: React.FC<{
  pedidos: PedidoONE[]
  onAccion: () => void
  isDemo: boolean
}> = ({ pedidos, onAccion, isDemo }) => {
  const sinKit = pedidos.filter((p) => p.logisticaStatus === 'entregado' && !p.kitGenerado)
  const [generando, setGenerando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerarKit(pedido: PedidoONE) {
    setGenerando(pedido.id)
    setError(null)
    try {
      if (isDemo) {
        await demoGenerarKit(pedido.id)
      } else {
        const productosKit = await Promise.all(
          pedido.items.map(async (item) => {
            const prod = await fetchProducto(item.productoId)
            const cafic = await fetchCaficultor(prod.caficultorId)
            return {
              caficultorNombre: cafic.nombre,
              caficultorFoto: cafic.foto,
              caficultorRegion: cafic.region,
              caficultorAltitud: cafic.altitudMsnm,
              caficultorHistoria: cafic.historia,
              productoNombre: prod.nombre,
              variedad: prod.variedad,
              proceso: prod.proceso,
              notasSabor: prod.notasSabor,
              puntajeReferencial: prod.puntajeReferencial,
            }
          })
        )
        await generarKit(pedido.id, pedido.nombreLocal, pedido.emprendedorId, productosKit)
      }
      onAccion()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al generar el kit')
    } finally {
      setGenerando(null)
    }
  }

  if (sinKit.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
        No hay kits pendientes de generar ✓
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <p style={{ color: C.red, fontSize: 13, fontFamily: 'Montserrat, sans-serif', padding: '10px 14px', background: C.red + '10', borderRadius: 8 }}>
          {error}
        </p>
      )}
      {sinKit.map((p) => (
        <div key={p.id} style={{
          background: C.white, borderRadius: 10,
          padding: '14px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              {p.nombreLocal}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
              {p.items.map(i => i.productoNombre).join(', ')}
            </p>
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

  function filtrar(desde: Date) {
    return pedidos.filter((p) => new Date(p.createdAt) >= desde)
  }

  function calcular(lista: PedidoONE[]) {
    const facturacion = lista
      .filter((p) => p.pagoStatus === 'verificado')
      .reduce((acc, p) => acc + p.totalCents, 0)

    const clientesIds = new Set(lista.map((p) => p.emprendedorId))
    const clientesNuevos = new Set(
      lista
        .filter((p) => {
          const anteriorCount = pedidos.filter(
            (o) => o.emprendedorId === p.emprendedorId && new Date(o.createdAt) < new Date(p.createdAt)
          ).length
          return anteriorCount === 0
        })
        .map((p) => p.emprendedorId)
    ).size

    return {
      pedidos: lista.length,
      facturacion,
      clientes: clientesIds.size,
      clientesNuevos,
      clientesRecurrentes: clientesIds.size - clientesNuevos,
    }
  }

  const semana = calcular(filtrar(inicioSemana))
  const mes = calcular(filtrar(inicioMes))

  const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div style={{
      background: C.white, borderRadius: 10,
      padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.green, fontFamily: 'Cormorant Garamond, serif' }}>
        {value}
      </p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: C.brown, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Esta semana
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        <StatCard label="Pedidos" value={String(semana.pedidos)} />
        <StatCard label="Facturación" value={formatCents(semana.facturacion)} sub="pagos verificados" />
        <StatCard label="Clientes nuevos" value={String(semana.clientesNuevos)} />
        <StatCard label="Recurrentes" value={String(semana.clientesRecurrentes)} />
      </div>

      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: C.brown, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Este mes
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Pedidos" value={String(mes.pedidos)} />
        <StatCard label="Facturación" value={formatCents(mes.facturacion)} sub="pagos verificados" />
        <StatCard label="Clientes totales" value={String(mes.clientes)} />
        <StatCard label="Nuevos este mes" value={String(mes.clientesNuevos)} />
      </div>

      {/* Lista de últimos pedidos */}
      {pedidos.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.brown, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Últimos pedidos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pedidos.slice(0, 10).map((p) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: C.white, borderRadius: 8, padding: '10px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
                    {p.nombreLocal}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                    {p.id} · {formatFecha(p.createdAt)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
                    {formatCents(p.totalCents)}
                  </p>
                  <ChipEstado
                    label={PAGO_STATUS_LABELS[p.pagoStatus] ?? p.pagoStatus}
                    color={colorPago(p.pagoStatus)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const AdminONE: React.FC<{ isDemo?: boolean }> = ({ isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('pedidos')
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const data = isDemo ? await demoFetchPedidosAdmin() : await fetchPedidosAdmin()
      setPedidos(data)
      setError(null)
    } catch (e) {
      setError('No se pudieron cargar los pedidos.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [isDemo])

  useEffect(() => { cargar() }, [cargar])

  const vouchersCount = pedidos.filter((p) => p.pagoStatus === 'voucher_subido').length
  const kitsCount = pedidos.filter((p) => p.logisticaStatus === 'entregado' && !p.kitGenerado).length

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'pedidos', label: 'Pedidos' },
    { key: 'pagos', label: 'Pagos', badge: vouchersCount },
    { key: 'kits', label: 'Kits', badge: kitsCount },
    { key: 'metricas', label: 'Métricas' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: C.green, padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, color: C.cream, fontSize: 18, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
            Admin ONE
          </h1>
          <p style={{ margin: 0, color: C.sage, fontSize: 11, letterSpacing: '0.05em' }}>
            TUNAY WASI
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={cargar}
            style={{ background: 'none', border: `1px solid ${C.sage}`, color: C.sage, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>
            Actualizar
          </button>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        background: C.green, display: 'flex',
        borderBottom: `2px solid ${C.tan}22`,
      }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 4px', border: 'none',
              background: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? `2px solid ${C.terra}` : '2px solid transparent',
              color: tab === t.key ? C.cream : C.tan,
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              fontFamily: 'Montserrat, sans-serif',
              position: 'relative',
            }}>
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 5, width: 18, height: 18, borderRadius: '50%',
                background: C.terra, color: C.white, fontSize: 10, fontWeight: 700,
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 60px' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: C.tan, padding: '48px 0' }}>Cargando pedidos...</p>
        )}
        {error && (
          <p style={{ color: C.red, textAlign: 'center', padding: '48px 0' }}>{error}</p>
        )}
        {!loading && !error && (
          <>
            {tab === 'pedidos' && <TabPedidos pedidos={pedidos} onAccion={cargar} isDemo={isDemo} />}
            {tab === 'pagos' && <TabPagos pedidos={pedidos} onAccion={cargar} isDemo={isDemo} />}
            {tab === 'kits' && <TabKits pedidos={pedidos} onAccion={cargar} isDemo={isDemo} />}
            {tab === 'metricas' && <TabMetricas pedidos={pedidos} />}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminONE
