import { useState, useEffect, useRef } from 'react';
import { SLICES } from '@/components/sections/Modelo';
import { Money } from '@/shared/money';

interface Props {
  unitCents: number;
  qty: number;
  producerPct: number;
  onClose: () => void;
}

export default function CostBreakdownModal({ unitCents, qty, producerPct, onClose }: Props) {
  const [animated, setAnimated] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  console.log({ unitCents, qty, producerPct });
  const totalConIgv = unitCents * qty;
  const netTotal = Math.round(totalConIgv / 1.18);

  // Compute display slices: override caficultor with producerPct, adjust Tunay Wasi as remainder
  const fixedPct = SLICES.filter(s => s.label !== 'Caficultor' && s.label !== 'Tunay Wasi')
    .reduce((sum, s) => sum + s.pct, 0);
  const tunayPct = Math.max(0, 100 - producerPct - fixedPct);
  const displaySlices = SLICES.map(s => {
    if (s.label === 'Caficultor') return { ...s, pct: producerPct };
    if (s.label === 'Tunay Wasi') return { ...s, pct: tunayPct };
    return s;
  });

  console.log({ totalConIgv, netTotal, displaySlices });

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(31, 48, 40, 0.55)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 10px',
      }}
    >
      <div style={{
        background: '#f2e0cc', borderRadius: 24, padding: '36px 32px',
        maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 32px 64px -24px rgba(83,59,34,0.65), 0 8px 20px rgba(0,0,0,0.18)',
        border: '1px solid #1f302818', position: 'relative',
      }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
          <div>
            <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase', marginBottom: 6 }}>
              Modelo 50 / 50
            </div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 28, lineHeight: 1.05, color: '#1f3028', margin: 0, letterSpacing: '-0.01em' }}>
              ¿Adónde va cada
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}> sol que pagas?</span>
            </h3>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#533b22', marginTop: 10 }}>
              DESGLOSE VERIFICADO · COSECHA MAYO 2026
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid #1f302833', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 16, color: '#533b22', lineHeight: 1, flexShrink: 0, marginLeft: 16 }}
          >
            ×
          </button>
        </div>

        {/* price summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', background: '#1f302811', borderRadius: 12, border: '1px solid #1f302822' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em', color: '#533b22', textTransform: 'uppercase', marginBottom: 4 }}>Precio sin IGV (base)</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: '#1f3028', lineHeight: 1 }}>{Money.formatPEN(netTotal)}</div>
          </div>
          <div style={{ padding: '12px 16px', background: '#c96e4b11', borderRadius: 12, border: '1px solid #c96e4b33' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.18em', color: '#533b22', textTransform: 'uppercase', marginBottom: 4 }}>Precio final (inc. IGV)</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: '#c96e4b', lineHeight: 1 }}>{Money.formatPEN(totalConIgv)}</div>
          </div>
        </div>

        {/* bar — based on net price */}
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.16em', color: '#533b22', textTransform: 'uppercase', marginBottom: 6 }}>
          Distribución del precio sin IGV ({Money.formatPEN(netTotal)})
        </div>
        <div style={{ display: 'flex', height: 56, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px -12px #533b22aa', border: '1px solid #1f302820', marginBottom: 8 }}>
          {displaySlices.map((s, i) => (
            <div
              key={s.label}
              style={{
                width: animated ? `${s.pct}%` : '0%',
                background: s.color,
                transition: `width 1.2s cubic-bezier(.2,.7,.2,1) ${i * 0.1}s`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}
            >
              <span style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600,
                color: s.color === '#c4b297' ? '#1f3028' : '#f2e0cc',
                opacity: animated ? 1 : 0, transition: 'opacity .4s ease .9s',
              }}>
                {s.pct}%
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.14em', color: '#533b22', marginBottom: 10 }}>
          {['0%', '25%', '50%', '75%', '100%'].map((l) => <span key={l}>{l}</span>)}
        </div>

        {/* slice list — amounts from net */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {displaySlices.map((s) => {
            const amount = Math.round(netTotal * s.pct / 100);
            return (
              <div key={s.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #1f302818' }}>
                <div style={{ width: 8, height: 44, background: s.color, borderRadius: 4, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600, color: '#1f3028' }}>{s.label}</span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: s.color, fontWeight: 700 }}>{s.pct}%</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#533b22' }}>
                        {Money.formatPEN(amount)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#533b22', marginTop: 4, lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* callout */}
        <div style={{ marginTop: 24, padding: '18px 22px', borderRadius: 14, background: '#1f3028', color: '#f2e0cc', display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#c96e4b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 700, flexShrink: 0, textAlign: 'center' as const, lineHeight: 1.1 }}>
            {producerPct}%<br /><span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>neto</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontStyle: 'italic', lineHeight: 1.3 }}>
              {producerPct}% del precio neto va al caficultor — {Money.formatPEN(Math.round(netTotal * producerPct / 100))}.
            </div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, marginTop: 6, color: '#c4b297' }}>El doble del comercio justo tradicional · Comparativa SCAA Perú 2025.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
