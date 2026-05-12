import { useState, useRef, useEffect } from 'react';

// Precios de referencia acopiador (MIDAGRI 2026 · subastas VRAEM ago-2025)
const ACOPIADOR_RANGES: Record<string, [number, number]> = {
  '82-83': [20, 25],
  '84-85': [22, 28],
  '86-87': [25, 32],
  '88-89': [28, 36],
  '90+':   [35, 45],
};

// Pago caficultor por kg de café verde — valores exactos de PRICING_RULES sección 5
// Selecto S/34.65 · Esp.Estándar S/38.44 · Esp.Alta S/55.48 · Joya S/66.84 · Geisha S/85.78
const TW_KG_VERDE: Record<string, number> = {
  '82-83': 34.65,
  '84-85': 38.44,
  '86-87': 55.48,
  '88-89': 66.84,
  '90+':   85.78,
};

const SCORES = ['82-83', '84-85', '86-87', '88-89', '90+'] as const;
type Score = typeof SCORES[number];

const SCORE_LABELS: Record<Score, string> = {
  '82-83': '82–83 pts',
  '84-85': '84–85 pts',
  '86-87': '86–87 pts',
  '88-89': '88–89 pts',
  '90+':   '90+ pts',
};

const KG_PRESETS = [250, 500, 1000, 2000];

export default function ModeloCaficultor() {
  const [animated, setAnimated] = useState(false);
  const [kg, setKg] = useState(500);
  const [kgInput, setKgInput] = useState('500');
  const [score, setScore] = useState<Score>('86-87');
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setAnimated(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const twPriceKg = TW_KG_VERDE[score];
  const [aMin, aMax] = ACOPIADOR_RANGES[score];
  const acopiadorMid = Math.round((aMin + aMax) / 2);

  const ingresosTW = kg * twPriceKg;
  const ingresosAcopiador = kg * acopiadorMid;
  const diferencia = ingresosTW - ingresosAcopiador;
  const pct = Math.round(((ingresosTW - ingresosAcopiador) / ingresosAcopiador) * 100);

  const maxVal = Math.max(ingresosTW, ingresosAcopiador);
  const barAcopiador = animated ? Math.round((ingresosAcopiador / maxVal) * 100) : 0;
  const barTW = animated ? 100 : 0;

  const fmt = (n: number) => `S/ ${n.toLocaleString('es-PE')}`;

  return (
    <section id="calculadora" ref={ref} style={{ padding: '100px 36px', background: '#1f3028', color: '#f2e0cc', position: 'relative', overflow: 'hidden' }}>
      {/* decorativo */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, opacity: 0.08, display: 'flex', gap: 24, justifyContent: 'center' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, background: '#8faf8a', transform: 'rotate(45deg)' }} />
        ))}
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>02 — Calculadora de ingresos</span>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, letterSpacing: '0.08em', color: '#c4b297', margin: '8px 0 0' }}>Comparativa referencial · MIDAGRI 2026 · subastas VRAEM ago-2025</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', lineHeight: 1.0, color: '#f2e0cc', margin: '12px 0 12px', letterSpacing: '-0.01em' }}>
            ¿Cuánto más ganarías<br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>con Tunay Wasi?</span>
          </h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#c4b297', maxWidth: 580, margin: '0 auto' }}>
            El acopiador compra café. Tunay Wasi vende tu historia — tu nombre, tu finca y tu proceso en cada bolsa que llega al consumidor.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }} className="tw-2col">

          {/* columna izquierda — controles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* kg */}
            <div>
              <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#c4b297', textTransform: 'uppercase', marginBottom: 14 }}>
                ¿Cuántos kg de café vendes al año?
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {KG_PRESETS.map(p => (
                  <button key={p} type="button" onClick={() => { setKg(p); setKgInput(String(p)); }}
                    style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${kg === p ? '#c96e4b' : '#f2e0cc33'}`, background: kg === p ? '#c96e4b22' : 'transparent', color: kg === p ? '#c96e4b' : '#c4b297', transition: 'all .2s ease' }}>
                    {p.toLocaleString('es-PE')} kg
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="number"
                  value={kgInput}
                  min={1}
                  onChange={e => {
                    setKgInput(e.target.value);
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v > 0) setKg(v);
                  }}
                  style={{ width: 120, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: '#f2e0cc', background: 'transparent', border: 'none', borderBottom: '1px solid #f2e0cc44', outline: 'none', padding: '8px 0' }}
                />
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297' }}>kg/año</span>
              </div>
            </div>

            {/* puntaje SCA */}
            <div>
              <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#c4b297', textTransform: 'uppercase', marginBottom: 14 }}>
                ¿Cuál es tu puntaje SCA estimado?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SCORES.map(s => (
                  <button key={s} type="button" onClick={() => setScore(s)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${score === s ? '#c96e4b' : '#f2e0cc22'}`, background: score === s ? '#c96e4b18' : 'transparent', transition: 'all .2s ease', textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: score === s ? '#c96e4b' : '#c4b297' }}>{SCORE_LABELS[s]}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: score === s ? '#8faf8a' : '#f2e0cc44' }}>
                      S/{TW_KG_VERDE[s].toFixed(2)}/kg
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* columna derecha — resultado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* barras comparativas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Acopiador */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297' }}>😔 Acopiador tradicional</span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, color: '#c4b297' }}>{fmt(ingresosAcopiador)}</span>
                </div>
                <div style={{ height: 14, borderRadius: 99, background: '#f2e0cc18', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barAcopiador}%`, background: '#c4b297', borderRadius: 99, transition: 'width 1.2s cubic-bezier(.2,.7,.2,1) 0.1s' }} />
                </div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', marginTop: 4 }}>
                  S/ {aMin} – S/ {aMax} por kg · Ref. MIDAGRI 2026
                </div>
              </div>

              {/* Tunay Wasi */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#8faf8a' }}>🎉 Con Tunay Wasi</span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: '#8faf8a' }}>{fmt(ingresosTW)}</span>
                </div>
                <div style={{ height: 14, borderRadius: 99, background: '#f2e0cc18', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barTW}%`, background: 'linear-gradient(90deg, #8faf8a 0%, #c96e4b 100%)', borderRadius: 99, transition: 'width 1.4s cubic-bezier(.2,.7,.2,1) 0.2s' }} />
                </div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#8faf8a99', marginTop: 4 }}>
                  S/ {twPriceKg.toFixed(2)}/kg de café verde · {SCORE_LABELS[score]}
                </div>
              </div>
            </div>

            {/* Resaltado diferencia */}
            <div style={{ padding: '20px 24px', borderRadius: 16, background: '#c96e4b18', border: '1px solid #c96e4b44', display: 'flex', gap: 18, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#c96e4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 700, flexShrink: 0, color: '#f2e0cc', textAlign: 'center', lineHeight: 1.1 }}>+{pct}%</div>
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontStyle: 'italic', color: '#f2e0cc', lineHeight: 1.2 }}>
                  Ganarías {fmt(diferencia)} más al año
                </div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', marginTop: 6 }}>
                  Cálculo: 1 kg verde → ~0.83 kg tostado → precio según puntaje SCA. Factor productor: ~42.1% del precio neto.
                </div>
              </div>
            </div>

            {/* nota metodológica */}
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#f2e0cc33', lineHeight: 1.6, letterSpacing: '0.08em' }}>
              * Precio acopiador: referencial MIDAGRI — Perspectivas del Café Peruano 2026 + subastas VRAEM ago-2025.
              El ingreso real con Tunay Wasi depende del puntaje SCA certificado y del lote final.
            </div>

            <a href="#registro" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 28px', background: '#c96e4b', color: '#1f3028', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, textDecoration: 'none', boxShadow: '0 18px 40px -16px #c96e4baa', transition: 'background .25s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f2e0cc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#c96e4b'; }}>
              Registrar mi café →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) { .tw-2col { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
