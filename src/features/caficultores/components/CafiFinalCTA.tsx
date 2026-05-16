import { useLandingConfig } from '@/features/catalog/useLandingConfig';

export function CafiFinalCTA() {
  return (
    <section style={{
      padding: '100px 36px',
      background: '#1f3028',
      color: '#f2e0cc',
      position: 'relative',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      <div style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 900, borderRadius: '50%',
        background: 'radial-gradient(circle, #c96e4b22 0%, #c96e4b00 60%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 880, margin: '0 auto' }}>
        <div className="tw-logo-hover" style={{ width: 72, height: 72, position: 'relative', marginBottom: 32, display: 'inline-block' }}>
          <style>{`
            @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
            .tw-logo-hover { animation: tw-logo-hover 4.2s ease-in-out infinite; }
            .tw-logo-hover img { animation: tw-logo-breathe 2.4s ease-in-out infinite; }
          `}</style>
          <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
          fontSize: 'clamp(36px, 5.5vw, 68px)', lineHeight: 1.0,
          margin: 0, color: '#f2e0cc', letterSpacing: '-0.01em',
        }}>
          ¿Tienes café de calidad?
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>
            Nosotros lo vendemos por ti.
          </span>
        </h2>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 16, lineHeight: 1.65,
          color: '#c4b297', maxWidth: 580, margin: '28px auto 0',
        }}>
          Registra tu finca. Te contactamos para coordinar la muestra y el resto lo hacemos nosotros.
        </p>
        <a href="#lista" style={{
          marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 12,
          fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#f2e0cc',
          background: 'linear-gradient(135deg, #c96e4b 0%, #b85a3a 100%)',
          padding: '22px 36px', borderRadius: 999, textDecoration: 'none',
          boxShadow: '0 18px 40px -16px #c96e4baa, inset 0 1px 0 #ffffff33',
          border: '1px solid #f2e0cc22',
          transition: 'all .3s ease',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
          🌱 Registrar mi Finca Ahora <span>→</span>
        </a>
      </div>
    </section>
  );
}

export function CafiFooter() {
  const { data: landing } = useLandingConfig();
  const email = landing?.contact.adminEmail ?? 'tunaywasi@gmail.com';

  return (
    <footer style={{
      padding: '40px 36px',
      background: '#0f1a14',
      color: '#c4b29799',
      borderTop: '1px solid #c4b29722',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase',
      }}>
        <a href="/" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#c4b297',
        }}>
          <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          <span>Tunay · Wasi · 2026</span>
        </a>
        <a href={`mailto:${email}`} style={{ color: '#8faf8a', textDecoration: 'none' }}>
          {email}
        </a>
      </div>
    </footer>
  );
}
