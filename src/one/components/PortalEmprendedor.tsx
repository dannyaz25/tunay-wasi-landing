/**
 * PortalEmprendedor.tsx — Dashboard post-compra del emprendedor
 *
 * - Pedido activo con estado visual
 * - Kit de identidad descargable
 * - Reposición rápida
 * - Historial de pedidos
 */
import React, { useEffect, useState } from 'react'
import { fetchPedidosByEmprendedor, fetchKitByPedido } from '../service'
import { demoFetchPedidosByEmprendedor, demoFetchKitByPedido } from '../demoService'
import { logout } from '../authService'
import type { PedidoONE, KitIdentidadONE } from '../types'


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

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return iso }
}

// ─── Estado del pedido — stepper visual ──────────────────────────────────────

function stepDePedido(p: PedidoONE): number {
  if (p.logisticaStatus === 'entregado') return 3
  if (p.logisticaStatus === 'despachado') return 2
  if (p.pagoStatus === 'verificado') return 1
  return 0
}

const STEPS = ['Pago pendiente', 'Pago verificado', 'En camino 🚚', 'Entregado ✓']

const StepperPedido: React.FC<{ pedido: PedidoONE }> = ({ pedido }) => {
  const step = stepDePedido(pedido)
  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: step >= i ? C.terra : C.tan + '44',
                border: step === i ? `2px solid ${C.terra}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step > i && <span style={{ color: C.white, fontSize: 12 }}>✓</span>}
                {step === i && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.white, display: 'block' }} />}
              </div>
              <p style={{
                margin: '4px 0 0', fontSize: 9,
                color: step >= i ? C.terra : C.tan,
                fontFamily: 'Montserrat, sans-serif', fontWeight: step === i ? 700 : 400,
                textAlign: 'center', lineHeight: 1.3,
              }}>
                {label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: step > i ? C.terra : C.tan + '44', marginBottom: 18 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Kit de identidad ────────────────────────────────────────────────────────

const KitSection: React.FC<{ kit: KitIdentidadONE }> = ({ kit }) => {
  const items: { label: string; sub: string; url?: string; emoji: string }[] = [
    { emoji: '📄', label: 'Menú PDF', sub: 'Para tu carta', url: kit.menuPdfUrl },
    { emoji: '🃏', label: 'Fichas para mesas', sub: 'Imprimibles A6', url: kit.fichasUrl },
    { emoji: '📱', label: 'QR de trazabilidad', sub: 'Para tus mesas', url: kit.qrUrl },
    { emoji: '📸', label: 'Pack Instagram', sub: '3 fotos + caption', url: kit.instagramPackUrl },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.url ?? '#'}
          target={item.url ? '_blank' : undefined}
          rel="noopener noreferrer"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '14px 10px', borderRadius: 10, textDecoration: 'none',
            background: item.url ? C.green : C.tan + '22',
            opacity: item.url ? 1 : 0.5,
            cursor: item.url ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.15s',
          }}>
          <span style={{ fontSize: 24, marginBottom: 6 }}>{item.emoji}</span>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: item.url ? C.cream : C.tan, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
            {item.label}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: item.url ? C.sage : C.tan, fontFamily: 'Montserrat, sans-serif', textAlign: 'center' }}>
            {item.url ? item.sub : 'Próximamente'}
          </p>
        </a>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  nombreUsuario: string
  isDemo?: boolean
}

const PortalEmprendedor: React.FC<Props> = ({ usuarioId, nombreUsuario, isDemo = false }) => {
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [kits, setKits] = useState<Map<string, KitIdentidadONE>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        const data = isDemo
          ? await demoFetchPedidosByEmprendedor(usuarioId)
          : await fetchPedidosByEmprendedor(usuarioId)
        setPedidos(data)

        const kitsMap = new Map<string, KitIdentidadONE>()
        await Promise.all(
          data
            .filter((p) => p.kitGenerado && p.kitId)
            .map(async (p) => {
              const kit = isDemo ? await demoFetchKitByPedido(p.id) : await fetchKitByPedido(p.id)
              if (kit) kitsMap.set(p.id, kit)
            })
        )
        setKits(kitsMap)
      } catch (e) {
        setError('No se pudo cargar tu portal.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [usuarioId])

  const pedidoActivo = pedidos.find((p) => p.logisticaStatus !== 'entregado')
  const historial = pedidos.filter((p) => p.logisticaStatus === 'entregado')
  const nombreLocal = pedidos[0]?.nombreLocal ?? ''

  const Section: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
    <div style={{
      background: C.white, borderRadius: 12,
      padding: '16px 18px', marginBottom: 16,
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    }}>
      <p style={{
        margin: '0 0 14px', fontSize: 11, fontWeight: 700,
        color: C.tan, fontFamily: 'Montserrat, sans-serif',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        borderBottom: `1px solid ${C.cream}`, paddingBottom: 10,
      }}>
        {titulo}
      </p>
      {children}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: C.green, padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ margin: 0, color: C.sage, fontSize: 11, letterSpacing: '0.06em' }}>TUNAY WASI</p>
          <h1 style={{ margin: '2px 0 0', color: C.cream, fontSize: 17, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
            {nombreLocal || nombreUsuario}
          </h1>
        </div>
        <button
          onClick={logout}
          style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 12 }}>
          Salir
        </button>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 60px' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: C.tan, padding: '48px 0' }}>Cargando tu portal...</p>
        )}
        {error && (
          <p style={{ color: C.red, textAlign: 'center', padding: '32px 0' }}>{error}</p>
        )}

        {!loading && !error && pedidos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>☕</p>
            <p style={{ fontSize: 16, color: C.green, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>
              Aún no tienes pedidos
            </p>
            <a href="#/"
              style={{
                display: 'inline-block', marginTop: 16,
                padding: '12px 28px', borderRadius: 10,
                background: C.terra, color: C.white,
                textDecoration: 'none', fontSize: 14,
                fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
              }}>
              Ver catálogo →
            </a>
          </div>
        )}

        {!loading && !error && pedidos.length > 0 && (
          <>
            {/* Pedido activo */}
            {pedidoActivo && (
              <Section titulo="Tu pedido activo">
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
                  {pedidoActivo.id}
                </p>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>
                  {pedidoActivo.items.map(i => `${i.cantidad}×${i.formato} ${i.productoNombre}`).join(', ')}
                </p>
                <StepperPedido pedido={pedidoActivo} />

                {pedidoActivo.pagoStatus === 'rechazado' && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: C.red + '10', borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: C.red, fontFamily: 'Montserrat, sans-serif' }}>
                      Tu pago fue rechazado. Contáctanos por WhatsApp para resolverlo.
                    </p>
                  </div>
                )}
              </Section>
            )}

            {/* Kit de identidad */}
            {pedidos.some((p) => p.kitGenerado) ? (
              <Section titulo="Tu Kit de Identidad">
                {(() => {
                  const pedidoConKit = pedidos.find((p) => p.kitGenerado)
                  const kit = pedidoConKit ? kits.get(pedidoConKit.id) : undefined
                  return kit
                    ? <KitSection kit={kit} />
                    : <p style={{ color: C.tan, fontSize: 13, fontFamily: 'Montserrat, sans-serif' }}>Cargando kit...</p>
                })()}
              </Section>
            ) : pedidos.some((p) => p.logisticaStatus === 'entregado') ? (
              <Section titulo="Tu Kit de Identidad">
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ fontSize: 24, marginBottom: 8 }}>⏳</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.brown, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
                    Tu kit está en preparación. Te avisamos cuando esté listo.
                  </p>
                </div>
              </Section>
            ) : null}

            {/* Reposición rápida */}
            {pedidos.length > 0 && (
              <Section titulo="Reposición rápida">
                <p style={{ margin: '0 0 14px', fontSize: 14, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>
                  ¿Necesitas más café?
                </p>
                <a href="#/"
                  style={{
                    display: 'block', padding: '12px 0', borderRadius: 10,
                    background: C.terra, color: C.white, textDecoration: 'none',
                    fontSize: 14, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                    textAlign: 'center',
                  }}>
                  Pedir de nuevo →
                </a>
              </Section>
            )}

            {/* Historial */}
            {historial.length > 0 && (
              <Section titulo="Historial">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {historial.map((p) => (
                    <div key={p.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: `1px solid ${C.cream}`,
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
                          {p.id}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                          {p.items.map(i => `${i.cantidad}×${i.formato}`).join(', ')} · {formatFecha(p.createdAt)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
                          {formatCents(p.totalCents)}
                        </p>
                        <span style={{ fontSize: 10, color: C.sage, fontFamily: 'Montserrat, sans-serif' }}>
                          Entregado ✓
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PortalEmprendedor
