import type { ToneOption } from '@/shared/types/catalog';

interface Props {
  label: string;
  ratio?: string;
  tone?: ToneOption;
  className?: string;
  src?: string;
  alt?: string;
}

const PALETTES: Record<ToneOption, { bg: string; stripe: string; text: string }> = {
  green: { bg: '#8faf8a', stripe: '#1f3028', text: '#f2e0cc' },
  tan:   { bg: '#c4b297', stripe: '#533b22', text: '#1f3028' },
  terra: { bg: '#c96e4b', stripe: '#533b22', text: '#f2e0cc' },
  cream: { bg: '#e8d2b6', stripe: '#533b22', text: '#1f3028' },
  deep:  { bg: '#1f3028', stripe: '#8faf8a', text: '#f2e0cc' },
};

export default function ImageSlot({ label, ratio = '4 / 5', tone = 'green', className = '', src, alt }: Props) {
  const p = PALETTES[tone] ?? PALETTES.green;
  return (
    <div className={className} style={{
      aspectRatio: ratio,
      width: '100%',
      background: src ? 'transparent' : `repeating-linear-gradient(135deg, ${p.bg} 0 14px, ${p.stripe}22 14px 15px)`,
      border: `1px solid ${p.stripe}`,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 18px 40px -22px #533b22cc',
    }}>
      {src ? (
        <img src={src} alt={alt ?? label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
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
      )}
    </div>
  );
}
