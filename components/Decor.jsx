// Decorative SVG elements: coffee branch, Andean diamonds divider, grain texture.

const CoffeeBranch = ({ className = '', flip = false }) => (
  <svg className={className} viewBox="0 0 200 320" fill="none" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
    <path d="M100 10 Q98 80 96 160 Q94 240 92 310" stroke="#1f3028" strokeWidth="2.2" strokeLinecap="round" />
    {/* leaves */}
    {[40, 90, 150, 220, 270].map((y, i) => (
      <g key={i}>
        <path d={`M${i % 2 ? 96 : 98} ${y} Q${i % 2 ? 40 : 160} ${y - 18} ${i % 2 ? 28 : 172} ${y + 6} Q${i % 2 ? 60 : 140} ${y + 14} ${i % 2 ? 96 : 98} ${y}`}
          fill="#8faf8a" stroke="#1f3028" strokeWidth="1.4" strokeLinejoin="round" />
        <path d={`M${i % 2 ? 28 : 172} ${y + 6} L${i % 2 ? 96 : 98} ${y + 4}`} stroke="#1f3028" strokeWidth="1" opacity="0.6" />
      </g>
    ))}
    {/* cherries */}
    {[60, 120, 200, 260].map((y, i) => (
      <g key={i}>
        <circle cx={i % 2 ? 110 : 84} cy={y} r="7" fill="#c96e4b" stroke="#533b22" strokeWidth="1.2" />
        <circle cx={i % 2 ? 118 : 76} cy={y + 4} r="6" fill="#c96e4b" stroke="#533b22" strokeWidth="1.2" />
      </g>
    ))}
  </svg>
);

const AndeanDivider = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 1200 24" preserveAspectRatio="none" fill="none">
    <line x1="0" y1="12" x2="540" y2="12" stroke="#1f3028" strokeWidth="1" />
    <line x1="660" y1="12" x2="1200" y2="12" stroke="#1f3028" strokeWidth="1" />
    <g transform="translate(600 12)">
      <path d="M-40 0 L-20 -10 L0 0 L-20 10 Z" fill="none" stroke="#1f3028" strokeWidth="1" />
      <path d="M-12 0 L0 -6 L12 0 L0 6 Z" fill="#c96e4b" />
      <path d="M40 0 L20 -10 L0 0 L20 10 Z" fill="none" stroke="#1f3028" strokeWidth="1" />
    </g>
  </svg>
);

const GrainOverlay = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35, mixBlendMode: 'multiply', zIndex: 1 }}>
    <filter id="tw-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.23  0 0 0 0 0.13  0 0 0 0.18 0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#tw-grain)" />
  </svg>
);

// Striped placeholder per design guidance — no fake imagery.
const ImageSlot = ({ label, ratio = '4 / 5', tone = 'green', className = '' }) => {
  const palettes = {
    green:   { bg: '#8faf8a', stripe: '#1f3028', text: '#f2e0cc' },
    tan:     { bg: '#c4b297', stripe: '#533b22', text: '#1f3028' },
    terra:   { bg: '#c96e4b', stripe: '#533b22', text: '#f2e0cc' },
    cream:   { bg: '#e8d2b6', stripe: '#533b22', text: '#1f3028' },
    deep:    { bg: '#1f3028', stripe: '#8faf8a', text: '#f2e0cc' },
  };
  const p = palettes[tone] || palettes.green;
  return (
    <div className={className} style={{
      aspectRatio: ratio,
      width: '100%',
      background: `repeating-linear-gradient(135deg, ${p.bg} 0 14px, ${p.stripe}22 14px 15px)`,
      border: `1px solid ${p.stripe}`,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 18px 40px -22px #533b22cc',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, padding: 24, textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: p.text, background: p.stripe, padding: '6px 12px', borderRadius: 999,
        }}>{label}</span>
      </div>
    </div>
  );
};

Object.assign(window, { CoffeeBranch, AndeanDivider, GrainOverlay, ImageSlot });
