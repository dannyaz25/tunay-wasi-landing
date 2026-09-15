/**
 * CatalogoPublico.tsx — Vista principal pública de TunayWasi ONE
 *
 * Muestra los cafés disponibles con foto del caficultor, historia
 * y precios por formato. Sin filtros. Sin búsqueda.
 * CTA: "Quiero este café para mi cafetería"
 */
import React, { useEffect, useState } from 'react'
import { fetchProductos, fetchCaficultores } from '../service'
import type { ProductoONE, CaficultorONE } from '../types'
import { PROCESO_LABELS } from '../config'
import seedProductos from '../seed/one_productos.json'
import seedCaficultores from '../seed/one_caficultores.json'

const C = {
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

const NotasSabor: React.FC<{ notas: string[] }> = ({ notas }) => (
  <p style={{
    fontSize: 13,
    color: C.brown,
    fontStyle: 'italic',
    margin: '4px 0 0',
    fontFamily: 'Cormorant Garamond, serif',
    letterSpacing: '0.02em',
  }}>
    {notas.join(' · ')}
  </p>
)

const BadgeProceso: React.FC<{ proceso: string }> = ({ proceso }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    background: C.sage + '33',
    color: C.green,
    fontSize: 11,
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }}>
    {PROCESO_LABELS[proceso] ?? proceso}
  </span>
)

const PreciosRow: React.FC<{ precios: ProductoONE['precios'] }> = ({ precios }) => (
  <div style={{
    display: 'flex',
    gap: 12,
    margin: '12px 0',
    flexWrap: 'wrap',
  }}>
    {([
      ['250g', precios.g250],
      ['1 kg', precios.kg1],
      ['5 kg', precios.kg5],
    ] as [string, number][]).map(([label, cents]) => (
      <div key={label} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: C.cream,
        border: `1px solid ${C.tan}`,
        borderRadius: 8,
        padding: '6px 14px',
        minWidth: 72,
      }}>
        <span style={{ fontSize: 11, color: C.tan, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontSize: 16, color: C.green, fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>
          {formatCents(cents)}
        </span>
      </div>
    ))}
  </div>
)

interface CardProps {
  producto: ProductoONE
  caficultor: CaficultorONE | undefined
  onSeleccionar: (p: ProductoONE) => void
}

const ProductoCard: React.FC<CardProps> = ({ producto, caficultor, onSeleccionar }) => (
  <div style={{
    background: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(31,48,40,0.10)',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 480,
    width: '100%',
    margin: '0 auto',
  }}>
    {/* Imagen del caficultor / producto */}
    <div style={{ position: 'relative', height: 220, background: C.tan + '44' }}>
      {caficultor?.foto ? (
        <img
          src={caficultor.foto}
          alt={caficultor.nombre}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.tan, fontSize: 48,
        }}>
          ☕
        </div>
      )}
      {/* Badge de origen */}
      {caficultor && (
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'rgba(31,48,40,0.85)',
          borderRadius: 8, padding: '6px 12px',
        }}>
          <p style={{
            margin: 0, color: C.cream, fontSize: 13,
            fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
          }}>
            {caficultor.nombre}
          </p>
          <p style={{
            margin: 0, color: C.sage, fontSize: 11,
            fontFamily: 'Montserrat, sans-serif',
          }}>
            {caficultor.region} · {caficultor.altitudMsnm.toLocaleString()} msnm
          </p>
        </div>
      )}
    </div>

    {/* Contenido */}
    <div style={{ padding: '20px 24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: 20,
            fontFamily: 'Cormorant Garamond, serif',
            color: C.green,
            fontWeight: 700,
            lineHeight: 1.2,
          }}>
            {producto.nombre}
          </h3>
          <p style={{
            margin: '4px 0 0',
            fontSize: 13,
            color: C.tan,
            fontFamily: 'Montserrat, sans-serif',
          }}>
            {producto.variedad} · {producto.cosecha}
          </p>
        </div>
        <BadgeProceso proceso={producto.proceso} />
      </div>

      <NotasSabor notas={producto.notasSabor} />

      {producto.puntajeReferencial && (
        <p style={{
          margin: '8px 0 0',
          fontSize: 12,
          color: C.tan,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          ~{producto.puntajeReferencial} pts · <em>{producto.notaReferencial}</em>
        </p>
      )}

      <PreciosRow precios={producto.precios} />

      <button
        onClick={() => onSeleccionar(producto)}
        style={{
          width: '100%',
          padding: '14px 0',
          background: C.terra,
          color: C.white,
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.03em',
          transition: 'opacity 0.15s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.88')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Quiero este café para mi cafetería →
      </button>

      {/* Link al perfil del caficultor */}
      {caficultor && (
        <a
          href={`#/caficultor/${caficultor.id}`}
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 10,
            fontSize: 12,
            color: C.tan,
            fontFamily: 'Montserrat, sans-serif',
            textDecoration: 'none',
          }}
        >
          Ver historia de {caficultor.nombre} →
        </a>
      )}
    </div>
  </div>
)

// ─── Componente principal ─────────────────────────────────────────────────────

const CatalogoPublico: React.FC<Props> = ({ onSeleccionar }) => {
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [caficultores, setCaficultores] = useState<Map<string, CaficultorONE>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [prods, cafics] = await Promise.all([
          fetchProductos(),
          fetchCaficultores(),
        ])
        // Si Firestore no tiene datos aún, usar seed local
        const productosFinales = prods.length > 0 ? prods : (seedProductos as ProductoONE[])
        const caficsFinales = cafics.length > 0 ? cafics : (seedCaficultores as CaficultorONE[])
        setProductos(productosFinales)
        const mapa = new Map(caficsFinales.map((c) => [c.id, c]))
        setCaficultores(mapa)
      } catch (e) {
        // Firestore no disponible — usar seed local
        setProductos(seedProductos as ProductoONE[])
        const mapa = new Map((seedCaficultores as CaficultorONE[]).map((c) => [c.id, c]))
        setCaficultores(mapa)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: C.green,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            color: C.cream,
            fontSize: 22,
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}>
            TUNAY WASI
          </h1>
          <p style={{ margin: 0, color: C.sage, fontSize: 12, letterSpacing: '0.06em' }}>
            CAFÉ PERUANO · DIRECTO DEL PRODUCTOR
          </p>
        </div>
        <a
          href="#/portal"
          style={{
            color: C.tan, fontSize: 12, textDecoration: 'none',
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          Mi portal →
        </a>
      </header>

      {/* Hero */}
      <div style={{
        background: C.green,
        padding: '32px 24px 40px',
        textAlign: 'center',
      }}>
        <p style={{
          margin: '0 auto',
          maxWidth: 520,
          color: C.cream,
          fontSize: 17,
          lineHeight: 1.6,
          fontFamily: 'Cormorant Garamond, serif',
        }}>
          Café de especialidad peruano para tu cafetería — con la historia del
          productor lista para tu carta y tus mesas desde el día uno.
        </p>
      </div>

      {/* Catálogo */}
      <main style={{ padding: '32px 20px 60px', maxWidth: 560, margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: C.tan }}>
            Cargando catálogo...
          </div>
        )}

        {!loading && productos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: C.tan }}>
            Próximamente — catálogo en preparación.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {productos.map((producto) => (
            <ProductoCard
              key={producto.id}
              producto={producto}
              caficultor={caficultores.get(producto.caficultorId)}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </div>

        {/* Propuesta de valor */}
        {!loading && productos.length > 0 && (
          <div style={{
            marginTop: 48,
            padding: '24px 20px',
            background: C.green,
            borderRadius: 16,
            textAlign: 'center',
          }}>
            <h3 style={{
              margin: '0 0 12px',
              color: C.cream,
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 20,
              fontWeight: 700,
            }}>
              ¿Qué incluye tu pedido?
            </h3>
            {[
              '☕  Café tostado con etiqueta Tunay Wasi',
              '📄  Menú personalizado con la historia del productor',
              '🃏  Fichas para tus mesas (imprimibles)',
              '📱  QR de trazabilidad para tus clientes',
              '📸  Pack de fotos de la finca para Instagram',
            ].map((item) => (
              <p key={item} style={{
                margin: '6px 0',
                color: C.cream,
                fontSize: 14,
                fontFamily: 'Montserrat, sans-serif',
                lineHeight: 1.4,
              }}>
                {item}
              </p>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default CatalogoPublico
