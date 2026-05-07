import { useCartTotalQuantity, useCartActions } from '@/features/cart/useCart';

export default function CartButton() {
  const totalQuantity = useCartTotalQuantity();
  const { open } = useCartActions();

  return (
    <button onClick={open} aria-label="Abrir canasta" style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 80,
      width: 64, height: 64, borderRadius: '50%',
      background: '#c96e4b', color: '#f2e0cc',
      border: '1px solid #533b22aa',
      cursor: 'pointer',
      boxShadow: '0 18px 36px -12px #533b22cc, inset 0 1px 0 #ffffff33',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .3s ease',
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.05)'; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)'; }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M3 4h2l2.5 12h11l2-9H6.5" stroke="#f2e0cc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.5" fill="#f2e0cc" />
        <circle cx="17" cy="20" r="1.5" fill="#f2e0cc" />
      </svg>
      {totalQuantity > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          minWidth: 24, height: 24, borderRadius: 12, padding: '0 7px',
          background: '#1f3028', color: '#f2e0cc',
          fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #f2e0cc',
        }}>{totalQuantity}</span>
      )}
    </button>
  );
}
