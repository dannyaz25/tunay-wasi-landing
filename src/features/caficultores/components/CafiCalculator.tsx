import { useState } from 'react';
import { useCafiLandingConfig, STATIC_DATA } from '@/features/caficultores/useCafiLandingConfig';

const fmtPEN = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');

export default function CafiCalculator() {
  const { data = STATIC_DATA } = useCafiLandingConfig();
  const { calculator } = data;

  const [kg, setKg] = useState(calculator.defaultKg);
  const [tier, setTier] = useState(calculator.defaultTierIndex);

  const t = calculator.tiers[tier] ?? calculator.tiers[0];
  const acopMid = (t.acopMin + t.acopMax) / 2;
  const acopTotal = kg * acopMid;
  const tunayTotal = kg * t.tunay;
  const delta = Math.round((tunayTotal / acopTotal - 1) * 100);
  const pct = ((kg - calculator.sliderMinKg) / (calculator.sliderMaxKg - calculator.sliderMinKg)) * 100;

  return (
    <section id="calculadora" style={{
      position: 'relative',
      padding: '100px 36px',
      background: '#1f3028',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'radial-gradient(#c4b29766 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>01 — Calculadora</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(38px, 5vw, 68px)', lineHeight: 1.02,
            margin: '20px 0 18px', color: '#f2e0cc', letterSpacing: '-0.01em',
          }}>
            ¿Cuánto más ganarías
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>
              con Tunay Wasi?
            </span>
          </h2>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.65,
            color: '#c4b297', maxWidth: 660, margin: '0 auto',
          }}>
            El acopiador compra café. Tunay Wasi vende tu historia — tu nombre, tu finca
            y tu proceso en cada bolsa que llega al consumidor.
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 60%)',
          border: '1px solid #c4b29722',
          borderRadius: 24,
          padding: 36,
          boxShadow: '0 30px 60px -28px #000000aa',
        }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 16, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600,
                color: '#f2e0cc', letterSpacing: '0.02em',
              }}>¿Cuántos kg de café vendes al año?</div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700,
                color: '#8faf8a', lineHeight: 1,
              }}>{kg.toLocaleString('es-PE')} <span style={{ fontSize: 16, color: '#c4b297', fontWeight: 500 }}>kg/año</span></div>
            </div>
            <input
              type="range"
              min={calculator.sliderMinKg}
              max={calculator.sliderMaxKg}
              step={calculator.sliderStepKg}
              value={kg}
              onChange={(e) => setKg(Number(e.target.value))}
              className="tw-cafi-slider"
              style={{
                width: '100%', height: 6, borderRadius: 999,
                appearance: 'none',
                background: `linear-gradient(90deg, #c96e4b 0%, #8faf8a ${pct}%, #f2e0cc1a ${pct}%, #f2e0cc1a 100%)`,
                outline: 'none',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 8,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
              color: '#c4b29799',
            }}>
              <span>{calculator.sliderMinKg} kg</span>
              <span>1 000 kg</span>
              <span>2 000 kg</span>
              <span>{calculator.sliderMaxKg.toLocaleString('es-PE')} kg</span>
            </div>
          </div>

          <div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600,
              color: '#f2e0cc', marginBottom: 14, letterSpacing: '0.02em',
            }}>¿Cuál es tu puntaje SCA estimado?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {calculator.tiers.map((s, i) => (
                <button key={s.label} onClick={() => setTier(i)} style={{
                  flex: '1 1 140px',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
                  padding: '12px 16px', borderRadius: 999, cursor: 'pointer',
                  background: tier === i ? '#c96e4b' : '#0f1a14',
                  color: tier === i ? '#f2e0cc' : '#c4b297',
                  border: `1px solid ${tier === i ? '#c96e4b' : '#c4b29733'}`,
                  letterSpacing: '0.02em',
                  transition: 'all .25s ease',
                }}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 36,
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'stretch',
        }} className="tw-cafi-compare">
          <div style={{
            background: '#0f1a14',
            border: '1px solid #c4b29722',
            borderRadius: 20,
            padding: 36,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>😔</div>
            <div style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.28em',
              color: '#c4b29799', textTransform: 'uppercase', marginBottom: 18,
            }}>Acopiador tradicional</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 56, color: '#c4b297', lineHeight: 1,
              letterSpacing: '-0.01em',
            }}>{fmtPEN(acopTotal)}</div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297',
              marginTop: 18,
            }}>S/ {t.acopMin} – S/ {t.acopMax} por kg ({t.label})</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em',
              color: '#c4b29766', textTransform: 'uppercase', marginTop: 10,
            }}>{calculator.footnote}</div>
          </div>

          <div className="tw-cafi-arrow" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c96e4b',
            fontFamily: 'Cormorant Garamond, serif', fontSize: 48,
          }}>→</div>

          <div style={{
            background: 'linear-gradient(135deg, #c96e4b22 0%, #8faf8a14 100%)',
            border: '1px solid #8faf8a66',
            borderRadius: 20,
            padding: 36,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 30px 60px -28px #8faf8a55',
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: '#8faf8a', color: '#1f3028',
              padding: '4px 10px', borderRadius: 999,
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>Tunay Wasi</div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.28em',
              color: '#8faf8a', textTransform: 'uppercase', marginBottom: 18,
            }}>Con Tunay Wasi</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 56, color: '#f2e0cc', lineHeight: 1,
              letterSpacing: '-0.01em',
            }}>{fmtPEN(tunayTotal)}</div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc',
              marginTop: 18,
            }}>≈ S/ {t.tunay.toFixed(2)} por kg de café verde ({t.label})</div>
            <div style={{
              display: 'inline-block', marginTop: 14,
              padding: '6px 14px', borderRadius: 999,
              background: '#8faf8a33', border: '1px solid #8faf8a99',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700,
              color: '#8faf8a', letterSpacing: '0.04em',
            }}>+{delta}% más que el acopiador</div>
          </div>
        </div>

        <div style={{
          marginTop: 32, padding: '20px 24px',
          background: '#0f1a14', borderRadius: 14, border: '1px solid #c4b29722',
          fontFamily: 'Montserrat, sans-serif', fontSize: 12, lineHeight: 1.65,
          color: '#c4b297', textAlign: 'center',
        }}>
          <strong style={{ color: '#f2e0cc' }}>Cálculo ({t.label}):</strong> 1 kg verde → ~0.83 kg tostado → precio según puntaje SCA = <strong style={{ color: '#8faf8a' }}>S/ {t.tunay.toFixed(2)}/kg</strong>.
          {' '}{calculator.footnote}.
        </div>
      </div>

      <style>{`
        .tw-cafi-slider::-webkit-slider-thumb {
          appearance: none; -webkit-appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: #f2e0cc; border: 3px solid #c96e4b;
          cursor: grab; box-shadow: 0 4px 12px -2px #00000088;
          transition: transform .2s ease;
        }
        .tw-cafi-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
        .tw-cafi-slider::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: #f2e0cc; border: 3px solid #c96e4b;
          cursor: grab;
        }
        @media (max-width: 760px) {
          .tw-cafi-compare { grid-template-columns: 1fr !important; }
          .tw-cafi-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </section>
  );
}
