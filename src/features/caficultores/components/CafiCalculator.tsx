import { useState } from 'react';
import { useCafiLandingConfig, STATIC_DATA } from '@/features/caficultores/useCafiLandingConfig';

const fmtPEN = (n: number) => 'S/ ' + Math.round(n).toLocaleString('es-PE');

const NIVELES = [
  { label: 'Inicio',  kg: 12  },
  { label: 'Bronce',  kg: 25  },
  { label: 'Plata',   kg: 50  },
  { label: 'Oro',     kg: 100 },
];

export default function CafiCalculator() {
  const { data = STATIC_DATA } = useCafiLandingConfig();
  const { calculator } = data;

  const [tier, setTier] = useState(calculator.defaultTierIndex);
  const [nivelIdx, setNivelIdx] = useState(0);
  const t = calculator.tiers[tier] ?? calculator.tiers[0];

  const KG_LOTE = NIVELES[nivelIdx].kg;
  const acopMid = (t.acopMin + t.acopMax) / 2;
  const acopTotal = KG_LOTE * acopMid;
  const tunayTotal = KG_LOTE * t.tunay;
  const delta = Math.round((tunayTotal / acopTotal - 1) * 100);

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
            Compara cuánto recibirías por tus kilos con un acopiador tradicional
            versus vender con Tunay Wasi — sin acopiadores, sin regateo.
          </p>
        </div>

        {/* Selector de tier SCA */}
        <div style={{
          background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 60%)',
          border: '1px solid #c4b29722',
          borderRadius: 24, padding: 36,
          boxShadow: '0 30px 60px -28px #000000aa',
          marginBottom: 36,
        }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600,
            color: '#f2e0cc', marginBottom: 14, letterSpacing: '0.02em',
          }}>¿Cuál es el puntaje SCA de tu café?</div>
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

        {/* Comparación por microlote */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'stretch',
        }} className="tw-cafi-compare">

          {/* Acopiador */}
          <div style={{
            background: '#0f1a14', border: '1px solid #c4b29722',
            borderRadius: 20, padding: 36, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>😔</div>
            <div style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.28em',
              color: '#c4b29799', textTransform: 'uppercase', marginBottom: 18,
            }}>Acopiador tradicional</div>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 56, color: '#c4b297', lineHeight: 1,
            }}>{fmtPEN(acopTotal)}</div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297', marginTop: 18,
            }}>S/ {t.acopMin} – S/ {t.acopMax} por kg · {KG_LOTE} kg</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em',
              color: '#c4b29766', textTransform: 'uppercase', marginTop: 10,
            }}>{calculator.footnote}</div>
          </div>

          <div className="tw-cafi-arrow" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c96e4b', fontFamily: 'Cormorant Garamond, serif', fontSize: 48,
          }}>→</div>

          {/* Tunay Wasi */}
          <div style={{
            background: 'linear-gradient(135deg, #c96e4b22 0%, #8faf8a14 100%)',
            border: '1px solid #8faf8a66', borderRadius: 20, padding: 36, textAlign: 'center',
            position: 'relative', boxShadow: '0 30px 60px -28px #8faf8a55',
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
            }}>{fmtPEN(tunayTotal)}</div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', marginTop: 18,
            }}>S/ {t.tunay.toFixed(2)} por kg · {KG_LOTE} kg · {t.label}</div>
            <div style={{
              display: 'inline-block', marginTop: 14,
              padding: '6px 14px', borderRadius: 999,
              background: '#8faf8a33', border: '1px solid #8faf8a99',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700,
              color: '#8faf8a', letterSpacing: '0.04em',
            }}>+{delta}% más que el acopiador</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em',
              color: '#8faf8a88', textTransform: 'uppercase', marginTop: 10,
            }}>Recibes esto cuando tu lote se agota · sujeto a análisis físico</div>
          </div>
        </div>

        {/* Proyección por nivel */}
        <div style={{
          marginTop: 28, padding: '20px 28px',
          background: '#0f1a14', borderRadius: 16, border: '1px solid #c4b29722',
        }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, lineHeight: 1.65, color: '#c4b297',
            marginBottom: 14,
          }}>
            <strong style={{ color: '#f2e0cc' }}>¿Cuánto ganarías con un lote más grande?</strong>
            {' '}Conforme vendas más lotes y tu café suba de calificación, puedes enviar lotes más grandes.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {NIVELES.map((n, i) => (
              <button key={n.label} onClick={() => setNivelIdx(i)} style={{
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                background: nivelIdx === i ? '#c96e4b22' : '#f2e0cc0a',
                border: `1px solid ${nivelIdx === i ? '#c96e4b88' : '#f2e0cc1a'}`,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em',
                color: nivelIdx === i ? '#c96e4b' : '#c4b29766',
                textTransform: 'uppercase',
                transition: 'all .2s ease',
              }}>
                {i === 0 ? '★ ' : ''}{n.label} · {n.kg} kg
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .tw-cafi-compare { grid-template-columns: 1fr !important; }
          .tw-cafi-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </section>
  );
}
