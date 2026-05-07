export default function GrainOverlay() {
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35, mixBlendMode: 'multiply', zIndex: 1 }}>
      <filter id="tw-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.23  0 0 0 0 0.13  0 0 0 0.18 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#tw-grain)" />
    </svg>
  );
}
