import { useState } from 'react';
import CoffeeBranch from '@/components/decor/CoffeeBranch';
import { useSupplyLandingConfig } from '@/features/mayoristas/useSupplyLandingConfig';
import { useMicrolotesLanding } from '@/features/mayoristas/useMicrolotesLanding';
import { STATIC_SUPPLY_LANDING, STATIC_MICROLOTES } from '@/features/catalog/catalogService';
import { setLoteReservado } from '@/features/mayoristas/useLoteReservado';

const PALETTE = {
  green: { accent: '#8faf8a' },
  terra: { accent: '#c96e4b' },
  gold:  { accent: '#d6b15a' },
  cream: { accent: '#c4b297' },
} as const;

const FILTERS: [string, string][] = [
  ['all', 'Todos'],
  ['washed', 'Lavado'],
  ['honey', 'Honey'],
  ['natural', 'Natural'],
];

export default function SupplyLotes() {
  const { data: supply = STATIC_SUPPLY_LANDING } = useSupplyLandingConfig();
  const { data: microlotes = STATIC_MICROLOTES } = useMicrolotesLanding();
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? microlotes.lotes : microlotes.lotes.filter(l => l.tag === filter);

  return (
    <section id="lotes" style={{
      background: '#f2e0cc', color: '#1f3028',
      padding: '100px 36px 120px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: -30, top: 60, width: 150, opacity: 0.35, zIndex: 0 }}>
        <CoffeeBranch />
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 64, alignItems: 'end',
          marginBottom: 64,
        }} className="tw-sup-2col">
          <div>
            <span style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
              color: '#c96e4b', textTransform: 'uppercase',
            }}>02 — Lotes Disponibles</span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 1.0,
              color: '#1f3028', margin: '20px 0 0', letterSpacing: '-0.01em',
            }}>
              Cosecha
              <br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>{supply.cosechaLabel}.</span>
            </h2>
          </div>
          <div>
            <p style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.65,
              color: '#533b22', margin: 0, maxWidth: 460,
            }}>
              Cada lote está catado y aprobado por un Q‑Grader certificado. Reservamos
              hasta el momento del despacho; el café duerme en bodega Lima a 18 °C.
            </p>
            <div style={{ marginTop: 22, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FILTERS.map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500,
                  padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                  background: filter === v ? '#1f3028' : 'transparent',
                  color: filter === v ? '#f2e0cc' : '#1f3028',
                  border: `1px solid ${filter === v ? '#1f3028' : '#1f302844'}`,
                  transition: 'all .25s ease',
                  letterSpacing: '0.04em',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28,
        }}>
          {filtered.map((l) => {
            const p = PALETTE[l.tone];
            return (
              <article key={l.id} className="tw-sup-card" style={{
                position: 'relative',
                background: '#fff8ee',
                border: '1px solid #533b2244',
                padding: 28,
                display: 'flex', flexDirection: 'column', gap: 0,
                transition: 'all .3s ease',
                cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 64, height: 64,
                  background: p.accent,
                  clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
                }} />
                <div style={{
                  position: 'absolute', top: -10, left: 28, height: 22, width: 64,
                  background: '#c96e4b', opacity: 0.85, transform: 'rotate(-2deg)',
                  boxShadow: '0 4px 10px -3px #00000044',
                }} />

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginTop: 12,
                }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
                    color: '#533b22', textTransform: 'uppercase',
                  }}>{l.id}</span>
                </div>

                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '0.10em',
                  color: '#533b22', marginTop: 6,
                }}>{l.origen}</div>

                <h3 style={{
                  fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
                  fontSize: 36, lineHeight: 0.98, letterSpacing: '-0.01em',
                  margin: '14px 0 4px', color: '#1f3028',
                }}>{l.variedad}</h3>

                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                  fontSize: 18, color: p.accent, fontWeight: 500,
                }}>{l.proceso}</div>

                <div style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13, lineHeight: 1.5,
                  color: '#533b22', marginTop: 14, fontStyle: 'italic',
                  paddingTop: 14, borderTop: '1px dashed #533b2244',
                }}>{l.notas}</div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
                  marginTop: 18,
                }}>
                  {[
                    ['Finca', l.finca],
                    ['Altitud', l.altitud],
                    ['SCA', `${l.sca} pts`],
                    ['Disponible', `${l.sacos} sacos · ${l.kg} kg`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.20em',
                        color: '#533b22aa', textTransform: 'uppercase',
                      }}>{k}</div>
                      <div style={{
                        fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#1f3028',
                        marginTop: 2,
                      }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 22, paddingTop: 18, borderTop: '1px solid #533b2244',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.20em',
                      color: '#533b22aa', textTransform: 'uppercase',
                    }}>FOB Lima / kg</div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 600, color: '#1f3028',
                      lineHeight: 1, marginTop: 4,
                    }}>S/ {l.precio.toFixed(2)}</div>
                  </div>
                  <a
                    href="#solicitud"
                    className="tw-sup-reservar"
                    onClick={() => setLoteReservado({ id: l.id, variedad: l.variedad, origen: l.origen, sca: l.sca, precioKg: l.precio })}
                    style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: '#f2e0cc', background: '#1f3028',
                      padding: '11px 16px', textDecoration: 'none',
                      transition: 'all .25s ease',
                    }}
                  >
                    Reservar →
                  </a>
                </div>

                {l.estado !== 'disponible' && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16, zIndex: 5,
                    fontFamily: 'Bowlby One SC, sans-serif', fontSize: 8, letterSpacing: '0.22em',
                    color: '#f2e0cc', background: '#c96e4b',
                    padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase',
                    boxShadow: '0 4px 12px -4px #c96e4b99',
                    pointerEvents: 'none',
                  }}>{l.estado}</div>
                )}
              </article>
            );
          })}
        </div>

        <div style={{
          marginTop: 48,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          paddingTop: 28, borderTop: '1px solid #1f302833',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.20em',
          color: '#533b22', textTransform: 'uppercase',
        }}>
          <span>+ 8 lotes en cata · disponibles en mayo</span>
          <a href="#solicitud" style={{ color: '#c96e4b', textDecoration: 'none' }}>
            Suscríbete al boletín de cosecha →
          </a>
        </div>
      </div>

      <style>{`
        .tw-sup-card:hover { transform: translateY(-4px); box-shadow: 0 24px 50px -22px #533b22aa; border-color: #1f3028; }
        .tw-sup-reservar:hover { background: #c96e4b !important; }
        @media (max-width: 880px) {
          .tw-sup-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
