import { type Dispatch, type SetStateAction } from 'react';

const BREW_GROUPS = [
  { group: 'Pour-over', icon: '◓', items: ['V60', 'Chemex', 'Clever', 'Sifón', 'Filtro'] },
  { group: 'Inmersión', icon: '◐', items: ['French Press', 'AeroPress', 'Turca'] },
  { group: 'Presión / frío', icon: '◑', items: ['Espresso', 'Moka', 'Cold Brew'] },
];
const EXPERIENCE = ['Todos', 'Soy nuevo', 'Quiero explorar', 'Experto'];
const ROAST = ['Todos', 'Espresso / clásico', 'Versátil', 'Filtrado / floral'];
const INTENSITY = ['Todos', 'Suave y familiar', 'Equilibrado', 'Explosión de sabor'];

export type FilterState = Record<string, string[]>;

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  selected: FilterState;
  setSelected: Dispatch<SetStateAction<FilterState>>;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500, padding: '10px 18px', borderRadius: 999, cursor: 'pointer', background: active ? '#1f3028' : '#f2e0cc', color: active ? '#f2e0cc' : '#1f3028', border: `1px solid ${active ? '#1f3028' : '#1f302833'}`, transition: 'all .25s ease', letterSpacing: '0.02em' }}
      onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = '#c96e4b'; (e.currentTarget as HTMLElement).style.color = '#c96e4b'; } }}
      onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = '#1f302833'; (e.currentTarget as HTMLElement).style.color = '#1f3028'; } }}>
      {children}
    </button>
  );
}

export default function FilterPanel({ open, selected, setSelected }: Props) {
  const toggle = (cat: string, val: string) => {
    setSelected((s) => {
      const cur = new Set(s[cat] ?? []);
      if (val === 'Todos') return { ...s, [cat]: ['Todos'] };
      cur.delete('Todos');
      cur.has(val) ? cur.delete(val) : cur.add(val);
      return { ...s, [cat]: cur.size ? [...cur] : ['Todos'] };
    });
  };
  const isActive = (cat: string, val: string) => (selected[cat] ?? []).includes(val);

  return (
    <section className="tw-filter-panel" style={{ background: '#e8d2b6', border: '1px solid #1f302822', borderRadius: 22, marginBottom: 40, overflow: 'hidden', boxShadow: '0 14px 36px -22px #533b22aa' }}>
      {/*<button onClick={() => setOpen((o) => !o)} style={{ width: '100%', padding: '24px 28px', cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 30, color: '#1f3028', letterSpacing: '-0.005em' }}>Elegir mi café</span>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#533b22' }}>Filtra por método, perfil y más</span>
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#1f3028', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .35s ease', display: 'inline-block' }}>▾</span>
      </button>*/}
      <div style={{ width: '100%', padding: '14px 20px', background: 'transparent', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 30, color: '#1f3028', letterSpacing: '-0.005em' }}>Elegir mi café</span>
        </span>
      </div>
      <div style={{ maxHeight: open ? 1200 : 0, overflow: 'hidden', transition: 'max-height .55s cubic-bezier(.2,.7,.2,1)' }}>
        <div style={{ padding: '0 28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em', color: '#c96e4b', textTransform: 'uppercase', marginBottom: 14 }}>Método de preparación</div>
            {BREW_GROUPS.map((g) => (
              <div key={g.group} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, color: '#533b22', marginBottom: 8, letterSpacing: '0.06em' }}>
                  <span style={{ marginRight: 6, color: '#c96e4b' }}>{g.icon}</span>{g.group}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {g.items.map((it) => (
                    <FilterChip key={it} active={isActive('brew', it)} onClick={() => toggle('brew', it)}>{it}</FilterChip>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {([['experiencia', 'Tu experiencia con café', EXPERIENCE], ['tueste', 'Tipo de tueste', ROAST], ['intensidad', 'Intensidad de sabor', INTENSITY]] as [string, string, string[]][]).map(([key, label, opts]) => (
            <div key={key} style={{ marginTop: 22 }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, color: '#1f3028', marginBottom: 10, letterSpacing: '0.04em' }}>{label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {opts.map((o) => <FilterChip key={o} active={isActive(key, o)} onClick={() => toggle(key, o)}>{o}</FilterChip>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) { .tw-filter-panel { display: none !important; } }
      `}</style>
    </section>
  );
}
