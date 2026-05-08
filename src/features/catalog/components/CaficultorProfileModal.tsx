import { useState, useEffect, useRef } from 'react';
import type { Caficultor } from '@/shared/types/catalog';
import ImageSlot from '@/components/decor/ImageSlot';

interface Props {
  producer: Caficultor;
  idx: number;
  total: number;
  onClose: () => void;
}

export default function CaficultorProfileModal({ producer: p, idx, total, onClose }: Props) {
  const [slide, setSlide] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);

  const photos = p.photos?.length ? p.photos : p.photo ? [p.photo] : [];
  const hasCarousel = photos.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && hasCarousel) setSlide(s => (s + 1) % photos.length);
      if (e.key === 'ArrowLeft' && hasCarousel) setSlide(s => (s - 1 + photos.length) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, hasCarousel, photos.length]);

  const prev = () => setSlide(s => (s - 1 + photos.length) % photos.length);
  const next = () => setSlide(s => (s + 1) % photos.length);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(31, 48, 40, 0.6)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 12px',
      }}
    >
      <div style={{
        background: '#f2e0cc', borderRadius: 24,
        maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 40px 80px -24px rgba(83,59,34,0.7), 0 8px 24px rgba(0,0,0,0.2)',
        border: '1px solid #1f302818', position: 'relative',
        scrollbarWidth: 'none',
      }}>
        {/* carousel */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: '24px 24px 0 0', background: '#1f3028' }}>
          {photos.length > 0 ? (
            <img
              key={slide}
              src={photos[slide]}
              alt={`${p.name} — foto ${slide + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <ImageSlot label={`retrato · ${p.name.split(' ').slice(-1)[0].toLowerCase()}`} tone={p.color} ratio="16 / 9" />
          )}

          {/* number badge */}
          <div style={{ position: 'absolute', top: 16, left: 16, background: '#1f3028cc', backdropFilter: 'blur(4px)', color: '#f2e0cc', padding: '6px 12px', borderRadius: 999, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            № 0{idx + 1} / {total}
          </div>

          {/* SCA badge */}
          <div style={{ position: 'absolute', top: 16, right: 56, background: '#c96e4b', color: '#f2e0cc', padding: '8px 14px', borderRadius: 8, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1, boxShadow: '0 8px 18px -8px #533b22aa' }}>
            SCA {p.score}
          </div>

          {/* close */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ position: 'absolute', top: 14, right: 14, background: '#1f3028cc', backdropFilter: 'blur(4px)', border: '1px solid #f2e0cc33', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: '#f2e0cc', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          >
            ×
          </button>

          {/* carousel arrows */}
          {hasCarousel && (
            <>
              <button onClick={prev} aria-label="Anterior" style={arrowStyle('left')}>‹</button>
              <button onClick={next} aria-label="Siguiente" style={arrowStyle('right')}>›</button>
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 7 }}>
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    style={{ width: i === slide ? 22 : 7, height: 7, borderRadius: 4, background: i === slide ? '#c96e4b' : '#f2e0cc88', border: 'none', cursor: 'pointer', padding: 0, transition: 'all .3s ease' }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* body */}
        <div style={{ padding: '32px 36px 40px' }}>
          {/* name + location */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: '#c96e4b', textTransform: 'uppercase', marginBottom: 8 }}>
              {p.region}
            </div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 40px)', lineHeight: 1.05, color: '#1f3028', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              {p.name}
            </h2>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#533b22', fontWeight: 500, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontStyle: 'italic', color: '#c96e4b' }}>{p.farm}</span>
              {p.location && (
                <>
                  <span style={{ color: '#1f302840' }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="10" height="13" viewBox="0 0 10 13" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5zm0 6.5A1.5 1.5 0 1 1 5 3.5a1.5 1.5 0 0 1 0 3z" fill="#533b22" />
                    </svg>
                    {p.location}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* quote */}
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, lineHeight: 1.5, color: '#1f3028', fontStyle: 'italic', margin: '0 0 20px', borderLeft: '3px solid #c96e4b', paddingLeft: 16 }}>
            "{p.quote}"
          </p>

          {/* bio */}
          {p.bio && (
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.75, color: '#1f3028', margin: '0 0 24px' }}>
              {p.bio}
            </p>
          )}

          {/* social impact */}
          {p.socialImpact && (
            <div style={{ marginBottom: 28, padding: '18px 20px', borderRadius: 14, border: '1px solid #8faf8a55', background: '#8faf8a12' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-15 9" stroke="#8faf8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M5.71 22c0-5.33 2.67-8 6.29-9" stroke="#8faf8a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
                <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.3em', color: '#1f3028', textTransform: 'uppercase' }}>Impacto Social</span>
              </div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, lineHeight: 1.75, color: '#1f3028', margin: 0 }}>
                Con el sobreprecio pagado por este lote,{' '}
                <strong style={{ fontWeight: 600 }}>{p.name}</strong>{' '}
                planea{' '}
                <span style={{ color: '#1f3028', fontWeight: 700, background: '#c96e4b18', borderBottom: '2px solid #c96e4b', paddingBottom: 1 }}>{p.socialImpact}</span>
              </p>
            </div>
          )}

          {/* stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, background: '#1f302812', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
            {[
              [p.yearsExp != null ? String(p.yearsExp) : '—', 'Años de experiencia'],
              [p.farmHa != null ? String(p.farmHa) : '—', 'Ha de cafetal'],
              [`SCA ${p.score}`, 'Cata (referencial)'],
            ].map(([val, label]) => (
              <div key={label} style={{ background: '#f2e0cc', padding: '20px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 700, color: '#1f3028', lineHeight: 1, marginBottom: 6 }}>{val}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: '#533b22', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, borderTop: '1px solid #1f302820', paddingTop: 20 }}>
            {([['Alt.', p.alt], ['Variedad', p.variety], ['Proceso', p.process]] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: '#533b22', textTransform: 'uppercase', marginBottom: 5 }}>{k}</div>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, color: '#1f3028' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        [data-caficultor-modal]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    [side]: 14,
    background: '#1f3028bb', backdropFilter: 'blur(4px)',
    border: '1px solid #f2e0cc33', borderRadius: 8,
    width: 38, height: 38, cursor: 'pointer',
    fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color: '#f2e0cc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, padding: 0,
  };
}
