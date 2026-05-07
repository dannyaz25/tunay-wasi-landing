interface Props {
  className?: string;
}

export default function AndeanDivider({ className = '' }: Props) {
  return (
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
}
