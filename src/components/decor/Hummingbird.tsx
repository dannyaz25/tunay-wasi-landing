interface Props {
  size?: number;
  stroke?: string;
  accent?: string;
}

export default function Hummingbird({ size = 96, stroke = '#1f3028', accent = '#c96e4b' }: Props) {
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-block' }} aria-label="Tunay Wasi colibrí">
      <style>{`
        @keyframes tw-flap-up {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(28deg); }
        }
        @keyframes tw-flap-down {
          0%, 100% { transform: rotate(12deg); }
          50% { transform: rotate(-28deg); }
        }
        @keyframes tw-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1.5px) scale(1.015); }
        }
        @keyframes tw-hover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .tw-bird-wrap { animation: tw-hover 4.2s ease-in-out infinite; transform-origin: center; width: 100%; height: 100%; }
        .tw-bird-body { animation: tw-breathe 2.4s ease-in-out infinite; transform-origin: 50% 55%; transform-box: fill-box; }
        .tw-wing-up { animation: tw-flap-up .42s ease-in-out infinite; transform-origin: 50% 60%; transform-box: fill-box; }
        .tw-wing-dn { animation: tw-flap-down .42s ease-in-out infinite; transform-origin: 50% 40%; transform-box: fill-box; }
      `}</style>
      <div className="tw-bird-wrap">
        <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g className="tw-bird-body">
            <path d="M86 70 L112 56 L108 64 L114 72 L106 74 L110 84 L100 80 L96 90 L92 80 Z"
              fill={accent} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
            <ellipse cx="68" cy="68" rx="22" ry="14" fill="#f2e0cc" stroke={stroke} strokeWidth="1.8" />
            <circle cx="44" cy="58" r="11" fill="#f2e0cc" stroke={stroke} strokeWidth="1.8" />
            <circle cx="40" cy="56" r="1.6" fill={stroke} />
            <path d="M34 60 L8 62" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M34 60 L8 62" stroke={accent} strokeWidth="0.8" strokeLinecap="round" />
            <path d="M44 64 Q50 70 56 66 Q52 72 46 70 Z" fill={accent} opacity="0.85" />
          </g>
          <g className="tw-wing-up">
            <path d="M64 60 Q56 38 30 30 Q44 46 50 58 Q42 50 28 50 Q44 58 56 64 Z"
              fill="#8faf8a" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" opacity="0.95" />
          </g>
          <g className="tw-wing-dn">
            <path d="M68 72 Q64 96 42 102 Q56 88 60 76 Q52 86 38 88 Q56 78 66 74 Z"
              fill="#c4b297" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" opacity="0.95" />
          </g>
        </svg>
      </div>
    </div>
  );
}
