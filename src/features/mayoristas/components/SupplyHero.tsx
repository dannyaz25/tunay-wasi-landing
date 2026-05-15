import { useState, useEffect } from 'react';
import { useSupplyLandingConfig } from '@/features/mayoristas/useSupplyLandingConfig';
import { useMicrolotesLanding } from '@/features/mayoristas/useMicrolotesLanding';
import { STATIC_SUPPLY_LANDING, STATIC_MICROLOTES } from '@/features/catalog/catalogService';

const features = [
  ['Trazabilidad', 'Finca · lote · cosecha verificados.'],
  ['Q-Grader', 'Cata SCA con puntaje certificado.'],
  ['Sacos 46 / 69 kg', 'Yute orgánico, ready to roast.'],
] as const;

export default function SupplyHero() {
  const { data: supply = STATIC_SUPPLY_LANDING } = useSupplyLandingConfig();
  const { data: microlotes = STATIC_MICROLOTES } = useMicrolotesLanding();
  const { heroCard } = supply;
  const lote = microlotes.lotes.find(l => l.featured) ?? microlotes.lotes[0];

  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(18px)',
    transition: `all 1s cubic-bezier(.2,.7,.2,1) ${delay}s`,
  });

  return (
    <section id="top" style={{
      position: 'relative',
      minHeight: '94vh',
      paddingTop: 140,
      paddingBottom: 100,
      background: 'linear-gradient(180deg, #182520 0%, #1f3028 60%, #233a30 100%)',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-10%', right: '-12%',
        width: 780, height: 780, borderRadius: '50%',
        background: 'radial-gradient(circle, #c96e4b40 0%, #c96e4b00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-25%', left: '-12%',
        width: 620, height: 620, borderRadius: '50%',
        background: 'radial-gradient(circle, #8faf8a40 0%, #8faf8a00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.10,
        backgroundImage: 'radial-gradient(#c4b29766 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 1320, margin: '0 auto', padding: '0 36px',
        display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 80, alignItems: 'center',
      }} className="tw-sup-hero-grid">
        {/* LEFT — copy */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, ...fade(0.05) }}>
            <span style={{ width: 48, height: 1, background: '#c96e4b' }} />
            <span style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
              color: '#c96e4b', textTransform: 'uppercase',
            }}>B2B · Tunay Wasi Supply · 2026</span>
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            color: '#f2e0cc',
            fontSize: 'clamp(44px, 6.4vw, 96px)',
            lineHeight: 0.96,
            letterSpacing: '-0.015em',
            margin: 0,
            ...fade(0.15),
          }}>
            Café verde,
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>directo del origen</span>
            <br />
            para tu <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>negocio</span>.
          </h1>

          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 400,
            color: '#c4b297',
            fontSize: 17, lineHeight: 1.65,
            maxWidth: 520, marginTop: 32,
            ...fade(0.3),
          }}>
            Abastece tu cafetería, restaurante u operación de tueste con microlotes
            peruanos trazables — validados por Q‑Grader, embarcados desde finca, llegados
            con su pasaporte de cata.
          </p>

          <div style={{ display: 'flex', gap: 16, marginTop: 40, alignItems: 'center', flexWrap: 'wrap', ...fade(0.45) }}>
            <a href="#lotes" className="tw-sup-hero-cta" style={{
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#1f3028',
              background: 'linear-gradient(135deg, #c96e4b 0%, #b85a3a 100%)',
              padding: '20px 32px', borderRadius: 999, textDecoration: 'none',
              boxShadow: '0 18px 40px -16px #c96e4baa, inset 0 1px 0 #ffffff33',
              display: 'inline-flex', alignItems: 'center', gap: 12,
              border: '1px solid #f2e0cc22',
              transition: 'all .3s ease',
            }}>
              Ver lotes disponibles <span className="tw-sup-hero-arrow">→</span>
            </a>
            <a href="#proceso" style={{
              fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14,
              letterSpacing: '0.04em', color: '#f2e0cc',
              textDecoration: 'none', padding: '20px 8px',
              borderBottom: '1px solid #f2e0cc55',
              transition: 'all .3s ease',
            }}>
              Cómo trabajamos
            </a>
          </div>

          <div style={{
            marginTop: 72,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
            ...fade(0.6),
          }} className="tw-sup-feat-grid">
            {features.map(([k, v], i) => (
              <div key={k} style={{
                paddingTop: 18, borderTop: '1px solid #c4b29744',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
                  color: '#c96e4b', textTransform: 'uppercase',
                }}>0{i + 1}</span>
                <span style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600,
                  color: '#f2e0cc', lineHeight: 1.05,
                }}>{k}</span>
                <span style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b297', lineHeight: 1.5,
                }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — spec card */}
        <div style={{ position: 'relative', minHeight: 520, ...fade(0.25) }}>
          {/* main spec card */}
          <div style={{
            position: 'absolute', top: 30, left: 0, right: 40,
            background: '#f2e0cc',
            color: '#1f3028',
            border: '1px solid #533b22',
            padding: '34px 32px 30px',
            boxShadow: '0 30px 60px -24px #00000099',
            transform: 'rotate(-1.4deg)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              borderBottom: '1px solid #1f302833', paddingBottom: 14, marginBottom: 18,
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.24em',
                color: '#533b22', textTransform: 'uppercase',
              }}>LOTE · {lote.id} · {lote.origen.split('·')[0].trim().toUpperCase()}</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
                color: '#c96e4b',
              }}>{lote.sca} SCA</span>
            </div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600,
              lineHeight: 1.0, letterSpacing: '-0.01em',
            }}>
              {lote.variedad}
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}> {heroCard.procesoDisplay}</span>
              <br />
              {lote.finca}
            </div>
            <div style={{
              marginTop: 20,
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            }}>
              {[
                ['Altitud', lote.altitud],
                ['Proceso', lote.proceso],
                ['Disponible', `${lote.sacos} sacos`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.20em',
                    color: '#533b22', textTransform: 'uppercase',
                  }}>{k}</div>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, marginTop: 2,
                  }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 22, padding: '14px 16px',
              background: '#1f3028', color: '#f2e0cc',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em' }}>
                FOB LIMA / KG
              </span>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 600 }}>
                S/ {lote.precio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* cup notes ticket */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: '70%',
            background: '#233a30',
            border: '1px solid #8faf8a55',
            padding: '22px 24px',
            transform: 'rotate(2deg)',
            boxShadow: '0 24px 50px -20px #00000088',
          }}>
            <div style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.28em',
              color: '#8faf8a', textTransform: 'uppercase', marginBottom: 12,
            }}>Notas de Cata</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: 18, color: '#f2e0cc', lineHeight: 1.4,
            }}>
              "{heroCard.notasCata}"
            </div>
            <div style={{
              marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              letterSpacing: '0.20em', color: '#c4b297', textTransform: 'uppercase',
            }}>
              {heroCard.qGrader}
            </div>
          </div>

          {/* stamp */}
          <div style={{
            position: 'absolute', top: '4%', right: '6%',
            width: 96, height: 96, borderRadius: '50%',
            border: '1px dashed #c96e4b', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1f3028', zIndex: 4, transform: 'rotate(-10deg)',
          }}>
            <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
              <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, color: '#c96e4b', letterSpacing: '0.18em' }}>READY</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: '#f2e0cc', marginTop: 2 }}>to roast</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: '#8faf8a', marginTop: 3, letterSpacing: '0.18em' }}>LIMA · BCO</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tw-sup-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 22px 50px -16px #c96e4bcc, inset 0 1px 0 #ffffff22; }
        .tw-sup-hero-cta:hover .tw-sup-hero-arrow { transform: translateX(6px); }
        .tw-sup-hero-arrow { transition: transform .3s ease; display: inline-block; }
        @media (max-width: 980px) {
          .tw-sup-hero-grid { grid-template-columns: 1fr !important; gap: 60px !important; }
          .tw-sup-feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
