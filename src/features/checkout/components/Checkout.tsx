import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Money } from '@/shared/money';
import type { AdapterName, ShippingData } from '@/shared/types/checkout';
import type { CartItem } from '@/shared/types/cart';
import type { CartTotals } from '@/shared/types/cart';
import {
  useCartIsCheckoutOpen, useCartCheckoutStep, useCartActions, useCartItems,
} from '@/features/cart/useCart';
import { SHIPPING_RULES } from '@/features/cart/shippingRules';
import { useCheckout } from '../useCheckout';
import { useActiveCycle } from '@/features/catalog/useActiveCycle';

const DEPARTAMENTOS = [
  'Lima Metropolitana', 'Lima provincias', 'Arequipa', 'Cusco',
  'La Libertad', 'Piura', 'Junín', 'Otro',
];
const DISTRITOS = [
  'Miraflores', 'Barranco', 'San Isidro', 'San Borja', 'Surco',
  'Magdalena', 'Pueblo Libre', 'Lince', 'Otro',
];

const inputStyle: React.CSSProperties = {
  width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: 14,
  padding: '14px 16px', borderRadius: 12,
  background: '#0f1a14', color: '#f2e0cc',
  border: '1px solid #c4b29733', outline: 'none',
  transition: 'all .25s ease', boxSizing: 'border-box',
};

function StepPill({ active, done, n, label }: { active: boolean; done: boolean; n: string; label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 999,
      background: active ? '#c96e4b' : (done ? '#8faf8a' : '#f2e0cc11'),
      color: active || done ? '#1f3028' : '#c4b297',
      fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
      border: `1px solid ${active ? '#c96e4b' : (done ? '#8faf8a' : '#c4b29733')}`,
      transition: 'all .3s ease',
    }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', background: active || done ? '#1f3028' : '#c4b29733', color: active || done ? '#f2e0cc' : '#c4b297', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'Bowlby One SC, sans-serif' }}>
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.22em', color: '#c4b297', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#8faf8a', marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function Row({ k, v, accent, strike }: { k: string; v: string; accent?: string | null; strike?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297' }}>{k}</span>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: accent ?? '#f2e0cc' }}>
        {strike && <span style={{ textDecoration: 'line-through', color: '#c4b29766', marginRight: 8, fontSize: 14 }}>{strike}</span>}
        {v}
      </span>
    </div>
  );
}

function StepDatos({ data, setData, totals }: { data: ShippingData; setData: React.Dispatch<React.SetStateAction<ShippingData>>; totals: CartTotals }) {
  const setField = (k: keyof ShippingData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 28, color: '#f2e0cc', margin: 0 }}>
        <span style={{ color: '#8faf8a' }}>📦</span> ¿A dónde lo enviamos?
      </h3>

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
        <input value={data.direccion} onChange={setField('direccion')} placeholder="Av. ej. 350 5th Ave" style={inputStyle} />
      </FormField>

      <FormField label="Referencia (opcional)">
        <textarea value={data.referencia} onChange={setField('referencia')} placeholder="Punto de referencia / indicaciones" rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
      </FormField>

      <FormField label="Nombre y teléfono">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input value={data.nombre} onChange={setField('nombre')} placeholder="Tu nombre completo" style={inputStyle} />
          <input value={data.telefono} onChange={setField('telefono')} placeholder="999 999 999" style={inputStyle} />
        </div>
      </FormField>

      <FormField label="Zona de envío">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.entries(SHIPPING_RULES) as [string, typeof SHIPPING_RULES[keyof typeof SHIPPING_RULES]][]).map(([k, r]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, cursor: 'pointer', background: data.zone === k ? '#c96e4b22' : '#0f1a14', border: `1px solid ${data.zone === k ? '#c96e4b' : '#c4b29722'}`, transition: 'all .25s ease' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="radio" name="zone" value={k} checked={data.zone === k} onChange={() => setData((d) => ({ ...d, zone: k as ShippingData['zone'] }))} style={{ accentColor: '#c96e4b' }} />
                <span>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, fontWeight: 600, color: '#f2e0cc' }}>{r.label}</div>
                  {r.freeThresholdCents > 0 && (
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', marginTop: 2 }}>
                      Envío gratis desde {Money.formatPEN(r.freeThresholdCents)}
                    </div>
                  )}
                </span>
              </span>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 20, color: '#f2e0cc' }}>
                {r.flatCents === 0 ? 'Gratis' : Money.formatPEN(r.flatCents)}
              </span>
            </label>
          ))}
        </div>
      </FormField>

      {totals.isFreeShipping && totals.shippingFlat > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 14, background: '#8faf8a22', border: '1px solid #8faf8a66', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', textAlign: 'center' }}>
          🎉 ¡Envío gratis aplicado! Ya pasaste {Money.formatPEN(totals.freeThresholdCents)}
        </div>
      )}
      {!totals.isFreeShipping && totals.remainingForFreeCents > 0 && (
        <div style={{ padding: '14px 18px', borderRadius: 14, background: '#c4b29722', border: '1px solid #c4b29766', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', textAlign: 'center' }}>
          Te faltan <strong>{Money.formatPEN(totals.remainingForFreeCents)}</strong> para envío gratis.
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, background: '#0f1a14', border: '1px solid #c4b29722', cursor: 'pointer' }}>
        <input type="checkbox" checked={data.acepta} onChange={(e) => setData((d) => ({ ...d, acepta: e.target.checked }))} style={{ accentColor: '#8faf8a', width: 18, height: 18 }} />
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>
          Acepto las <a href="#" style={{ color: '#c96e4b', textDecoration: 'underline' }}>políticas de compra, privacidad y entrega</a>.
        </span>
      </label>
    </div>
  );
}

function HowToPayAccordion({ method, totalFormatted }: { method: 'yape' | 'plin'; totalFormatted: string }) {
  const [open, setOpen] = useState(false);
  const steps = method === 'yape'
    ? [
        'Abre la app de Yape',
        'Toca el ícono QR (escanear)',
        'Apunta la cámara a este código',
        `Confirma el monto: ${totalFormatted}`,
      ]
    : [
        'Abre tu app de BCP, Interbank, BBVA o Scotiabank',
        'Ingresa a Plin → Pagar con QR',
        `Escanea el código o ingresa el número: 917-959-370`,
        `Confirma el monto: ${totalFormatted}`,
      ];
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: 'transparent', border: 'none', color: '#8faf8a', fontFamily: 'Montserrat, sans-serif', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0 }}>
        <span style={{ display: 'inline-block', transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'none', fontSize: 9 }}>▶</span>
        ¿Cómo pago con {method === 'yape' ? 'Yape' : 'Plin'}?
      </button>
      {open && (
        <ol style={{ margin: '10px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b297', lineHeight: 1.5 }}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ValidationTimer({ totalSeconds = 120 }: { totalSeconds?: number }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const pct = (remaining / totalSeconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const expired = remaining === 0;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799' }}>Tiempo de verificación</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: expired ? '#c96e4b' : '#f2e0cc', fontWeight: 600 }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: '#f2e0cc1a', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: expired ? '#c96e4b' : '#8faf8a', transition: 'width 1s linear, background .5s ease' }} />
      </div>
      {expired && (
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', textAlign: 'center', marginTop: 4 }}>
          ¿Demora más de lo esperado?{' '}
          <a href="https://api.whatsapp.com/send/?phone=51917959370&text=Hola%2C+realic%C3%A9+un+pago+y+no+recib%C3%AD+confirmaci%C3%B3n" target="_blank" rel="noopener noreferrer" style={{ color: '#8faf8a', textDecoration: 'underline' }}>
            Escríbenos por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

function SpinnerKeyframes() {
  useEffect(() => {
    if (document.getElementById('tw-spinner-kf')) return;
    const s = document.createElement('style');
    s.id = 'tw-spinner-kf';
    s.textContent = '@keyframes tw-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }, []);
  return null;
}

type PaymentPhase = 'select' | 'qr' | 'validating' | 'failed';

function StepPago({ items, totals, onSubmit, status }: { items: CartItem[]; totals: CartTotals; onSubmit: (a: AdapterName) => void; status: string }) {
  const [selectedMethod, setSelectedMethod] = useState<'yape' | 'plin' | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>('select');
  const [comprobante, setComprobante] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'validating' && status === 'idle') setPhase('failed');
  }, [status, phase]);

  const selectMethod = (m: 'yape' | 'plin') => {
    setSelectedMethod(m);
    setPhase('qr');
  };

  const handlePaid = () => {
    setPhase('validating');
    onSubmit('yapePlin');
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-tunay-wasi-${selectedMethod ?? 'pago'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodBtnStyle = (m: 'yape' | 'plin'): React.CSSProperties => {
    const active = selectedMethod === m && phase !== 'select';
    return {
      background: m === 'yape' ? '#742280' : '#0bb4d9',
      color: '#f2e0cc',
      padding: '14px 32px',
      borderRadius: 12,
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 18,
      fontWeight: 800,
      border: active ? '2px solid #c4b297' : '2px solid transparent',
      boxShadow: active ? '0 0 0 3px #c4b29733' : 'none',
      cursor: phase === 'validating' ? 'default' : 'pointer',
      outline: 'none',
      transition: 'all .2s ease',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#0f1a14', border: '1px solid #c4b29722', borderRadius: 18, padding: 24 }}>
        <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em', color: '#8faf8a', textTransform: 'uppercase', marginBottom: 18 }}>📋 Resumen de tu pedido</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', gap: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#c4b29799', textTransform: 'uppercase', paddingBottom: 12, borderBottom: '1px solid #f2e0cc18' }}>
          <span>Producto</span>
          <span style={{ textAlign: 'right' }}>c/u</span>
          <span style={{ textAlign: 'right' }}>cant.</span>
          <span style={{ textAlign: 'right' }}>total</span>
        </div>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 0.6fr 0.8fr', gap: 12, padding: '12px 0', borderBottom: '1px solid #f2e0cc14', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>
              {it.name} <span style={{ color: '#c4b297' }}>({it.weight} · {it.grind})</span>
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>{Money.formatPEN(it.unitCents)}</span>
            <span style={{ textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc' }}>{it.qty}</span>
            <span style={{ textAlign: 'right', fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: '#f2e0cc' }}>{Money.formatPEN(it.unitCents * it.qty)}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Row k="Subtotal" v={Money.formatPEN(totals.subtotalCents)} />
          {totals.discountCents > 0 && <Row k="Descuento" v={'– ' + Money.formatPEN(totals.discountCents)} accent="#8faf8a" />}
          <Row k={totals.shippingLabel} v={totals.isFreeShipping ? 'Gratis' : Money.formatPEN(totals.shippingCents)} strike={totals.isFreeShipping ? Money.formatPEN(totals.shippingFlat) : null} accent={totals.isFreeShipping ? '#8faf8a' : null} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 14, borderTop: '1px solid #f2e0cc22', marginTop: 6 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 22, color: '#f2e0cc' }}>Total</span>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 32, color: '#c96e4b' }}>{Money.formatPEN(totals.totalCents)}</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#8faf8a', marginTop: 4 }}>
            42% al caficultor: {Money.formatPEN(totals.producerShareCents)}
          </div>
        </div>
      </div>

      {phase === 'failed' ? (
        <div style={{ padding: 28, borderRadius: 18, background: '#c4b29709', border: '2px solid #c4b29755', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#c4b29722', border: '2px solid #c4b297', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>⚠️</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 22, color: '#f2e0cc' }}>No detectamos tu pago automáticamente</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297', lineHeight: 1.6, maxWidth: 340 }}>
            Si ya realizaste la transferencia por Yape o Plin, adjunta tu comprobante aquí.
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setComprobante(f.name); }} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 28px', borderRadius: 14, background: '#0f1a14', border: '2px dashed #c4b29766', color: '#f2e0cc', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
            📎 {comprobante ? `✓ ${comprobante}` : 'Subir captura de comprobante'}
          </button>
          {comprobante && (
            <button style={{ padding: '14px 32px', borderRadius: 999, background: '#8faf8a', color: '#1f3028', border: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Enviar comprobante
            </button>
          )}
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', lineHeight: 1.6 }}>
            Validaremos manualmente y te confirmaremos por WhatsApp en breve
          </div>
          <button onClick={() => { setPhase('select'); setSelectedMethod(null); setComprobante(null); }} style={{ background: 'transparent', border: 'none', color: '#8faf8a', fontFamily: 'Montserrat, sans-serif', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Intentar de nuevo
          </button>
        </div>
      ) : (
        <div style={{ padding: 24, borderRadius: 18, background: 'linear-gradient(180deg, #c96e4b14 0%, #1f302800 100%)', border: '1px solid #c96e4b44' }}>
          <SpinnerKeyframes />
          <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.22em', color: '#c96e4b', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 }}>⚡ Paga rápido con</div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <button onClick={() => phase !== 'validating' && selectMethod('yape')} style={methodBtnStyle('yape')}>yape</button>
            <span style={{ color: '#c4b297', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>o</span>
            <button onClick={() => phase !== 'validating' && selectMethod('plin')} style={methodBtnStyle('plin')}>plin</button>
          </div>

          {phase === 'select' && (
            <div style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b29799', marginBottom: 12 }}>
              Selecciona tu método de pago para ver el QR
            </div>
          )}

          {phase === 'qr' && selectedMethod && (
            <>
              <div style={{ background: '#0f1a14', borderRadius: 16, padding: 20, display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  <div ref={qrRef} style={{ borderRadius: 8, overflow: 'hidden', lineHeight: 0 }}>
                    <QRCodeSVG
                      value={`917959370`}
                      size={140}
                      fgColor="#1f3028"
                      bgColor="#ffffff"
                      level="M"
                    />
                  </div>
                  <button onClick={downloadQR} style={{ marginTop: 10, width: 140, padding: '8px 0', borderRadius: 8, background: 'transparent', border: '1px solid #c4b29744', color: '#c4b297', fontFamily: 'Montserrat, sans-serif', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    ⬇ Descargar QR
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', paddingTop: 8 }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', lineHeight: 1.6 }}>
                    Escanea el QR desde tu app de{' '}
                    <strong style={{ color: selectedMethod === 'yape' ? '#c084fc' : '#38bdf8' }}>{selectedMethod}</strong>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#c4b297', letterSpacing: '0.08em' }}>
                    📱 917-959-370
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', marginBottom: 2 }}>Total a pagar</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: '#c96e4b' }}>{Money.formatPEN(totals.totalCents)}</div>
                  </div>
                  <HowToPayAccordion method={selectedMethod} totalFormatted={Money.formatPEN(totals.totalCents)} />
                </div>
              </div>
              <button onClick={handlePaid} style={{ width: '100%', padding: 16, background: selectedMethod === 'yape' ? '#742280' : '#0bb4d9', color: '#f2e0cc', border: 'none', borderRadius: 14, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                ✓ Confirmé el pago de {Money.formatPEN(totals.totalCents)}
              </button>
            </>
          )}

          {phase === 'validating' && (
            <div style={{ background: '#0f1a14', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, border: '4px solid #f2e0cc1a', borderTopColor: '#c96e4b', borderRadius: '50%', animation: 'tw-spin 1s linear infinite' }} />
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', lineHeight: 1.7 }}>
                <strong>Verificando tu pago…</strong><br />
                por favor, no cierres esta ventana
              </div>
              <ValidationTimer totalSeconds={120} />
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', lineHeight: 1.6 }}>
                Te enviaremos la confirmación por WhatsApp<br />en cuanto el pago sea validado
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', marginTop: 4 }}>
            Te contactamos por WhatsApp · Coordinamos entrega
          </div>
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  const isOpen = useCartIsCheckoutOpen();
  const step = useCartCheckoutStep();
  const { closeCheckout, setCheckoutStep } = useCartActions();
  const items = useCartItems();
  const { data, setData, status, orderId, totals, canContinue, submitPayment, reset } = useCheckout();
  const { data: cycle } = useActiveCycle();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 110, background: '#0a1410cc', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '40px 16px' }}
      onClick={closeCheckout}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px, 100%)', background: '#1f3028', color: '#f2e0cc', borderRadius: 24, border: '1px solid #c96e4b33', boxShadow: '0 60px 120px -40px #000000ee', overflow: 'hidden', position: 'relative' }}>

        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f2e0cc18', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 32, color: '#f2e0cc', margin: 0, lineHeight: 1.05 }}>
              Checkout — <span style={{ color: '#c96e4b', fontStyle: 'italic' }}>Selección</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <StepPill active={step === 'datos'} done={step === 'pago'} n="1" label="👤 Datos" />
              <span style={{ color: '#c4b29766' }}>—</span>
              <StepPill active={step === 'pago'} done={false} n="2" label="💳 Pago" />
            </div>
          </div>
          <button onClick={closeCheckout} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, color: '#c4b297', background: 'transparent', border: '1px solid #c4b29744', borderRadius: 999, padding: '10px 18px', cursor: 'pointer', letterSpacing: '0.04em' }}>Cerrar ✕</button>
        </div>

        <div style={{ padding: '20px 32px 0' }}>
          <div style={{ padding: '14px 18px', borderRadius: 14, background: '#c96e4b22', border: '1px solid #c96e4b66', fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', lineHeight: 1.5 }}>
            <strong style={{ color: '#c96e4b' }}>☕ Selección · tostamos solo lo que se vende.</strong><br />
            {cycle ? (
              <span style={{ color: '#c4b297' }}>Cierre: <strong style={{ color: '#f2e0cc' }}>{cycle.closeAt}</strong> · Entrega Lima desde <strong style={{ color: '#f2e0cc' }}>{cycle.deliverLima}</strong> · Nacional desde <strong style={{ color: '#f2e0cc' }}>{cycle.deliverProv}</strong></span>
            ) : (
              <span style={{ color: '#c4b297' }}>Cierre: <strong style={{ color: '#f2e0cc' }}>31 may.</strong> · Entrega Lima desde <strong style={{ color: '#f2e0cc' }}>ago. (1a semana)</strong> · Nacional desde <strong style={{ color: '#f2e0cc' }}>ago. (2a semana)</strong></span>
            )}
          </div>
        </div>

        <div style={{ padding: '24px 32px 32px' }}>
          {status === 'done' ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#8faf8a', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 48, color: '#1f3028' }}>✓</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 38, color: '#f2e0cc', margin: 0 }}>¡Pedido recibido!</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297', marginTop: 14, maxWidth: 420, marginInline: 'auto', lineHeight: 1.6 }}>
                Pedido <strong style={{ color: '#f2e0cc' }}>#{orderId}</strong> registrado. Verificaremos tu pago y te confirmaremos por WhatsApp en cuanto esté aprobado.
              </p>
              <button onClick={reset} style={{ marginTop: 28, padding: '14px 28px', background: '#c96e4b', color: '#1f3028', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Listo</button>
            </div>
          ) : step === 'datos' ? (
            <StepDatos data={data} setData={setData} totals={totals} />
          ) : (
            <StepPago items={items} totals={totals} onSubmit={submitPayment} status={status} />
          )}
        </div>

        {status !== 'done' && (
          <div style={{ padding: '20px 32px', borderTop: '1px solid #f2e0cc18', background: '#182520', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <button onClick={() => step === 'pago' ? setCheckoutStep('datos') : closeCheckout()} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 500, color: '#c4b297', background: 'transparent', border: '1px solid #c4b29744', borderRadius: 999, padding: '12px 20px', cursor: 'pointer', letterSpacing: '0.04em' }}>
              ← {step === 'pago' ? 'Volver a datos' : 'Volver'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <a href="https://api.whatsapp.com/send/?phone=51917959370&text=Hola%2C+tengo+dudas+sobre+Tunay+Wasi&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#8faf8a', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>💬 ¿Dudas?</a>
              {step === 'datos' && (
                <button onClick={() => setCheckoutStep('pago')} disabled={!canContinue} style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1f3028', background: canContinue ? 'linear-gradient(135deg, #c96e4b 0%, #d68863 100%)' : '#c4b29766', padding: '14px 28px', borderRadius: 999, border: 'none', cursor: canContinue ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  Ir a pagar →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
