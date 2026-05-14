const BENEFITS = [
  {
    icon: '💰',
    title: 'Precio Justo por Puntaje SCA',
    desc: 'Pagamos según la calidad real de tu café: desde S/ 34.65 por kg verde (82 pts) hasta S/ 85.78 por kg (90+ pts). No el precio spot del mercado.',
    color: '#c96e4b',
  },
  {
    icon: '⚡',
    title: 'Pago al Recepcionar tu Lote',
    desc: 'Te pagamos dentro de las 48h de recepcionar tu microlote en Lima y confirmar el puntaje SCA. Sin esperar semanas ni depender de cuándo llega el dinero.',
    color: '#8faf8a',
  },
  {
    icon: '🎯',
    title: 'Tu Historia en Cada Bolsa',
    desc: 'Los clientes ven tu nombre, tu finca, tu historia. Construyes tu marca directamente — no eres un grano anónimo en un saco.',
    color: '#c4b297',
  },
] as const;

export default function CafiBeneficios() {
  return (
    <section id="beneficios" style={{
      position: 'relative',
      padding: '100px 36px',
      background: 'linear-gradient(180deg, #1f3028 0%, #182520 100%)',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>02 — Beneficios</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(38px, 5vw, 68px)', lineHeight: 1.02,
            margin: '20px 0 0', color: '#f2e0cc', letterSpacing: '-0.01em',
          }}>
            ¿Por qué vender
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>
              con Tunay Wasi?
            </span>
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
        }} className="tw-cafi-benefits">
          {BENEFITS.map((b, i) => (
            <article key={b.title} style={{
              background: 'linear-gradient(180deg, #2a3d33 0%, #1f3028 100%)',
              border: '1px solid #c4b29722',
              borderRadius: 22,
              padding: 32,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all .35s cubic-bezier(.2,.7,.2,1)',
            }} className="tw-cafi-card">
              <div style={{
                position: 'absolute', top: 20, right: 24,
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
                fontSize: 48, fontStyle: 'italic',
                color: b.color, opacity: 0.4, lineHeight: 1,
              }}>0{i + 1}</div>

              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${b.color}22`, border: `1px solid ${b.color}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 24,
              }}>{b.icon}</div>

              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
                fontSize: 28, lineHeight: 1.1, margin: 0, color: '#f2e0cc',
                letterSpacing: '-0.005em',
              }}>{b.title}</h3>

              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.6,
                color: '#c4b297', margin: '16px 0 0',
              }}>{b.desc}</p>

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: 3, background: b.color,
                transform: 'scaleX(0)', transformOrigin: 'left',
                transition: 'transform .45s cubic-bezier(.2,.7,.2,1)',
              }} className="tw-cafi-underline" />
            </article>
          ))}
        </div>
      </div>

      <style>{`
        .tw-cafi-card:hover { transform: translateY(-6px); border-color: #f2e0cc44 !important; }
        .tw-cafi-card:hover .tw-cafi-underline { transform: scaleX(1) !important; }
        @media (max-width: 1000px) { .tw-cafi-benefits { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
