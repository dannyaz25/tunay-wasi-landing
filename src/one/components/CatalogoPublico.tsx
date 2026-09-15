/**
 * CatalogoPublico.tsx — Vista principal pública de TunayWasi ONE
 * Layout estilo Netflix: fondo oscuro, carrusel horizontal con hover expand
 */
import React, { useEffect, useState, useRef } from 'react'
import { fetchProductos, fetchCaficultores } from '../service'
import type { ProductoONE, CaficultorONE } from '../types'
import { PROCESO_LABELS } from '../config'
import seedProductos from '../seed/one_productos.json'
import seedCaficultores from '../seed/one_caficultores.json'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  bgHover: '#1f1f1f',
  cream: '#f2e0cc',
  green: '#1f3028',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  brown: '#533b22',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.7)',
}

interface Props {
  onSeleccionar: (producto: ProductoONE) => void
}

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

// ─── Hero Banner (primer producto destacado) ──────────────────────────────────

const HeroBanner: React.FC<{
  producto: ProductoONE
  caficultor: CaficultorONE | undefined
  onSeleccionar: (p: ProductoONE) => void
}> = ({ producto, caficultor, onSeleccionar }) => (
  <div style={{
    position: 'relative',
    height: '56vw',
    maxHeight: 500,
    minHeight: 280,
    background: C.bgCard,
    overflow: 'hidden',
  }}>
    {/* Imagen de fondo */}
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(to bottom, transparent 40%, ${C.bg} 100%),
                   linear-gradient(to right, ${C.bg} 0%, transparent 60%)`,
      zIndex: 1,
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'url(https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1400&q=80) center/cover no-repeat',
      filter: 'brightness(0.45)',
    }} />

    {/* Contenido */}
    <div style={{
      position: 'absolute', bottom: '12%', left: '4%',
      zIndex: 2, maxWidth: 480,
    }}>
      <p style={{
        margin: '0 0 6px',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
        color: C.terra, fontFamily: 'Montserrat, sans-serif',
        textTransform: 'uppercase',
      }}>
        {caficultor?.region ?? ''} · {caficultor?.altitudMsnm?.toLocaleString()} msnm
      </p>
      <h1 style={{
        margin: '0 0 10px',
        fontSize: 'clamp(24px, 4vw, 42px)',
        fontFamily: 'Cormorant Garamond, serif',
        fontWeight: 700, color: C.white, lineHeight: 1.1,
      }}>
        {producto.nombre}
      </h1>
      <p style={{
        margin: '0 0 6px',
        fontSize: 14, color: C.cream + 'cc',
        fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5,
      }}>
        {producto.notasSabor.join(' · ')}
      </p>
      <p style={{
        margin: '0 0 20px',
        fontSize: 13, color: C.tan,
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {PROCESO_LABELS[producto.proceso]} · {producto.variedad} · {producto.cosecha}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onSeleccionar(producto)}
          style={{
            padding: '10px 24px', borderRadius: 6, border: 'none',
            background: C.white, color: C.bg,
            fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer', letterSpacing: '0.02em',
          }}>
          ▶  Quiero este café
        </button>
        <a href={`#/caficultor/${caficultor?.id}`}
          style={{
            padding: '10px 20px', borderRadius: 6,
            background: 'rgba(109,109,110,0.7)',
            color: C.white, textDecoration: 'none',
            fontSize: 15, fontWeight: 600, fontFamily: 'Montserrat, sans-serif',
          }}>
          ⓘ  Más info
        </a>
      </div>
    </div>
  </div>
)

// ─── Card del carrusel ────────────────────────────────────────────────────────

const CarruselCard: React.FC<{
  producto: ProductoONE
  caficultor: CaficultorONE | undefined
  onSeleccionar: (p: ProductoONE) => void
}> = ({ producto, caficultor, onSeleccionar }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: 220,
        borderRadius: 6,
        overflow: 'visible',
        position: 'relative',
        transition: 'transform 0.25s ease, z-index 0s',
        transform: hovered ? 'scale(1.22)' : 'scale(1)',
        zIndex: hovered ? 10 : 1,
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%', height: 130, borderRadius: 6,
        background: C.bgCard, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${C.green}88 0%, ${C.brown}44 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 48, opacity: 0.6,
        }}>
          ☕
        </div>
        {/* Badge proceso */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          padding: '2px 8px', borderRadius: 4,
          background: C.terra, color: C.white,
          fontSize: 9, fontWeight: 700,
          fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {PROCESO_LABELS[producto.proceso]}
        </span>
      </div>

      {/* Panel expandido al hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: C.bgHover,
          borderRadius: '0 0 6px 6px',
          padding: '12px 14px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
          zIndex: 10,
        }}>
          <p style={{
            margin: '0 0 2px',
            fontSize: 13, fontWeight: 700, color: C.white,
            fontFamily: 'Cormorant Garamond, serif',
            lineHeight: 1.2,
          }}>
            {producto.nombre}
          </p>
          <p style={{
            margin: '0 0 6px',
            fontSize: 10, color: C.tan,
            fontFamily: 'Montserrat, sans-serif',
          }}>
            {caficultor?.nombre} · {caficultor?.region}
          </p>
          <p style={{
            margin: '0 0 10px',
            fontSize: 11, color: C.cream + 'aa',
            fontFamily: 'Montserrat, sans-serif', fontStyle: 'italic',
          }}>
            {producto.notasSabor.join(' · ')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
              desde {formatCents(producto.precios.g250)}
            </span>
            {producto.puntajeReferencial && (
              <span style={{ fontSize: 10, color: C.sage, fontFamily: 'Montserrat, sans-serif' }}>
                ~{producto.puntajeReferencial} pts
              </span>
            )}
          </div>
          <button
            onClick={() => onSeleccionar(producto)}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 5,
              border: 'none', background: C.terra, color: C.white,
              fontSize: 12, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
              cursor: 'pointer',
            }}>
            Quiero este café →
          </button>
        </div>
      )}

      {/* Título siempre visible debajo */}
      {!hovered && (
        <div style={{ padding: '8px 4px 0' }}>
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 600,
            color: C.cream, fontFamily: 'Montserrat, sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {producto.nombre}
          </p>
          <p style={{
            margin: '2px 0 0', fontSize: 10, color: C.tan,
            fontFamily: 'Montserrat, sans-serif',
          }}>
            {caficultor?.nombre ?? ''}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Fila de carrusel ─────────────────────────────────────────────────────────

const CarruselRow: React.FC<{
  titulo: string
  productos: ProductoONE[]
  caficultores: Map<string, CaficultorONE>
  onSeleccionar: (p: ProductoONE) => void
}> = ({ titulo, productos, caficultores, onSeleccionar }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 480 : -480, behavior: 'smooth' })
  }

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 10)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  const ArrowBtn: React.FC<{ dir: 'left' | 'right'; visible: boolean }> = ({ dir, visible }) => (
    <button
      onClick={() => scroll(dir)}
      style={{
        position: 'absolute',
        top: 0, bottom: 40,
        [dir]: 0,
        width: 48,
        background: visible ? 'rgba(0,0,0,0.6)' : 'transparent',
        border: 'none',
        color: visible ? C.white : 'transparent',
        fontSize: 22, cursor: visible ? 'pointer' : 'default',
        zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s',
        borderRadius: dir === 'left' ? '0 4px 4px 0' : '4px 0 0 4px',
      }}>
      {dir === 'left' ? '‹' : '›'}
    </button>
  )

  return (
    <div style={{ marginBottom: 40, position: 'relative' }}>
      <h2 style={{
        margin: '0 0 12px 4%',
        fontSize: 18, fontWeight: 700,
        color: C.cream, fontFamily: 'Montserrat, sans-serif',
        letterSpacing: '0.02em',
      }}>
        {titulo}
      </h2>

      <div style={{ position: 'relative' }}>
        <ArrowBtn dir="left" visible={canLeft} />
        <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            overflowY: 'visible',
            scrollbarWidth: 'none',
            padding: '8px 4% 60px',
            scrollSnapType: 'x mandatory',
          }}>
          {productos.map((p) => (
            <div key={p.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
              <CarruselCard
                producto={p}
                caficultor={caficultores.get(p.caficultorId)}
                onSeleccionar={onSeleccionar}
              />
            </div>
          ))}
        </div>
        <ArrowBtn dir="right" visible={canRight} />
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const CatalogoPublico: React.FC<Props> = ({ onSeleccionar }) => {
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [caficultores, setCaficultores] = useState<Map<string, CaficultorONE>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [prods, cafics] = await Promise.all([fetchProductos(), fetchCaficultores()])
        const productosFinales = prods.length > 0 ? prods : (seedProductos as ProductoONE[])
        const caficsFinales = cafics.length > 0 ? cafics : (seedCaficultores as CaficultorONE[])
        setProductos(productosFinales)
        setCaficultores(new Map(caficsFinales.map((c) => [c.id, c])))
      } catch {
        setProductos(seedProductos as ProductoONE[])
        setCaficultores(new Map((seedCaficultores as CaficultorONE[]).map((c) => [c.id, c])))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const destacado = productos[0]
  const caficultorDestacado = destacado ? caficultores.get(destacado.caficultorId) : undefined

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header flotante estilo Netflix */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 4%',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{
            fontSize: 20, fontWeight: 700, letterSpacing: '0.08em',
            color: C.terra, fontFamily: 'Cormorant Garamond, serif',
          }}>
            TUNAY WASI
          </span>
          <span style={{
            marginLeft: 12, fontSize: 11, color: C.tan,
            letterSpacing: '0.1em', fontFamily: 'Montserrat, sans-serif',
          }}>
            CAFÉ PERUANO
          </span>
        </div>
        <a href="#/portal" style={{
          color: C.cream, fontSize: 13, textDecoration: 'none',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
          padding: '7px 18px', borderRadius: 4,
          background: C.terra,
        }}>
          Mi portal
        </a>
      </header>

      {/* Hero */}
      {loading ? (
        <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: C.tan, fontSize: 14 }}>Cargando...</p>
        </div>
      ) : destacado && (
        <HeroBanner
          producto={destacado}
          caficultor={caficultorDestacado}
          onSeleccionar={onSeleccionar}
        />
      )}

      {/* Filas de carrusel */}
      <div style={{ paddingTop: 16 }}>
        {!loading && productos.length > 0 && (
          <>
            <CarruselRow
              titulo="Nuestros orígenes"
              productos={productos}
              caficultores={caficultores}
              onSeleccionar={onSeleccionar}
            />
            <CarruselRow
              titulo="Proceso lavado — sabores limpios"
              productos={productos.filter(p => p.proceso === 'lavado')}
              caficultores={caficultores}
              onSeleccionar={onSeleccionar}
            />
            <CarruselRow
              titulo="Proceso natural y honey — frutas y miel"
              productos={productos.filter(p => p.proceso === 'natural' || p.proceso === 'honey')}
              caficultores={caficultores}
              onSeleccionar={onSeleccionar}
            />
          </>
        )}
      </div>

      {/* Propuesta de valor */}
      {!loading && productos.length > 0 && (
        <div style={{
          margin: '0 4% 60px',
          padding: '28px 24px',
          background: C.bgCard,
          borderRadius: 10,
          borderLeft: `3px solid ${C.terra}`,
        }}>
          <h3 style={{
            margin: '0 0 16px', fontSize: 18,
            color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
          }}>
            ¿Qué incluye tu pedido?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              ['☕', 'Café tostado', 'Con etiqueta Tunay Wasi'],
              ['📄', 'Menú personalizado', 'Con la historia del productor'],
              ['🃏', 'Fichas para mesas', 'Imprimibles A6'],
              ['📱', 'QR de trazabilidad', 'Para tus clientes'],
              ['📸', 'Pack Instagram', '3 fotos + caption sugerido'],
            ].map(([emoji, titulo, sub]) => (
              <div key={titulo} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>{titulo}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ocultar scrollbar globalmente para los carruseles */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

export default CatalogoPublico
