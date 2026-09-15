/**
 * PortalCaficultor.tsx — Portal de solo lectura para el caficultor
 *
 * Muestra:
 * - Resumen de ganancias del mes
 * - Pedidos donde aparece su café
 * - Sus productos activos con stock disponible
 */
import React, { useEffect, useState } from 'react'
import { fetchPedidosByCaficultor, fetchProductos, fetchCaficultor } from '../service'
import {
  demoFetchPedidosByCaficultor,
  demoFetchProductosByCaficultor,
  demoFetchCaficultor,
} from '../demoService'
import { logout } from '../authService'
import type { PedidoONE, ProductoONE, CaficultorONE } from '../types'
import { PROCESO_LABELS } from '../config'

const C = {
  cream: '#f2e0cc',
  green: '#1f3028',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  brown: '#533b22',
  white: '#ffffff',
  yellow: '#f39c12',
}

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return iso }
}

function colorLogistica(status: string): string {
  if (status === 'entregado') return C.sage
  if (status === 'despachado') return C.yellow
  return C.tan
}

// ─── Calcular ganancias del mes ───────────────────────────────────────────────

function calcularGananciasMes(pedidos: PedidoONE[], productos: ProductoONE[]): number {
  const ahora = new Date()
  const mesActual = ahora.getMonth()
  const anioActual = ahora.getFullYear()
  const productoIds = new Set(productos.map(p => p.id))

  return pedidos
    .filter(p => {
      const fecha = new Date(p.createdAt)
      return (
        p.pagoStatus === 'verificado' &&
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      )
    })
    .reduce((total, pedido) => {
      const subtotal = pedido.items
        .filter(item => productoIds.has(item.productoId))
        .reduce((s, item) => s + item.subtotalCents, 0)
      return total + subtotal
    }, 0)
}

function calcularProximoPago(pedidos: PedidoONE[], productos: ProductoONE[]): number {
  const productoIds = new Set(productos.map(p => p.id))
  return pedidos
    .filter(p => p.pagoStatus === 'verificado' && p.logisticaStatus !== 'entregado')
    .reduce((total, pedido) => {
      const subtotal = pedido.items
        .filter(item => productoIds.has(item.productoId))
        .reduce((s, item) => s + item.subtotalCents, 0)
      return total + subtotal
    }, 0)
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  caficultorId: string
  isDemo?: boolean
}

const PortalCaficultor: React.FC<Props> = ({ usuarioId: _usuarioId, caficultorId, isDemo = false }) => {
  const [caficultor, setCaficultor] = useState<CaficultorONE | null>(null)
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        const [cafic, peds, prods] = await Promise.all([
          isDemo
            ? demoFetchCaficultor(caficultorId)
            : fetchCaficultor(caficultorId).catch(() => null),
          isDemo
            ? demoFetchPedidosByCaficultor(caficultorId)
            : fetchPedidosByCaficultor(caficultorId),
          isDemo
            ? demoFetchProductosByCaficultor(caficultorId)
            : fetchProductos().then(all => all.filter(p => p.caficultorId === caficultorId)),
        ])
        setCaficultor(cafic)
        setPedidos(peds)
        setProductos(prods)
      } catch (e) {
        setError('No se pudo cargar tu portal.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [caficultorId, isDemo])

  const gananciasMes = calcularGananciasMes(pedidos, productos)
  const proximoPago = calcularProximoPago(pedidos, productos)
  const pedidosActivos = pedidos.filter(p => p.logisticaStatus !== 'entregado')
  const historial = pedidos.filter(p => p.logisticaStatus === 'entregado')

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.tan, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: C.green, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: C.tan, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Portal Caficultor
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 18, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
            {caficultor?.nombre ?? 'Mi portal'}
          </h1>
          {caficultor && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.sage }}>
              {caficultor.region} · {caficultor.altitudMsnm.toLocaleString()} msnm
            </p>
          )}
        </div>
        <button
          onClick={() => logout().then(() => { window.location.hash = '#/' })}
          style={{ background: 'none', border: `1px solid ${C.tan}`, color: C.tan, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>
          Salir
        </button>
      </header>

      {error && (
        <div style={{ margin: 20, padding: 14, background: '#fde8e8', borderRadius: 8, color: '#c0392b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Ganancias */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28,
        }}>
          <div style={{ background: C.green, borderRadius: 12, padding: '18px 16px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: C.tan, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ganancias este mes
            </p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.sage, fontFamily: 'Cormorant Garamond, serif' }}>
              {formatCents(gananciasMes)}
            </p>
          </div>
          <div style={{ background: C.white, borderRadius: 12, padding: '18px 16px', border: `1px solid ${C.tan}` }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: C.tan, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Próximo pago
            </p>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif' }}>
              {proximoPago > 0 ? formatCents(proximoPago) : '—'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 10, color: C.tan }}>
              Cuando se confirme entrega
            </p>
          </div>
        </div>

        {/* Mis productos */}
        {productos.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.brown, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Mis productos activos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {productos.map(p => (
                <div key={p.id} style={{
                  background: C.white, borderRadius: 10, padding: '14px 16px',
                  border: `1px solid ${C.tan}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.green, fontFamily: 'Cormorant Garamond, serif' }}>
                      {p.nombre}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.tan }}>
                      {PROCESO_LABELS[p.proceso]} · {p.variedad} · ~{p.puntajeReferencial} pts
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: p.kgDisponibles > 20 ? C.sage : C.terra }}>
                      {p.kgDisponibles} kg
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: C.tan }}>disponibles</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pedidos activos */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.brown, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Pedidos en curso ({pedidosActivos.length})
          </h2>
          {pedidosActivos.length === 0 ? (
            <p style={{ fontSize: 13, color: C.tan }}>No hay pedidos activos ahora.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pedidosActivos.map(p => {
                const misItems = p.items.filter(i => productos.some(pr => pr.id === i.productoId || pr.caficultorNombre === i.caficultorNombre))
                return (
                  <div key={p.id} style={{
                    background: C.white, borderRadius: 10, padding: '14px 16px',
                    border: `1px solid ${C.tan}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.green }}>
                          {p.nombreLocal}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.tan }}>
                          {p.distritoLocal} · {formatFecha(p.createdAt)}
                        </p>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 12,
                        background: colorLogistica(p.logisticaStatus) + '22',
                        color: colorLogistica(p.logisticaStatus),
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      }}>
                        {p.logisticaStatus === 'preparando' ? 'Preparando' : p.logisticaStatus === 'despachado' ? 'En camino' : 'Entregado'}
                      </span>
                    </div>
                    {misItems.map((item, i) => (
                      <p key={i} style={{ margin: '4px 0 0', fontSize: 12, color: C.brown }}>
                        {item.cantidad} × {item.formato} — {item.productoNombre}
                      </p>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Historial */}
        {historial.length > 0 && (
          <section>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: C.brown, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Historial de entregas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {historial.map(p => (
                <div key={p.id} style={{
                  background: C.white, borderRadius: 10, padding: '12px 16px',
                  border: `1px solid ${C.tan}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.green }}>
                      {p.nombreLocal}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.tan }}>
                      {p.id} · {formatFecha(p.updatedAt)}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: C.sage, fontWeight: 700 }}>✓ Entregado</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default PortalCaficultor
