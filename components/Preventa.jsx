// Preventa — flagship CTA module with live countdown to next roast cut-off.
// Business model: pre-orders fund the next batch; we close orders, roast, ship.

const useCountdown = (target) => {
  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      done: diff === 0,
    };
  };
  const [t, setT] = React.useState(calc);
  React.useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
};

const Preventa = () => {
  // Cut-off: next Wednesday 23:59 Lima time (UTC-5). For demo, use a fixed +1d 16h offset.
  const cutoff = React.useMemo(() => {
    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + 1);
    target.setHours(23, 59, 0, 0);
    return target.getTime();
  }, []);
  const t = useCountdown(cutoff);

  return (
    <section id="preventa" style={{
      position: 'relative',
      padding: '120px 36px 100px',
      background: '#1f3028',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      {/* warm glow */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 720, height: 720, borderRadius: '50%',
        background: 'radial-gradient(circle, #c96e4b66 0%, #c96e4b00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, #8faf8a44 0%, #8faf8a00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      {/* dotted pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.18,
        backgroundImage: 'radial-gradient(#c4b29766 1px, transparent 1px)',
        backgroundSize: '24px 24px', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{
          background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 60%)',
          border: '1px solid #c96e4b44',
          borderRadius: 28,
          padding: 56,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 40px 80px -32px #000000aa',
        }}>
          {/* left vertical accent */}
          <div style={{
            position: 'absolute', top: 24, bottom: 24, left: 0,
            width: 4, background: 'linear-gradient(180deg, #c96e4b 0%, #8faf8a 100%)',
            borderRadius: 4,
          }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 64, alignItems: 'center' }} className="tw-2col">
            <div>
              {/* batch badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', borderRadius: 999,
                background: '#c96e4b22', border: '1px solid #c96e4b66',
                marginBottom: 28,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#c96e4b',
                  boxShadow: '0 0 0 0 #c96e4b88', animation: 'tw-pulse 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.18em',
                  color: '#f2e0cc', textTransform: 'uppercase',
                }}>
                  Próximo tueste · ciclo abierto
                </span>
              </div>

              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
                fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 0.95,
                margin: 0, color: '#f2e0cc', letterSpacing: '-0.01em',
              }}>
                Selección de mayo
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>
                  cosecha fresca,
                </span>
                <br />
                <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>
                  tostada bajo pedido.
                </span>
              </h2>

              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 16, lineHeight: 1.65,
                color: '#c4b297', marginTop: 28, maxWidth: 520,
              }}>
                Reservas hoy. Cerramos pedidos, calculamos el tueste exacto y arrancamos
                el tambor. Entrega <strong style={{ color: '#f2e0cc' }}>Lima 7 mayo</strong> ·
                Provincia <strong style={{ color: '#f2e0cc' }}>desde 8 mayo</strong>.
              </p>

              {/* countdown */}
              <div style={{ marginTop: 36 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                }}>
                  <span style={{
                    fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em',
                    color: '#c96e4b', textTransform: 'uppercase',
                  }}>⏳ Preventa cierra · 23:59 Lima</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                  {[
                    [String(t.d).padStart(2, '0'), 'días'],
                    [String(t.h).padStart(2, '0'), 'horas'],
                    [String(t.m).padStart(2, '0'), 'min'],
                    [String(t.s).padStart(2, '0'), 'seg'],
                  ].map(([n, l], i) => (
                    <React.Fragment key={l}>
                      <div style={{
                        flex: 1, textAlign: 'center',
                        padding: '20px 8px',
                        background: '#0f1a14',
                        border: '1px solid #c96e4b33',
                        borderRadius: 14,
                        boxShadow: 'inset 0 1px 0 #ffffff08, 0 6px 20px -10px #000000cc',
                        minWidth: 80,
                      }}>
                        <div style={{
                          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
                          fontSize: 44, lineHeight: 1, color: '#f2e0cc',
                          letterSpacing: '0.02em',
                        }}>{n}</div>
                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                          letterSpacing: '0.22em', color: '#c4b29799',
                          marginTop: 8, textTransform: 'uppercase',
                        }}>{l}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b29799',
                  marginTop: 14, lineHeight: 1.5,
                }}>
                  Pedidos después del corte entran al siguiente ciclo · entrega Lima 14 mayo · Prov. desde 15 mayo.
                </p>
              </div>

              {/* shipping pills */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
                <span style={{
                  display: 'inline-flex', gap: 8, alignItems: 'center',
                  padding: '9px 16px', borderRadius: 999,
                  background: '#8faf8a22', border: '1px solid #8faf8a55',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 13l3-9h13l3 9v6h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3z" stroke="#8faf8a" strokeWidth="1.6" />
                  </svg>
                  Lima gratis desde S/ 100
                </span>
                <span style={{
                  display: 'inline-flex', gap: 8, alignItems: 'center',
                  padding: '9px 16px', borderRadius: 999,
                  background: '#c4b29722', border: '1px solid #c4b29766',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" stroke="#c4b297" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                  Provincia gratis desde S/ 150
                </span>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 36, flexWrap: 'wrap' }}>
                <a href="#cafe" className="tw-cta-primary" style={{
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
                  Reservar mi café <span className="tw-cta-arrow">→</span>
                </a>
                <span style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                  fontSize: 18, color: '#c4b297',
                }}>
                  desde <strong style={{ color: '#f2e0cc', fontStyle: 'normal', fontFamily: 'Cormorant Garamond, serif', fontWeight: 600 }}>S/ 24.43</strong> · 250 g
                </span>
              </div>
            </div>

            {/* right column: process pipeline */}
            <div style={{
              padding: 32,
              borderRadius: 20,
              background: 'linear-gradient(180deg, #f2e0cc12 0%, #f2e0cc04 100%)',
              border: '1px solid #f2e0cc18',
            }}>
              <div style={{
                fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em',
                color: '#8faf8a', textTransform: 'uppercase', marginBottom: 24,
              }}>Cómo funciona la preventa</div>

              {[
                { n: '01', t: 'Reservas', d: 'Eliges tu finca, peso y método. Pagas para asegurar tu lote.' },
                { n: '02', t: 'Cerramos', d: 'Sumamos los pedidos del ciclo y avisamos al productor del volumen exacto.' },
                { n: '03', t: 'Tostamos', d: 'Tueste un día antes del envío — café ultra fresco, lote único.' },
                { n: '04', t: 'A tu puerta', d: 'Entrega en Lima en 24h · Provincia 2-4 días hábiles.' },
              ].map((s, i) => (
                <div key={s.n} style={{
                  display: 'grid', gridTemplateColumns: '52px 1fr', gap: 18,
                  padding: '16px 0',
                  borderBottom: i < 3 ? '1px solid #f2e0cc14' : 'none',
                }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
                    fontSize: 32, color: '#c96e4b', lineHeight: 1, fontStyle: 'italic',
                  }}>{s.n}</div>
                  <div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 22,
                      color: '#f2e0cc', fontWeight: 600, lineHeight: 1.1,
                    }}>{s.t}</div>
                    <div style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: 13,
                      color: '#c4b297', marginTop: 6, lineHeight: 1.5,
                    }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tw-pulse {
          0%, 100% { box-shadow: 0 0 0 0 #c96e4b88; }
          50% { box-shadow: 0 0 0 8px #c96e4b00; }
        }
      `}</style>
    </section>
  );
};

window.Preventa = Preventa;
