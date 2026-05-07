interface Props {
  className?: string;
  flip?: boolean;
}

export default function CoffeeBranch({ className = '', flip = false }: Props) {
  return (
    <svg className={className} viewBox="0 0 200 320" fill="none" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path d="M100 10 Q98 80 96 160 Q94 240 92 310" stroke="#1f3028" strokeWidth="2.2" strokeLinecap="round" />
      {[40, 90, 150, 220, 270].map((y, i) => (
        <g key={i}>
          <path d={`M${i % 2 ? 96 : 98} ${y} Q${i % 2 ? 40 : 160} ${y - 18} ${i % 2 ? 28 : 172} ${y + 6} Q${i % 2 ? 60 : 140} ${y + 14} ${i % 2 ? 96 : 98} ${y}`}
            fill="#8faf8a" stroke="#1f3028" strokeWidth="1.4" strokeLinejoin="round" />
          <path d={`M${i % 2 ? 28 : 172} ${y + 6} L${i % 2 ? 96 : 98} ${y + 4}`} stroke="#1f3028" strokeWidth="1" opacity="0.6" />
        </g>
      ))}
      {[60, 120, 200, 260].map((y, i) => (
        <g key={i}>
          <circle cx={i % 2 ? 110 : 84} cy={y} r="7" fill="#c96e4b" stroke="#533b22" strokeWidth="1.2" />
          <circle cx={i % 2 ? 118 : 76} cy={y + 4} r="6" fill="#c96e4b" stroke="#533b22" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  );
}
