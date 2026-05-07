const COLUMNS: [string, string[]][] = [
  ['Tienda', ['Café en grano', 'Molido', 'Suscripción', 'Mayorista']],
  ['Casa', ['Origen', 'Caficultores', 'Modelo 50/50', 'Reportes']],
  ['Conecta', ['Instagram', 'WhatsApp', 'Email', 'Newsletter']],
];

export default function Footer() {
  return (
    <footer style={{ background: '#1f3028', color: '#f2e0cc', padding: '80px 36px 32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 56 }} className="tw-foot-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, animation: 'tw-logo-hover 4.2s ease-in-out infinite' }}>
                <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'tw-logo-breathe 2.4s ease-in-out infinite' }} />
              </div>
              <div style={{ fontFamily: 'Mulish, sans-serif', fontWeight: 700, fontSize: 26, color: '#f2e0cc', letterSpacing: '0.005em' }}>
                Tunay Wasi
              </div>
            </div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontStyle: 'italic', color: '#c4b297', lineHeight: 1.4, maxWidth: 360, margin: 0 }}>
              "La verdadera casa del café peruano — donde el grano y la mano que lo sembró caben en la misma bolsa."
            </p>
          </div>
          {COLUMNS.map(([title, items]) => (
            <div key={title}>
              <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase', marginBottom: 20 }}>{title}</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((it) => (
                  <li key={it}>
                    <a href="#" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#f2e0cc', textDecoration: 'none', transition: 'color .25s ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#8faf8a'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#f2e0cc'; }}>
                      {it}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 64, paddingTop: 24, borderTop: '1px solid #f2e0cc22',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
          color: '#c4b29799', textTransform: 'uppercase',
        }}>
          <span>© 2026 Tunay Wasi · Lima, Perú</span>
          <span>50% para el caficultor · siempre.</span>
        </div>
      </div>
      <style>{`
        @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @media (max-width: 880px) { .tw-foot-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </footer>
  );
}
