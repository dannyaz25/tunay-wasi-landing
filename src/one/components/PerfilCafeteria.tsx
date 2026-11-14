/**
 * PerfilCafeteria.tsx — Página pública de una cafetería
 * Destino: #/cafeteria/:id — QR en la mesa apunta aquí
 * Sin auth — accesible para el cliente final
 */
import React, { useEffect, useState } from 'react'
import { fetchNegocio, fetchMenuActivo } from '../service'
import { demoFetchNegocio, demoFetchMenuActivo } from '../demoService'
import type { UsuarioONE, PreparacionMenu, MenuONE } from '../types'
import seedUsuarios from '../seed/one_usuarios.json'
import seedMenus from '../seed/one_menus.json'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  cream: '#f2e0cc',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  white: '#ffffff',
  border: '#222222',
  muted: '#555555',
}

// ─── Preparaciones de demo (fallback si no hay menú activo) ───────────────────

const MENU_DEMO_FALLBACK: PreparacionMenu[] = [
  { nombre: 'Espresso', precio: 8, metodo: 'Espresso', categoria: 'ESPRESSO', caficultorNombre: 'Segundo Rojas Herrera', origen: 'Bourbon Lavado · Segundo Rojas · Cajamarca', notas: ['chocolate negro', 'avellana', 'mandarina'] },
  { nombre: 'Americano', precio: 7, metodo: 'Espresso + agua', categoria: 'ESPRESSO', caficultorNombre: 'Segundo Rojas Herrera', origen: 'Bourbon Lavado · Segundo Rojas · Cajamarca', notas: ['chocolate negro', 'avellana', 'mandarina'] },
  { nombre: 'Cappuccino', precio: 10, metodo: 'Espresso + leche vaporizada', categoria: 'ESPRESSO', caficultorNombre: 'Segundo Rojas Herrera', origen: 'Bourbon Lavado · Segundo Rojas · Cajamarca', notas: ['chocolate negro', 'avellana', 'mandarina'] },
  { nombre: 'V60', precio: 12, metodo: 'Filtrado V60', categoria: 'FILTER', caficultorNombre: 'Aydé Lloclla Díaz', origen: 'Geisha Natural · Aydé Lloclla · Cajamarca', notas: ['durazno', 'panela', 'jazmín'] },
  { nombre: 'Prensa Francesa', precio: 10, metodo: 'Prensa francesa', categoria: 'FILTER', caficultorNombre: 'Carlos Quispe Mamani', origen: 'Caturra Honey · Carlos Quispe · Junín', notas: ['caramelo', 'nuez', 'ciruela'] },
  { nombre: 'Cold Brew', precio: 14, metodo: 'Infusión en frío 12h', categoria: 'FRÍO', caficultorNombre: 'Carlos Quispe Mamani', origen: 'Caturra Honey · Carlos Quispe · Junín', notas: ['caramelo', 'nuez', 'ciruela'] },
]

interface Props {
  cafeteriaId: string
  isDemo?: boolean
}

const PerfilCafeteria: React.FC<Props> = ({ cafeteriaId, isDemo = false }) => {
  const [cafeteria, setCafeteria] = useState<UsuarioONE | null>(null)
  const [preparaciones, setPreparaciones] = useState<PreparacionMenu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      const c = (seedUsuarios as UsuarioONE[]).find(u => u.uid === cafeteriaId && u.rol === 'negocio') ?? null
      setCafeteria(c)
      // Usar preparaciones del menú activo del seed
      const menuActivo = (seedMenus as MenuONE[]).find(m => m.negocioId === cafeteriaId && m.activo)
      setPreparaciones(menuActivo?.preparaciones ?? MENU_DEMO_FALLBACK)
      setLoading(false)
    }, 3000)

    async function cargar() {
      try {
        const c = isDemo
          ? await demoFetchNegocio(cafeteriaId)
          : await fetchNegocio(cafeteriaId).catch(() => null)
        clearTimeout(timer)
        setCafeteria(c)

        // Cargar preparaciones del menú activo
        if (isDemo) {
          const menuActivo = await demoFetchMenuActivo(cafeteriaId)
          setPreparaciones(menuActivo?.preparaciones?.length ? menuActivo.preparaciones : MENU_DEMO_FALLBACK)
        } else {
          const menuActivo = await fetchMenuActivo(cafeteriaId)
          setPreparaciones(menuActivo?.preparaciones?.length ? menuActivo.preparaciones : MENU_DEMO_FALLBACK)
        }
      } catch {
        clearTimeout(timer)
        const c = (seedUsuarios as UsuarioONE[]).find(u => u.uid === cafeteriaId) ?? null
        setCafeteria(c)
        setPreparaciones(MENU_DEMO_FALLBACK)
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

  if (!cafeteria || !cafeteria.negocio) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: C.tan, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Cafetería no encontrada.</p>
      </div>
    )
  }

  const emp = cafeteria.negocio
  const abierto = emp.etapa === 'abierto'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header compacto — nombre del local + estado */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: abierto ? C.sage : C.tan,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: C.cream, fontFamily: 'Cormorant Garamond, serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {emp.nombreLocal}
          </span>
          <span className="caf-header-distrito" style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>
            · {emp.distritoLocal}
          </span>
          {emp.scoreConfianza && emp.totalCalificaciones ? (
            <span className="caf-header-score" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4, flexShrink: 0 }}>
              <span style={{ color: '#f39c12', fontSize: 12 }}>★</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.cream }}>{emp.scoreConfianza.toFixed(1)}</span>
              <span className="caf-header-count" style={{ fontSize: 11, color: C.muted }}>({emp.totalCalificaciones})</span>
            </span>
          ) : null}
        </div>
        <a href="#/cafeterias" style={{
          fontSize: 11, color: C.muted,
          textDecoration: 'none', fontFamily: 'Montserrat, sans-serif',
          flexShrink: 0,
        }}>
          ← Cafeterías
        </a>
        <style>{`
          @media (max-width: 400px) {
            .caf-header-distrito { display: none !important; }
            .caf-header-score { display: none !important; }
          }
        `}</style>
      </header>

      {/* Contenido — carta directo, sin hero */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 5% 80px' }}>

        {/* Menú */}
        {abierto && (
          <section style={{ marginBottom: 40 }}>
            {emp.descripcion && (
              <p style={{ margin: '0 0 6px', fontSize: 13, color: C.tan, lineHeight: 1.6, fontStyle: 'italic' }}>
                {emp.descripcion}
              </p>
            )}
            {emp.scoreConfianza && emp.totalCalificaciones ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
                <span style={{ color: '#f39c12', fontSize: 14 }}>
                  {'★'.repeat(Math.round(emp.scoreConfianza))}{'☆'.repeat(5 - Math.round(emp.scoreConfianza))}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.cream }}>{emp.scoreConfianza.toFixed(1)}</span>
                <span style={{ fontSize: 11, color: C.muted }}>· {emp.totalCalificaciones} reseñas de clientes</span>
              </div>
            ) : <div style={{ marginBottom: 28 }} />}
            <h2 style={{
              margin: '0 0 6px', fontSize: 13, fontWeight: 700,
              color: C.tan, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Carta de preparaciones
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
              Origen del café visible en cada preparación
            </p>

            {/* Agrupar por categoría */}
            {(['ESPRESSO', 'FILTER', 'FRÍO'] as PreparacionMenu['categoria'][]).map(cat => {
              const preps = preparaciones.filter(p => p.categoria === cat)
              if (preps.length === 0) return null
              return (
                <div key={cat} style={{ marginBottom: 32 }}>
                  {/* Label categoría */}
                  <p style={{
                    margin: '0 0 12px', fontSize: 10, fontWeight: 700,
                    color: C.terra, letterSpacing: '0.15em',
                    textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif',
                  }}>
                    {cat}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {preps.map((p, i) => (
                      <div key={`${p.nombre}-${i}`} style={{
                        padding: '14px 0',
                        borderBottom: i < preps.length - 1 ? `1px solid ${C.border}` : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        gap: 12,
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: '0 0 3px', fontSize: 15, fontWeight: 700,
                            color: C.cream, fontFamily: 'Cormorant Garamond, serif',
                          }}>
                            {p.nombre}
                          </p>
                          <p style={{ margin: '0 0 3px', fontSize: 10, color: C.sage }}>
                            {p.origen || p.caficultorNombre}
                          </p>
                          {p.notas.length > 0 && (
                            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontStyle: 'italic' }}>
                              {p.notas.join(' · ')}
                            </p>
                          )}
                        </div>
                        <p style={{
                          margin: 0, fontSize: 18, fontWeight: 700,
                          color: C.terra, fontFamily: 'Cormorant Garamond, serif',
                          flexShrink: 0,
                        }}>
                          S/ {p.precio}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
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
