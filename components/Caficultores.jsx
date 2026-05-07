// "Caficultores" — the producers behind the coffee.
const PRODUCERS = [
  {
    name: 'Doña Eulalia Quispe',
    farm: 'Finca Sumaq Mayu',
    region: 'Cusco · Calca',
    alt: '1,650 m',
    variety: 'Bourbon · Typica',
    process: 'Lavado',
    score: '86.5',
    color: 'green',
    quote: 'El café se siembra con la mano, pero se cuida con el oído — escuchando la lluvia.',
  },
  {
    name: 'Mateo Huamán',
    farm: 'Finca Yanapay',
    region: 'San Martín · Lamas',
    alt: '1,420 m',
    variety: 'Caturra · Geisha',
    process: 'Honey Naranja',
    score: '88.0',
    color: 'tan',
    quote: 'Cuando alguien toma mi café en Lima, una parte de la chacra viaja con él.',
  },
  {
    name: 'Familia Mamani',
    farm: 'Finca Wayra Punku',
    region: 'Puno · Sandia',
    alt: '1,820 m',
    variety: 'Catuaí Rojo',
    process: 'Natural',
    score: '87.2',
    color: 'terra',
    quote: 'Tunay Wasi nos pagó antes de la cosecha. Eso, aquí arriba, no se había visto.',
  },
];

const ProducerCard = ({ p, idx }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#f2e0cc',
        border: '1px solid #1f302833',
        borderRadius: 24,
        padding: 28,
        transition: 'all .45s cubic-bezier(.2,.7,.2,1)',
        transform: hover ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hover
          ? '0 32px 60px -24px #533b22cc, 0 8px 16px -8px #533b2266'
          : '0 12px 28px -16px #533b2288',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
      <div style={{ position: 'relative' }}>
        <ImageSlot label={`retrato · ${p.name.split(' ').slice(-1)[0].toLowerCase()}`} tone={p.color} ratio="4 / 5" />
        <div style={{
          position: 'absolute', top: 14, left: 14,
          background: '#1f3028', color: '#f2e0cc',
          padding: '6px 12px', borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          № 0{idx + 1} / 12{/* TODO: total real de Firebase */}
        </div>
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          background: '#c96e4b', color: '#f2e0cc',
          padding: '8px 14px', borderRadius: 8,
          fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600,
          letterSpacing: '0.02em', lineHeight: 1,
          boxShadow: '0 8px 18px -8px #533b22aa',
        }}>
          SCA {p.score}
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
          color: '#533b22', textTransform: 'uppercase', marginBottom: 8,
        }}>{p.region}</div>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
          fontSize: 30, lineHeight: 1.05, color: '#1f3028', margin: 0, letterSpacing: '-0.005em',
        }}>{p.name}</h3>
        <div style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c96e4b',
          marginTop: 6, fontWeight: 500, fontStyle: 'italic',
        }}>{p.farm}</div>
      </div>

      <p style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: 17, lineHeight: 1.45,
        color: '#1f3028', fontStyle: 'italic', margin: 0, textWrap: 'pretty',
      }}>"{p.quote}"</p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
        borderTop: '1px solid #1f302822', paddingTop: 16, marginTop: 'auto',
      }}>
        {[['ALT.', p.alt], ['VAR.', p.variety], ['PROC.', p.process]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: '#533b22' }}>{k}</div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, color: '#1f3028', marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
    </article>
  );
};

const Caficultores = () => {
  return (
    <section id="caficultores" style={{
      position: 'relative',
      padding: '140px 36px',
      background: '#1f3028',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      {/* decorative diamond row */}
      <div style={{
        position: 'absolute', top: 40, left: 0, right: 0, opacity: 0.12,
        display: 'flex', gap: 24, justifyContent: 'center',
      }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, background: '#8faf8a', transform: 'rotate(45deg)' }} />
        ))}
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 48, marginBottom: 72, flexWrap: 'wrap',
        }}>
          <div>
            <span style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
              color: '#c96e4b', textTransform: 'uppercase',
            }}>02 — Caficultores</span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 1.02,
              color: '#f2e0cc', margin: '24px 0 0', letterSpacing: '-0.01em', maxWidth: 720,
            }}>
              Doce familias.{/* TODO: count real de Firebase */}
              <br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>
                Una sola palabra dada.
              </span>
            </h2>
          </div>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7,
            color: '#c4b297', maxWidth: 380, margin: 0,
          }}>
            Cada lote que llega a tu cocina nace en una parcela que conocemos por su nombre.
            Aquí no hay un anónimo "café peruano" — hay personas, alturas y microclimas.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
        }} className="tw-prod-grid">
          {PRODUCERS.map((p, i) => <ProducerCard key={p.name} p={p} idx={i} />)}
        </div>

        <div style={{
          marginTop: 56, display: 'flex', justifyContent: 'center',
        }}>
          <a href="#contacto" style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500, letterSpacing: '0.06em',
            color: '#f2e0cc', textDecoration: 'none',
            padding: '18px 32px', border: '1px solid #f2e0cc55', borderRadius: 999,
            transition: 'all .3s ease',
          }} onMouseEnter={e => { e.currentTarget.style.background = '#c96e4b'; e.currentTarget.style.borderColor = '#c96e4b'; }}
             onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f2e0cc55'; }}>
            Ver las 12 fincas →{/* TODO: count real de Firebase */}
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 1040px) { .tw-prod-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 700px) { .tw-prod-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
};

window.Caficultores = Caficultores;
