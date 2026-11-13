/**
 * CatalogoPublico.tsx — Vista principal pública de TunayWasi ONE
 * Layout: Carruseles por caficultor → Grid con filtros
 */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { fetchProductos, fetchCaficultores } from '../service'
import type { ProductoONE, CaficultorONE, ProcesoONE, FormatoONE } from '../types'
import { PROCESO_LABELS, calcularPrecioFinal } from '../config'
import seedProductos from '../seed/one_productos.json'
import seedCaficultores from '../seed/one_caficultores.json'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  bgHover: '#1f1f1f',
  cream: '#f2e0cc',
  creamDim: '#c4b297',
  green: '#1f3028',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  brown: '#533b22',
  white: '#ffffff',
  border: '#2a2a2a',
  muted: '#555555',
}

interface ModoSeleccion {
  seleccionados: Set<string>
  onToggle: (p: ProductoONE) => void
  onConfirmar: () => void
  confirmando?: boolean
  max: number
}

interface ItemCarritoMin {
  producto: { id: string; nombre: string; precioBaseKgCents: number }
  formato: FormatoONE
  qty: number
}

interface Props {
  onSeleccionar?: (producto: ProductoONE, formato?: FormatoONE) => void
  modoSeleccion?: ModoSeleccion
  // Carrito acumulativo (cuando el usuario está logueado)
  carritoCount?: number
  totalCarritoCents?: number
  onIrAlCheckout?: () => void
  // IDs de productos ya en carrito (para mostrar estado)
  carritoProductoIds?: Set<string>
  // Líneas del carrito para mostrar chips en la barra flotante
  carritoLineas?: ItemCarritoMin[]
  isDemo?: boolean
  // Offset del sidebar del portal (para evitar que el header y barras flotantes queden tapadas)
  sidebarOffset?: number
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

// ─── Card compartida (carrusel + grid) ───────────────────────────────────────

const ProductoCard: React.FC<{
  producto: ProductoONE
  caficultor: CaficultorONE | undefined
  onSeleccionar: (p: ProductoONE) => void
  width?: number
  seleccionado?: boolean
  disabled?: boolean
  enCarrito?: boolean
}> = ({ producto, caficultor, onSeleccionar, width = 200, seleccionado, disabled, enCarrito }) => {
  const [hovered, setHovered] = useState(false)
  const procesoColor = PROCESO_COLORS[producto.proceso] ?? C.terra

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !disabled && onSeleccionar?.(producto)}
      style={{
        width,
        borderRadius: 8,
        overflow: 'visible',
        position: 'relative',
        transition: 'transform 0.2s ease',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        zIndex: hovered ? 10 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: '100%', height: 130, borderRadius: 8,
        background: C.bgCard, overflow: 'hidden', position: 'relative',
        border: seleccionado ? `2px solid ${C.terra}` : '2px solid transparent',
      }}>
        {producto.foto ? (
          <img
            src={producto.foto}
            alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : null}
        <div style={{
          position: 'absolute', inset: 0,
          background: producto.foto
            ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)'
            : `linear-gradient(135deg, ${C.green}88 0%, ${C.brown}44 100%)`,
        }} />
        {!producto.foto && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, opacity: 0.5,
          }}>
            ☕
          </div>
        )}
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
        {/* Badge urgencia stock — solo si no está en carrito */}
        {!enCarrito && producto.kgDisponibles < 15 && producto.id !== 'kit-inicio-001' && (
          <span style={{
            position: 'absolute', bottom: 8, left: 8,
            padding: '3px 8px', borderRadius: 4,
            background: '#b94040', color: '#ffffff',
            fontSize: 9, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
            letterSpacing: '0.04em',
          }}>
            ⚡ {producto.kgDisponibles} kg
          </span>
        )}
        {/* Badge "En tu pedido" */}
        {enCarrito && (
          <span style={{
            position: 'absolute', bottom: 8, left: 8,
            padding: '3px 8px', borderRadius: 4,
            background: '#1f3028', border: '1px solid #8faf8a55',
            color: '#8faf8a',
            fontSize: 9, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
            letterSpacing: '0.04em',
          }}>
            ✓ En tu pedido
          </span>
        )}
        {/* Checkmark si está seleccionado */}
        {seleccionado && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            width: 24, height: 24, borderRadius: '50%',
            background: C.terra, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: C.white, fontWeight: 700,
          }}>✓</div>
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
                desde {formatCents(calcularPrecioFinal(producto.precioBaseKgCents, '1kg'))}
              </span>
              <span style={{ fontSize: 10, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
                {producto.variedad}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); !disabled && onSeleccionar?.(producto) }}
              style={{
                width: '100%', padding: '7px 0', borderRadius: 5,
                border: 'none',
                background: seleccionado ? C.terra + '88' : C.terra,
                color: C.white,
                fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                cursor: disabled ? 'not-allowed' : 'pointer', marginBottom: 4,
              }}>
              {seleccionado !== undefined
                ? (seleccionado ? '✓ Seleccionado' : 'Agregar a mi carta')
                : 'Quiero este café →'
              }
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
  subtitulo?: string
  productos: ProductoONE[]
  caficultores: Map<string, CaficultorONE>
  onSeleccionar: (p: ProductoONE) => void
  seleccionados?: Set<string>
}> = ({ titulo, subtitulo, productos, caficultores, onSeleccionar, seleccionados }) => {
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
      <div style={{ margin: '0 0 10px 4%' }}>
        <h2 style={{
          margin: 0,
          fontSize: 17, fontWeight: 700,
          color: C.cream, fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '0.02em',
        }}>
          {titulo}
        </h2>
        {subtitulo && (
          <p style={{ margin: '3px 0 0', fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
            {subtitulo}
          </p>
        )}
      </div>
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
                seleccionado={seleccionados ? seleccionados.has(p.id) : undefined}
                disabled={seleccionados ? (seleccionados.size >= 3 && !seleccionados.has(p.id)) : false}
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
  seleccionados?: Set<string>
  carritoProductoIds?: Set<string>
}> = ({ productos, caficultores, onSeleccionar, seleccionados, carritoProductoIds }) => {
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
            seleccionado={seleccionados ? seleccionados.has(p.id) : undefined}
            disabled={seleccionados ? (seleccionados.size >= 3 && !seleccionados.has(p.id)) : false}
            enCarrito={carritoProductoIds?.has(p.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Drawer de detalle ───────────────────────────────────────────────────────

const DetalleDrawer: React.FC<{
  producto: ProductoONE
  caficultor: CaficultorONE | undefined
  onCerrar: () => void
  onAgregar: (producto: ProductoONE, formato: FormatoONE, cantidadKg: number) => void
  enCarrito: boolean
  todosProductos?: ProductoONE[]
  todosCaficultores?: Map<string, CaficultorONE>
  onVerOtroProducto?: (p: ProductoONE) => void
}> = ({ producto, caficultor, onCerrar, onAgregar, enCarrito, todosProductos = [], onVerOtroProducto }) => {
  const [cantidadKg, setCantidadKg] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [fotoIdx, setFotoIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const procesoColor = PROCESO_COLORS[producto.proceso] ?? C.terra

  const fotos = (producto.fotos?.length ? producto.fotos : producto.foto ? [producto.foto] : []).filter(Boolean)

  const maxKg = producto.kgDisponibles || 999
  const precioPorKgCents = producto.precioBaseKgCents
  const totalCents = precioPorKgCents * cantidadKg

  function cambiarCantidad(delta: number) {
    setCantidadKg(prev => Math.min(maxKg, Math.max(1, prev + delta)))
  }

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox) setLightbox(false)
        else onCerrar()
      }
      if (lightbox && e.key === 'ArrowRight') setFotoIdx(i => Math.min(fotos.length - 1, i + 1))
      if (lightbox && e.key === 'ArrowLeft') setFotoIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar, lightbox, fotos.length])

  function handleAgregar() {
    onAgregar(producto, '1kg', cantidadKg)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <>
      {/* Lightbox fullscreen */}
      {lightbox && fotos.length > 0 && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <img
            src={fotos[fotoIdx]}
            alt={producto.nombre}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 4,
              boxShadow: '0 8px 64px rgba(0,0,0,0.8)',
            }}
          />
          {/* Flecha izq */}
          {fotoIdx > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setFotoIdx(i => i - 1) }}
              style={{
                position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', fontSize: 28, cursor: 'pointer', borderRadius: '50%',
                width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >‹</button>
          )}
          {/* Flecha der */}
          {fotoIdx < fotos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setFotoIdx(i => i + 1) }}
              style={{
                position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', fontSize: 28, cursor: 'pointer', borderRadius: '50%',
                width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >›</button>
          )}
          {/* Cerrar */}
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 18, cursor: 'pointer', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
          {/* Contador */}
          {fotos.length > 1 && (
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, alignItems: 'center' }}>
              {fotos.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setFotoIdx(i) }} style={{
                  width: i === fotoIdx ? 24 : 8, height: 8, borderRadius: 4,
                  background: i === fotoIdx ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s',
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay drawer */}
      <div
        onClick={onCerrar}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel — drawer lateral derecho, ancho fijo, scroll vertical único */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 'min(520px, 100vw)',
        background: '#111111',
        borderLeft: `1px solid ${C.border}`,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)', border: `1px solid ${C.border}`,
            color: C.cream, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>

        {/* ── Galería ── */}
        <div style={{
          position: 'relative', height: 280, flexShrink: 0,
          background: `linear-gradient(135deg, ${C.green} 0%, ${C.brown}88 100%)`,
          overflow: 'hidden',
        }}>
          {fotos.length > 0 && (
            <img
              src={fotos[fotoIdx]}
              alt={producto.nombre}
              onClick={() => setLightbox(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          {/* Botón zoom explícito */}
          {fotos.length > 0 && (
            <button
              onClick={() => setLightbox(true)}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 5,
                background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 14, cursor: 'pointer', borderRadius: 6,
                padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              }}
            >⤢ Ver</button>
          )}
          {!fotos.length && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, opacity: 0.12 }}>☕</div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, #111111, transparent)' }} />
          {fotos.length > 1 && fotoIdx > 0 && (
            <button onClick={() => setFotoIdx(i => i - 1)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: C.white, fontSize: 18, cursor: 'pointer', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          )}
          {fotos.length > 1 && fotoIdx < fotos.length - 1 && (
            <button onClick={() => setFotoIdx(i => i + 1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: C.white, fontSize: 18, cursor: 'pointer', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          )}
          {fotos.length > 1 && (
            <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {fotos.map((_, i) => (
                <button key={i} onClick={() => setFotoIdx(i)} style={{ width: i === fotoIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === fotoIdx ? C.terra : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s' }} />
              ))}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
            <span style={{ padding: '3px 10px', borderRadius: 4, background: procesoColor, color: C.white, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {PROCESO_LABELS[producto.proceso]}
            </span>
            {producto.puntajeReferencial && (
              <span style={{ marginLeft: 6, padding: '3px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: C.sage, fontSize: 10, fontWeight: 700 }}>
                {producto.puntajeReferencial} pts SCA
              </span>
            )}
          </div>
        </div>

        {/* ── Contenido scrolleable ── */}
        <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Nombre */}
          <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.2 }}>
            {producto.nombre}
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: C.tan }}>
            {caficultor?.region ?? ''}{producto.altitudMsnm ? ` · ${producto.altitudMsnm.toLocaleString()} msnm` : ''} · Cosecha {producto.cosecha}
          </p>

          {/* Notas de sabor */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {producto.notasSabor.map(nota => (
              <span key={nota} style={{ padding: '3px 10px', borderRadius: 20, background: procesoColor + '22', border: `1px solid ${procesoColor}44`, color: procesoColor, fontSize: 11, fontWeight: 600 }}>
                {nota}
              </span>
            ))}
          </div>

          {/* Grid técnico */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0, marginBottom: 18,
            borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}>
            {[
              { label: 'Variedad', value: producto.variedad },
              { label: 'Proceso', value: PROCESO_LABELS[producto.proceso] },
              { label: 'Tueste', value: producto.nivelTueste },
              { label: 'Present.', value: producto.presentacion === 'tostado_grano' ? 'En grano' : 'Molido' },
              { label: 'Stock', value: `${producto.kgDisponibles} kg`, color: C.sage },
            ].map((item, idx, arr) => (
              <div key={item.label} style={{
                padding: '10px 6px', textAlign: 'center',
                borderRight: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                background: '#141414',
              }}>
                <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700, color: item.color ?? C.cream, textTransform: 'capitalize' }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Descripción */}
          {producto.descripcion && (
            <p style={{ margin: '0 0 18px', fontSize: 13, color: C.cream + 'cc', lineHeight: 1.7 }}>
              {producto.descripcion}
            </p>
          )}

          {/* Caficultor */}
          {caficultor && (
            <div style={{
              padding: '14px 16px', borderRadius: 10, marginBottom: 18,
              border: `1px solid ${C.border}`,
              background: `linear-gradient(135deg, ${C.green}18, #141414)`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.green, border: `2px solid ${C.sage}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🧑‍🌾</div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream }}>{caficultor.nombre}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{caficultor.distrito}, {caficultor.region} · {caficultor.altitudMsnm?.toLocaleString()} msnm</p>
              </div>
            </div>
          )}

          {/* Precio */}
          <div style={{ marginBottom: 4 }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precio</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.terra, letterSpacing: '-0.02em' }}>
              S/ {(precioPorKgCents / 100).toFixed(0)}
              <span style={{ fontSize: 14, fontWeight: 400, color: C.tan, marginLeft: 6 }}>/kg</span>
            </p>
          </div>

          {/* Urgencia */}
          {producto.kgDisponibles < 15 && producto.id !== 'kit-inicio-001' && (
            <div style={{ margin: '12px 0', padding: '8px 12px', borderRadius: 8, background: '#b9404018', border: '1px solid #b9404055', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13 }}>⚡</span>
              <span style={{ fontSize: 12, color: '#e87070', fontWeight: 600 }}>Solo quedan {producto.kgDisponibles} kg · Cosecha {producto.cosecha}</span>
            </div>
          )}

          {/* Separador */}
          <div style={{ borderTop: `1px solid ${C.border}`, margin: '20px 0 16px' }} />

          {/* Selector de cantidad */}
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cantidad</p>

          {/* Chips rápidos */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[1, 5, 10, 25].filter(n => n <= maxKg).map(n => (
              <button key={n} onClick={() => setCantidadKg(n)} style={{
                padding: '5px 14px', borderRadius: 6,
                border: `1px solid ${cantidadKg === n ? C.terra : C.border}`,
                background: cantidadKg === n ? C.terra + '20' : 'transparent',
                color: cantidadKg === n ? C.terra : C.tan,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.12s',
              }}>
                {n} kg
              </button>
            ))}
          </div>

          {/* Stepper compacto — no full width */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#161616', borderRadius: 8, border: `1px solid ${C.border}`, height: 38 }}>
              <button onClick={() => cambiarCantidad(-1)} disabled={cantidadKg <= 1} style={{
                width: 36, height: 38, border: 'none', background: 'transparent',
                color: cantidadKg <= 1 ? C.muted : C.cream, fontSize: 18,
                cursor: cantidadKg <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                borderRight: `1px solid ${C.border}`,
              }}>−</button>
              <input type="number" value={cantidadKg} min={1} max={maxKg}
                onChange={e => setCantidadKg(Math.max(1, Math.min(maxKg, parseInt(e.target.value) || 1)))}
                style={{ width: 52, textAlign: 'center', border: 'none', background: 'transparent', color: C.cream, fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', outline: 'none' }}
              />
              <span style={{ fontSize: 13, color: C.tan, paddingRight: 2 }}>kg</span>
              <button onClick={() => cambiarCantidad(1)} disabled={cantidadKg >= maxKg} style={{
                width: 36, height: 38, border: 'none', background: 'transparent',
                color: cantidadKg >= maxKg ? C.muted : C.cream, fontSize: 18,
                cursor: cantidadKg >= maxKg ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                borderLeft: `1px solid ${C.border}`,
              }}>+</button>
            </div>
            <span style={{ fontSize: 12, color: C.muted }}>máx {maxKg} kg</span>
          </div>
          <div style={{ marginBottom: 20 }} />

          {/* Total + botón */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: C.tan }}>{cantidadKg} kg × S/ {(precioPorKgCents / 100).toFixed(0)}/kg</span>
            <span style={{ fontSize: 30, fontWeight: 800, color: C.terra, letterSpacing: '-0.02em' }}>S/ {(totalCents / 100).toFixed(0)}</span>
          </div>
          <button onClick={handleAgregar} style={{
            width: '100%', padding: '15px',
            borderRadius: 10, border: 'none',
            background: agregado ? C.sage : C.terra,
            color: C.white, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.3s',
            letterSpacing: '0.02em',
          }}>
            {agregado ? '✓ Agregado al carrito' : (enCarrito ? '+ Agregar más' : 'Agregar al carrito →')}
          </button>

          {producto.notaReferencial && (
            <p style={{ margin: '14px 0 0', fontSize: 11, color: C.muted, fontStyle: 'italic' }}>* {producto.notaReferencial}</p>
          )}

          {/* Cross-selling: Más cafés de este productor */}
          {(() => {
            const otrosDelCaficultor = todosProductos
              .filter(p => p.caficultorId === producto.caficultorId && p.id !== producto.id)
              .slice(0, 3)
            if (otrosDelCaficultor.length === 0) return null
            return (
              <div style={{ marginTop: 28 }}>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Más de {caficultor?.nombre ?? producto.caficultorNombre}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {otrosDelCaficultor.map(p => {
                      const pc = PROCESO_COLORS[p.proceso] ?? C.terra
                      return (
                        <div
                          key={p.id}
                          onClick={() => onVerOtroProducto?.(p)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 10,
                            background: '#161616', border: `1px solid ${C.border}`,
                            cursor: 'pointer', transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = C.terra + '55')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                            background: pc + '22', border: `1px solid ${pc}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20,
                          }}>☕</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.nombre}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: C.tan }}>
                              {p.variedad} · {PROCESO_LABELS[p.proceso] ?? p.proceso}
                            </p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.terra, flexShrink: 0 }}>
                            S/{(p.precioBaseKgCents / 100).toFixed(0)}/kg
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const CatalogoPublico: React.FC<Props> = ({ onSeleccionar, modoSeleccion, carritoCount = 0, totalCarritoCents = 0, onIrAlCheckout, carritoProductoIds, carritoLineas, isDemo = false, sidebarOffset = 0 }) => {
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [caficultores, setCaficultores] = useState<Map<string, CaficultorONE>>(new Map())
  const [loading, setLoading] = useState(true)
  const [productoDetalle, setProductoDetalle] = useState<ProductoONE | null>(null)
  const [modalRegistro, setModalRegistro] = useState(false)

  // Cerrar drawer estable como callback
  const cerrarDetalle = useCallback(() => setProductoDetalle(null), [])

  useEffect(() => {
    const usarSeed = () => {
      console.log('[CatalogoPublico] Usando datos seed (fallback)')
      setProductos(seedProductos as ProductoONE[])
      setCaficultores(new Map((seedCaficultores as CaficultorONE[]).map((c) => [c.id, c])))
      setLoading(false)
    }

    if (isDemo) {
      console.log('[CatalogoPublico] Modo demo — seed')
      usarSeed()
      return
    }

    console.log('[CatalogoPublico] Cargando desde Firestore...')
    const timer = setTimeout(usarSeed, 3000)

    async function cargar() {
      try {
        const [prods, cafics] = await Promise.all([fetchProductos(), fetchCaficultores()])
        clearTimeout(timer)
        console.log(`[CatalogoPublico] Firestore OK — ${prods.length} productos, ${cafics.length} caficultores`)
        const productosFinales = prods.length > 0 ? prods : (seedProductos as ProductoONE[])
        const caficsFinales = cafics.length > 0 ? cafics : (seedCaficultores as CaficultorONE[])
        if (prods.length === 0) console.warn('[CatalogoPublico] Productos vacíos en Firestore — usando seed')
        if (cafics.length === 0) console.warn('[CatalogoPublico] Caficultores vacíos en Firestore — usando seed')
        setProductos(productosFinales)
        setCaficultores(new Map(caficsFinales.map((c) => [c.id, c])))
      } catch (err) {
        clearTimeout(timer)
        console.error('[CatalogoPublico] Error al cargar Firestore — usando seed', err)
        usarSeed()
      } finally {
        setLoading(false)
      }
    }
    cargar()
    return () => clearTimeout(timer)
  }, [isDemo])

  // Agrupar productos por caficultor (excluir kit-inicio-001 del catálogo)
  // En modo normal: top 4. En modo selección: todos los caficultores
  const productosParaCatalogo = productos.filter(p => p.id !== 'kit-inicio-001')

  const porCaficultor: Map<string, ProductoONE[]> = new Map()
  for (const p of productosParaCatalogo) {
    const lista = porCaficultor.get(p.caficultorId) ?? []
    porCaficultor.set(p.caficultorId, [...lista, p])
  }
  const caficultoresOrdenados = [...porCaficultor.entries()]
    .sort((a, b) => b[1].length - a[1].length)
  const filasCarrusel = modoSeleccion ? caficultoresOrdenados : caficultoresOrdenados.slice(0, 4)

  // En modo selección: toggle directo. En modo normal: abrir drawer de detalle
  const handleCard = modoSeleccion
    ? (p: ProductoONE) => modoSeleccion.onToggle(p)
    : (p: ProductoONE) => setProductoDetalle(p)

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'Montserrat, sans-serif',
      position: 'relative',
      // Fondo de la página: imagen de finca fija + overlay oscuro
      ...((!modoSeleccion && sidebarOffset === 0) ? {
        backgroundImage: 'url(/imgs/hero-finca.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
        backgroundAttachment: 'fixed',
      } : { background: C.bg }),
    }}>
      {/* Header flotante — solo en modo standalone (sin portal) */}
      {!modoSeleccion && sidebarOffset === 0 && (
        <header style={{
          position: 'fixed', top: 0, left: sidebarOffset, right: 0, zIndex: 100,
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="#/para-caficultores" style={{
              color: C.tan, fontSize: 13, textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif',
              padding: '7px 14px',
            }}>
              Soy caficultor
            </a>
            <a href="#/para-cafeterias" style={{
              color: C.tan, fontSize: 13, textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif',
              padding: '7px 14px',
            }}>
              Soy negocio
            </a>
            <button onClick={() => setModalRegistro(true)} style={{
              color: C.cream, fontSize: 13,
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              padding: '7px 16px', borderRadius: 4,
              border: `1px solid ${C.terra}`,
              background: 'none', cursor: 'pointer',
            }}>
              Registrarse
            </button>
            <a href="#/portal" style={{
              color: C.cream, fontSize: 13, textDecoration: 'none',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              padding: '7px 18px', borderRadius: 4,
              background: C.terra,
            }}>
              Mi portal
            </a>
          </div>
        </header>
      )}

      {/* Overlay oscuro sobre toda la página (solo modo standalone) */}
      {!modoSeleccion && sidebarOffset === 0 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'rgba(10,10,10,0.72)',
        }} />
      )}

      {/* Hero — texto sobre imagen de fondo */}
      {!modoSeleccion && sidebarOffset === 0 && (
        <div style={{
          position: 'relative', zIndex: 1,
          height: 'clamp(320px, 52vw, 580px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px 48px',
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
            color: '#8faf8a', textTransform: 'uppercase', marginBottom: 14,
          }}>
            Café de especialidad peruano
          </span>
          <h1 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700, color: '#f2e0cc',
            lineHeight: 1.05, letterSpacing: '-0.01em',
          }}>
            Del caficultor<br />a tu local.
          </h1>
          <p style={{
            margin: '0 0 32px',
            fontSize: 'clamp(13px, 1.5vw, 16px)',
            color: '#c4b297', lineHeight: 1.6,
            maxWidth: 460,
          }}>
            Lotes con trazabilidad completa — región, altitud, variedad y proceso — directamente de la finca.
          </p>
          <a
            href="#catalogo"
            onClick={e => {
              e.preventDefault()
              document.getElementById('catalogo-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              padding: '13px 32px', borderRadius: 8,
              background: '#c96e4b', color: '#fff',
              fontSize: 14, fontWeight: 700,
              textDecoration: 'none', letterSpacing: '0.04em',
            }}
          >
            Ver catálogo →
          </a>
        </div>
      )}

      {/* Divisor */}
      <div id="catalogo-section" style={{ padding: '32px 4% 8px', borderTop: modoSeleccion ? 'none' : `1px solid ${C.border}`, position: 'relative', zIndex: 1 }}>
        <h2 style={{
          margin: 0,
          fontSize: 22, fontWeight: 700,
          color: C.cream, fontFamily: 'Cormorant Garamond, serif',
          letterSpacing: '0.02em',
        }}>
          {modoSeleccion ? 'Elige tus cafés' : 'Los cafés disponibles hoy'}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
          {modoSeleccion
            ? `Selecciona hasta ${modoSeleccion.max} · ${modoSeleccion.seleccionados.size} elegidos`
            : 'Todos con historia, origen y trazabilidad verificada'
          }
        </p>
      </div>

      {/* Carruseles y grid */}
      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ color: C.tan, fontSize: 14 }}>Cargando catálogo...</p>
        </div>
      ) : (
        <div style={{ paddingTop: 24, paddingBottom: modoSeleccion ? 120 : 0, position: 'relative', zIndex: 1 }}>
          {/* Carruseles por caficultor */}
          {filasCarrusel.map(([caficultorId, prods]) => {
            const caficultor = caficultores.get(caficultorId)
            if (!caficultor) return null
            return (
              <CarruselRow
                key={caficultorId}
                titulo={`Cafés de ${caficultor.nombre}`}
                subtitulo={`${caficultor.region} · ${caficultor.altitudMsnm?.toLocaleString()} msnm`}
                productos={prods.slice(0, 8)}
                caficultores={caficultores}
                onSeleccionar={handleCard}
                seleccionados={modoSeleccion?.seleccionados}
              />
            )
          })}

          {/* Grid con filtros */}
          <GridFiltrado
            productos={productosParaCatalogo}
            caficultores={caficultores}
            onSeleccionar={handleCard}
            seleccionados={modoSeleccion?.seleccionados}
            carritoProductoIds={carritoProductoIds}
          />
        </div>
      )}

      {/* Floating CTA bar — solo en modo selección */}
      {modoSeleccion && (
        <div style={{
          position: 'fixed', bottom: 0, left: sidebarOffset, right: 0, zIndex: 50,
          background: 'linear-gradient(to top, #0a0a0a 70%, transparent)',
          padding: '20px 4% 28px',
          pointerEvents: 'none',
        }}>
          <div style={{ maxWidth: 600, margin: '0 auto', pointerEvents: 'all' }}>
            {modoSeleccion.seleccionados.size > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[...modoSeleccion.seleccionados].map(id => {
                  const p = productos.find(x => x.id === id)
                  if (!p) return null
                  return (
                    <span key={id} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 600,
                      background: (PROCESO_COLORS[p.proceso] ?? C.terra) + '33',
                      color: PROCESO_COLORS[p.proceso] ?? C.terra,
                      border: `1px solid ${(PROCESO_COLORS[p.proceso] ?? C.terra)}55`,
                    }}>
                      {p.nombre}
                    </span>
                  )
                })}
              </div>
            )}
            <button
              onClick={() => modoSeleccion.onConfirmar()}
              disabled={modoSeleccion.confirmando}
              style={{
                width: '100%', padding: '15px', borderRadius: 10,
                background: modoSeleccion.confirmando ? '#555' : C.terra,
                color: C.white, border: 'none',
                fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                cursor: modoSeleccion.confirmando ? 'not-allowed' : 'pointer',
              }}
            >
              {modoSeleccion.confirmando ? 'Creando tu cuenta...' : (
                modoSeleccion.seleccionados.size > 0
                  ? `${modoSeleccion.seleccionados.size} de ${modoSeleccion.max} · Crear mi cuenta →`
                  : 'Crear mi cuenta →'
              )}
            </button>
            {modoSeleccion.seleccionados.size === 0 && (
              <p style={{ margin: '8px 0 0', fontSize: 11, color: C.tan, textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>
                Puedes elegir cafés desde el catálogo también.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Barra flotante de carrito — cuando hay ítems y no estamos en modoSelección */}
      {!modoSeleccion && carritoCount > 0 && onIrAlCheckout && (
        <div style={{
          position: 'fixed', bottom: 0, left: sidebarOffset, right: 0, zIndex: 50,
          background: 'linear-gradient(to top, #0a0a0a 70%, transparent)',
          padding: '16px 4% 28px',
          animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Chips de ítems del carrito */}
            {carritoLineas && carritoLineas.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {carritoLineas.slice(0, 3).map((item, i) => {
                  const precio = calcularPrecioFinal(item.producto.precioBaseKgCents, item.formato)
                  const nombreCorto = item.producto.nombre.split(' ').slice(0, 2).join(' ')
                  return (
                    <span key={i} style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 10, fontWeight: 600,
                      background: C.terra + '22', border: `1px solid ${C.terra}44`,
                      color: C.cream, whiteSpace: 'nowrap',
                    }}>
                      {nombreCorto} · S/{((precio * item.qty) / 100).toFixed(0)}
                    </span>
                  )
                })}
                {carritoLineas.length > 3 && (
                  <span style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 10, fontWeight: 600,
                    background: '#222', color: C.tan, whiteSpace: 'nowrap',
                  }}>
                    +{carritoLineas.length - 3} más
                  </span>
                )}
              </div>
            )}
            <button
              onClick={onIrAlCheckout}
              style={{
                width: '100%', padding: '16px 20px', borderRadius: 12,
                background: `linear-gradient(135deg, ${C.terra}, #d4825f)`,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: `0 4px 24px ${C.terra}44`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: 'Montserrat, sans-serif' }}>
                🛒 {carritoCount} {carritoCount === 1 ? 'producto' : 'productos'} · Despacho directo del caficultor
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }}>
                S/ {(totalCarritoCents / 100).toFixed(0)} · Ir al checkout →
              </span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Drawer de detalle — solo en modo normal */}
      {!modoSeleccion && productoDetalle && (
        <DetalleDrawer
          producto={productoDetalle}
          caficultor={caficultores.get(productoDetalle.caficultorId)}
          onCerrar={cerrarDetalle}
          onAgregar={(producto, formato, cantidadKg) => {
            // Llamar onSeleccionar tantas veces como kg pidió
            for (let i = 0; i < cantidadKg; i++) {
              onSeleccionar?.(producto, formato)
            }
          }}
          enCarrito={carritoProductoIds?.has(productoDetalle.id) ?? false}
          todosProductos={productosParaCatalogo}
          todosCaficultores={caficultores}
          onVerOtroProducto={(p) => setProductoDetalle(p)}
        />
      )}
      {/* Modal selección de rol para registro */}
      {modalRegistro && (
        <div
          onClick={() => setModalRegistro(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f0f0f',
              borderRadius: 20,
              padding: '36px 32px 28px',
              maxWidth: 420,
              width: '100%',
              border: '1px solid #252525',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            {/* Logo / marca */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.terra, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Tunay Wasi
              </span>
              <h2 style={{
                margin: '6px 0 6px',
                fontSize: 26,
                fontWeight: 700,
                color: C.cream,
                fontFamily: 'Cormorant Garamond, serif',
                lineHeight: 1.2,
              }}>
                ¿Cómo quieres unirte?
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                Elige tu rol para crear tu cuenta gratis
              </p>
            </div>

            {/* Opción Negocio */}
            <a
              href="#/registro-emprendedor"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 18px', borderRadius: 12,
                border: `1px solid ${C.terra}55`,
                background: `linear-gradient(135deg, ${C.terra}12, ${C.terra}06)`,
                textDecoration: 'none', marginBottom: 10,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${C.terra}18`,
                border: `1px solid ${C.terra}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                ☕
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: C.cream }}>
                  Soy negocio
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#777', lineHeight: 1.5 }}>
                  Cafetería, restaurante o tienda
                </p>
              </div>
              <span style={{ marginLeft: 'auto', color: C.terra, fontSize: 16, flexShrink: 0 }}>→</span>
            </a>

            {/* Opción Caficultor */}
            <a
              href="#/registro-caficultor"
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 18px', borderRadius: 12,
                border: `1px solid ${C.sage}44`,
                background: `linear-gradient(135deg, ${C.sage}0f, ${C.sage}06)`,
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${C.sage}15`,
                border: `1px solid ${C.sage}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                🌱
              </div>
              <div>
                <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: C.cream }}>
                  Soy caficultor
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#777', lineHeight: 1.5 }}>
                  Productor de café en Perú
                </p>
              </div>
              <span style={{ marginLeft: 'auto', color: C.sage, fontSize: 16, flexShrink: 0 }}>→</span>
            </a>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#222' }} />
              <span style={{ fontSize: 11, color: '#444', letterSpacing: '0.06em' }}>¿YA TIENES CUENTA?</span>
              <div style={{ flex: 1, height: 1, background: '#222' }} />
            </div>

            {/* Botón Iniciar sesión */}
            <a
              href="#/login"
              onClick={() => setModalRegistro(false)}
              style={{
                display: 'block', textAlign: 'center',
                padding: '13px', borderRadius: 10,
                border: 'none',
                background: '#c96e4b',
                color: '#ffffff', fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              Iniciar sesión
            </a>

            <button
              onClick={() => setModalRegistro(false)}
              style={{
                display: 'block', width: '100%', marginTop: 12,
                background: 'none', border: 'none',
                color: '#444', fontSize: 12, cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.03em',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogoPublico
