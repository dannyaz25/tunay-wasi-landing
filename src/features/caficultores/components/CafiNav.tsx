import { useState, useEffect } from 'react';

const LINKS: [string, string][] = [
  ['Calculadora', '#calculadora'],
  ['Beneficios', '#beneficios'],
  ['Regístrate', '#lista'],
  ['FAQ', '#faq'],
];


export default function CafiNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'all .35s ease',
      background: scrolled || menuOpen ? 'rgba(24, 37, 32, 0.97)' : 'transparent',
      backdropFilter: scrolled || menuOpen ? 'blur(14px)' : 'none',
      borderBottom: scrolled || menuOpen ? '1px solid #f2e0cc11' : '1px solid transparent',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        padding: scrolled ? '14px 36px' : '22px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'padding .35s ease',
      }}>
        <a href="/" onClick={() => setMenuOpen(false)} style={{
          display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
        }}>
          <div className="tw-logo-hover" style={{ width: 52, height: 52, position: 'relative' }}>
            <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{
              fontFamily: 'Mulish, sans-serif', fontWeight: 700, letterSpacing: '0.06em',
              color: '#f2e0cc', fontSize: 18,
            }}>Tunay · Wasi</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.28em',
              color: '#8faf8a', marginTop: 6, textTransform: 'uppercase',
            }}>Transparencia desde el origen</div>
          </div>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} className="tw-cafi-navlink" style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500,
              color: '#c4b297', textDecoration: 'none', letterSpacing: '0.04em',
              position: 'relative', padding: '6px 0',
              transition: 'color .25s ease',
            }}>{label}</a>
          ))}

          <a href="#lista" onClick={() => setMenuOpen(false)} className="tw-cafi-register-btn" style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
            color: '#f2e0cc', textDecoration: 'none', letterSpacing: '0.06em',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #c96e4b 0%, #b85a3a 100%)',
            padding: '11px 22px', borderRadius: 999,
            boxShadow: '0 8px 24px -8px #c96e4baa',
            transition: 'all .25s ease',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#f2e0cc',
              animation: 'tw-pulse-dot 2s ease-in-out infinite', flexShrink: 0,
            }} />
            Registrar mi Finca <span className="tw-cafi-register-arrow">→</span>
          </a>

          {/* Hamburger — visible ≤880px */}
          <button
            className="tw-cafi-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none', flexDirection: 'column', gap: 5 }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: '#f2e0cc', borderRadius: 2, transition: 'all .3s ease', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#f2e0cc', borderRadius: 2, transition: 'all .3s ease', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#f2e0cc', borderRadius: 2, transition: 'all .3s ease', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        </nav>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          padding: '20px 36px 28px',
          borderTop: '1px solid #f2e0cc11',
          background: 'rgba(24, 37, 32, 0.97)',
        }}>
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600,
              color: '#f2e0cc', textDecoration: 'none', letterSpacing: '-0.005em',
              padding: '10px 0', borderBottom: '1px solid #f2e0cc11', display: 'block',
            }}>{label}</a>
          ))}
          <a href="#lista" onClick={() => setMenuOpen(false)} style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 700,
            color: '#f2e0cc', textDecoration: 'none', letterSpacing: '0.06em',
            display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 20,
            background: 'linear-gradient(135deg, #c96e4b 0%, #b85a3a 100%)',
            padding: '16px 28px', borderRadius: 999,
            boxShadow: '0 8px 24px -8px #c96e4baa',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#f2e0cc',
              animation: 'tw-pulse-dot 2s ease-in-out infinite', flexShrink: 0,
            }} />
            Registrar mi Finca →
          </a>
        </div>
      )}

      <style>{`
        @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes tw-pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
        .tw-logo-hover { animation: tw-logo-hover 4.2s ease-in-out infinite; }
        .tw-logo-hover img { animation: tw-logo-breathe 2.4s ease-in-out infinite; }
        .tw-cafi-navlink::after { content: ''; position: absolute; left: 0; right: 100%; bottom: 0; height: 1px; background: #c96e4b; transition: right .35s ease; }
        .tw-cafi-navlink:hover { color: #f2e0cc !important; }
        .tw-cafi-navlink:hover::after { right: 0; }
        .tw-cafi-register-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px -10px #c96e4bcc !important; }
        .tw-cafi-register-arrow { display: inline-block; transition: transform .25s ease; }
        .tw-cafi-register-btn:hover .tw-cafi-register-arrow { transform: translateX(3px); }
        @media (max-width: 880px) {
          .tw-cafi-navlink { display: none !important; }
          .tw-cafi-register-btn { display: none !important; }
          .tw-cafi-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
