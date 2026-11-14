/**
 * SoporteONE.tsx — Página de soporte TunayWasi ONE
 * Ruta: #/soporte
 * Canales: WhatsApp, Email, Instagram, Docs + FAQ accordion
 */
import React, { useState } from 'react'

const C = {
  bg:         '#0a0a0a',
  bgCard:     '#141414',
  bgSection:  '#0f0f0f',
  cream:      '#f2e0cc',
  creamDim:   '#c4b297',
  terra:      '#c96e4b',
  sage:       '#8faf8a',
  border:     '#222222',
  muted:      '#555555',
  mutedLight: '#777777',
  white:      '#ffffff',
}

const FAQ_SOPORTE = [
  {
    p: '¿Cómo descargo la app?',
    r: 'La app está en versión beta. Descárgala desde el enlace de Firebase App Distribution que encuentras en las páginas de negocio o caficultor. Aún no está publicada en Google Play Store.',
  },
  {
    p: '¿La app está disponible para iPhone?',
    r: 'Aún no. La app está en beta para Android (8.0 o superior). La versión iOS y la publicación en Google Play Store están en desarrollo.',
  },
  {
    p: '¿Cómo calculo el precio final de un pedido?',
    r: 'Los caficultores publican un precio base. TunayWasi suma S/5 por el servicio de tueste (si aplica) y S/1 por bolsa. No hay cargos de envío en la plataforma — el costo de la agencia se coordina directamente con el caficultor.',
  },
  {
    p: '¿Qué hago si el caficultor no responde?',
    r: 'Usa el chat del pedido para contactarlo directamente. Si no recibes respuesta en 48 horas, escríbenos por WhatsApp al +51 917 959 370 con el número de tu pedido y lo gestionamos.',
  },
  {
    p: '¿Cómo contacto a TunayWasi si hay un problema con mi pedido?',
    r: 'Escríbenos por WhatsApp al +51 917 959 370. Incluye tu número de pedido y una descripción breve del problema. Respondemos en horario de lunes a sábado de 9am a 6pm.',
  },
  {
    p: '¿Puedo cambiar o cancelar un pedido después de confirmarlo?',
    r: 'Puedes solicitar cambios o cancelación antes de que el caficultor confirme el pago. Una vez que el pago es confirmado, el pedido está en proceso y no se puede cancelar. Contacta al caficultor por el chat del pedido.',
  },
  {
    p: '¿Cómo funciona el pago? ¿Es seguro?',
    r: 'El pago va a TunayWasi, que lo retiene en custodia. Una vez que confirmas la entrega del pedido — o pasan 7 días desde el despacho — el dinero se libera al caficultor. Esto protege tu compra en caso de cualquier problema.',
  },
  {
    p: '¿Con qué agencias se puede enviar?',
    r: 'El caficultor elige la agencia: Olva Courier, Shalom, Cruz del Sur u otras disponibles en su zona. La agencia y el costo de envío se coordinan en el chat del pedido antes de despachar.',
  },
]

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NavBar: React.FC = () => (
  <nav style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    background: `${C.bg}f0`, backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 5%', height: 56,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
      <button onClick={() => { window.location.hash = '#/' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 20, fontWeight: 700, color: C.cream,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        TunayWasi
      </button>
      <span style={{ color: C.border, fontSize: 20, flexShrink: 0 }}>·</span>
      <span className="sop-nav-label" style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 13, fontWeight: 600, color: C.sage,
        letterSpacing: '0.05em',
      }}>
        Soporte
      </span>
    </div>
    <div className="sop-nav-links" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <button onClick={() => { window.location.hash = '#/docs' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.terra,
        fontWeight: 600, whiteSpace: 'nowrap',
      }}>
        Documentación
      </button>
      <button onClick={() => { window.location.hash = '#/' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.mutedLight,
        whiteSpace: 'nowrap',
      }}>
        Catálogo
      </button>
    </div>
    <style>{`
      @media (max-width: 480px) {
        .sop-nav-links { display: none !important; }
        .sop-nav-label { display: none !important; }
      }
    `}</style>
  </nav>
)

// ─── Sección Hero ─────────────────────────────────────────────────────────────

const Hero: React.FC = () => (
  <section style={{
    paddingTop: 56,
    background: `linear-gradient(180deg, #0a0a0a 0%, #0d1f13 100%)`,
    borderBottom: `1px solid ${C.border}`,
  }}>
    <div style={{
      maxWidth: 640, margin: '0 auto',
      padding: '72px 24px 60px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: `${C.sage}18`, border: `1px solid ${C.sage}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', fontSize: 24,
      }}>
        💬
      </div>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(32px, 5vw, 48px)',
        fontWeight: 700, color: C.cream,
        margin: '0 0 14px', lineHeight: 1.15,
      }}>
        ¿En qué podemos ayudarte?
      </h1>
      <p style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 15, color: C.creamDim, lineHeight: 1.7, margin: 0,
      }}>
        Estamos disponibles por WhatsApp, email y redes sociales.<br />
        También puedes consultar la documentación paso a paso.
      </p>
    </div>
  </section>
)

// ─── Canales ──────────────────────────────────────────────────────────────────

interface Canal {
  icono: string
  titulo: string
  descripcion: string
  ctaLabel: string
  href: string
  color: string
  bgColor: string
}

const CANALES: Canal[] = [
  {
    icono: '📱',
    titulo: 'WhatsApp',
    descripcion: 'Respuesta más rápida. Lunes a sábado de 9am a 6pm.',
    ctaLabel: 'Escribir por WhatsApp',
    href: 'https://wa.me/51917959370',
    color: '#25D366',
    bgColor: '#0a2a18',
  },
  {
    icono: '✉️',
    titulo: 'Email',
    descripcion: 'Para consultas detalladas o temas que requieran documentación.',
    ctaLabel: 'Enviar un correo',
    href: 'mailto:soporte@tunaywasi.pe',
    color: C.terra,
    bgColor: '#1a0d05',
  },
  {
    icono: '📸',
    titulo: 'Instagram',
    descripcion: 'Seguimos de cerca los mensajes directos. También publicamos novedades.',
    ctaLabel: 'Ir a Instagram',
    href: 'https://instagram.com/tunaywasi',
    color: '#E1306C',
    bgColor: '#1a0812',
  },
  {
    icono: '📖',
    titulo: 'Documentación',
    descripcion: 'Guías paso a paso para negocios y caficultores.',
    ctaLabel: 'Ver documentación',
    href: '#/docs',
    color: C.sage,
    bgColor: '#0a1f13',
  },
]

const SeccionCanales: React.FC = () => (
  <section style={{ background: C.bg, padding: '64px 24px' }}>
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {CANALES.map(canal => (
          <a
            key={canal.titulo}
            href={canal.href.startsWith('#') ? undefined : canal.href}
            onClick={canal.href.startsWith('#') ? () => { window.location.hash = canal.href } : undefined}
            target={canal.href.startsWith('#') ? undefined : '_blank'}
            rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 14, padding: '32px 20px 28px',
              background: canal.bgColor,
              border: `1px solid ${canal.color}33`,
              borderRadius: 16,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = canal.color + '88'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = canal.color + '33'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${canal.color}18`,
              border: `1px solid ${canal.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {canal.icono}
            </div>
            <h3 style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 15, fontWeight: 700,
              color: C.cream, margin: 0, textAlign: 'center',
            }}>
              {canal.titulo}
            </h3>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 12, color: C.creamDim,
              lineHeight: 1.6, margin: 0, textAlign: 'center',
            }}>
              {canal.descripcion}
            </p>
            <span style={{
              marginTop: 4,
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 12, fontWeight: 700,
              color: canal.color, letterSpacing: '0.04em',
            }}>
              {canal.ctaLabel} →
            </span>
          </a>
        ))}
      </div>
    </div>
  </section>
)

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const SeccionFAQ: React.FC = () => {
  const [abierto, setAbierto] = useState<number | null>(null)
  return (
    <section style={{ background: C.bgSection, padding: '64px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 10, fontWeight: 700, color: C.muted,
            letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px',
          }}>
            Preguntas frecuentes
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 700, color: C.cream, margin: 0,
          }}>
            Respuestas rápidas
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ_SOPORTE.map((f, i) => (
            <div key={i} style={{
              background: C.bgCard,
              border: `1px solid ${abierto === i ? C.sage + '44' : C.border}`,
              borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
            }}>
              <button onClick={() => setAbierto(abierto === i ? null : i)} style={{
                width: '100%', padding: '16px 20px',
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', gap: 14,
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
                <div style={{ padding: '0 20px 16px' }}>
                  <p style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 13, color: C.creamDim,
                    lineHeight: 1.75, margin: 0,
                  }}>
                    {f.r}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA WhatsApp al fondo */}
        <div style={{
          marginTop: 44, textAlign: 'center',
          background: '#0a1a10',
          border: `1px solid ${C.sage}33`,
          borderRadius: 14, padding: '28px 24px',
        }}>
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 14, color: C.creamDim,
            margin: '0 0 16px',
          }}>
            ¿No encontraste lo que buscabas?
          </p>
          <a
            href="https://wa.me/51917959370"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10,
              background: '#25D366', border: 'none',
              color: C.white, fontSize: 14, fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              textDecoration: 'none',
              boxShadow: '0 4px 16px #25D36633',
            }}
          >
            <span>📱</span> Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Footer mínimo ────────────────────────────────────────────────────────────

const Footer: React.FC = () => (
  <footer style={{
    background: '#050505',
    borderTop: `1px solid ${C.border}`,
    padding: '28px 24px',
  }}>
    <div style={{
      maxWidth: 880, margin: '0 auto',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 16, fontWeight: 700, color: C.creamDim,
      }}>
        TunayWasi
      </span>
      <div style={{ display: 'flex', gap: 20 }}>
        <button onClick={() => { window.location.hash = '#/docs' }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.mutedLight,
        }}>
          Documentación
        </button>
        <button onClick={() => { window.location.hash = '#/' }} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.mutedLight,
        }}>
          Catálogo
        </button>
      </div>
    </div>
  </footer>
)

// ─── Componente principal ─────────────────────────────────────────────────────

const SoporteONE: React.FC = () => (
  <div style={{ background: C.bg, minHeight: '100vh' }}>
    <NavBar />
    <Hero />
    <SeccionCanales />
    <SeccionFAQ />
    <Footer />
  </div>
)

export default SoporteONE
