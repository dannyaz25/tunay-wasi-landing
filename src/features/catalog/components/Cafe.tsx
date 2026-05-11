import { useState, useEffect } from 'react';
import { useCatalog } from '../useCatalog';
import FilterPanel, { type FilterState } from './FilterPanel';
import ProductCard from './ProductCard';
import CostBreakdownModal from './CostBreakdownModal';

const PER_PAGE = 3;

function gridStyle(count: number): React.CSSProperties {
  if (count === 1) return { display: 'grid', gridTemplateColumns: '1fr', gap: 20, width: '45%', marginLeft: 'auto', marginRight: 'auto' };
  if (count === 2) return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, width: '100%' };
  return { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, width: '100%' };
}

export default function Cafe() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FilterState>({
    brew: ['Todos'], experiencia: ['Todos'], tueste: ['Todos'], intensidad: ['Todos'],
  });
  const { data: products, isLoading } = useCatalog();
  const total = products?.length ?? 0;
  const [breakdownData, setBreakdownData] = useState<{ unitCents: number; qty: number; producerPct: number } | null>(null);
  const [page, setPage] = useState(0);

  const useCarousel = total > PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  useEffect(() => { setPage(0); }, [selected]);

  const navBtnStyle = (enabled: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
    background: enabled ? '#1f3028' : '#1f302822',
    border: 'none', color: '#f2e0cc',
    fontSize: 20, lineHeight: 1,
    cursor: enabled ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: enabled ? 1 : 0.35,
    transition: 'all .2s ease',
  });

  return (
    <section id="cafe" style={{ background: '#f2e0cc', padding: '100px 36px', position: 'relative' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48, marginBottom: 30, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>03 — Café de cosecha</span>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.65, color: '#533b22', maxWidth: 380, margin: 0 }}>
            Reserva ahora — tostamos un día antes de despachar. Tu pedido inicia el siguiente ciclo de tueste.
          </p>
        </div>

        <FilterPanel open={open} setOpen={setOpen} selected={selected} setSelected={setSelected} />

        {isLoading ? (
          <div style={gridStyle(3)} className="tw-cafe-grid">
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: '#e8d2b6', borderRadius: 20, height: 420, animation: 'tw-skeleton-pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        ) : !useCarousel ? (
          <div style={gridStyle(total)} className="tw-cafe-grid">
            {(products ?? []).map(p => (
              <ProductCard
                key={p.id}
                p={p}
                onRequestBreakdown={(uc, q, pct) => setBreakdownData({ unitCents: uc, qty: q, producerPct: pct })}
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
                  <div key={pageIdx} className="tw-cafe-page" style={{ width: `${100 / totalPages}%` }}>
                    {(products ?? []).slice(pageIdx * PER_PAGE, (pageIdx + 1) * PER_PAGE).map(p => (
                      <ProductCard
                        key={p.id}
                        p={p}
                        onRequestBreakdown={(uc, q, pct) => setBreakdownData({ unitCents: uc, qty: q, producerPct: pct })}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation: arrows + dots */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={!canPrev} style={navBtnStyle(canPrev)}>‹</button>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    style={{
                      width: i === page ? 28 : 8, height: 8, borderRadius: 999,
                      background: i === page ? '#c96e4b' : '#1f302833',
                      border: 'none', cursor: 'pointer', padding: 0,
                      transition: 'all .3s ease',
                    }}
                  />
                ))}
              </div>
              <button onClick={() => setPage(p => p + 1)} disabled={!canNext} style={navBtnStyle(canNext)}>›</button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .tw-cafe-grid { max-width: 1200px; margin-left: auto; margin-right: auto; }
        @media (max-width: 1040px) { .tw-cafe-grid { grid-template-columns: repeat(2, 1fr) !important; width: 100% !important; } }
        @media (max-width: 640px)  { .tw-cafe-grid { grid-template-columns: 1fr !important; gap: 20px !important; } }
        .tw-cafe-page {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          box-sizing: border-box;
          align-items: start;
          flex-shrink: 0;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (max-width: 1040px) { .tw-cafe-page { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px)  { .tw-cafe-page { grid-template-columns: 1fr !important; } }
        @keyframes tw-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>

      {breakdownData && (
        <CostBreakdownModal
          unitCents={breakdownData.unitCents}
          qty={breakdownData.qty}
          producerPct={breakdownData.producerPct}
          onClose={() => setBreakdownData(null)}
        />
      )}
    </section>
  );
}
