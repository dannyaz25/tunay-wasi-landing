/**
 * LandingCaficultores.tsx — Landing pública para caficultores peruanos
 * Ruta: #/para-caficultores
 * CTA principal: descarga de la app Android en Play Store.
 * Modelo: TunayWasi es solo la plataforma. El caficultor cultiva, tuesta, muele y despacha.
 * Big domino: calculadora TunayWasi vs acopiador — el número habla solo.
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

const LO_QUE_GANAS = [
  {
    icono: '💰',
    titulo: 'Tú fijas el precio — nadie más',
    texto: 'Publicas a S/ 55, S/ 70 o S/ 90/kg. Lo que tú decides. El negocio ve tu precio y compra. TunayWasi no negocia por ti ni te impone techo.',
  },
  {
    icono: '🌐',
    titulo: 'Visibilidad nacional',
    texto: 'Tu perfil con región, altitud, variedad y proceso visible para cafeterías y negocios en todo el país. Tu origen es el argumento — no solo el precio.',
  },
  {
    icono: '🆓',
    titulo: 'Cero comisión mientras arrancamos',
    texto: 'Publicas, vendes y cobras el 100%. TunayWasi no se lleva nada mientras construimos la red de caficultores. Te avisaremos antes de cualquier cambio.',
  },
]

const FAQ = [
  {
    p: '¿Cómo cobro? ¿Cuándo me llega el dinero?',
    r: 'El negocio paga a TunayWasi al confirmar el pedido. TunayWasi retiene el dinero en custodia y lo libera a tu cuenta cuando el negocio confirma que recibió el café — o automáticamente a los 7 días si no hay reclamo.',
  },
  {
    p: '¿Qué pasa si el comprador no paga o devuelve el pedido?',
    r: 'No despachas sin pago confirmado. TunayWasi verifica que el pago llegó antes de avisarte que prepares el pedido. Si hay un reclamo legítimo de entrega, TunayWasi media entre las partes antes de liberar el dinero.',
  },
  {
    p: '¿Y si no tengo suficiente stock para cubrir el pedido?',
    r: 'Tú controlas los kg disponibles en tu perfil. Cuando un negocio compra, el stock se descuenta automáticamente. Si estás por quedarte sin lote, actualizas tu número y el catálogo se ajusta al instante.',
  },
  {
    p: '¿Tengo que tostar yo o puedo vender verde?',
    r: 'Por ahora solo café tostado y molido — porque las cafeterías lo necesitan listo para barra. Si no tienes tostadora propia, puedes asociarte con un tostador local y publicar el lote terminado. No necesitas certificación de proceso.',
  },
]

// ─── Átomos ───────────────────────────────────────────────────────────────────

const Chip: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.sage }) => (
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

const Nav: React.FC<{ onRegistrar: () => void }> = ({ onRegistrar }) => (
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
      <button onClick={() => { window.location.hash = '#/para-cafeterias' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.mutedLight,
      }}>
        Soy negocio
      </button>
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
      <button onClick={onRegistrar} style={{
        padding: '8px 20px', borderRadius: 8, border: 'none',
        background: C.sage, color: C.bg,
        fontSize: 13, fontWeight: 700,
        fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
        Descargar app
      </button>
    </div>
  </nav>
)

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero: React.FC<{ onRegistrar: () => void }> = ({ onRegistrar }) => {
  return (
  <section style={{
    position: 'relative',
    minHeight: '80vh',
    overflow: 'hidden',
    paddingTop: 64,
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&q=80) center/cover no-repeat',
      filter: 'brightness(0.2)',
    }} />
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(135deg, ${C.bg} 0%, ${C.green}88 60%, transparent 100%)`,
    }} />

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
      minHeight: 'calc(80vh - 64px)',
    }}>
      {/* Columna izquierda — propuesta de valor */}
      <div style={{ maxWidth: 600 }}>
        <Chip>Para caficultores peruanos</Chip>

        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(38px, 6vw, 72px)',
          fontWeight: 700, color: C.cream,
          margin: '20px 0 18px', lineHeight: 1.05,
        }}>
          Tu café, visible<br />
          <span style={{ color: C.terra }}>a nivel nacional.</span>
        </h1>

        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: C.creamDim, lineHeight: 1.75,
          maxWidth: 520, margin: '0 0 24px',
        }}>
          Ya produces con calidad. TunayWasi te da el canal para llegar a cafeterías
          y negocios en todo el país — con tu perfil de finca, tus lotes publicados
          y pagos confirmados automáticamente en tu celular.
        </p>

        {/* CTA principal */}
        <CTABtn onClick={onRegistrar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
          Descargar app (Android)
        </CTABtn>

      </div>

      {/* Columna derecha — formulario beta */}
      <div id="beta-form" className="cafi-hero-card">
        <BetaRegistro
          rolDefecto="caficultor"
          acento={C.sage}
          titulo="Únete a la beta"
          subtitulo="Regístrate y te enviamos el link de descarga directo a tu correo."
          origen="landing-caficultores"
        />
      </div>
    </div>
    <style>{`@media (max-width: 720px) { .cafi-hero-card { display: none !important; } }`}</style>
  </section>
  )
}


// ─── Lo que ganas ─────────────────────────────────────────────────────────────

const SeccionBeneficios: React.FC = () => (
  <section style={{ background: C.bgSection, padding: '80px 24px' }}>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <Chip>Lo que ganas</Chip>
        <H2>Una plataforma que trabaja<br />para ti, no contra ti</H2>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
      }}>
        {LO_QUE_GANAS.map(b => (
          <div key={b.titulo} style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: 26,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.sage + '55' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border }}
          >
            <div style={{ fontSize: 30, marginBottom: 12 }}>{b.icono}</div>
            <h3 style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 14,
              fontWeight: 700, color: C.cream, marginBottom: 8,
            }}>
              {b.titulo}
            </h3>
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13,
              color: C.creamDim, lineHeight: 1.7, margin: 0,
            }}>
              {b.texto}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
)

// ─── FAQ ──────────────────────────────────────────────────────────────────────

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
              border: `1px solid ${abierto === i ? C.sage + '44' : C.border}`,
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
                <span style={{ color: C.sage, fontSize: 18, flexShrink: 0 }}>
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

const INSTALACION_PASOS = [
  {
    n: '1',
    titulo: 'Descarga la app',
    texto: 'Abre Google Play Store en tu celular Android y busca "TunayWasi" o toca el botón de descarga. La instalación toma menos de 1 minuto.',
    color: '#c96e4b',
  },
  {
    n: '2',
    titulo: 'Crea tu cuenta de caficultor',
    texto: 'Ingresa con tu cuenta Google o con tu correo. Selecciona el rol "Caficultor" y completa tu perfil: nombre, región, altitud y una foto de tu finca.',
    color: '#c96e4b',
  },
  {
    n: '3',
    titulo: 'Publica tu primer lote',
    texto: 'Toca "Agregar producto", sube 4-5 fotos reales, elige el proceso (lavado, natural, honey o anaeróbico), el tipo (verde, tostado en grano o tostado y molido), el stock en kg y el precio que tú decides.',
    color: '#c96e4b',
  },
  {
    n: '4',
    titulo: 'Recibe y confirma pedidos',
    texto: 'Cuando un negocio compra tu café recibirás una notificación. Entra al pedido, confirma la recepción del pago (TunayWasi lo retiene en custodia) y coordina el despacho por tu agencia.',
    color: '#8faf8a',
  },
  {
    n: '5',
    titulo: 'Despacha y sube el tracking',
    texto: 'Una vez que TunayWasi confirma el pago en custodia, despacha el café por tu agencia (Olva, Shalom, etc.) y sube el código de seguimiento al chat del pedido. El dinero se libera cuando el negocio confirma la entrega o pasan 7 días.',
    color: '#8faf8a',
  },
]

const FUNCIONALIDADES_CAFICULTOR = [
  { icono: '🌿', titulo: 'Perfil de finca público', texto: 'Foto, región, altitud, variedades y proceso visible para todos los negocios en el catálogo.' },
  { icono: '📦', titulo: 'Gestión de productos', texto: 'Publica y edita tus lotes con galería de 4-5 fotos, tipo de molienda, stock y precio — todo desde el celular.' },
  { icono: '🔔', titulo: 'Notificaciones de pedido', texto: 'Badge en la navegación y alerta cuando un negocio hace un nuevo pedido.' },
  { icono: '💳', titulo: 'Pagos en custodia', texto: 'El negocio paga a TunayWasi al confirmar el pedido. El dinero se libera a tu cuenta cuando el negocio confirma la entrega o pasan 7 días.' },
  { icono: '💬', titulo: 'Chat por pedido', texto: 'Cada pedido tiene su propio hilo de chat en tiempo real con el negocio. Sin WhatsApp separado.' },
  { icono: '⭐', titulo: 'Calificaciones verificadas', texto: 'Los negocios te califican al recibir su pedido. Tu reputación se construye con cada entrega.' },
]

const SeccionInstalacion: React.FC<{ onDescargar: () => void }> = ({ onDescargar }) => (
  <section style={{ background: '#0a0a0a', padding: '80px 24px' }}>
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <Chip color='#c96e4b'>Cómo instalar</Chip>
        <H2>En 5 pasos estás<br />publicando tu café</H2>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 15,
          color: '#c4b297', lineHeight: 1.7,
          maxWidth: 480, margin: '16px auto 0',
        }}>
          Solo necesitas un celular Android con Android 8.0 o superior.
          Todo el proceso toma menos de 10 minutos.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 680, margin: '0 auto 60px' }}>
        {INSTALACION_PASOS.map((paso, i) => (
          <div key={paso.n} style={{
            display: 'grid', gridTemplateColumns: '56px 1fr',
            gap: 20, paddingBottom: i < INSTALACION_PASOS.length - 1 ? 36 : 0,
            position: 'relative',
          }}>
            {i < INSTALACION_PASOS.length - 1 && (
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
        {FUNCIONALIDADES_CAFICULTOR.map(f => (
          <div key={f.titulo} style={{
            background: '#141414', border: '1px solid #222',
            borderRadius: 14, padding: 24,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#8faf8a55' }}
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
        background: 'linear-gradient(135deg, #0d2218 0%, #081a0e 100%)',
        border: '1px solid #8faf8a44',
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
          La detección automática de pagos Yape/Plin solo funciona<br />en dispositivo físico con el permiso activado.
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



const SeccionCTA: React.FC<{ onRegistrar: () => void }> = ({ onRegistrar }) => (
  <section style={{
    background: `linear-gradient(135deg, ${C.green} 0%, #081a0e 100%)`,
    padding: '90px 24px', textAlign: 'center',
  }}>
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(34px, 5vw, 56px)',
        fontWeight: 700, color: C.cream,
        marginBottom: 16, lineHeight: 1.15,
      }}>
        Incorporando los primeros<br />
        <span style={{ color: C.terra }}>caficultores de cosecha 2026.</span>
      </h2>
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 15,
        color: C.creamDim, lineHeight: 1.7, marginBottom: 12,
      }}>
        El catálogo abre a negocios este octubre. Los caficultores que entren ahora
        son los primeros que verán los compradores.
      </p>
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 13,
        color: C.muted, lineHeight: 1.6, marginBottom: 36,
      }}>
        Registro gratuito · Tú fijas el precio · Sin comisión
      </p>
      <CTABtn onClick={onRegistrar} fullWidth>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
        Descargar app (Android)
      </CTABtn>
      <p style={{
        marginTop: 16, fontFamily: 'Montserrat, sans-serif',
        fontSize: 12, color: C.muted,
      }}>
        Gratis · Sin comisión · Cupos limitados para la cosecha 2026
      </p>
    </div>
  </section>
)

// ─── Componente principal ─────────────────────────────────────────────────────

const LandingCaficultores: React.FC = () => {
  function irAFormulario() {
    const el = document.getElementById('beta-form')
    if (!el) { window.location.hash = '#/para-caficultores'; return }
    const esMovil = window.matchMedia('(max-width: 720px)').matches
    if (esMovil) {
      el.style.display = 'block'
      el.style.marginTop = '24px'
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => el.querySelector('input')?.focus(), 400)
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Nav onRegistrar={irAFormulario} />
      <Hero onRegistrar={irAFormulario} />
      <SeccionInstalacion onDescargar={irAFormulario} />
      <SeccionBeneficios />
      <SeccionFAQ />
      <SeccionCTA onRegistrar={irAFormulario} />
    </div>
  )
}

export default LandingCaficultores
