/**
 * PerfilCaficultor.tsx — Página pública del caficultor
 * Destino del QR de trazabilidad que está en las mesas de las cafeterías
 */
import React, { useEffect, useState } from 'react'
import { fetchCaficultor, fetchProductos, crearCalificacionCafeteria } from '../service'
import { demoFetchCaficultor, demoFetchProductosByCaficultor, demoCrearCalificacionCafeteria } from '../demoService'
import type { CaficultorONE, ProductoONE } from '../types'
import { PROCESO_LABELS, calcularPrecioFinal } from '../config'
import seedCaficultores from '../seed/one_caficultores.json'
import seedProductos from '../seed/one_productos.json'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  cream: '#f2e0cc',
  green: '#1f3028',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  brown: '#533b22',
  white: '#ffffff',
}

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

interface Props {
  caficultorId: string
  isDemo?: boolean
}

const PerfilCaficultor: React.FC<Props> = ({ caficultorId, isDemo = false }) => {
  const [caficultor, setCaficultor] = useState<CaficultorONE | null>(null)
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormCafeteria, setMostrarFormCafeteria] = useState(false)
  const [estrellasForm, setEstrellasForm] = useState<1|2|3|4|5>(5)
  const [comentarioForm, setComentarioForm] = useState('')
  const [nombreLocalForm, setNombreLocalForm] = useState('')
  const [enviandoForm, setEnviandoForm] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fallback al seed si Firestore no responde
      const c = (seedCaficultores as CaficultorONE[]).find(x => x.id === caficultorId) ?? null
      const p = (seedProductos as ProductoONE[]).filter(x => x.caficultorId === caficultorId)
      setCaficultor(c)
      setProductos(p)
      setLoading(false)
    }, 3000)

    async function cargar() {
      try {
        const [c, p] = await Promise.all([
          isDemo
            ? demoFetchCaficultor(caficultorId)
            : fetchCaficultor(caficultorId).catch(() => null),
          isDemo
            ? demoFetchProductosByCaficultor(caficultorId)
            : fetchProductos().then(all => all.filter(x => x.caficultorId === caficultorId)),
        ])
        clearTimeout(timer)
        setCaficultor(c)
        setProductos(p)
      } catch {
        clearTimeout(timer)
        const c = (seedCaficultores as CaficultorONE[]).find(x => x.id === caficultorId) ?? null
        const p = (seedProductos as ProductoONE[]).filter(x => x.caficultorId === caficultorId)
        setCaficultor(c)
        setProductos(p)
      } finally {
        setLoading(false)
      }
    }
    cargar()
    return () => clearTimeout(timer)
  }, [caficultorId, isDemo])

  async function enviarCalificacionCafeteria() {
    if (!caficultor || !nombreLocalForm.trim()) return
    setEnviandoForm(true)
    try {
      const input = {
        caficultorId,
        nombreLocal: nombreLocalForm.trim(),
        distritoLocal: '',
        estrellas: estrellasForm,
        comentario: comentarioForm.trim() || undefined,
      }
      if (isDemo) {
        await demoCrearCalificacionCafeteria(input)
      } else {
        await crearCalificacionCafeteria(input)
      }
      setEnviado(true)
      setMostrarFormCafeteria(false)
    } finally {
      setEnviandoForm(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.tan, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Cargando...</p>
      </div>
    )
  }

  if (!caficultor) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.tan, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Caficultor no encontrado.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 4%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.08em' }}>
            TUNAY WASI
          </span>
        </a>
        <a href="#/" style={{
          color: C.cream, fontSize: 12, textDecoration: 'none',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
          padding: '6px 16px', borderRadius: 4, background: C.terra,
        }}>
          Ver catálogo
        </a>
      </header>

      {/* Hero — foto de fondo */}
      <div style={{
        position: 'relative',
        height: '60vw', maxHeight: 480, minHeight: 260,
        background: C.bgCard, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url(https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=1400&q=80) center/cover no-repeat',
          filter: 'brightness(0.4)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 30%, ${C.bg} 100%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%', zIndex: 2,
        }}>
          <p style={{
            margin: '0 0 6px', fontSize: 11, fontWeight: 700,
            color: C.terra, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            {caficultor.region} · {caficultor.altitudMsnm.toLocaleString()} msnm
          </p>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700, color: C.white, lineHeight: 1.1,
          }}>
            {caficultor.nombre}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: C.tan }}>
            {caficultor.distrito}
          </p>
          {/* Score de confianza */}
          {caficultor.scoreConfianza && caficultor.totalCalificaciones ? (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#f39c12', fontSize: 14 }}>
                {'★'.repeat(Math.round(caficultor.scoreConfianza))}{'☆'.repeat(5 - Math.round(caficultor.scoreConfianza))}
              </span>
              <span style={{ fontSize: 12, color: C.cream, fontWeight: 700 }}>
                {caficultor.scoreConfianza.toFixed(1)}
              </span>
              <span style={{ fontSize: 11, color: C.tan }}>
                ({caficultor.totalCalificaciones} pedidos)
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 5% 80px' }}>

        {/* Historia */}
        <section style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: 'clamp(15px, 2vw, 17px)',
            color: C.cream + 'dd',
            lineHeight: 1.8,
            fontFamily: 'Cormorant Garamond, serif',
            fontStyle: 'italic',
          }}>
            "{caficultor.historia}"
          </p>
        </section>

        {/* Datos de la finca */}
        <section style={{ marginBottom: 40 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          }}>
            {[
              { label: 'Región', value: caficultor.region },
              { label: 'Altitud', value: `${caficultor.altitudMsnm.toLocaleString()} msnm` },
              { label: 'Distrito', value: caficultor.distrito },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: C.bgCard, borderRadius: 8, padding: '14px 16px',
                borderLeft: `3px solid ${C.terra}`,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, color: C.tan, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Sus cafés */}
        {productos.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              margin: '0 0 16px', fontSize: 13, fontWeight: 700,
              color: C.tan, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Sus cafés disponibles
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {productos.map(p => (
                <div key={p.id} style={{
                  background: C.bgCard, borderRadius: 10, padding: '16px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4,
                        background: C.terra, color: C.white,
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {PROCESO_LABELS[p.proceso]}
                      </span>
                      {p.puntajeReferencial && (
                        <span style={{ fontSize: 10, color: C.sage }}>
                          ~{p.puntajeReferencial} pts
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: '0 0 4px', fontSize: 15, fontWeight: 700,
                      color: C.cream, fontFamily: 'Cormorant Garamond, serif',
                    }}>
                      {p.nombre}
                    </p>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: C.tan }}>
                      {p.variedad} · {p.cosecha}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: C.cream + '99', fontStyle: 'italic' }}>
                      {p.notasSabor.join(' · ')}
                    </p>
                  </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: C.terra }}>
                      desde {formatCents(calcularPrecioFinal(p.precioBaseKgCents, '1kg'))}
                    </p>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('one_carrito_producto', JSON.stringify(p))
                        window.location.hash = '#/checkout'
                      }}
                      style={{
                        display: 'inline-block', marginTop: 8,
                        padding: '6px 14px', borderRadius: 5,
                        background: C.terra, color: C.white,
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        border: 'none', fontFamily: 'Montserrat, sans-serif',
                      }}>
                      Comprar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Calificación del cliente final */}
        <section style={{ marginBottom: 32 }}>
          {enviado ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>★</p>
              <p style={{ margin: 0, fontSize: 14, color: C.cream, fontWeight: 700, fontFamily: 'Cormorant Garamond, serif' }}>
                ¡Gracias por tu calificación!
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.tan }}>
                Ayuda a otros cafés a conocer este productor.
              </p>
            </div>
          ) : !mostrarFormCafeteria ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: C.tan }}>
                ¿Cómo estuvo el café en esta cafetería?
              </p>
              <button
                onClick={() => setMostrarFormCafeteria(true)}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  border: `1px solid ${C.sage}`, background: 'none',
                  fontSize: 13, fontWeight: 600, color: C.sage,
                  cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                }}>
                Calificar mi experiencia
              </button>
            </div>
          ) : (
            <div style={{ background: C.bgCard, borderRadius: 12, padding: '20px 18px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
                ¿Cómo estuvo el café?
              </p>
              {/* Estrellas */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {([1,2,3,4,5] as const).map(n => (
                  <button key={n} onClick={() => setEstrellasForm(n)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 28, padding: 0, color: '#f39c12',
                    opacity: n <= estrellasForm ? 1 : 0.3,
                  }}>★</button>
                ))}
              </div>
              {/* Nombre del local */}
              <input
                type="text"
                placeholder="¿En qué cafetería estás?"
                value={nombreLocalForm}
                onChange={e => setNombreLocalForm(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${C.tan + '66'}`, background: 'transparent',
                  fontSize: 13, color: C.cream, fontFamily: 'Montserrat, sans-serif',
                  marginBottom: 10, boxSizing: 'border-box', outline: 'none',
                }}
              />
              {/* Comentario */}
              <textarea
                placeholder="Comentario opcional..."
                value={comentarioForm}
                onChange={e => setComentarioForm(e.target.value)}
                maxLength={150}
                style={{
                  width: '100%', minHeight: 60, padding: '8px 12px',
                  borderRadius: 8, border: `1px solid ${C.tan + '66'}`,
                  background: 'transparent', fontSize: 13, color: C.cream,
                  fontFamily: 'Montserrat, sans-serif', resize: 'vertical',
                  marginBottom: 14, boxSizing: 'border-box', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMostrarFormCafeteria(false)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  border: `1px solid ${C.tan}`, background: 'none',
                  fontSize: 13, color: C.tan, cursor: 'pointer',
                }}>Cancelar</button>
                <button
                  onClick={enviarCalificacionCafeteria}
                  disabled={enviandoForm || !nombreLocalForm.trim()}
                  style={{
                    flex: 2, padding: '10px 0', borderRadius: 8,
                    border: 'none', background: C.terra,
                    fontSize: 13, fontWeight: 700, color: C.white,
                    cursor: enviandoForm || !nombreLocalForm.trim() ? 'not-allowed' : 'pointer',
                    opacity: enviandoForm || !nombreLocalForm.trim() ? 0.6 : 1,
                  }}>
                  {enviandoForm ? 'Enviando...' : 'Enviar →'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Sello de transparencia */}
        <div style={{
          background: C.bgCard, borderRadius: 10, padding: '20px 20px',
          borderLeft: `3px solid ${C.sage}`,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: C.sage }}>
            ¿Por qué escanear este QR?
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.tan, lineHeight: 1.6 }}>
            Este café fue producido por <strong style={{ color: C.cream }}>{caficultor.nombre}</strong> en {caficultor.distrito}, {caficultor.region}.
            Tunay Wasi conecta directamente al productor con la cafetería donde estás —
            sin intermediarios, con precio transparente al productor.
          </p>
        </div>

      </div>
    </div>
  )
}

export default PerfilCaficultor
