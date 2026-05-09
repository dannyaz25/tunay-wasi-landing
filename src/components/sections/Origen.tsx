import CoffeeBranch from '@/components/decor/CoffeeBranch';

export default function Origen() {
  return (
    <section id="origen" style={{ position: 'relative', padding: '100px 36px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '-8%', left: '-6%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, #8faf8a55 0%, #8faf8a00 70%)', filter: 'blur(28px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', right: -10, bottom: 40, width: 160, zIndex: 1, opacity: 0.55 }}>
        <CoffeeBranch flip />
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.42fr 0.58fr', gap: 64, alignItems: 'start' }} className="tw-2col">

          {/* columna izquierda — imagen + título */}
          <div>
            <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>01 — Origen</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(32px, 4vw, 58px)', lineHeight: 1.02, color: '#1f3028', margin: '16px 0 24px', letterSpacing: '-0.01em' }}>
              Tunay Wasi:<br />
              <span style={{ fontStyle: 'italic', fontWeight: 500 }}>la verdadera casa.</span>
            </h2>
            <div style={{ border: '1px solid #1f302822', borderRadius: 24, overflow: 'hidden', boxShadow: '0 18px 40px -16px #533b2255' }}>
              <img src="/imgs/tunay-wasi-origen-2.png" alt="Tunay Wasi · finca" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>

          {/* columna derecha — historia del fundador */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 36 }}>
            <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.28em', color: '#533b22', textTransform: 'uppercase' }}>De la finca al código</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px, 3vw, 32px)', color: '#1f3028', margin: 0, lineHeight: 1.05 }}>
              Soy <em style={{ color: '#c96e4b' }}>Danny Santa Cruz</em>,<br />y crecí entre cafetales.
            </h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#533b22', margin: 0 }}>
              En la <strong style={{ color: '#c96e4b' }}>Finca Vista Hermosa</strong> de mi familia, en Jaén, Perú. Desde pequeño vi cosechar café de especialidad de altísima calidad.
            </p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#533b22', margin: 0 }}>
              Pero también vi la dura realidad: <strong style={{ color: '#1f3028' }}>intermediarios que se quedaban con más del 70 % del valor</strong> mientras los caficultores apenas cubrían costos.
            </p>
            <div style={{ borderLeft: '3px solid #c96e4b', paddingLeft: 24 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontStyle: 'italic', color: '#1f3028', margin: 0, lineHeight: 1.35 }}>
                "¿Por qué no podemos hacer lo mismo con el café?"
              </p>
            </div>

            <div style={{ marginTop: 12, padding: '24px 32px', background: 'rgba(201,110,75,0.08)', border: '1px solid #c96e4b33', borderRadius: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(18px, 2vw, 24px)', fontStyle: 'italic', color: '#1f3028', margin: 0, lineHeight: 1.45, flex: 1, minWidth: 240 }}>
                "No es solo un negocio para mí. Es honrar el trabajo de mi familia y de miles de caficultores peruanos que merecen un trato justo."
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 20, color: '#c96e4b' }}>— Danny Santa Cruz</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#533b2299', textTransform: 'uppercase' }}>Fundador · Ing. de Software · Hijo de caficultores</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
