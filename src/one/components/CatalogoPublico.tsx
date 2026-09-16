/**
 * CatalogoPublico.tsx — Vista principal pública de TunayWasi ONE
 * Layout: Hero → Carrusel Destacados → Carrusel Nuevos → Grid con filtros
 */
import React, { useEffect, useState, useRef } from 'react'
import { fetchProductos, fetchCaficultores } from '../service'
import type { ProductoONE, CaficultorONE, ProcesoONE } from '../types'
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
}

interface Props {
  onSeleccionar: (producto: ProductoONE) => void
}

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

const PROCESO_COLORS: Record<ProcesoONE, string> = {
  lavado: '#4a90c4',
  natural: '#c96e4b',
  honey: '#d4a017',
  anaerobico: '#9b59b6',
}

// ─── Hero Banner ─────────────────────────────────────────────────────────────

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
            cursor: 'pointer',
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

// ─── Card compartida (carrusel + grid) ───────────────────────────────────────

const ProductoCard: React.FC<{
  producto: ProductoONE
  caficultor: CaficultorONE | undefined
  onSeleccionar: (p: ProductoONE) => void
  width?: number
}> = ({ producto, caficultor, onSeleccionar, width = 200 }) => {
  const [hovered, setHovered] = useState(false)
  const procesoColor = PROCESO_COLORS[producto.proceso] ?? C.terra

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        borderRadius: 8,
        overflow: 'visible',
        position: 'relative',
        transition: 'transform 0.2s ease',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        zIndex: hovered ? 10 : 1,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%', height: 130, borderRadius: 8,
        background: C.bgCard, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${C.green}88 0%, ${C.brown}44 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, opacity: 0.5,
        }}>
          ☕
        </div>
        <span style={{
          position: 'absolute', top: 8, left: 8,
          padding: '2px 8px', borderRadius: 4,
          background: procesoColor, color: C.white,
          fontSize: 9, fontWeight: 700,
          fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {PROCESO_LABELS[producto.proceso]}
        </span>
        {producto.puntajeReferencial && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            padding: '2px 6px', borderRadius: 4,
            background: 'rgba(0,0,0,0.7)', color: C.sage,
            fontSize: 9, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
          }}>
            ~{producto.puntajeReferencial}
          </span>
        )}
      </div>

      {/* Info base */}
      <div style={{
        padding: '8px 4px 0',
        background: hovered ? C.bgHover : 'transparent',
        borderRadius: '0 0 8px 8px',
      }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 700,
          color: C.cream, fontFamily: 'Cormorant Garamond, serif',
          lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {producto.nombre}
        </p>
        <p style={{
          margin: '2px 0 0', fontSize: 10, color: C.tan,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          {caficultor?.nombre ?? producto.caficultorNombre} · {caficultor?.region ?? ''}
        </p>

        {/* Panel expandido al hover */}
        {hovered && (
          <div style={{ marginTop: 8 }}>
            <p style={{
              margin: '0 0 8px',
              fontSize: 10, color: C.cream + 'aa',
              fontFamily: 'Montserrat, sans-serif', fontStyle: 'italic',
            }}>
              {producto.notasSabor.join(' · ')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
                desde {formatCents(producto.precios.g250)}
              </span>
              <span style={{ fontSize: 10, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                {producto.variedad}
              </span>
            </div>
            <button
              onClick={() => onSeleccionar(producto)}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 5,
                border: 'none', background: C.terra, color: C.white,
                fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer', marginBottom: 4,
              }}>
              Quiero este café →
            </button>
          </div>
        )}
      </div>
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
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 480 : -480, behavior: 'smooth' })
  }

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 10)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  if (productos.length === 0) return null

  return (
    <div style={{ marginBottom: 40, position: 'relative' }}>
      <h2 style={{
        margin: '0 0 12px 4%',
        fontSize: 17, fontWeight: 700,
        color: C.cream, fontFamily: 'Montserrat, sans-serif',
        letterSpacing: '0.02em',
      }}>
        {titulo}
      </h2>
      <div style={{ position: 'relative' }}>
        {/* Flecha izquierda */}
        <button onClick={() => scroll('left')} style={{
          position: 'absolute', top: 0, bottom: 40, left: 0, width: 44,
          background: canLeft ? 'rgba(0,0,0,0.65)' : 'transparent',
          border: 'none', color: canLeft ? C.white : 'transparent',
          fontSize: 22, cursor: canLeft ? 'pointer' : 'default',
          zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '0 4px 4px 0',
        }}>‹</button>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            display: 'flex', gap: 10,
            overflowX: 'auto', overflowY: 'visible',
            scrollbarWidth: 'none',
            padding: '8px 4% 60px',
            scrollSnapType: 'x mandatory',
          }}>
          {productos.map((p) => (
            <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
              <ProductoCard
                producto={p}
                caficultor={caficultores.get(p.caficultorId)}
                onSeleccionar={onSeleccionar}
                width={200}
              />
            </div>
          ))}
        </div>

        {/* Flecha derecha */}
        <button onClick={() => scroll('right')} style={{
          position: 'absolute', top: 0, bottom: 40, right: 0, width: 44,
          background: canRight ? 'rgba(0,0,0,0.65)' : 'transparent',
          border: 'none', color: canRight ? C.white : 'transparent',
          fontSize: 22, cursor: canRight ? 'pointer' : 'default',
          zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '4px 0 0 4px',
        }}>›</button>
      </div>
    </div>
  )
}

// ─── Chip de filtro ───────────────────────────────────────────────────────────

const Chip: React.FC<{
  label: string
  activo: boolean
  color?: string
  onClick: () => void
}> = ({ label, activo, color = C.terra, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 14px', borderRadius: 20,
      border: `1px solid ${activo ? color : '#333'}`,
      background: activo ? color : 'transparent',
      color: activo ? C.white : C.tan,
      fontSize: 12, fontWeight: 600,
      fontFamily: 'Montserrat, sans-serif',
      cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'all 0.15s',
    }}
  >
    {label}
  </button>
)

// ─── Grid con filtros ────────────────────────────────────────────────────────

const GridFiltrado: React.FC<{
  productos: ProductoONE[]
  caficultores: Map<string, CaficultorONE>
  onSeleccionar: (p: ProductoONE) => void
}> = ({ productos, caficultores, onSeleccionar }) => {
  const [filtroProceso, setFiltroProceso] = useState<ProcesoONE | 'todos'>('todos')
  const [filtroRegion, setFiltroRegion] = useState<string>('todas')
  const [busqueda, setBusqueda] = useState('')

  const regiones = Array.from(new Set(
    productos.map(p => caficultores.get(p.caficultorId)?.region).filter(Boolean) as string[]
  )).sort()

  const termino = busqueda.toLowerCase().trim()
  const filtrados = productos.filter(p => {
    const region = caficultores.get(p.caficultorId)?.region
    const pasaProceso = filtroProceso === 'todos' || p.proceso === filtroProceso
    const pasaRegion = filtroRegion === 'todas' || region === filtroRegion
    const pasaBusqueda = !termino
      || p.nombre.toLowerCase().includes(termino)
      || p.variedad.toLowerCase().includes(termino)
      || p.caficultorNombre.toLowerCase().includes(termino)
      || p.notasSabor.some(n => n.toLowerCase().includes(termino))
    return pasaProceso && pasaRegion && pasaBusqueda
  })

  const procesos: { key: ProcesoONE | 'todos'; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'lavado', label: 'Lavado' },
    { key: 'natural', label: 'Natural' },
    { key: 'honey', label: 'Honey' },
    { key: 'anaerobico', label: 'Anaeróbico' },
  ]

  return (
    <div style={{ padding: '0 4% 60px' }}>
      <h2 style={{
        margin: '0 0 14px',
        fontSize: 17, fontWeight: 700,
        color: C.cream, fontFamily: 'Montserrat, sans-serif',
      }}>
        Todo el catálogo
      </h2>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.tan, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar por café, variedad, productor, notas..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: 8, border: `1px solid #2a2a2a`,
            background: C.bgCard, color: C.cream,
            fontSize: 13, fontFamily: 'Montserrat, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 16 }}>✕</button>
        )}
      </div>

      {/* Filtros por proceso */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {procesos.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            activo={filtroProceso === key}
            color={key === 'todos' ? C.terra : PROCESO_COLORS[key as ProcesoONE] ?? C.terra}
            onClick={() => setFiltroProceso(key)}
          />
        ))}
      </div>

      {/* Filtros por región */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Chip
          label="Todas las regiones"
          activo={filtroRegion === 'todas'}
          color={C.sage}
          onClick={() => setFiltroRegion('todas')}
        />
        {regiones.map(r => (
          <Chip
            key={r}
            label={r}
            activo={filtroRegion === r}
            color={C.sage}
            onClick={() => setFiltroRegion(r)}
          />
        ))}
      </div>

      {/* Contador */}
      <p style={{
        margin: '0 0 16px',
        fontSize: 12, color: C.tan,
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {filtrados.length} {filtrados.length === 1 ? 'café encontrado' : 'cafés encontrados'}
      </p>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 20,
      }}>
        {filtrados.map(p => (
          <ProductoCard
            key={p.id}
            producto={p}
            caficultor={caficultores.get(p.caficultorId)}
            onSeleccionar={onSeleccionar}
            width={undefined}
          />
        ))}
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
    const usarSeed = () => {
      setProductos(seedProductos as ProductoONE[])
      setCaficultores(new Map((seedCaficultores as CaficultorONE[]).map((c) => [c.id, c])))
      setLoading(false)
    }

    const timer = setTimeout(usarSeed, 3000)

    async function cargar() {
      try {
        const [prods, cafics] = await Promise.all([fetchProductos(), fetchCaficultores()])
        clearTimeout(timer)
        const productosFinales = prods.length > 0 ? prods : (seedProductos as ProductoONE[])
        const caficsFinales = cafics.length > 0 ? cafics : (seedCaficultores as CaficultorONE[])
        setProductos(productosFinales)
        setCaficultores(new Map(caficsFinales.map((c) => [c.id, c])))
      } catch {
        clearTimeout(timer)
        usarSeed()
      } finally {
        setLoading(false)
      }
    }
    cargar()
    return () => clearTimeout(timer)
  }, [])

  const destacado = productos[0]
  const caficultorDestacado = destacado ? caficultores.get(destacado.caficultorId) : undefined

  // Fila 1: primeros 8 productos como "destacados del mes"
  const destacados = productos.slice(0, 8)

  // Fila 2: siguientes 8 como "nuevos ingresos" (orden por createdAt desc en producción)
  const nuevos = productos.slice(8, 16)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header flotante */}
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

      {/* Contenido */}
      {!loading && productos.length > 0 && (
        <div style={{ paddingTop: 16 }}>
          {/* Fila 1 — Destacados del mes */}
          <CarruselRow
            titulo="Destacados del mes"
            productos={destacados}
            caficultores={caficultores}
            onSeleccionar={onSeleccionar}
          />

          {/* Fila 2 — Nuevos ingresos */}
          <CarruselRow
            titulo="Nuevos ingresos"
            productos={nuevos}
            caficultores={caficultores}
            onSeleccionar={onSeleccionar}
          />

          {/* Fila 3 — Grid con filtros */}
          <GridFiltrado
            productos={productos}
            caficultores={caficultores}
            onSeleccionar={onSeleccionar}
          />
        </div>
      )}

      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

export default CatalogoPublico
