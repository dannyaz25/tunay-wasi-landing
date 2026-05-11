import { useState } from 'react';
import type { Caficultor } from '@/shared/types/catalog';
import { useCaficultores } from '../useCaficultores';
import ImageSlot from '@/components/decor/ImageSlot';
import CaficultorProfileModal from './CaficultorProfileModal';

function ProducerCard({ p, idx, total, onOpenProfile }: { p: Caficultor; idx: number; total: number; onOpenProfile: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: '#f2e0cc', border: '1px solid #1f302833', borderRadius: 20, padding: 22, transition: 'all .45s cubic-bezier(.2,.7,.2,1)', transform: hover ? 'translateY(-6px)' : 'translateY(0)', boxShadow: hover ? '0 28px 52px -20px #533b22cc, 0 6px 12px -6px #533b2266' : '0 10px 24px -14px #533b2288', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minWidth: 0 }}
    >
      <div style={{ position: 'relative' }}>
        {p.photo ? (
          <img
            src={p.photo}
            alt={p.name}
            style={{ width: '100%', aspectRatio: '5 / 3', objectFit: 'cover', borderRadius: 16, display: 'block' }}
          />
        ) : (
          <ImageSlot label={`retrato · ${(p.name ?? '').split(' ').slice(-1)[0].toLowerCase()}`} tone={p.color ?? 'green'} ratio="4 / 3" />
        )}
        <div style={{ position: 'absolute', top: 14, left: 14, background: '#1f3028', color: '#f2e0cc', padding: '6px 12px', borderRadius: 999, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          № 0{idx + 1} / {total}
        </div>
        <div style={{ position: 'absolute', bottom: 14, right: 14, background: '#c96e4b', color: '#f2e0cc', padding: '8px 14px', borderRadius: 8, fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1, boxShadow: '0 8px 18px -8px #533b22aa' }}>
          SCA {p.score}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: '#533b22', textTransform: 'uppercase', marginBottom: 8 }}>{p.region}</div>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 24, lineHeight: 1.05, color: '#1f3028', margin: 0, letterSpacing: '-0.005em' }}>{p.name}</h3>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c96e4b', marginTop: 6, fontWeight: 500, fontStyle: 'italic' }}>{p.farm}</div>
      </div>

      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, lineHeight: 1.45, color: '#1f3028', fontStyle: 'italic', margin: 0 }}>"{p.summary}"</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, borderTop: '1px solid #1f302822', paddingTop: 16 }}>
        {([['ALT.', p.alt], ['VAR.', p.variety], ['PROC.', p.process]] as [string, string][]).map(([k, v]) => (
          <div key={k}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: '#533b22' }}>{k}</div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, color: '#1f3028', marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onOpenProfile}
        style={{ marginTop: 'auto', width: '100%', padding: '13px 20px', background: 'transparent', border: '1px solid #1f302844', borderRadius: 10, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', color: '#1f3028', transition: 'all .3s ease', textAlign: 'center' }}
        onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = '#1f3028'; el.style.color = '#f2e0cc'; el.style.borderColor = '#1f3028'; }}
        onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.color = '#1f3028'; el.style.borderColor = '#1f302844'; }}
      >
        Ver perfil completo →
      </button>
    </article>
  );
}

const PER_PAGE = 3;

function gridStyle(count: number): React.CSSProperties {
  if (count === 1) return { display: 'grid', gridTemplateColumns: '1fr', gap: 24, width: '45%', marginLeft: 'auto', marginRight: 'auto' };
  if (count === 2) return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, width: '100%' };
  return { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%' };
}

export default function Caficultores() {
  const { data: producers, isLoading } = useCaficultores();
  const total = producers?.length ?? 0;
  const [selected, setSelected] = useState<{ producer: Caficultor; idx: number } | null>(null);
  const [page, setPage] = useState(0);

  const useCarousel = total > PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const navBtnStyle = (enabled: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
    background: enabled ? '#c96e4b' : '#f2e0cc18',
    border: 'none', color: '#f2e0cc',
    fontSize: 20, lineHeight: 1,
    cursor: enabled ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: enabled ? 1 : 0.35,
    transition: 'all .2s ease',
  });

  return (
    <section id="caficultores" style={{ position: 'relative', padding: '100px 36px', background: '#1f3028', color: '#f2e0cc', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, opacity: 0.12, display: 'flex', gap: 24, justifyContent: 'center' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 14, background: '#8faf8a', transform: 'rotate(45deg)' }} />
        ))}
      </div>

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, marginBottom: 48, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>02 — Caficultores</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(32px, 4vw, 58px)', lineHeight: 1.02, color: '#f2e0cc', margin: '16px 0 0', letterSpacing: '-0.01em', maxWidth: 720 }}>
              {total > 0 ? `${total} familias.` : 'Doce familias.'}<br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>Una sola palabra dada.</span>
            </h2>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#c4b297', maxWidth: 360, margin: 0 }}>
            Cada lote que llega a tu cocina nace en una parcela que conocemos por su nombre. Aquí no hay un anónimo "café peruano" — hay personas, alturas y microclimas.
          </p>
        </div>

        {isLoading ? (
          <div className="tw-carousel-page" style={{ width: '100%' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: '#2a3d33', borderRadius: 24, height: 480, animation: 'tw-skeleton-pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        ) : !useCarousel ? (
          <div style={gridStyle(total)} className="tw-prod-grid">
            {(producers ?? []).map((p, i) => (
              <ProducerCard
                key={p.id}
                p={p}
                idx={i}
                total={total}
                onOpenProfile={() => setSelected({ producer: p, idx: i })}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Carousel track */}
            <div style={{ overflow: 'hidden', paddingBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  width: `${totalPages * 100}%`,
                  transform: `translateX(-${(page / totalPages) * 100}%)`,
                  transition: 'transform 0.45s cubic-bezier(.2,.7,.2,1)',
                }}
              >
                {Array.from({ length: totalPages }).map((_, pageIdx) => (
                  <div key={pageIdx} className="tw-carousel-page" style={{ width: `${100 / totalPages}%` }}>
                    {(producers ?? []).slice(pageIdx * PER_PAGE, (pageIdx + 1) * PER_PAGE).map((p, i) => (
                      <ProducerCard
                        key={p.id}
                        p={p}
                        idx={pageIdx * PER_PAGE + i}
                        total={total}
                        onOpenProfile={() => setSelected({ producer: p, idx: pageIdx * PER_PAGE + i })}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Navigation: arrows + dots */}
        {useCarousel && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={!canPrev} style={navBtnStyle(canPrev)}>‹</button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{
                    width: i === page ? 28 : 8, height: 8, borderRadius: 999,
                    background: i === page ? '#c96e4b' : '#f2e0cc33',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all .3s ease',
                  }}
                />
              ))}
            </div>
            <button onClick={() => setPage(p => p + 1)} disabled={!canNext} style={navBtnStyle(canNext)}>›</button>
          </div>
        )}

      </div>

      <style>{`
        .tw-prod-grid { max-width: 1200px; margin-left: auto; margin-right: auto; }
        @media (max-width: 1040px) { .tw-prod-grid { grid-template-columns: repeat(2, 1fr) !important; width: 100% !important; } }
        @media (max-width: 640px)  { .tw-prod-grid { grid-template-columns: 1fr !important; gap: 24px !important; } }
        .tw-carousel-page {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          box-sizing: border-box;
          align-items: start;
          flex-shrink: 0;
        }
        @media (max-width: 1040px) { .tw-carousel-page { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .tw-carousel-page { grid-template-columns: 1fr !important; } }
        @keyframes tw-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>

      {selected && (
        <CaficultorProfileModal
          producer={selected.producer}
          idx={selected.idx}
          total={total}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
