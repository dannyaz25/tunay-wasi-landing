import { useState, useEffect } from 'react';
import CoffeeBranch from '@/components/decor/CoffeeBranch';
import ImageSlot from '@/components/decor/ImageSlot';

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  const fade = (delay: number, finalOpacity = 1) => ({
    opacity: loaded ? finalOpacity : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(18px)',
    transition: `all 1s cubic-bezier(.2,.7,.2,1) ${delay}s`,
  });

  return (
    <>
      <style>{`
        @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes tw-scroll { 0%, 100% { transform: scaleY(0.4); transform-origin: top; opacity: 0.4; } 50% { transform: scaleY(1); opacity: 1; } }
        .tw-cta-primary:hover { background: #1f3028 !important; transform: translateY(-2px); box-shadow: 0 22px 50px -16px #533b22cc, inset 0 1px 0 #ffffff22; }
        .tw-cta-primary:hover .tw-cta-arrow { transform: translateX(6px); }
        @media (max-width: 960px) { .tw-hero-grid { grid-template-columns: 1fr !important; gap: 60px !important; } }
      `}</style>
      <section id="top" style={{ position: 'relative', minHeight: '100vh', paddingTop: 120, paddingBottom: 80, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(80% 60% at 75% 30%, #e8c69e 0%, #f2e0cc 55%, #f2e0cc 100%)' }} />
        <div style={{ position: 'absolute', top: '12%', right: '-8%', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, #c96e4b88 0%, #c96e4b00 70%)', filter: 'blur(22px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-6%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, #8faf8a55 0%, #8faf8a00 70%)', filter: 'blur(28px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: -20, top: 80, width: 180, zIndex: 1, ...fade(0.4, 0.55) }}>
          <CoffeeBranch />
        </div>
        <div style={{ position: 'absolute', right: -10, bottom: 40, width: 160, zIndex: 1, ...fade(0.55, 0.55) }}>
          <CoffeeBranch flip />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1320, margin: '0 auto', padding: '0 36px', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 64, alignItems: 'center' }} className="tw-hero-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, ...fade(0.05) }}>
              <span style={{ width: 48, height: 1, background: '#1f3028' }} />
              <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#533b22', textTransform: 'uppercase' }}>Café · Origen Perú · 2026</span>
            </div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: '#1f3028', fontSize: 'clamp(48px, 7vw, 104px)', lineHeight: 0.95, letterSpacing: '-0.015em', margin: 0, ...fade(0.15) }}>
              La verdadera<br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>casa </span>del café<br />
              <span style={{ fontStyle: 'italic', fontWeight: 500 }}>peruano.</span>
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 400, color: '#1f3028', fontSize: 18, lineHeight: 1.6, maxWidth: 520, marginTop: 32, ...fade(0.3, 0.82) }}>
              Conectamos directamente a caficultores de los Andes con tu taza. Sin intermediarios, sin opacidad — hasta el <strong style={{ color: '#1f3028', fontWeight: 600 }}>50&nbsp;% de cada bolsa</strong> regresa a quien sembró el grano.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 44, alignItems: 'center', flexWrap: 'wrap', ...fade(0.45) }}>
              <a href="#cafe" className="tw-cta-primary" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f2e0cc', background: '#c96e4b', padding: '20px 32px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 18px 40px -16px #533b22aa, inset 0 1px 0 #ffffff33', display: 'inline-flex', alignItems: 'center', gap: 12, transition: 'all .35s cubic-bezier(.2,.7,.2,1)', border: '1px solid #533b2244' }}>
                Descubrir nuestro café
                <span style={{ display: 'inline-block', transition: 'transform .35s ease' }} className="tw-cta-arrow">→</span>
              </a>
              <a href="#caficultores" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: 14, letterSpacing: '0.06em', color: '#1f3028', textDecoration: 'none', padding: '20px 8px', borderBottom: '1px solid #1f3028', transition: 'all .3s ease' }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#c96e4b'; el.style.borderColor = '#c96e4b'; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#1f3028'; el.style.borderColor = '#1f3028'; }}>
                Conoce a los caficultores
              </a>
            </div>
            <div style={{ display: 'flex', gap: 48, marginTop: 72, flexWrap: 'wrap', ...fade(0.6) }}>
              {([['Hasta 50%', 'directo al productor'], ['12', 'fincas asociadas'], ['+1,400 m', 'altitud media']] as [string, string][]).map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 44, fontWeight: 600, color: '#1f3028', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, color: '#533b22', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 8 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: 580, ...fade(0.25) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '70%' }}>
              <ImageSlot label="finca · neblina andina" tone="green" ratio="3 / 4" />
            </div>
            <div style={{ position: 'absolute', bottom: 30, right: 0, width: '60%', transform: 'rotate(2.5deg)' }}>
              <ImageSlot label="cerezos de café" tone="terra" ratio="4 / 5" />
            </div>
            <div style={{ position: 'absolute', top: '38%', right: '32%', width: 130, height: 130, borderRadius: '50%', background: '#f2e0cc', border: '1px solid #533b22', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 60px -20px #533b22aa', zIndex: 3 }}>
              <div style={{ width: 96, height: 96, animation: 'tw-logo-hover 4.2s ease-in-out infinite' }}>
                <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'tw-logo-breathe 2.4s ease-in-out infinite' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', top: '6%', right: '4%', width: 100, height: 100, borderRadius: '50%', border: '1px dashed #1f3028', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2e0cc', zIndex: 4, transform: 'rotate(-12deg)' }}>
              <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
                <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, color: '#c96e4b', letterSpacing: '0.18em' }}>50/50</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 13, color: '#1f3028', marginTop: 3 }}>justo</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: '#533b22', marginTop: 3, letterSpacing: '0.18em' }}>EST · 2024</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...fade(0.8) }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.32em', color: '#533b22', textTransform: 'uppercase' }}>Desliza</span>
            <span style={{ width: 1, height: 38, background: '#1f3028', display: 'block', animation: 'tw-scroll 2.2s ease-in-out infinite' }} />
          </div>
        </div>
      </section>
    </>
  );
}
