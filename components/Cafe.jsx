// "Café" — filter panel ("Elegir mi café") + rich product cards with caficultor info,
// brew methods, freshness, weight selector, qty stepper, "Reservar".

const BREW_GROUPS = [
  { group: 'Pour-over', icon: '◓', items: ['V60', 'Chemex', 'Clever', 'Sifón', 'Filtro'] },
  { group: 'Inmersión', icon: '◐', items: ['French Press', 'AeroPress', 'Turca'] },
  { group: 'Presión / frío', icon: '◑', items: ['Espresso', 'Moka', 'Cold Brew'] },
];
const EXPERIENCE = ['Todos', 'Soy nuevo', 'Quiero explorar', 'Experto'];
const ROAST = ['Todos', 'Espresso / clásico', 'Versátil', 'Filtrado / floral'];
const INTENSITY = ['Todos', 'Suave y familiar', 'Equilibrado', 'Explosión de sabor'];

const FilterChip = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500,
    padding: '10px 18px', borderRadius: 999, cursor: 'pointer',
    background: active ? '#1f3028' : '#f2e0cc',
    color: active ? '#f2e0cc' : '#1f3028',
    border: `1px solid ${active ? '#1f3028' : '#1f302833'}`,
    transition: 'all .25s ease',
    letterSpacing: '0.02em',
  }} onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#c96e4b'; e.currentTarget.style.color = '#c96e4b'; }}}
     onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#1f302833'; e.currentTarget.style.color = '#1f3028'; }}}>
    {children}
  </button>
);

const FilterPanel = ({ open, setOpen, selected, setSelected }) => {
  const toggle = (cat, val) => {
    setSelected(s => {
      const cur = new Set(s[cat] || []);
      if (val === 'Todos') return { ...s, [cat]: ['Todos'] };
      cur.delete('Todos');
      cur.has(val) ? cur.delete(val) : cur.add(val);
      return { ...s, [cat]: cur.size ? [...cur] : ['Todos'] };
    });
  };
  const isActive = (cat, val) => (selected[cat] || []).includes(val);

  return (
    <section style={{
      background: '#e8d2b6',
      border: '1px solid #1f302822',
      borderRadius: 22,
      marginBottom: 40,
      overflow: 'hidden',
      boxShadow: '0 14px 36px -22px #533b22aa',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', padding: '24px 28px', cursor: 'pointer',
        background: 'transparent', border: 'none', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
            fontSize: 30, color: '#1f3028', letterSpacing: '-0.005em',
          }}>Elegir mi café</span>
          <span style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#533b22',
          }}>Filtra por método, perfil y más</span>
        </span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#1f3028',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform .35s ease', display: 'inline-block',
        }}>▾</span>
      </button>
      <div style={{
        maxHeight: open ? 1200 : 0, overflow: 'hidden',
        transition: 'max-height .55s cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{ padding: '0 28px 32px' }}>
          {/* Brew methods */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em',
              color: '#c96e4b', textTransform: 'uppercase', marginBottom: 14,
            }}>Método de preparación</div>
            {BREW_GROUPS.map(g => (
              <div key={g.group} style={{ marginBottom: 14 }}>
                <div style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500,
                  color: '#533b22', marginBottom: 8, letterSpacing: '0.06em',
                }}>
                  <span style={{ marginRight: 6, color: '#c96e4b' }}>{g.icon}</span>
                  {g.group}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {g.items.map(it => (
                    <FilterChip key={it} active={isActive('brew', it)} onClick={() => toggle('brew', it)}>{it}</FilterChip>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Experience / Roast / Intensity */}
          {[
            ['experiencia', 'Tu experiencia con café', EXPERIENCE],
            ['tueste', 'Tipo de tueste', ROAST],
            ['intensidad', 'Intensidad de sabor', INTENSITY],
          ].map(([key, label, opts]) => (
            <div key={key} style={{ marginTop: 22 }}>
              <div style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600,
                color: '#1f3028', marginBottom: 10, letterSpacing: '0.04em',
              }}>{label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {opts.map(o => (
                  <FilterChip key={o} active={isActive(key, o)} onClick={() => toggle(key, o)}>{o}</FilterChip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PRODUCTS = [
  {
    code: '01', name: 'Sumaq Mayu', sub: 'Lavado · Cusco',
    region: 'Perú · Cusco · Calca', alt: '1,650 m',
    farm: 'Finca Sumaq Mayu', producer: 'Doña Eulalia Quispe',
    notes: ['Caramelo', 'Naranja sanguina', 'Cacao'],
    body: 'Medio', acidity: 'Cítrica brillante',
    score: '86.5', tag: 'Versátil', tagTone: 'sage',
    brews: ['V60', 'Chemex', 'AeroPress'],
    weights: [['250g', 78], ['1kg', 270], ['3kg', 760]],
    tone: 'green', stockKg: 9.2,
    desc: 'Café de pequeño productor, secado al sol y proceso lavado clásico — el equilibrio andino.',
  },
  {
    code: '02', name: 'Yanapay Honey', sub: 'Honey naranja · San Martín',
    region: 'Perú · San Martín · Lamas', alt: '1,420 m',
    farm: 'Finca Yanapay', producer: 'Mateo Huamán',
    notes: ['Miel', 'Durazno', 'Almendra'],
    body: 'Sedoso', acidity: 'Suave, frutal',
    score: '88.0', tag: 'Filtrado / floral', tagTone: 'terra',
    brews: ['V60', 'Chemex', 'Clever'],
    weights: [['250g', 92], ['1kg', 320], ['3kg', 900]],
    tone: 'tan', stockKg: 4.1,
    desc: 'Honey naranja con fermentación natural — dulzor de miel de palma y final largo.',
  },
  {
    code: '03', name: 'Wayra Punku', sub: 'Natural · Puno',
    region: 'Perú · Puno · Sandia', alt: '1,820 m',
    farm: 'Finca Wayra Punku', producer: 'Familia Mamani',
    notes: ['Frutos rojos', 'Vino tinto', 'Chocolate'],
    body: 'Pleno', acidity: 'Madura, vinosa',
    score: '87.2', tag: 'Espresso / clásico', tagTone: 'deep',
    brews: ['Espresso', 'Moka', 'French Press'],
    weights: [['250g', 84], ['1kg', 290], ['3kg', 820]],
    tone: 'terra', stockKg: 6.8,
    desc: 'Naturales secados en cama africana, con perfil intenso y notas de fruta madura.',
  },
];

const TAG_TONES = {
  sage:  { bg: '#8faf8a', text: '#1f3028' },
  terra: { bg: '#c96e4b', text: '#f2e0cc' },
  deep:  { bg: '#1f3028', text: '#f2e0cc' },
};

const ProductCard = ({ p }) => {
  const [hover, setHover] = React.useState(false);
  const [weight, setWeight] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  const [w, price] = p.weights[weight];
  const tone = TAG_TONES[p.tagTone];

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#f2e0cc',
        border: '1px solid #1f302833',
        borderRadius: 24,
        padding: 24,
        transition: 'all .45s cubic-bezier(.2,.7,.2,1)',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hover ? '0 32px 60px -22px #533b22cc' : '0 14px 32px -22px #533b2288',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
      {/* image with overlay info */}
      <div style={{ position: 'relative' }}>
        <ImageSlot label={`bolsa · ${p.name.toLowerCase()}`} tone={p.tone} ratio="4 / 3" />
        <div style={{
          position: 'absolute', top: 14, left: 14,
          background: '#1f3028e0', color: '#f2e0cc',
          padding: '6px 12px', borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase', backdropFilter: 'blur(6px)',
        }}>№ {p.code} · SCA {p.score}</div>
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: tone.bg, color: tone.text,
          padding: '6px 12px', borderRadius: 999,
          fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>{p.tag}</div>
        <div style={{
          position: 'absolute', bottom: 14, left: 14,
          background: '#f2e0cce0', color: '#1f3028',
          padding: '6px 10px', borderRadius: 8,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.12em',
          backdropFilter: 'blur(6px)',
        }}>{p.alt} · {p.region.split(' · ').slice(-1)[0]}</div>
      </div>

      {/* title */}
      <div>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
          fontSize: 32, lineHeight: 1.0, margin: 0, letterSpacing: '-0.005em',
          color: '#1f3028',
        }}>{p.name}</h3>
        <div style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 12,
          color: '#533b22', marginTop: 6, fontStyle: 'italic',
        }}>{p.sub}</div>
      </div>

      {/* caficultor + finca pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500,
          padding: '6px 11px', borderRadius: 8,
          background: '#1f3028', color: '#f2e0cc',
        }}>Caficultor: <strong style={{ fontWeight: 600 }}>{p.producer}</strong></span>
        <span style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500,
          padding: '6px 11px', borderRadius: 8,
          background: '#c4b297', color: '#1f3028',
        }}>{p.farm}</span>
      </div>

      {/* notes */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {p.notes.map(n => (
          <span key={n} style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500,
            padding: '5px 11px', borderRadius: 999,
            background: '#8faf8a44', color: '#1f3028', border: '1px solid #8faf8a99',
          }}>{n}</span>
        ))}
      </div>

      {/* freshness banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#8faf8a22', border: '1px solid #8faf8a66',
        borderRadius: 12, padding: '10px 14px',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#8faf8a',
          animation: 'tw-pulse-mini 2s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500,
          color: '#1f3028',
        }}>Tostado un día antes del envío — café ultra fresco</span>
      </div>

      {/* description */}
      <p style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: 16, lineHeight: 1.45,
        color: '#1f3028', fontStyle: 'italic', margin: 0, textWrap: 'pretty', opacity: 0.85,
      }}>{p.desc}</p>

      {/* brew compatibility */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        paddingTop: 14, borderTop: '1px solid #1f302822',
      }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em', color: '#533b22' }}>BIEN PARA</span>
        {p.brews.map(b => (
          <span key={b} style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500,
            padding: '3px 9px', borderRadius: 6,
            background: '#1f302811', color: '#1f3028', border: '1px solid #1f302822',
          }}>{b}</span>
        ))}
      </div>

      {/* weight selector */}
      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.2em',
          color: '#533b22', marginBottom: 8,
        }}>PRESENTACIÓN</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {p.weights.map(([wl], i) => (
            <button key={wl} onClick={() => setWeight(i)} style={{
              flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
              background: weight === i ? '#c96e4b' : '#f2e0cc',
              color: weight === i ? '#f2e0cc' : '#1f3028',
              border: `1px solid ${weight === i ? '#c96e4b' : '#1f302833'}`,
              transition: 'all .25s ease',
            }}>{wl}</button>
          ))}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
          color: '#533b22', marginTop: 8,
        }}>Stock verde: {p.stockKg} kg</div>
      </div>

      {/* price + qty + reservar */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end',
      }}>
        <div>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 600,
            fontSize: 40, lineHeight: 1, color: '#1f3028',
          }}>S/ {(price * qty).toFixed(0)}</div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            letterSpacing: '0.18em', color: '#533b22', marginTop: 6,
          }}>50% al caficultor · S/ {(price * qty * 0.5).toFixed(0)}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          border: '1px solid #1f302833', borderRadius: 999, overflow: 'hidden',
          background: '#f2e0cc',
        }}>
          <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
            width: 36, height: 40, border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 16, color: '#1f3028',
          }}>−</button>
          <span style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600,
            minWidth: 28, textAlign: 'center', color: '#1f3028',
          }}>{qty}</span>
          <button onClick={() => setQty(q => q + 1)} style={{
            width: 36, height: 40, border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 16, color: '#1f3028',
          }}>+</button>
        </div>
      </div>

      <button onClick={() => {
        const [wl, pr] = p.weights[weight];
        window.cartStore.getState().add({
          id: `${p.code}-${wl}-Grano`,
          sku: p.code,
          name: p.name,
          weight: wl,
          grind: 'Grano',
          unitCents: pr * 100,
          qty: qty,
          maxQty: 30,
          caficultor: p.producer,
          finca: p.farm,
          badge: 'Selección',
        });
      }} style={{
        marginTop: 4,
        fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#f2e0cc',
        background: hover ? '#c96e4b' : '#1f3028',
        padding: '16px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
        boxShadow: '0 14px 28px -16px #533b22aa',
        transition: 'all .35s ease',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span>Reservar — entrega 7 mayo</span>
        <span>→</span>
      </button>

      <style>{`
        @keyframes tw-pulse-mini {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </article>
  );
};

const Cafe = () => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState({
    brew: ['Todos'], experiencia: ['Todos'], tueste: ['Todos'], intensidad: ['Todos'],
  });

  return (
    <section id="cafe" style={{
      background: '#f2e0cc',
      padding: '140px 36px',
      position: 'relative',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 48, marginBottom: 56, flexWrap: 'wrap',
        }}>
          <div>
            <span style={{
              fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
              color: '#c96e4b', textTransform: 'uppercase',
            }}>03 — Café de cosecha</span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 1.02,
              color: '#1f3028', margin: '24px 0 0', letterSpacing: '-0.01em',
            }}>
              Tres lotes,
              <br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>
                tres cordilleras.
              </span>
            </h2>
          </div>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.65,
            color: '#533b22', maxWidth: 380, margin: 0,
          }}>
            Reserva ahora — tostamos un día antes de despachar.
            Tu pedido inicia el siguiente ciclo de tueste.
          </p>
        </div>

        <FilterPanel open={open} setOpen={setOpen} selected={selected} setSelected={setSelected} />

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
        }} className="tw-cafe-grid">
          {PRODUCTS.map(p => <ProductCard key={p.code} p={p} />)}
        </div>
      </div>

      <style>{`
        @media (max-width: 1040px) { .tw-cafe-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 700px) { .tw-cafe-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
};

window.Cafe = Cafe;
