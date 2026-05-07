// Checkout — two-step modal (Datos → Pago) overlaid on the page.

const DEPARTAMENTOS = ['Lima Metropolitana', 'Lima provincias', 'Arequipa', 'Cusco', 'La Libertad', 'Piura', 'Junín', 'Otro'];
const DISTRITOS = ['Miraflores', 'Barranco', 'San Isidro', 'San Borja', 'Surco', 'Magdalena', 'Pueblo Libre', 'Lince', 'Otro'];

const StepPill = ({ active, done, n, label }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', borderRadius: 999,
    background: active ? '#c96e4b' : (done ? '#8faf8a' : '#f2e0cc11'),
    color: active || done ? '#1f3028' : '#c4b297',
    fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600,
    letterSpacing: '0.04em',
    border: `1px solid ${active ? '#c96e4b' : (done ? '#8faf8a' : '#c4b29733')}`,
    transition: 'all .3s ease',
  }}>
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      background: active || done ? '#1f3028' : '#c4b29733',
      color: active || done ? '#f2e0cc' : '#c4b297',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontFamily: 'Bowlby One SC, sans-serif',
    }}>{done ? '✓' : n}</span>
    {label}
  </div>
);

const FormField = ({ label, children, hint }) => (
  <div>
    <div style={{
      fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.22em',
      color: '#c4b297', textTransform: 'uppercase', marginBottom: 8,
    }}>{label}</div>
    {children}
    {hint && (
      <div style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#8faf8a',
        marginTop: 6,
      }}>{hint}</div>
    )}
  </div>
);

const inputStyle = {
  width: '100%',
  fontFamily: 'Montserrat, sans-serif', fontSize: 14,
  padding: '14px 16px', borderRadius: 12,
  background: '#0f1a14', color: '#f2e0cc',
  border: '1px solid #c4b29733',
  outline: 'none',
  transition: 'all .25s ease',
};

const StepDatos = ({ data, setData, totals }) => {
  const { formatPEN } = window.Money;
  const setField = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 28,
          color: '#f2e0cc', margin: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ color: '#8faf8a' }}>📦</span> ¿A dónde lo enviamos?
        </h3>
      </div>

      <FormField label="Departamento">
        <select value={data.departamento} onChange={setField('departamento')} style={inputStyle}>
          {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </FormField>

      <FormField label="Distrito">
        <select value={data.distrito} onChange={setField('distrito')} style={inputStyle}>
          {DISTRITOS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </FormField>

      <FormField label="Dirección">
        <input value={data.direccion} onChange={setField('direccion')} placeholder="Av. ej. 350 5th Ave"
          style={inputStyle} />
      </FormField>

      <FormField label="Referencia (opcional)">
        <textarea value={data.referencia} onChange={setField('referencia')}
          placeholder="Punto de referencia / indicaciones"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
      </FormField>

      <FormField label="Nombre y teléfono">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input value={data.nombre} onChange={setField('nombre')} placeholder="Tu nombre completo" style={inputStyle} />
          <input value={data.telefono} onChange={setField('telefono')} placeholder="999 999 999" style={inputStyle} />
        </div>
      </FormField>

      {/* Shipping zone selector */}
      <FormField label="Zona de envío">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(window.SHIPPING_RULES).map(([k, r]) => (
            <label key={k} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
              background: data.zone === k ? '#c96e4b22' : '#0f1a14',
              border: `1px solid ${data.zone === k ? '#c96e4b' : '#c4b29722'}`,
              transition: 'all .25s ease',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="radio" name="zone" value={k} checked={data.zone === k}
                  onChange={() => setData((d) => ({ ...d, zone: k }))}
                  style={{ accentColor: '#c96e4b' }} />
                <span>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#f2e0cc' }}>{r.label}</div>
                  {r.freeThresholdCents > 0 && (
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', marginTop: 2 }}>
                      Envío gratis desde {formatPEN(r.freeThresholdCents)}
                    </div>
                  )}
                </span>
              </span>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 20, color: '#f2e0cc' }}>
                {r.flatCents === 0 ? 'Gratis' : formatPEN(r.flatCents)}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      {totals.isFreeShipping && totals.shippingFlat > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: '#8faf8a22', border: '1px solid #8faf8a66',
          fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc',
          textAlign: 'center',
        }}>
          🎉 ¡Envío gratis aplicado! Ya pasaste {formatPEN(totals.freeThresholdCents)}
        </div>
      )}
      {!totals.isFreeShipping && totals.remainingForFreeCents > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: '#c4b29722', border: '1px solid #c4b29766',
          fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc',
          textAlign: 'center',
        }}>
          Te faltan <strong>{formatPEN(totals.remainingForFreeCents)}</strong> para envío gratis.
        </div>
      )}

      <label style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px', borderRadius: 14,
        background: '#0f1a14', border: '1px solid #c4b29722',
        cursor: 'pointer',
      }}>
        <input type="checkbox" checked={data.acepta} onChange={(e) => setData((d) => ({ ...d, acepta: e.target.checked }))}
          style={{ accentColor: '#8faf8a', width: 18, height: 18 }} />
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>
          Acepto las <a href="#" style={{ color: '#c96e4b', textDecoration: 'underline' }}>políticas de compra, privacidad y entrega</a>.
        </span>
      </label>
    </div>
  );
};

const StepPago = ({ data, items, totals, onSubmit, status }) => {
  const { formatPEN } = window.Money;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* summary table */}
      <div style={{
        background: '#0f1a14',
        border: '1px solid #c4b29722',
        borderRadius: 18,
        padding: 24,
      }}>
        <div style={{
          fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em',
          color: '#8faf8a', textTransform: 'uppercase', marginBottom: 18,
        }}>📋 Resumen de tu pedido</div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', gap: 12,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
          color: '#c4b29799', textTransform: 'uppercase', paddingBottom: 12,
          borderBottom: '1px solid #f2e0cc18',
        }}>
          <span>Producto</span><span style={{ textAlign: 'right' }}>c/u</span>
          <span style={{ textAlign: 'right' }}>cant.</span><span style={{ textAlign: 'right' }}>total</span>
        </div>

        {items.map((it) => (
          <div key={it.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', gap: 12,
            padding: '12px 0', borderBottom: '1px solid #f2e0cc14', alignItems: 'baseline',
          }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>
              {it.name} <span style={{ color: '#c4b297' }}>({it.weight} · {it.grind})</span>
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>{formatPEN(it.unitCents)}</span>
            <span style={{ textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>{it.qty}</span>
            <span style={{ textAlign: 'right', fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: '#f2e0cc' }}>{formatPEN(it.unitCents * it.qty)}</span>
          </div>
        ))}

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Row k="Subtotal" v={formatPEN(totals.subtotalCents)} />
          {totals.discountCents > 0 && <Row k="Descuento" v={'– ' + formatPEN(totals.discountCents)} accent="#8faf8a" />}
          <Row k={totals.shippingLabel} v={totals.isFreeShipping ? 'Gratis' : formatPEN(totals.shippingCents)}
            strike={totals.isFreeShipping ? formatPEN(totals.shippingFlat) : null}
            accent={totals.isFreeShipping ? '#8faf8a' : null} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            paddingTop: 14, borderTop: '1px solid #f2e0cc22', marginTop: 6,
          }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 22, color: '#f2e0cc' }}>Total</span>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 32, color: '#c96e4b' }}>{formatPEN(totals.totalCents)}</span>
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
            color: '#8faf8a', marginTop: 4,
          }}>42% al caficultor: {formatPEN(totals.producerShareCents)}</div>
        </div>
      </div>

      {/* fast pay */}
      <div style={{
        padding: 24, borderRadius: 18,
        background: 'linear-gradient(180deg, #c96e4b14 0%, #1f302800 100%)',
        border: '1px solid #c96e4b44',
      }}>
        <div style={{
          fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em',
          color: '#c96e4b', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16,
        }}>⚡ Paga rápido con</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <span style={{
            background: '#742280', color: '#f2e0cc',
            padding: '14px 32px', borderRadius: 12,
            fontFamily: 'Montserrat, sans-serif', fontSize: 18, fontWeight: 800,
            letterSpacing: '0.02em',
          }}>yape</span>
          <span style={{ color: '#c4b297', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>o</span>
          <span style={{
            background: '#0bb4d9', color: '#f2e0cc',
            padding: '14px 32px', borderRadius: 12,
            fontFamily: 'Montserrat, sans-serif', fontSize: 18, fontWeight: 800,
            letterSpacing: '0.02em',
          }}>plin</span>
        </div>
        <button onClick={() => onSubmit('yapePlin')} disabled={status === 'paying'} style={{
          width: '100%', padding: '18px',
          background: '#8faf8a', color: '#1f3028',
          border: 'none', borderRadius: 14, cursor: status === 'paying' ? 'not-allowed' : 'pointer',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <span>💬</span> {status === 'paying' ? 'Procesando…' : 'Pagar con Yape / Plin'}
        </button>
        <div style={{
          textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 11,
          color: '#c4b29799', marginTop: 10,
        }}>Te contactamos por WhatsApp · Pedido #428</div>
      </div>
    </div>
  );
};

const Row = ({ k, v, accent, strike }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297' }}>{k}</span>
    <span style={{
      fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600,
      color: accent || '#f2e0cc',
    }}>
      {strike && <span style={{ textDecoration: 'line-through', color: '#c4b29766', marginRight: 8, fontSize: 14 }}>{strike}</span>}
      {v}
    </span>
  </div>
);

const Checkout = () => {
  const isOpen = window.useCart((s) => s.isCheckoutOpen);
  const step = window.useCart((s) => s.checkoutStep);
  const items = window.useCart((s) => s.items);
  const closeCheckout = window.cartStore.getState().closeCheckout;
  const setCheckoutStep = window.cartStore.getState().setCheckoutStep;
  const clear = window.cartStore.getState().clear;

  const [data, setData] = React.useState({
    departamento: 'Lima Metropolitana',
    distrito: 'San Borja',
    direccion: '',
    referencia: '',
    nombre: '',
    telefono: '',
    zone: 'lima',
    acepta: false,
  });
  const [status, setStatus] = React.useState('idle'); // idle | paying | done
  const [orderId, setOrderId] = React.useState(null);

  const totals = window.useCartTotals(data.zone);
  const { formatPEN } = window.Money;

  const canContinue = data.direccion.trim().length > 3
    && data.nombre.trim().length > 1
    && data.telefono.trim().length >= 7
    && data.acepta;

  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const submitPayment = async (adapter) => {
    setStatus('paying');
    const res = await window.checkout.startCheckout({
      adapter,
      cart: { items },
      shipping: data,
      totals,
    });
    if (res.ok) {
      setOrderId(res.orderId);
      setStatus('done');
    } else {
      setStatus('idle');
      alert('Hubo un problema: ' + (res.error || 'desconocido'));
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: '#0a1410cc', backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      overflowY: 'auto', padding: '40px 16px',
    }} onClick={closeCheckout}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(720px, 100%)',
        background: '#1f3028',
        color: '#f2e0cc',
        borderRadius: 24,
        border: '1px solid #c96e4b33',
        boxShadow: '0 60px 120px -40px #000000ee',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #f2e0cc18',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 32,
              color: '#f2e0cc', margin: 0, lineHeight: 1.05,
            }}>
              Checkout — <span style={{ color: '#c96e4b', fontStyle: 'italic' }}>Selección</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <StepPill active={step === 'datos'} done={step === 'pago'} n="1" label="👤 Datos" />
              <span style={{ color: '#c4b29766' }}>—</span>
              <StepPill active={step === 'pago'} done={false} n="2" label="💳 Pago" />
            </div>
          </div>
          <button onClick={closeCheckout} style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500,
            color: '#c4b297', background: 'transparent',
            border: '1px solid #c4b29744', borderRadius: 999,
            padding: '10px 18px', cursor: 'pointer', letterSpacing: '0.04em',
          }}>Cerrar ✕</button>
        </div>

        {/* cycle banner */}
        <div style={{ padding: '20px 32px 0' }}>
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: '#c96e4b22', border: '1px solid #c96e4b66',
            fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc',
            lineHeight: 1.5,
          }}>
            <strong style={{ color: '#c96e4b' }}>☕ Selección · tostamos solo lo que se vende.</strong>
            <br />
            <span style={{ color: '#c4b297' }}>Cierre: <strong style={{ color: '#f2e0cc' }}>31 may.</strong> · Entrega Lima desde <strong style={{ color: '#f2e0cc' }}>ago. (1a semana)</strong> · Nacional desde <strong style={{ color: '#f2e0cc' }}>ago. (2a semana)</strong></span>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: '24px 32px 32px' }}>
          {status === 'done' ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: '#8faf8a', margin: '0 auto 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, serif', fontSize: 48, color: '#1f3028',
              }}>✓</div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 38,
                color: '#f2e0cc', margin: 0,
              }}>¡Reservado!</h3>
              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297',
                marginTop: 14, maxWidth: 420, marginInline: 'auto', lineHeight: 1.6,
              }}>
                Pedido <strong style={{ color: '#f2e0cc' }}>#{orderId}</strong> registrado.
                Te escribimos por WhatsApp para confirmar el tueste y la entrega.
              </p>
              <button onClick={() => { clear(); closeCheckout(); }} style={{
                marginTop: 28, padding: '14px 28px',
                background: '#c96e4b', color: '#1f3028',
                border: 'none', borderRadius: 999, cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>Listo</button>
            </div>
          ) : step === 'datos' ? (
            <StepDatos data={data} setData={setData} totals={totals} />
          ) : (
            <StepPago data={data} items={items} totals={totals} onSubmit={submitPayment} status={status} />
          )}
        </div>

        {/* footer */}
        {status !== 'done' && (
          <div style={{
            padding: '20px 32px',
            borderTop: '1px solid #f2e0cc18',
            background: '#182520',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <button
              onClick={() => step === 'pago' ? setCheckoutStep('datos') : closeCheckout()}
              style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500,
                color: '#c4b297', background: 'transparent',
                border: '1px solid #c4b29744', borderRadius: 999,
                padding: '12px 20px', cursor: 'pointer', letterSpacing: '0.04em',
              }}>
              ← {step === 'pago' ? 'Volver a datos' : 'Volver'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#8faf8a',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>💬 ¿Dudas?</span>
              {step === 'datos' && (
                <button onClick={() => setCheckoutStep('pago')} disabled={!canContinue} style={{
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: '#1f3028',
                  background: canContinue ? 'linear-gradient(135deg, #c96e4b 0%, #d68863 100%)' : '#c4b29766',
                  padding: '14px 28px', borderRadius: 999, border: 'none',
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}>Ir a pagar →</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.Checkout = Checkout;
