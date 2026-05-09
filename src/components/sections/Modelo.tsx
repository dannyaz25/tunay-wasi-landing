import { useState, useRef, useEffect } from 'react';

export const SLICES = [
  { pct: 42, label: 'Caficultor',             color: '#c96e4b', detail: 'Pago directo a la finca, antes de que el grano viaje.' },
  { pct: 15, label: 'Tueste + Cata Q-Grader', color: '#8faf8a', detail: 'Tostado artesanal y certificación de calidad SCA.' },
  { pct:  6, label: 'Flete y Empaque',         color: '#c4b297', detail: 'Transporte desde origen y embalaje kraft reciclado.' },
  { pct: 15, label: 'IGV (18%)',               color: '#8faf8a', detail: 'Impuesto al consumo incluido en el precio final.' },
  { pct: 21, label: 'Tunay Wasi',              color: '#c96e4b', detail: 'Plataforma, tecnología y operación del marketplace.' },
];

export default function Modelo() {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="modelo" ref={ref} style={{ padding: '100px 36px', background: '#1f3028', color: '#f2e0cc', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, opacity: 0.12, display: 'flex', gap: 24, justifyContent: 'center' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, background: '#8faf8a', transform: 'rotate(45deg)' }} />
        ))}
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>04 — Modelo 50 / 50</span>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, letterSpacing: '0.08em', color: '#c4b297', margin: '8px 0 0' }}>Desglose verificado del precio al consumidor</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', lineHeight: 1.0, color: '#f2e0cc', margin: '12px 0 12px', letterSpacing: '-0.01em' }}>
            ¿Adónde va cada<br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>sol que pagas?</span>
          </h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#c4b297', maxWidth: 560, margin: '0 auto' }}>
            Auditamos el desglose cada trimestre y lo publicamos en nuestro reporte abierto.
            Esta es la última cosecha — mayo 2026.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }} className="tw-2col">
          <div>
            <div style={{ display: 'flex', height: 54, borderRadius: 12, overflow: 'hidden', boxShadow: '0 18px 36px -18px #00000077', border: '1px solid #f2e0cc22' }}>
              {SLICES.map((s, i) => (
                <div key={s.label} style={{
                  width: animated ? `${s.pct}%` : '0%',
                  background: s.color,
                  transition: `width 1.4s cubic-bezier(.2,.7,.2,1) ${i * 0.12}s`,
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600, color: s.color === '#c4b297' ? '#1f3028' : '#f2e0cc', opacity: animated ? 1 : 0, transition: 'opacity .6s ease 1s' }}>{s.pct}%</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#c4b297' }}>
              {['S/ 0', 'S/ 25', 'S/ 50', 'S/ 75', 'S/ 100'].map((l) => <span key={l}>{l}</span>)}
            </div>
            <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: 'rgba(201,110,75,0.12)', border: '1px solid #c96e4b44', boxShadow: '0 24px 50px -22px #00000066', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#c96e4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, flexShrink: 0, color: '#f2e0cc' }}>42%</div>
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontStyle: 'italic', lineHeight: 1.2, color: '#f2e0cc' }}>Es el doble de lo que paga el comercio justo tradicional.</div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, marginTop: 8, color: '#c4b297' }}>Comparativa SCAA Perú 2025 · Ratio FOB / consumidor.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SLICES.map((s) => (
              <div key={s.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #f2e0cc14' }}>
                <div style={{ width: 6, height: 36, background: s.color, borderRadius: 3, flexShrink: 0, marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: '#f2e0cc', letterSpacing: '-0.005em' }}>{s.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                  </div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297', marginTop: 6, lineHeight: 1.55 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
