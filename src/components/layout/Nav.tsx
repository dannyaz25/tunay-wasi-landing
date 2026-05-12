import { useState, useEffect } from 'react';

const LINKS: [string, string][] = [
  ['¿Por qué Tunay Wasi?', '#modelo'],
  ['¿Cuánto ganas?', '#calculadora'],
  ['¿Cuánto café necesito?', '#requisitos'],
  ['Preguntas frecuentes', '#faq'],
  ['Contacto', '#contacto'],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'all .35s ease',
      background: scrolled || menuOpen ? 'rgba(242, 224, 204, 0.97)' : 'transparent',
      backdropFilter: scrolled || menuOpen ? 'blur(14px)' : 'none',
      borderBottom: scrolled || menuOpen ? '1px solid #1f302822' : '1px solid transparent',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        padding: scrolled ? '14px 36px' : '22px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'padding .35s ease',
      }}>
        <a href="#top" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div className="tw-logo-hover" style={{ width: 52, height: 52, position: 'relative' }}>
            <style>{`
              @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
              @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
              .tw-logo-hover { animation: tw-logo-hover 4.2s ease-in-out infinite; }
              .tw-logo-hover img { animation: tw-logo-breathe 2.4s ease-in-out infinite; }
            `}</style>
            <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: 'Mulish, sans-serif', fontWeight: 700, letterSpacing: '0.005em', color: '#1f3028', fontSize: 20 }}>
              Tunay Wasi
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.32em', color: '#c96e4b', marginTop: 4, textTransform: 'uppercase' }}>
              Para caficultores
            </div>
          </div>
        </a>

        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} className="tw-navlink" style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500,
              color: '#1f3028', textDecoration: 'none', letterSpacing: '0.04em',
              position: 'relative', padding: '6px 0',
            }}>{label}</a>
          ))}
          <a href="#registro" className="tw-cta-btn" style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
            color: '#f2e0cc', background: '#c96e4b', padding: '11px 22px',
            borderRadius: 999, textDecoration: 'none', letterSpacing: '0.06em',
            transition: 'all .25s ease', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1f3028'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#c96e4b'; }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f2e0cc', animation: 'tw-pulse-dot 2s ease-in-out infinite' }} />
            Registrar mi café
          </a>

          {/* Hamburger — visible ≤880px */}
          <button
            className="tw-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none', flexDirection: 'column', gap: 5 }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: '#1f3028', borderRadius: 2, transition: 'all .3s ease', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#1f3028', borderRadius: 2, transition: 'all .3s ease', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: '#1f3028', borderRadius: 2, transition: 'all .3s ease', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
        </nav>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="tw-mobile-nav">
          {LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={closeMenu}
              style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600,
                color: '#1f3028', textDecoration: 'none', letterSpacing: '-0.005em',
                padding: '10px 0', borderBottom: '1px solid #1f302814', display: 'block',
              }}
            >{label}</a>
          ))}
          <a
            href="#registro"
            onClick={closeMenu}
            style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600,
              color: '#f2e0cc', background: '#c96e4b', padding: '14px 24px',
              borderRadius: 999, textDecoration: 'none', letterSpacing: '0.06em',
              display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f2e0cc' }} />
            Registrar mi café
          </a>
        </div>
      )}

      <style>{`
        @keyframes tw-pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .tw-navlink::after { content: ''; position: absolute; left: 0; right: 100%; bottom: 0; height: 1px; background: #c96e4b; transition: right .35s ease; }
        .tw-navlink:hover::after { right: 0; }
        .tw-navlink:hover { color: #c96e4b; }
        @media (max-width: 880px) {
          .tw-navlink { display: none; }
          .tw-cta-btn { display: none; }
          .tw-hamburger { display: flex !important; }
          .tw-mobile-nav {
            padding: 20px 24px 28px;
            border-top: 1px solid #1f302822;
          }
        }
      `}</style>
    </header>
  );
}
