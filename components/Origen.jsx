// "Origen" — manifesto / about section.
const Origen = () => {
  return (
    <section id="origen" style={{
      position: 'relative', padding: '140px 36px 120px',
      background: '#f2e0cc',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '0.42fr 0.58fr', gap: 96, alignItems: 'start',
        }} className="tw-2col">
          <div>
            <span style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
              color: '#c96e4b', textTransform: 'uppercase',
            }}>01 — Origen</span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 1.02,
              color: '#1f3028', margin: '24px 0 0', letterSpacing: '-0.01em',
            }}>
              Tunay Wasi:
              <br />
              <span style={{ fontStyle: 'italic', fontWeight: 500 }}>la verdadera casa.</span>
            </h2>
          </div>
          <div>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 28, lineHeight: 1.35,
              color: '#1f3028', fontStyle: 'italic', fontWeight: 400,
              margin: 0, textWrap: 'pretty',
            }}>
              "En quechua, <em style={{ color: '#c96e4b' }}>Tunay Wasi</em> significa la casa verdadera.
              Esa que se construye con manos, neblina y paciencia — la que está antes
              que la marca, antes que la góndola, antes que el barista."
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 56,
            }}>
              {[
                {
                  k: 'Transparencia radical',
                  v: 'Cada bolsa lleva el nombre de la finca, la altitud, el proceso y el precio que recibió el productor.',
                },
                {
                  k: 'Compra directa',
                  v: 'Sin acopiadores, sin comisiones intermedias. Pagamos a la finca antes de que el grano viaje.',
                },
                {
                  k: 'Café de especialidad',
                  v: 'Lotes con puntaje SCA mayor a 84 — todos cosechados a mano, en altura, en parcelas pequeñas.',
                },
                {
                  k: 'Modelo 50 / 50',
                  v: 'Por cada sol que pagas, exactamente la mitad regresa al productor. Auditado y publicado.',
                },
              ].map(p => (
                <div key={p.k}>
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600,
                    color: '#1f3028', marginBottom: 8, letterSpacing: '0.02em',
                  }}>{p.k}</div>
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.6,
                    color: '#533b22',
                  }}>{p.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

window.Origen = Origen;
