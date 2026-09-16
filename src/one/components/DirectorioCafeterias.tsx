/**
 * DirectorioCafeterias.tsx — Directorio público de cafeterías
 * Destino: #/cafeterias
 * Sin auth — accesible para el cliente final
 */
import React, { useEffect, useState } from 'react'
import { fetchCafeterias } from '../service'
import { demoFetchCafeterias } from '../demoService'
import type { UsuarioONE } from '../types'
import seedUsuarios from '../seed/one_usuarios.json'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  cream: '#f2e0cc',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  white: '#ffffff',
}

interface Props {
  isDemo?: boolean
}

const DirectorioCafeterias: React.FC<Props> = ({ isDemo = false }) => {
  const [cafeterias, setCafeterias] = useState<UsuarioONE[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroDistrito, setFiltroDistrito] = useState<string>('todos')
  const [filtroEtapa, setFiltroEtapa] = useState<string>('todas')

  useEffect(() => {
    const timer = setTimeout(() => {
      const fallback = (seedUsuarios as UsuarioONE[]).filter(u => u.rol === 'emprendedor')
      setCafeterias(fallback)
      setLoading(false)
    }, 3000)

    async function cargar() {
      try {
        const data = isDemo
          ? await demoFetchCafeterias()
          : await fetchCafeterias().catch(() => (seedUsuarios as UsuarioONE[]).filter(u => u.rol === 'emprendedor'))
        clearTimeout(timer)
        setCafeterias(data)
      } catch {
        clearTimeout(timer)
        setCafeterias((seedUsuarios as UsuarioONE[]).filter(u => u.rol === 'emprendedor'))
      } finally {
        setLoading(false)
      }
    }
    cargar()
    return () => clearTimeout(timer)
  }, [isDemo])

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
          Ver cafés
        </a>
      </header>

      {/* Hero */}
      <div style={{
        position: 'relative',
        height: '40vw', maxHeight: 320, minHeight: 200,
        background: C.bgCard, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=80) center/cover no-repeat',
          filter: 'brightness(0.3)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 20%, ${C.bg} 100%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: '12%', left: '5%', zIndex: 2,
        }}>
          <p style={{
            margin: '0 0 6px', fontSize: 11, fontWeight: 700,
            color: C.terra, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            Café de origen · Perú
          </p>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(22px, 4vw, 38px)',
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 700, color: C.white, lineHeight: 1.2,
          }}>
            Cafeterías que sirven<br />café directo del productor
          </h1>
        </div>
      </div>

      {/* Listado */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 5% 80px' }}>

        {/* Filtros */}
        {!loading && cafeterias.length > 0 && (() => {
          const distritos = Array.from(new Set(cafeterias.map(c => c.emprendedor?.distritoLocal).filter(Boolean) as string[])).sort()
          const termino = busqueda.toLowerCase().trim()
          const filtradas = cafeterias.filter(c => {
            const emp = c.emprendedor
            if (!emp) return false
            const pasaDistrito = filtroDistrito === 'todos' || emp.distritoLocal === filtroDistrito
            const pasaEtapa = filtroEtapa === 'todas' || emp.etapa === filtroEtapa
            const pasaBusqueda = !termino || emp.nombreLocal.toLowerCase().includes(termino) || emp.distritoLocal.toLowerCase().includes(termino) || (emp.descripcion ?? '').toLowerCase().includes(termino)
            return pasaDistrito && pasaEtapa && pasaBusqueda
          })

          return (
            <>
              {/* Buscador */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.tan, pointerEvents: 'none' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar cafetería o distrito..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  style={{ width: '100%', padding: '10px 36px', borderRadius: 8, border: `1px solid #2a2a2a`, background: C.bgCard, color: C.cream, fontSize: 13, fontFamily: 'Montserrat, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
                {busqueda && <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 16 }}>✕</button>}
              </div>

              {/* Filtros rápidos */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                  { value: 'todos', label: 'Todos los distritos' },
                  ...distritos.map(d => ({ value: d, label: d }))
                ].map(opt => (
                  <button key={opt.value} onClick={() => setFiltroDistrito(opt.value)} style={{
                    padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    border: `1px solid ${filtroDistrito === opt.value ? C.terra : '#333'}`,
                    background: filtroDistrito === opt.value ? C.terra : 'transparent',
                    color: filtroDistrito === opt.value ? C.white : C.tan,
                    fontFamily: 'Montserrat, sans-serif',
                  }}>{opt.label}</button>
                ))}
                <button onClick={() => setFiltroEtapa(filtroEtapa === 'abierto' ? 'todas' : 'abierto')} style={{
                  padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  border: `1px solid ${filtroEtapa === 'abierto' ? C.sage : '#333'}`,
                  background: filtroEtapa === 'abierto' ? C.sage : 'transparent',
                  color: filtroEtapa === 'abierto' ? '#000' : C.tan,
                  fontFamily: 'Montserrat, sans-serif',
                }}>Solo abiertos</button>
              </div>

              <p style={{ margin: '0 0 16px', fontSize: 12, color: C.tan }}>
                {filtradas.length} {filtradas.length === 1 ? 'cafetería encontrada' : 'cafeterías encontradas'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {filtradas.map(cafeteria => (
                  <TarjetaCafeteria key={cafeteria.uid} cafeteria={cafeteria} />
                ))}
              </div>
            </>
          )
        })()}

        {loading && (
          <p style={{ color: C.tan, textAlign: 'center', padding: '48px 0' }}>Cargando cafeterías...</p>
        )}

        {!loading && cafeterias.length === 0 && (
          <p style={{ color: C.tan, textAlign: 'center', padding: '48px 0' }}>No hay cafeterías disponibles aún.</p>
        )}

        {/* Footer info */}
        {!loading && (
          <div style={{
            marginTop: 48, padding: '20px 20px',
            background: C.bgCard, borderRadius: 10,
            borderLeft: `3px solid ${C.sage}`,
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: C.sage }}>
              ¿Qué es Tunay Wasi?
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.tan, lineHeight: 1.6 }}>
              Conectamos caficultores de los Andes peruanos con cafeterías de especialidad,
              sin intermediarios. Cada taza que tomas lleva directamente el trabajo del productor a tu mesa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const TarjetaCafeteria: React.FC<{ cafeteria: UsuarioONE }> = ({ cafeteria }) => {
  const emp = cafeteria.emprendedor
  if (!emp) return null
  const abierto = emp.etapa === 'abierto'

  return (
    <a
      href={`#/cafeteria/${cafeteria.uid}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: C.bgCard, borderRadius: 12, overflow: 'hidden',
        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px rgba(0,0,0,0.4)`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }}
      >
        {/* Foto */}
        <div style={{
          height: 160, overflow: 'hidden', position: 'relative', background: '#1a1a1a',
        }}>
          {emp.fotoLocal ? (
            <img
              src={emp.fotoLocal}
              alt={emp.nombreLocal}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, opacity: 0.3,
            }}>☕</div>
          )}
          {/* Badge etapa */}
          <span style={{
            position: 'absolute', top: 10, right: 10,
            padding: '3px 10px', borderRadius: 20,
            background: abierto ? C.sage : C.tan,
            color: '#000', fontSize: 9, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {abierto ? 'Abierto' : 'Próximamente'}
          </span>
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
            {emp.nombreLocal}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: C.terra, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {emp.distritoLocal}
          </p>
          {emp.descripcion && (
            <p style={{ margin: 0, fontSize: 12, color: C.tan, lineHeight: 1.5 }}>
              {emp.descripcion}
            </p>
          )}
          {!abierto && emp.fechaAperturaEstimada && (
            <p style={{ margin: '8px 0 0', fontSize: 11, color: C.tan }}>
              Abre {new Date(emp.fechaAperturaEstimada).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}

export default DirectorioCafeterias
