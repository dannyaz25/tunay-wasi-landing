/**
 * LandingEmprendedor.tsx — Landing para emprendedores que quieren abrir su cafetería
 * Ruta: #/para-cafeterias
 * CTA principal: descarga de la app Android en Play Store.
 * Flujo CRO: Hero → Kit (precio real) → Instalación → Calculadora → Carta → FAQ → CTA final
 */
import React, { useState } from 'react'
import { BetaRegistro } from './BetaRegistro'

const PLAY_STORE_URL = 'https://appdistribution.firebase.google.com/testerapps/1:399522765847:android:98ef173a366e5ba6ddd052/releases/3snss7d78jr78'

const C = {
  bg:         '#0a0a0a',
  bgCard:     '#141414',
  bgSection:  '#0f0f0f',
  cream:      '#f2e0cc',
  creamDim:   '#c4b297',
  terra:      '#c96e4b',
  terraLight: '#d4825f',
  sage:       '#8faf8a',
  green:      '#1f3028',
  white:      '#ffffff',
  border:     '#222222',
  muted:      '#555555',
  mutedLight: '#777777',
}

// ─── Datos ────────────────────────────────────────────────────────────────────

const FAQ = [
  {
    p: '¿El café llega listo para usar?',
    r: 'Depende de lo que pidas. El caficultor puede publicar su café como verde (sin tostar), tostado en grano o tostado y molido. Tú eliges la presentación y, si es molido, el tipo de molienda (gruesa, media o fina para espresso).',
  },
  {
    p: '¿Puedo ver el catálogo antes de registrarme?',
    r: 'Sí. Puedes explorar los lotes disponibles, ver las fichas técnicas y los perfiles de los caficultores sin crear cuenta. Solo necesitas cuenta para hacer un pedido.',
  },
  {
    p: '¿Cómo llega el café a mi local?',
    r: 'El caficultor despacha directo a tu dirección por la agencia de su elección (Olva, Shalom u otro courier). Te comparte el código de tracking en el chat del pedido para que hagas seguimiento.',
  },
  {
    p: '¿Cómo pago?',
    r: 'Puedes pagar por Yape, Plin o efectivo directamente al caficultor. Para pagos digitales la app te muestra el número de destino y puedes subir la captura del comprobante como respaldo.',
  },
  {
    p: '¿Puedo pedir poco para probar?',
    r: 'Sí. Las presentaciones arrancan desde 1kg. Puedes probar un lote antes de comprometerte con un volumen mayor.',
  },
]

// ─── Átomos ───────────────────────────────────────────────────────────────────

const Chip: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.terra }) => (
  <span style={{
    display: 'inline-block', padding: '4px 14px', borderRadius: 20,
    background: `${color}18`, border: `1px solid ${color}44`,
    color, fontSize: 11, fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    letterSpacing: '0.1em', textTransform: 'uppercase',
  }}>
    {children}
  </span>
)

const CTABtn: React.FC<{ onClick: () => void; children: React.ReactNode; secondary?: boolean; fullWidth?: boolean }> = ({ onClick, children, secondary, fullWidth }) => (
  <button onClick={onClick} style={{
    padding: '16px 36px', borderRadius: 10,
    border: secondary ? `1px solid ${C.border}` : 'none',
    background: secondary ? 'transparent' : `linear-gradient(135deg, ${C.terra} 0%, ${C.terraLight} 100%)`,
    color: secondary ? C.creamDim : C.white,
    fontSize: 15, fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    cursor: 'pointer', letterSpacing: '0.04em',
    boxShadow: secondary ? 'none' : `0 4px 24px ${C.terra}44`,
    width: fullWidth ? '100%' : undefined,
    transition: 'opacity 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: 10,
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
  >
    {children}
  </button>
)

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: 'clamp(28px, 4vw, 46px)',
    fontWeight: 700, color: C.cream,
    margin: '16px 0 0', lineHeight: 1.15,
  }}>
    {children}
  </h2>
)

// ─── Nav ──────────────────────────────────────────────────────────────────────

const Nav: React.FC<{ onEmpezar: () => void }> = ({ onEmpezar }) => (
  <nav style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: `${C.bg}ee`, backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 64,
  }}>
    <button onClick={() => { window.location.hash = '#/' }} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'Cormorant Garamond, serif',
      fontSize: 22, fontWeight: 700, color: C.cream,
    }}>
      TunayWasi
    </button>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button onClick={() => { window.location.hash = '#/' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.mutedLight,
      }}>
        Ver catálogo
      </button>
      <button onClick={() => { window.location.hash = '#/docs' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.mutedLight,
      }}>
        Docs
      </button>
      <button onClick={() => { window.location.hash = '#/soporte' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.sage,
        fontWeight: 600,
      }}>
        Soporte
      </button>
      <button onClick={onEmpezar} style={{
        padding: '8px 20px', borderRadius: 8, border: 'none',
        background: C.terra, color: C.white,
        fontSize: 13, fontWeight: 700,
        fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
        Descargar app
      </button>
    </div>
  </nav>
)

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero: React.FC<{ onEmpezar: () => void }> = ({ onEmpezar }) => (
  <section style={{
    position: 'relative',
    minHeight: '82vh',
    overflow: 'hidden',
    paddingTop: 64,
  }}>
    {/* Fondo foto */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'url(https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1400&q=80) center/cover no-repeat',
      filter: 'brightness(0.18)',
    }} />
    {/* Overlay gradiente */}
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(135deg, ${C.bg} 0%, ${C.green}88 60%, transparent 100%)`,
    }} />

    {/* Grid de dos columnas */}
    <div style={{
      position: 'relative', zIndex: 1,
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: 1140,
      margin: '0 auto',
      padding: '80px 48px',
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: 64,
      alignItems: 'center',
      minHeight: 'calc(82vh - 64px)',
    }}>

      {/* ── Izquierda ── */}
      <div>
        <Chip>Para negocios de cafetería</Chip>

        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(38px, 5.5vw, 68px)',
          fontWeight: 700, color: C.cream,
          margin: '20px 0 18px', lineHeight: 1.05,
        }}>
          Café de origen directo<br />
          <span style={{ color: C.terra }}>al productor.<br />Sin intermediarios.</span>
        </h1>

        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 'clamp(14px, 1.6vw, 17px)',
          color: C.creamDim, lineHeight: 1.75,
          maxWidth: 460, margin: '0 0 36px',
        }}>
          Explora el catálogo de caficultores peruanos, ve la ficha técnica completa
          de cada lote y haz tu pedido directamente desde la app — con pago por
          Yape, Plin o efectivo y chat directo con el productor.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <CTABtn onClick={onEmpezar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
            Descargar app (Android)
          </CTABtn>
          <CTABtn onClick={() => { window.location.hash = '#/' }} secondary>Ver catálogo web</CTABtn>
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => document.getElementById('lead-plantilla')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13,
              color: C.mutedLight, textDecoration: 'underline', padding: 0,
            }}
          >
            ¿Quieres calcular tus costos primero? Descarga la plantilla de menú gratis →
          </button>
        </div>

        <p style={{
          marginTop: 14,
          fontFamily: 'Montserrat, sans-serif', fontSize: 12,
          color: C.muted,
        }}>
          Café directo del productor · sin intermediarios · sin contrato
        </p>
      </div>

      {/* ── Derecha — formulario beta ── */}
      <div className="emp-hero-card" style={{ boxShadow: '0 16px 64px rgba(0,0,0,0.7)' }}>
        <BetaRegistro
          rolDefecto="emprendedor"
          acento={C.terra}
          titulo="Únete a la beta"
          subtitulo="Regístrate y te enviamos el link de descarga directo a tu correo."
          origen="landing-emprendedor"
        />
      </div>

    </div>

    <style>{`
      @media (max-width: 780px) {
        .emp-hero-card { display: none !important; }
      }
    `}</style>
  </section>
)

// ─── Sección instalación y funcionalidades ───────────────────────────────────

const SeccionFAQ: React.FC = () => {
  const [abierto, setAbierto] = useState<number | null>(null)
  return (
    <section style={{ background: C.bgSection, padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Chip>Preguntas frecuentes</Chip>
          <H2>Resolvemos tus dudas</H2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map((f, i) => (
            <div key={i} style={{
              background: C.bgCard,
              border: `1px solid ${abierto === i ? C.terra + '44' : C.border}`,
              borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              <button onClick={() => setAbierto(abierto === i ? null : i)} style={{
                width: '100%', padding: '18px 22px',
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', gap: 16,
              }}>
                <span style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 14, fontWeight: 600,
                  color: C.cream, textAlign: 'left',
                }}>
                  {f.p}
                </span>
                <span style={{ color: C.terra, fontSize: 18, flexShrink: 0 }}>
                  {abierto === i ? '−' : '+'}
                </span>
              </button>
              {abierto === i && (
                <div style={{ padding: '0 22px 18px' }}>
                  <p style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 14, color: C.creamDim,
                    lineHeight: 1.7, margin: 0,
                  }}>
                    {f.r}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Sección instalación y funcionalidades ───────────────────────────────────

const INSTALACION_PASOS_EMP = [
  {
    n: '1',
    titulo: 'Descarga la app',
    texto: 'La app está en beta. Descárgala desde el enlace de Firebase App Distribution que encontrarás en esta página. La instalación toma menos de 1 minuto.',
    color: '#c96e4b',
  },
  {
    n: '2',
    titulo: 'Crea tu cuenta de negocio',
    texto: 'Ingresa con tu cuenta Google o con tu correo. Selecciona el rol "Negocio" y completa tu perfil con el nombre de tu local y tu distrito.',
    color: '#c96e4b',
  },
  {
    n: '3',
    titulo: 'Explora el catálogo',
    texto: 'Navega los lotes disponibles. Filtra por proceso (lavado, natural, honey, anaeróbico) y región. Cada producto tiene ficha completa: variedad, altitud, cosecha, notas de sabor y galería de fotos reales de la finca.',
    color: '#c96e4b',
  },
  {
    n: '4',
    titulo: 'Arma tu pedido y paga',
    texto: 'Agrega al carrito, elige la presentación (café verde, tostado en grano o tostado y molido) y el tipo de molienda si aplica. El pago va a TunayWasi, que lo retiene en custodia hasta que confirmes la entrega o pasen 7 días — solo entonces se libera al caficultor.',
    color: '#8faf8a',
  },
  {
    n: '5',
    titulo: 'Coordina y recibe',
    texto: 'TunayWasi confirma el pago, coordina el despacho con el caficultor y te comparte el código de tracking en el chat del pedido. Al recibir tu café, califica al productor con 1 a 5 estrellas.',
    color: '#8faf8a',
  },
]

const FUNCIONALIDADES_EMP = [
  { icono: '🔍', titulo: 'Catálogo con filtros', texto: 'Explora todos los lotes disponibles. Filtra por proceso y región. Cada producto muestra variedad, altitud, cosecha y notas de sabor.' },
  { icono: '📸', titulo: 'Ficha completa del lote', texto: 'Galería de fotos reales de la finca, proceso de beneficio, fecha de cosecha y perfil del caficultor con su historial de calificaciones.' },
  { icono: '🛒', titulo: 'Carrito y checkout', texto: 'Agrega productos, elige presentación y molienda. Checkout en 2 pasos: revisión del carrito y pago con Yape, Plin o efectivo.' },
  { icono: '💬', titulo: 'Chat directo por pedido', texto: 'Cada pedido tiene su propio hilo de chat en tiempo real con el caficultor. Toda la coordinación en un solo lugar.' },
  { icono: '📍', titulo: 'Seguimiento del despacho', texto: 'El caficultor registra el código de agencia (Olva, Shalom, etc.) en el chat del pedido. Sabes exactamente cuándo sale tu café.' },
  { icono: '⭐', titulo: 'Calificaciones verificadas', texto: 'Califica al caficultor al recibir tu pedido. Las reseñas son visibles en su perfil — el respaldo que necesitas antes de comprarle a alguien nuevo.' },
]

const SeccionInstalacion: React.FC<{ onDescargar: () => void }> = ({ onDescargar }) => (
  <section style={{ background: '#0a0a0a', padding: '80px 24px' }}>
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Chip color='#c96e4b'>Cómo instalar</Chip>
        <H2>Tu primer pedido de café<br />de origen en 5 pasos</H2>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 15,
          color: '#c4b297', lineHeight: 1.7,
          maxWidth: 480, margin: '16px auto 0',
        }}>
          Solo necesitas un celular Android con Android 8.0 o superior y tu cuenta Google.
          Primer pedido listo en menos de 10 minutos.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 680, margin: '0 auto 60px' }}>
        {INSTALACION_PASOS_EMP.map((paso, i) => (
          <div key={paso.n} style={{
            display: 'grid', gridTemplateColumns: '56px 1fr',
            gap: 20, paddingBottom: i < INSTALACION_PASOS_EMP.length - 1 ? 36 : 0,
            position: 'relative',
          }}>
            {i < INSTALACION_PASOS_EMP.length - 1 && (
              <div style={{
                position: 'absolute', left: 27, top: 52, bottom: 0,
                width: 1,
                background: `linear-gradient(to bottom, ${paso.color}55, transparent)`,
              }} />
            )}
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: '#141414', border: `2px solid ${paso.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 18, fontWeight: 700, color: paso.color, flexShrink: 0,
            }}>
              {paso.n}
            </div>
            <div style={{ paddingTop: 10 }}>
              <h3 style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 15, fontWeight: 700, color: '#f2e0cc', marginBottom: 6,
              }}>
                {paso.titulo}
              </h3>
              <p style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 13, color: '#c4b297', lineHeight: 1.7, margin: 0,
              }}>
                {paso.texto}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Funcionalidades */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Chip>Qué puedes hacer</Chip>
        <H2>Todo lo que tiene<br />la app para ti</H2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16, marginBottom: 52,
      }}>
        {FUNCIONALIDADES_EMP.map(f => (
          <div key={f.titulo} style={{
            background: '#141414', border: '1px solid #222',
            borderRadius: 14, padding: 24,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#c96e4b55' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#222' }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icono}</div>
            <h3 style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 14,
              fontWeight: 700, color: '#f2e0cc', marginBottom: 6,
            }}>
              {f.titulo}
            </h3>
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13,
              color: '#c4b297', lineHeight: 1.65, margin: 0,
            }}>
              {f.texto}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #1a0d05 0%, #0d0605 100%)',
        border: '1px solid #c96e4b44',
        borderRadius: 16, padding: '32px 28px',
        textAlign: 'center',
        maxWidth: 480, margin: '0 auto',
      }}>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 13,
          color: '#c4b297', marginBottom: 6,
        }}>
          Requiere Android 8.0 o superior · Gratis
        </p>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 12,
          color: '#555', marginBottom: 20,
        }}>
          App gratuita · Sin membresía · Repones cuando quieras
        </p>
        <button
          onClick={onDescargar}
          style={{
            width: '100%', padding: '16px',
            borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #c96e4b, #d4825f)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 4px 20px #c96e4b44',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
          Descargar app (Android)
        </button>
      </div>
    </div>
  </section>
)

// ─── CTA final ────────────────────────────────────────────────────────────────

const SeccionCTA: React.FC<{ onEmpezar: () => void }> = ({ onEmpezar }) => (
  <section style={{
    background: `linear-gradient(135deg, ${C.green} 0%, #081a0e 100%)`,
    padding: '90px 24px', textAlign: 'center',
  }}>
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(34px, 5vw, 56px)',
        fontWeight: 700, color: C.cream,
        marginBottom: 16, lineHeight: 1.15,
      }}>
        Encuentra tu caficultor.<br />
        <span style={{ color: C.terra }}>Haz tu primer pedido hoy.</span>
      </h2>
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 15,
        color: C.creamDim, lineHeight: 1.7, marginBottom: 36,
      }}>
        Explora el catálogo, elige el lote que te interesa y coordina el despacho
        directo con el productor desde la app.
      </p>
      <CTABtn onClick={onEmpezar} fullWidth>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
        Descargar app (Android)
      </CTABtn>
      <p style={{
        marginTop: 16,
        fontFamily: 'Montserrat, sans-serif', fontSize: 12,
        color: C.muted,
      }}>
        Sin contrato · Sin membresía · Repones cuando quieras
      </p>
    </div>
  </section>
)

// ─── Componente principal ─────────────────────────────────────────────────────

const LandingEmprendedor: React.FC = () => {
  function irAPlayStore() {
    window.open(PLAY_STORE_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <Nav onEmpezar={irAPlayStore} />
      <Hero onEmpezar={irAPlayStore} />
      <SeccionInstalacion onDescargar={irAPlayStore} />
      <SeccionFAQ />
      <SeccionCTA onEmpezar={irAPlayStore} />
    </div>
  )
}

export default LandingEmprendedor
