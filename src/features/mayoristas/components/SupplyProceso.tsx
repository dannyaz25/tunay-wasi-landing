import { useSupplyLandingConfig } from '@/features/mayoristas/useSupplyLandingConfig';
import { STATIC_SUPPLY_LANDING } from '@/features/catalog/catalogService';

const pasos = [
  {
    n: '01', titulo: 'Eliges el lote',
    sub: 'Trazado en finca',
    desc: 'Revisas la ficha técnica, notas de cata y precio FOB Lima. Pides muestra de 200 g si necesitas catar antes de cerrar.',
    meta: 'Día 0',
  },
  {
    n: '02', titulo: 'Coordinamos el flete',
    sub: 'Finca → Lima → tu tostadora',
    desc: 'Gestionamos el transporte desde la chacra hasta tu local, en Lima o provincias. Sacos sellados, control de humedad y temperatura.',
    meta: 'Día 3 — 7',
  },
  {
    n: '03', titulo: 'Recibes el lote certificado',
    sub: 'Pasaporte de cata incluido',
    desc: 'Cada saco llega con su certificado Q‑Grader, ficha de trazabilidad, datos del caficultor y nota de cata. Listo para tu mesa de tueste.',
    meta: 'Día 7 — 10',
  },
] as const;

export default function SupplyProceso() {
  const { data = STATIC_SUPPLY_LANDING } = useSupplyLandingConfig();
  const logistics = data.logistics;
  return (
    <section id="proceso" style={{
      background: '#1f3028',
      color: '#f2e0cc',
      padding: '100px 36px 130px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'radial-gradient(#c4b29766 1px, transparent 1px)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '-12%', width: 540, height: 540, borderRadius: '50%',
        background: 'radial-gradient(circle, #c96e4b33 0%, #c96e4b00 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 80px' }}>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>03 — Cómo Funciona</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 1.0,
            color: '#f2e0cc', margin: '20px 0 18px', letterSpacing: '-0.01em',
          }}>
            Tres pasos.
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>Una semana.</span>
            <br />
            Cero intermediarios.
          </h2>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.65,
            color: '#c4b297', maxWidth: 540, margin: '0 auto',
          }}>
            Trabajamos con tu calendario de tueste. El primer pedido suele coordinarse
            en 24 horas desde la solicitud.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="tw-sup-proc-line" style={{
            position: 'absolute', top: 72, left: '10%', right: '10%', height: 1,
            background: 'repeating-linear-gradient(90deg, #c96e4b66 0 8px, transparent 8px 16px)',
            zIndex: 0,
          }} />

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36,
            position: 'relative', zIndex: 1,
          }} className="tw-sup-steps">
            {pasos.map((p, i) => (
              <div key={p.n} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 144, height: 144, margin: '0 auto 28px',
                  borderRadius: '50%',
                  background: '#233a30',
                  border: '1px solid #8faf8a55',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 24px 50px -22px #00000099',
                }}>
                  <div style={{
                    position: 'absolute', inset: 8, borderRadius: '50%',
                    border: '1px dashed #c4b29744',
                  }} />
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
                    fontSize: 56, fontStyle: 'italic',
                    color: '#c96e4b', lineHeight: 1, letterSpacing: '-0.02em',
                  }}>{p.n}</div>

                  {i < pasos.length - 1 && (
                    <div className="tw-sup-step-dot" style={{
                      position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#c96e4b',
                      boxShadow: '0 0 0 4px #1f3028',
                    }} />
                  )}
                </div>

                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.24em',
                  color: '#8faf8a', textTransform: 'uppercase', marginBottom: 10,
                }}>{p.meta}</div>

                <h3 style={{
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 600,
                  lineHeight: 1.05, letterSpacing: '-0.01em',
                  color: '#f2e0cc', margin: 0,
                }}>{p.titulo}</h3>

                <div style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 18,
                  color: '#c96e4b', fontWeight: 500, marginTop: 4,
                }}>{p.sub}</div>

                <p style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.65,
                  color: '#c4b297', maxWidth: 320, margin: '14px auto 0',
                }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 96,
          padding: '32px 40px',
          background: '#233a30',
          border: '1px solid #8faf8a33',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24,
        }} className="tw-sup-logi">
          {logistics.map(({ key: k, value: v }) => (
            <div key={k} style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              paddingLeft: 18, borderLeft: '1px solid #c96e4b66',
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.24em',
                color: '#c96e4b', textTransform: 'uppercase',
              }}>{k}</span>
              <span style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600,
                color: '#f2e0cc', lineHeight: 1.1,
              }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .tw-sup-steps { grid-template-columns: 1fr !important; gap: 56px !important; }
          .tw-sup-proc-line { display: none; }
          .tw-sup-step-dot { display: none; }
          .tw-sup-logi { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
