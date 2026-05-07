// Top navigation bar.
const Nav = () => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = [
    ['Preventa', '#preventa'],
    ['Caficultores', '#caficultores'],
    ['Café', '#cafe'],
    ['Modelo 50/50', '#modelo'],
    ['Contacto', '#contacto'],
  ];
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      transition: 'all .35s ease',
      background: scrolled ? 'rgba(242, 224, 204, 0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid #1f302822' : '1px solid transparent',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        padding: scrolled ? '14px 36px' : '22px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'padding .35s ease',
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div className="tw-logo-hover" style={{ width: 52, height: 52, position: 'relative' }}>
            <style>{`
              @keyframes tw-logo-hover {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
              }
              @keyframes tw-logo-breathe {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
              }
              .tw-logo-hover {
                animation: tw-logo-hover 4.2s ease-in-out infinite;
              }
              .tw-logo-hover img {
                animation: tw-logo-breathe 2.4s ease-in-out infinite;
              }
            `}</style>
            <img src="brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontFamily: 'Mulish, sans-serif', fontWeight: 700, letterSpacing: '0.005em', color: '#1f3028', fontSize: 20 }}>
              Tunay Wasi
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.32em', color: '#533b22', marginTop: 4, textTransform: 'uppercase' }}>
              Verdadera · Casa
            </div>
          </div>
        </a>
        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {links.map(([label, href]) => (
            <a key={href} href={href} className="tw-navlink" style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500,
              color: '#1f3028', textDecoration: 'none', letterSpacing: '0.04em',
              position: 'relative', padding: '6px 0',
            }}>{label}</a>
          ))}
          <a href="#preventa" style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
            color: '#f2e0cc', background: '#c96e4b', padding: '11px 22px',
            borderRadius: 999, textDecoration: 'none', letterSpacing: '0.06em',
            transition: 'all .25s ease', display: 'inline-flex', alignItems: 'center', gap: 8,
          }} onMouseEnter={e => { e.currentTarget.style.background = '#1f3028'; }}
             onMouseLeave={e => { e.currentTarget.style.background = '#c96e4b'; }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f2e0cc', animation: 'tw-pulse-dot 2s ease-in-out infinite' }} />
            Reservar mi café
          </a>
        </nav>
      </div>
      <style>{`
        @keyframes tw-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .tw-navlink::after {
          content: ''; position: absolute; left: 0; right: 100%; bottom: 0;
          height: 1px; background: #c96e4b; transition: right .35s ease;
        }
        .tw-navlink:hover::after { right: 0; }
        .tw-navlink:hover { color: #c96e4b; }
        @media (max-width: 880px) { .tw-navlink { display: none; } }
      `}</style>
    </header>
  );
};

window.Nav = Nav;
