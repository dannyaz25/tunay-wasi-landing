import { useState } from 'react';
import { useCatalog } from '../useCatalog';
import FilterPanel, { type FilterState } from './FilterPanel';
import ProductCard from './ProductCard';
import CostBreakdownModal from './CostBreakdownModal';

function gridStyle(count: number): React.CSSProperties {
  if (count === 1) return { display: 'grid', gridTemplateColumns: '1fr', gap: 28, width: '50%', marginLeft: 'auto', marginRight: 'auto' };
  if (count === 2) return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28, width: '100%' };
  return { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, width: '100%' };
}

export default function Cafe() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FilterState>({
    brew: ['Todos'], experiencia: ['Todos'], tueste: ['Todos'], intensidad: ['Todos'],
  });
  const { data: products, isLoading } = useCatalog();
  const total = products?.length ?? 0;
  const [breakdownData, setBreakdownData] = useState<{ unitCents: number; qty: number } | null>(null);

  return (
    <section id="cafe" style={{ background: '#f2e0cc', padding: '100px 36px', position: 'relative' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48, marginBottom: 30, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>03 — Café de cosecha</span>
            {/*<h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 1.02, color: '#1f3028', margin: '24px 0 0', letterSpacing: '-0.01em' }}>
              Tres lotes,<br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>tres cordilleras.</span>
            </h2>*/}
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.65, color: '#533b22', maxWidth: 380, margin: 0 }}>
            Reserva ahora — tostamos un día antes de despachar. Tu pedido inicia el siguiente ciclo de tueste.
          </p>
        </div>

        <FilterPanel open={open} setOpen={setOpen} selected={selected} setSelected={setSelected} />

        {isLoading ? (
          <div style={gridStyle(3)} className="tw-cafe-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ background: '#e8d2b6', borderRadius: 24, height: 520, animation: 'tw-skeleton-pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div style={gridStyle(total)} className="tw-cafe-grid">
            {(products ?? []).map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onRequestBreakdown={(uc, q) => setBreakdownData({ unitCents: uc, qty: q })}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .tw-cafe-grid { max-width: 1200px; margin-left: auto; margin-right: auto; }
        @media (max-width: 1040px) { .tw-cafe-grid { grid-template-columns: repeat(2, 1fr) !important; width: 100% !important; } }
        @media (max-width: 640px)  { .tw-cafe-grid { grid-template-columns: 1fr !important; gap: 20px !important; } }
        @keyframes tw-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>

      {breakdownData && (
        <CostBreakdownModal
          unitCents={breakdownData.unitCents}
          qty={breakdownData.qty}
          onClose={() => setBreakdownData(null)}
        />
      )}
    </section>
  );
}
