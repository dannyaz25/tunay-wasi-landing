/**
 * PerfilCafeteria.tsx — Página pública de una cafetería
 * Destino: #/cafeteria/:id — QR en la mesa apunta aquí
 * Sin auth — accesible para el cliente final
 */
import React, { useEffect, useState } from 'react'
import { fetchCafeteria, fetchMenuCafeteria } from '../service'
import { demoFetchCafeteria, demoFetchMenuCafeteria } from '../demoService'
import type { UsuarioONE, ProductoONE } from '../types'
import { PROCESO_LABELS } from '../config'
import seedUsuarios from '../seed/one_usuarios.json'
import seedProductos from '../seed/one_productos.json'
import seedPedidos from '../seed/one_pedidos.json'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  cream: '#f2e0cc',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  white: '#ffffff',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: '#4a90c4',
  natural: '#c96e4b',
  honey: '#d4a017',
  anaerobico: '#9b59b6',
}

interface Props {
  cafeteriaId: string
  isDemo?: boolean
}

const PerfilCafeteria: React.FC<Props> = ({ cafeteriaId, isDemo = false }) => {
  const [cafeteria, setCafeteria] = useState<UsuarioONE | null>(null)
  const [menu, setMenu] = useState<ProductoONE[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Fallback seed
      const c = (seedUsuarios as UsuarioONE[]).find(u => u.uid === cafeteriaId && u.rol === 'emprendedor') ?? null
      const pedidoIds = c?.emprendedor?.pedidoIds ?? []
      const productoIds = new Set(
        (seedPedidos as { emprendedorId: string; items: { productoId: string }[] }[])
          .filter(p => pedidoIds.includes(p.emprendedorId) || p.emprendedorId === cafeteriaId)
          .flatMap(p => p.items.map(i => i.productoId))
      )
      const productos = (seedProductos as ProductoONE[]).filter(p => productoIds.has(p.id))
      setCafeteria(c)
      setMenu(productos)
      setLoading(false)
    }, 3000)

    async function cargar() {
      try {
        const [c, m] = await Promise.all([
          isDemo
            ? demoFetchCafeteria(cafeteriaId)
            : fetchCafeteria(cafeteriaId).catch(() => null),
          isDemo
            ? demoFetchMenuCafeteria(cafeteriaId)
            : fetchMenuCafeteria(cafeteriaId).catch(() => []),
        ])
        clearTimeout(timer)
        setCafeteria(c)
        setMenu(m)
      } catch {
        clearTimeout(timer)
        // fallback seed
        const c = (seedUsuarios as UsuarioONE[]).find(u => u.uid === cafeteriaId) ?? null
        setCafeteria(c)
        setMenu([])
      } finally {
        setLoading(false)
      }
    }
    cargar()
    return () => clearTimeout(timer)
  }, [cafeteriaId, isDemo])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.tan, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Cargando...</p>
      </div>
    )
  }

  if (!cafeteria || !cafeteria.emprendedor) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.tan, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Cafetería no encontrada.</p>
      </div>
    )
  }

  const emp = cafeteria.emprendedor
  const abierto = emp.etapa === 'abierto'

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
        <a href="#/cafeterias" style={{
          color: C.cream, fontSize: 12, textDecoration: 'none',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
          padding: '6px 16px', borderRadius: 4,
          border: `1px solid ${C.tan + '55'}`,
        }}>
          ← Cafeterías
        </a>
      </header>

      {/* Hero */}
      <div style={{
        position: 'relative',
        height: '60vw', maxHeight: 420, minHeight: 240,
        background: C.bgCard, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: emp.fotoLocal
            ? `url(${emp.fotoLocal}) center/cover no-repeat`
            : 'url(https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1400&q=80) center/cover no-repeat',
          filter: 'brightness(0.4)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 30%, ${C.bg} 100%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '5%', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 20,
              background: abierto ? C.sage : C.tan,
              color: '#000', fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {abierto ? 'Abierto' : 'Próximamente'}
            </span>
          </div>
          <p style={{
            margin: '0 0 6px', fontSize: 11, fontWeight: 700,
            color: C.terra, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            {emp.distritoLocal} · Lima
          </p>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700, color: C.white, lineHeight: 1.1,
          }}>
            {emp.nombreLocal}
          </h1>
          {emp.descripcion && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: C.tan, maxWidth: 400, lineHeight: 1.5 }}>
              {emp.descripcion}
            </p>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 5% 80px' }}>

        {/* Menú */}
        {abierto && menu.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              margin: '0 0 16px', fontSize: 13, fontWeight: 700,
              color: C.tan, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Nuestro menú de cafés
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {menu.map(p => (
                <div key={p.id} style={{
                  background: C.bgCard, borderRadius: 10, padding: '16px 18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: PROCESO_COLORS[p.proceso] ?? C.terra,
                      color: C.white,
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {PROCESO_LABELS[p.proceso] ?? p.proceso}
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
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: C.cream + '99', fontStyle: 'italic' }}>
                    {p.notasSabor.join(' · ')}
                  </p>
                  <a
                    href={`#/caficultor/${p.caficultorId}`}
                    style={{
                      fontSize: 11, color: C.sage, textDecoration: 'none', fontWeight: 600,
                    }}>
                    Conocer al productor: {p.caficultorNombre} →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {abierto && menu.length === 0 && (
          <section style={{ marginBottom: 40, textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>☕</p>
            <p style={{ color: C.tan, fontSize: 14 }}>El menú estará disponible pronto.</p>
          </section>
        )}

        {!abierto && (
          <section style={{ marginBottom: 40 }}>
            <div style={{
              background: C.bgCard, borderRadius: 10, padding: '24px 20px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🔜</p>
              <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
                Abre pronto
              </p>
              {emp.fechaAperturaEstimada && (
                <p style={{ margin: 0, fontSize: 13, color: C.tan }}>
                  Apertura estimada: {new Date(emp.fechaAperturaEstimada).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Sello de transparencia */}
        <div style={{
          background: C.bgCard, borderRadius: 10, padding: '20px 20px',
          borderLeft: `3px solid ${C.sage}`,
        }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: C.sage }}>
            Café directo del productor
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.tan, lineHeight: 1.6 }}>
            Los cafés que sirve <strong style={{ color: C.cream }}>{emp.nombreLocal}</strong> vienen
            directamente de caficultores de los Andes peruanos a través de Tunay Wasi —
            sin intermediarios, con precio transparente al productor.
          </p>
        </div>

      </div>
    </div>
  )
}

export default PerfilCafeteria
