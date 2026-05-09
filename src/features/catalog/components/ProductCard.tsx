import { useState } from 'react';
import { Money } from '@/shared/money';
import type { Producto, ProductLabel } from '@/shared/types/catalog';
import { useCartActions } from '@/features/cart/useCart';
import ImageSlot from '@/components/decor/ImageSlot';


const TAG_TONES: Record<string, { bg: string; text: string }> = {
  sage:  { bg: '#8faf8a', text: '#1f3028' },
  terra: { bg: '#c96e4b', text: '#f2e0cc' },
  deep:  { bg: '#1f3028', text: '#f2e0cc' },
};

const LABEL_STYLES: Record<ProductLabel, React.CSSProperties> = {
  'PREVENTA': {
    background: '#1f3028',
    color: '#f2e0cc',
    borderTop: '2px solid #c96e4b',
    boxShadow: '0 8px 24px -6px rgba(83, 59, 34, 0.55), 0 3px 8px rgba(0,0,0,0.22)',
  },
  'NEW': {
    background: '#8faf8a',
    color: '#1f3028',
    borderTop: '2px solid #1f3028',
    boxShadow: '0 8px 20px -6px rgba(83, 59, 34, 0.4), 0 3px 8px rgba(0,0,0,0.15)',
  },
};

const GRIND_DEFAULT = 'Grano';

export default function ProductCard({ p, onRequestBreakdown }: { p: Producto; onRequestBreakdown: (unitCents: number, qty: number, producerPct: number) => void }) {
  const [hover, setHover] = useState(false);
  const [weightIdx, setWeightIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const { add, open: openCart } = useCartActions();
  const tone = TAG_TONES[p.tagTone] ?? TAG_TONES.sage;
  const [wLabel, unitCents] = p.weights[weightIdx];
  const netCents = Math.round(unitCents / 1.18);
  const caficultorCents = Math.round(netCents * qty * p.producerPct / 100);

  const handleReservar = () => {
    add({
      id: `${p.code}-${wLabel}-${GRIND_DEFAULT}`,
      sku: p.code,
      name: p.name,
      weight: wLabel as '250g' | '1kg' | '3kg',
      grind: GRIND_DEFAULT,
      unitCents,
      qty,
      maxQty: 30,
      caficultor: p.producer,
      finca: p.farm,
      badge: 'Selección',
    });
    openCart();
  };

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: '#f2e0cc', border: '1px solid #1f302833', borderRadius: 20, padding: 18, transition: 'all .45s cubic-bezier(.2,.7,.2,1)', transform: hover ? 'translateY(-6px)' : 'translateY(0)', boxShadow: hover ? '0 28px 52px -20px #533b22cc' : '0 12px 28px -20px #533b2288', position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {p.label && (
        <div style={{
          position: 'absolute', top: -12, right: -12, zIndex: 10,
          ...LABEL_STYLES[p.label],
          padding: '9px 20px', borderRadius: '0 12px 0 12px',
          fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c96e4b', boxShadow: '0 0 0 0 #c96e4b88', animation: 'tw-pulse 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.18em', color: '#f2e0cc', textTransform: 'uppercase' }}> {p.label}</span>

        </div>
      )}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
        {p.photo ? (
          <img
            src={p.photo}
            alt={p.name}
            style={{ width: '100%', aspectRatio: '5 / 3', objectFit: 'cover', borderRadius: 16, display: 'block' }}
          />
        ) : (
          <ImageSlot label={`bolsa · ${p.name.toLowerCase()}`} tone={p.tone} ratio="7 / 3" />
        )}
        <div style={{ position: 'absolute', top: 14, left: 14, background: '#1f3028e0', color: '#f2e0cc', padding: '6px 12px', borderRadius: 999, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', backdropFilter: 'blur(6px)' }}>
          № {p.code} · SCA {p.score}
        </div>
        <div style={{ position: 'absolute', top: 14, right: 14, background: tone.bg, color: tone.text, padding: '6px 12px', borderRadius: 999, fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          {p.tag}
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, background: '#f2e0cce0', color: '#1f3028', padding: '6px 10px', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em', backdropFilter: 'blur(6px)' }}>
          {p.alt} · {p.region.split(' · ').slice(-1)[0]}
        </div>
      </div>

      <div>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 26, lineHeight: 1.0, margin: 0, letterSpacing: '-0.005em', color: '#1f3028' }}>{p.name}</h3>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#533b22', marginTop: 6, fontStyle: 'italic' }}>{p.sub}</div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, padding: '6px 11px', borderRadius: 8, background: '#1f3028', color: '#f2e0cc' }}>
          Caficultor: <strong style={{ fontWeight: 600 }}>{p.producer}</strong>
        </span>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, padding: '6px 11px', borderRadius: 8, background: '#c4b297', color: '#1f3028' }}>{p.farm}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {p.notes.map((n) => (
          <span key={n} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, padding: '5px 11px', borderRadius: 999, background: '#8faf8a44', color: '#1f3028', border: '1px solid #8faf8a99' }}>{n}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#8faf8a22', border: '1px solid #8faf8a66', borderRadius: 12, padding: '10px 14px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8faf8a', animation: 'tw-pulse-mini 2s ease-in-out infinite', display: 'inline-block' }} />
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, color: '#1f3028' }}>Tostado un día antes del envío — café ultra fresco</span>
      </div>

      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 14, lineHeight: 1.45, color: '#1f3028', fontStyle: 'italic', margin: 0, opacity: 0.85 }}>{p.desc}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid #1f302822' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: '#533b22' }}>BIEN PARA</span>
        {p.brews.map((b) => (
          <span key={b} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 6, background: '#1f302811', color: '#1f3028', border: '1px solid #1f302822' }}>{b}</span>
        ))}
      </div>

      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: '#533b22', marginBottom: 8 }}>PRESENTACIÓN</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {p.weights.map(([wl], i) => (
            <button key={wl} onClick={() => setWeightIdx(i)} style={{ flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, background: weightIdx === i ? '#c96e4b' : '#f2e0cc', color: weightIdx === i ? '#f2e0cc' : '#1f3028', border: `1px solid ${weightIdx === i ? '#c96e4b' : '#1f302833'}`, transition: 'all .25s ease' }}>{wl}</button>
          ))}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#533b22', marginTop: 8 }}>
          Stock verde: {p.stockKg} kg
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 32, lineHeight: 1, color: '#1f3028' }}>
              {Money.formatPEN(unitCents * qty)}
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em', color: '#533b2299', textTransform: 'uppercase' }}>inc. IGV</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#533b22' }}>
              {p.producerPct}% al caficultor (sin IGV) · {Money.formatPEN(caficultorCents)}
            </span>
            <button
              onClick={() => onRequestBreakdown(unitCents, qty, p.producerPct)}
              title="Ver desglose de costos"
              style={{ background: 'none', border: '1px solid #533b2255', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
            >
              <span style={{ fontFamily: 'serif', fontSize: 11, color: '#533b22', lineHeight: 1, userSelect: 'none' }}>i</span>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #1f302833', borderRadius: 999, overflow: 'hidden', background: '#f2e0cc' }}>
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 36, height: 40, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#1f3028' }}>−</button>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: 'center', color: '#1f3028' }}>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} style={{ width: 36, height: 40, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#1f3028' }}>+</button>
        </div>
      </div>

      <button onClick={handleReservar} style={{ marginTop: 4, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f2e0cc', background: hover ? '#c96e4b' : '#1f3028', padding: '12px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', boxShadow: '0 12px 24px -14px #533b22aa', transition: 'all .35s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span>Reservar — entrega junio</span>
        <span>→</span>
      </button>

      <style>{`@keyframes tw-pulse-mini { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.85); } }`}</style>
    </article>
  );
}
