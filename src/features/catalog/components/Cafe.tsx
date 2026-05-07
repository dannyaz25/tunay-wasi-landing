import { useState } from 'react';
import { useCatalog } from '../useCatalog';
import FilterPanel, { type FilterState } from './FilterPanel';
import ProductCard from './ProductCard';

export default function Cafe() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FilterState>({
    brew: ['Todos'], experiencia: ['Todos'], tueste: ['Todos'], intensidad: ['Todos'],
  });
  const { data: products, isLoading } = useCatalog();

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }} className="tw-cafe-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ background: '#e8d2b6', borderRadius: 24, height: 520, animation: 'tw-skeleton-pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }} className="tw-cafe-grid">
            {(products ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1040px) { .tw-cafe-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 700px) { .tw-cafe-grid { grid-template-columns: 1fr !important; } }
        @keyframes tw-skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>
    </section>
  );
}
