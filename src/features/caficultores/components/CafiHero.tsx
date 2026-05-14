import { useState, useEffect } from 'react';
import { useCafiLandingConfig } from '@/features/caficultores/useCafiLandingConfig';

export default function CafiHero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  const { data } = useCafiLandingConfig();
  const minPrice = data?.hero.minPricePerKg.toFixed(2) ?? '34.65';
  const maxPrice = data?.hero.maxPricePerKg.toFixed(2) ?? '85.78';
  const minLabel = data?.hero.minScaLabel ?? '82 pts';
  const maxLabel = data?.hero.maxScaLabel ?? '90+ pts';

  const fade = (delay: number): React.CSSProperties => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(18px)',
    transition: `all 1s cubic-bezier(.2,.7,.2,1) ${delay}s`,
  });

  return (
    <section style={{
      position: 'relative',
      minHeight: '88vh',
      paddingTop: 100,
      paddingBottom: 100,
      background: 'linear-gradient(180deg, #182520 0%, #1f3028 100%)',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%',
        width: 760, height: 760, borderRadius: '50%',
        background: 'radial-gradient(circle, #c96e4b44 0%, #c96e4b00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30%', left: '-10%',
        width: 620, height: 620, borderRadius: '50%',
        background: 'radial-gradient(circle, #8faf8a44 0%, #8faf8a00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.12,
        backgroundImage: 'radial-gradient(#c4b29766 1px, transparent 1px)',
        backgroundSize: '28px 28px', pointerEvents: 'none',
      }} />

      <svg viewBox="0 0 400 400" style={{
        position: 'absolute', right: '-40px', top: '20%', width: 520, height: 520,
        opacity: 0.18, pointerEvents: 'none',
      }}>
        <g stroke="#c4b297" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <ellipse cx="200" cy="160" rx="120" ry="22" />
          <path d="M80 160 L100 290 Q100 320 130 326 L270 326 Q300 320 300 290 L320 160" />
          <path d="M320 190 Q368 200 368 240 Q368 280 320 286" />
          <path d="M170 60 Q160 80 175 100 Q190 120 175 140" />
          <path d="M210 50 Q200 75 215 95 Q230 115 215 135" />
          <path d="M245 60 Q235 80 250 100 Q265 120 250 140" />
        </g>
      </svg>

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 920, margin: '0 auto', padding: '0 36px',
        textAlign: 'center',
      }}>
        <div style={fade(0.05)}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', borderRadius: 999,
            background: '#8faf8a22', border: '1px solid #8faf8a55',
            marginBottom: 36,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#8faf8a',
              animation: 'tw-pulse-dot 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.28em',
              color: '#f2e0cc', textTransform: 'uppercase',
            }}>Lista de espera · Caficultores</span>
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
          fontSize: 'clamp(40px, 6.5vw, 92px)',
          lineHeight: 0.98, letterSpacing: '-0.015em',
          margin: 0, color: '#f2e0cc',
          ...fade(0.15),
        }}>
          Vende tu <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>Café</span>
          {' '}y recibe <br />
          <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>pago justo</span>
          {' '}al entregarlo<br />
          en <span style={{ fontStyle: 'italic', fontWeight: 500 }}>Lima</span>.
        </h1>

        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontWeight: 400,
          fontSize: 17, lineHeight: 1.65,
          color: '#c4b297', maxWidth: 720, margin: '36px auto 0',
          ...fade(0.3),
        }}>
          Te pagamos al recepcionar tu microlote en Lima, según el puntaje SCA de tu café.
          Desde <strong style={{ color: '#f2e0cc' }}>S/ {minPrice} por kg verde</strong> ({minLabel}) hasta
          {' '}<strong style={{ color: '#8faf8a' }}>S/ {maxPrice} por kg</strong> ({maxLabel}).
          {' '}Sin intermediarios.
        </p>

        <div style={{
          marginTop: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap',
          ...fade(0.45),
        }}>
          <a href="#lista" className="tw-cafi-cta" style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: '#f2e0cc',
            background: 'linear-gradient(135deg, #c96e4b 0%, #b85a3a 100%)',
            padding: '20px 32px', borderRadius: 999, textDecoration: 'none',
            boxShadow: '0 18px 40px -16px #c96e4baa, inset 0 1px 0 #ffffff33',
            display: 'inline-flex', alignItems: 'center', gap: 12,
            border: '1px solid #f2e0cc22',
            transition: 'all .3s ease',
          }}>
            Registrar mi Finca <span className="tw-cafi-cta-arrow">→</span>
          </a>
          <a href="#lista" style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14,
            letterSpacing: '0.04em', color: '#f2e0cc',
            textDecoration: 'none', padding: '20px 8px',
            borderBottom: '1px solid #f2e0cc55',
            transition: 'all .3s ease',
          }}>
            Lista de espera abierta
          </a>
        </div>
      </div>

      <style>{`
        @keyframes tw-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .tw-cafi-cta:hover { transform: translateY(-2px); }
        .tw-cafi-cta:hover .tw-cafi-cta-arrow { transform: translateX(6px); }
        .tw-cafi-cta-arrow { transition: transform .3s ease; display: inline-block; }
      `}</style>
    </section>
  );
}
