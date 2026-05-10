import { useEffect } from 'react';
import type { CartItem } from '@/shared/types/cart';
import { Money } from '@/shared/money';
import {
  useCartItems, useCartIsOpen, useCartTotalQuantity, useCartSubtotalCents, useCartActions,
} from '@/features/cart/useCart';
import { useActiveCycle } from '@/features/catalog/useActiveCycle';
import { useComisiones } from '@/features/catalog/useComisiones';

function ProducerShareLine({ unitCents, qty }: { unitCents: number; qty: number }) {
  const { data: comisiones } = useComisiones();
  const factor = comisiones?.producerShareFactor ?? 0.421;
  const pct = Math.round(factor * 100);
  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#533b22' }}>
      MÁX. {qty} unid. · {pct}% al caficultor: {Money.formatPEN(Math.round(unitCents * qty * factor))}
    </div>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const { dec, inc, remove, setQty } = useCartActions();
  const lineTotal = item.unitCents * item.qty;

  return (
    <div style={{ background: '#f2e0cc', border: '1px solid #1f302822', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, transition: 'all .25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 22, lineHeight: 1.1, margin: 0, color: '#1f3028' }}>{item.name}</h4>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, padding: '4px 9px', borderRadius: 999, background: '#8faf8a55', color: '#1f3028', border: '1px solid #8faf8a99' }}>{item.weight} · {item.badge}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#533b22' }}>{Money.formatPEN(item.unitCents)} c/u</span>
          </div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#533b22', marginTop: 6 }}>
            Molienda: <strong style={{ color: '#1f3028', fontWeight: 600 }}>{item.grind}</strong>
          </div>
        </div>
        <button onClick={() => remove(item.id)} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, color: '#c96e4b', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, letterSpacing: '0.04em' }}>Eliminar</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f2e0cc', border: '1px solid #1f302833', borderRadius: 999 }}>
          <button onClick={() => dec(item.id)} aria-label="Restar" style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#1f3028' }}>−</button>
          <input type="number" value={item.qty} min={1} max={item.maxQty}
            onChange={(e) => setQty(item.id, parseInt(e.target.value || '1', 10))}
            style={{ width: 36, textAlign: 'center', border: 'none', background: 'transparent', fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#1f3028', outline: 'none' }} />
          <button onClick={() => inc(item.id)} aria-label="Sumar" disabled={item.qty >= item.maxQty} style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: item.qty >= item.maxQty ? 'not-allowed' : 'pointer', fontSize: 18, color: item.qty >= item.maxQty ? '#1f302855' : '#1f3028' }}>+</button>
        </div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 24, color: '#1f3028' }}>{Money.formatPEN(lineTotal)}</div>
      </div>
      <ProducerShareLine unitCents={item.unitCents} qty={item.qty} />
    </div>
  );
}

function EmptyCart() {
  const { close } = useCartActions();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: 18 }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#f2e0cc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1f302833' }}>
        <div style={{ width: 64, height: 64, animation: 'tw-logo-hover 4.2s ease-in-out infinite' }}>
          <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'tw-logo-breathe 2.4s ease-in-out infinite' }} />
        </div>
      </div>
      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 30, color: '#f2e0cc', margin: 0, lineHeight: 1.1 }}>Tu canasta está vacía.</h3>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297', maxWidth: 280, lineHeight: 1.6, margin: 0 }}>
        Aún no hay café reservado para el próximo tueste. Empieza por nuestras tres cordilleras.
      </p>
      <a href="#cafe" onClick={close} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1f3028', background: '#c96e4b', padding: '14px 22px', borderRadius: 999, textDecoration: 'none', marginTop: 8 }}>
        Explorar la cosecha
      </a>
    </div>
  );
}

export default function CartDrawer() {
  const isOpen = useCartIsOpen();
  const items = useCartItems();
  const totalQuantity = useCartTotalQuantity();
  const subtotalCents = useCartSubtotalCents();
  const { close, clear, openCheckout } = useCartActions();
  const { data: cycle } = useActiveCycle();
  const { data: comisiones } = useComisiones();
  const producerShareFactor = comisiones?.producerShareFactor ?? 0.421;
  const producerSharePct = Math.round(producerShareFactor * 100);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  return (
    <>
      <style>{`
        @keyframes tw-logo-hover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes tw-logo-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
      `}</style>
      <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#1f3028', opacity: isOpen ? 0.5 : 0, pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity .35s ease', backdropFilter: 'blur(2px)' }} />
      <aside aria-hidden={!isOpen} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100, width: 'min(460px, 100vw)', background: '#1f3028', color: '#f2e0cc', transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .55s cubic-bezier(.2,.7,.2,1)', display: 'flex', flexDirection: 'column', boxShadow: '-30px 0 80px -30px #000000aa', borderLeft: '1px solid #c96e4b33' }}>
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid #f2e0cc18', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, animation: 'tw-logo-hover 4.2s ease-in-out infinite' }}>
                <img src="/brand/logo.png" alt="Tunay Wasi" style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'tw-logo-breathe 2.4s ease-in-out infinite' }} />
              </div>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 28, color: '#f2e0cc' }}>Tu canasta</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.18em', background: '#c96e4b', color: '#f2e0cc', padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase' }}>Selección</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b297' }}>{totalQuantity} {totalQuantity === 1 ? 'artículo' : 'artículos'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {items.length > 0 && (
              <button onClick={clear} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, color: '#c4b297', background: 'transparent', border: '1px solid #c4b29744', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>Limpiar</button>
            )}
            <button onClick={close} aria-label="Cerrar" style={{ width: 36, height: 36, borderRadius: '50%', background: '#f2e0cc11', border: '1px solid #f2e0cc22', color: '#f2e0cc', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        </div>

        {items.length > 0 && cycle && (
          <div style={{ margin: '18px 28px 0', padding: '12px 16px', borderRadius: 12, background: '#c96e4b22', border: '1px solid #c96e4b66', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>
            <span style={{ fontSize: 16 }}>☕</span>
            <span>Cierra <strong>{cycle.closeAt}</strong> · Entrega Lima <strong>{cycle.deliverLima}</strong></span>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: items.length ? '18px 28px' : 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.length === 0 ? <EmptyCart /> : items.map((it) => <CartItemRow key={it.id} item={it} />)}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid #f2e0cc18', padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 14, background: 'linear-gradient(180deg, #1f3028 0%, #182520 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297' }}>Subtotal (sin delivery)</span>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 32, color: '#f2e0cc' }}>{Money.formatPEN(subtotalCents)}</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#8faf8a' }}>
              {producerSharePct}% al caficultor: {Money.formatPEN(Math.round(subtotalCents * producerShareFactor))}
            </div>
            <button onClick={openCheckout} style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1f3028', background: 'linear-gradient(135deg, #c96e4b 0%, #d68863 100%)', padding: '20px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', boxShadow: '0 18px 40px -16px #c96e4baa, inset 0 1px 0 #ffffff33', transition: 'all .3s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              Completar reserva →
            </button>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', textAlign: 'center', lineHeight: 1.6 }}>
              Envío gratis Lima desde S/ 100 · Provincia desde S/ 150<br />
              Lima S/ 8 · Lima Ext. (Olva) S/ 10–12 · Provincia (Olva) S/ 12–15
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
