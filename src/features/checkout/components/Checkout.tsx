import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Money } from '@/shared/money';
import type { AdapterName, ShippingData, ShippingZone } from '@/shared/types/checkout';
import type { CartItem } from '@/shared/types/cart';
import type { CartTotals } from '@/shared/types/cart';
import {
  useCartIsCheckoutOpen, useCartCheckoutStep, useCartActions, useCartItems,
} from '@/features/cart/useCart';
import { useCheckout, isValidPeruvianPhone } from '../useCheckout';
import { useActiveCycle } from '@/features/catalog/useActiveCycle';
import { useShipping } from '@/features/catalog/useShipping';
import { useYapePlin } from '@/features/catalog/useYapePlin';
import type { ShippingZoneRule, YapePlinData } from '@/features/catalog/catalogService';
import ubigeo from '@/data/peru-ubigeo.json';

// ── Ubigeo helpers ───────────────────────────────────────────────────────────

type Ubigeo = Record<string, Record<string, string[]>>;
const GEO = ubigeo as Ubigeo;
const DEPARTAMENTOS = Object.keys(GEO);

function getProvincias(dep: string): string[] {
  return Object.keys(GEO[dep] ?? {});
}
function getDistritos(dep: string, prov: string): string[] {
  return GEO[dep]?.[prov] ?? ['Otro'];
}

const LIMA_OLVA_DISTRICTS = new Set([
  'Carabayllo', 'Chaclacayo', 'Cieneguilla', 'Lurigancho', 'Lurín',
  'Pachacamac', 'Puente Piedra', 'Santa María del Mar', 'Santa Rosa',
  'San Juan de Lurigancho',
]);

function inferZone(dep: string, _prov: string, dist = ''): Exclude<ShippingZone, 'recojo'> {
  if (dep === 'Callao') return 'limaExt';
  if (dep === 'Lima Metropolitana') return LIMA_OLVA_DISTRICTS.has(dist) ? 'limaExt' : 'lima';
  if (dep === 'Lima Provincia') return 'limaExt';
  return 'provincia';
}

// ── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: 13,
  padding: '9px 12px', borderRadius: 10,
  background: '#0f1a14', color: '#f2e0cc',
  border: '1px solid #c4b29733', outline: 'none',
  transition: 'all .25s ease', boxSizing: 'border-box',
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1px solid #c96e4b99',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StepPill({ active, done, n, label }: { active: boolean; done: boolean; n: string; label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 999,
      background: active ? '#c96e4b' : (done ? '#8faf8a' : '#f2e0cc11'),
      color: active || done ? '#1f3028' : '#c4b297',
      fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      border: `1px solid ${active ? '#c96e4b' : (done ? '#8faf8a' : '#c4b29733')}`,
      transition: 'all .3s ease',
    }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: active || done ? '#1f3028' : '#c4b29733', color: active || done ? '#f2e0cc' : '#c4b297', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'Bowlby One SC, sans-serif' }}>
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  );
}

function FormField({ label, children, hint, error }: { label: string; children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: error ? '#c96e4b' : '#c4b297', textTransform: 'uppercase', marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {error && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: '#c96e4b', fontWeight: 400 }}>{error}</span>}
      </div>
      {children}
      {hint && !error && <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#8faf8a', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Row({ k, v, accent, strike }: { k: string; v: string; accent?: string | null; strike?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b297' }}>{k}</span>
      <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: accent ?? '#f2e0cc' }}>
        {strike && <span style={{ textDecoration: 'line-through', color: '#c4b29766', marginRight: 6, fontSize: 13 }}>{strike}</span>}
        {v}
      </span>
    </div>
  );
}

// ── Step Datos ───────────────────────────────────────────────────────────────

function ShippingSummaryCard({
  zone, totals, shippingZones,
}: {
  zone: ShippingZone;
  totals: CartTotals;
  shippingZones: ShippingZoneRule[];
}) {
  const rule = shippingZones.find(z => z.key === zone);
  const carrier = rule?.carrier;
  const transitDays = rule?.transitDays;
  const headerLabel = carrier
    ? `${carrier}${transitDays ? ` · ${transitDays} días hábiles` : ''}`
    : 'Delivery a domicilio';
  const costLabel = zone === 'recojo' || totals.isFreeShipping
    ? 'Gratis'
    : Money.formatPEN(totals.shippingCents);
  return (
    <div style={{ borderRadius: 10, background: '#0f1a14', border: '1px solid #c4b29733', padding: '10px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b297' }}>{headerLabel}</div>
          {rule && rule.freeThresholdCents > 0 && zone !== 'recojo' && (
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799', marginTop: 2 }}>
              Envío gratis desde {Money.formatPEN(rule.freeThresholdCents)}
            </div>
          )}
          {!totals.isFreeShipping && totals.remainingForFreeCents > 0 && zone !== 'recojo' && (
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c96e4b', marginTop: 2 }}>
              Agrega {Money.formatPENShort(totals.remainingForFreeCents)} más y el envío es gratis
            </div>
          )}
          {totals.isFreeShipping && (
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#8faf8a', marginTop: 2 }}>
              🎉 ¡Envío gratis!
            </div>
          )}
        </div>
        <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 20, color: totals.isFreeShipping || zone === 'recojo' ? '#8faf8a' : '#f2e0cc', whiteSpace: 'nowrap' }}>
          {costLabel}
        </span>
      </div>
    </div>
  );
}

function FreeShippingBanner({ totals }: { totals: CartTotals }) {
  if (totals.isFreeShipping || totals.remainingForFreeCents <= 0 || totals.freeThresholdCents <= 0) return null;
  const pct = Math.min(100, (totals.subtotalCents / totals.freeThresholdCents) * 100);
  return (
    <div style={{ borderRadius: 10, background: '#0f1a14', border: '1px solid #c4b29733', padding: '10px 14px', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#f2e0cc', marginBottom: 8 }}>
        Agrega <strong>{Money.formatPENShort(totals.remainingForFreeCents)}</strong> más y el envío es{' '}
        <span style={{ color: '#8faf8a', fontWeight: 600 }}>gratis</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: '#f2e0cc1a', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #c96e4b 0%, #8faf8a 100%)', borderRadius: 99, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

function StepDatos({
  data, setData, totals, shippingZones,
}: {
  data: ShippingData;
  setData: React.Dispatch<React.SetStateAction<ShippingData>>;
  totals: CartTotals;
  shippingZones: ShippingZoneRule[];
}) {
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [dniBlurred, setDniBlurred] = useState(false);
  const phoneError = phoneBlurred && !isValidPeruvianPhone(data.telefono);
  const dniError = dniBlurred && data.dni.replace(/\D/g, '').length < 8;

  const isOlvaZone = data.zone === 'limaExt' || data.zone === 'provincia';
  const isNationalZone = data.zone === 'provincia';

  const olvaRule = shippingZones.find(z => z.key === data.zone);
  const recojoPrice = olvaRule?.recojoFlatCents ?? 0;
  const domicilioPrice = olvaRule?.domicilioFlatCents ?? olvaRule?.flatCents ?? 0;

  const provincias = getProvincias(data.departamento);
  const distritos = getDistritos(data.departamento, data.provincia);

  const handleDep = (dep: string) => {
    const firstProv = getProvincias(dep)[0] ?? '';
    const firstDist = getDistritos(dep, firstProv)[0] ?? 'Otro';
    const autoZone = inferZone(dep, firstProv, firstDist);
    setData(d => ({ ...d, departamento: dep, provincia: firstProv, distrito: firstDist, zone: autoZone, olvaMode: 'domicilio' }));
  };

  const handleProv = (prov: string) => {
    const firstDist = getDistritos(data.departamento, prov)[0] ?? 'Otro';
    const autoZone = inferZone(data.departamento, prov, firstDist);
    setData(d => ({ ...d, provincia: prov, distrito: firstDist, zone: autoZone, olvaMode: 'domicilio' }));
  };

  const handleDist = (dist: string) => {
    const autoZone = inferZone(data.departamento, data.provincia, dist);
    setData(d => ({ ...d, distrito: dist, zone: autoZone, olvaMode: 'domicilio' }));
  };

  const setField = (k: keyof ShippingData) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setData(d => ({ ...d, [k]: e.target.value }));

  const olvaCardStyle = (mode: 'recojo' | 'domicilio'): React.CSSProperties => {
    const active = data.olvaMode === mode;
    return {
      padding: '12px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
      background: active ? '#8faf8a18' : '#0f1a14',
      border: `2px solid ${active ? '#8faf8a' : '#c4b29733'}`,
      transition: 'all .2s ease', outline: 'none',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Departamento */}
      <FormField label="Departamento">
        <select value={data.departamento} onChange={e => handleDep(e.target.value)} style={inputStyle}>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </FormField>

      {/* Lima zones: provincia + distrito cascade */}
      {!isNationalZone && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Provincia">
            <select value={data.provincia} onChange={e => handleProv(e.target.value)} style={inputStyle}>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="Distrito">
            <select value={data.distrito} onChange={e => handleDist(e.target.value)} style={inputStyle}>
              {distritos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>
        </div>
      )}

      {/* National: free-text city */}
      {isNationalZone && (
        <FormField label="Ciudad / Provincia">
          <input
            value={data.ciudad}
            onChange={setField('ciudad')}
            placeholder="Ej: Ayacucho, Cusco, Trujillo"
            style={inputStyle}
          />
        </FormField>
      )}

      {/* Olva carrier options */}
      {isOlvaZone && olvaRule && (
        <div>
          <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#c4b297', textTransform: 'uppercase', marginBottom: 8 }}>
            {olvaRule.carrier ?? 'Olva Courier'}{olvaRule.transitDays ? ` · ${olvaRule.transitDays} días hábiles` : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => setData(d => ({ ...d, olvaMode: 'recojo' }))}
              style={olvaCardStyle('recojo')}
            >
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#f2e0cc', marginBottom: 3 }}>
                📦 Recojo en agencia
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', marginBottom: 8 }}>
                Recoges en agencia Olva
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 17, color: data.olvaMode === 'recojo' ? '#8faf8a' : '#f2e0cc' }}>
                {Money.formatPENShort(recojoPrice)}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setData(d => ({ ...d, olvaMode: 'domicilio' }))}
              style={olvaCardStyle('domicilio')}
            >
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, color: '#f2e0cc', marginBottom: 3 }}>
                🏠 A domicilio
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', marginBottom: 8 }}>
                Llega a tu puerta
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 17, color: data.olvaMode === 'domicilio' ? '#8faf8a' : '#f2e0cc' }}>
                {Money.formatPENShort(domicilioPrice)}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Direct delivery: address field */}
      {!isOlvaZone && (
        <FormField label="Dirección">
          <input value={data.direccion} onChange={setField('direccion')} placeholder="Av. ejemplo 350, piso 2" style={inputStyle} />
        </FormField>
      )}

      {/* Olva: DNI field */}
      {isOlvaZone && (
        <FormField label="DNI  (requerido por Olva)" error={dniError ? 'Mínimo 8 dígitos' : undefined}>
          <input
            value={data.dni}
            onChange={setField('dni')}
            onBlur={() => setDniBlurred(true)}
            placeholder="12345678"
            maxLength={9}
            inputMode="numeric"
            style={dniError ? inputErrorStyle : inputStyle}
          />
        </FormField>
      )}

      {/* Referencia */}
      <FormField label={isOlvaZone ? 'Referencia / indicaciones' : 'Referencia (opcional)'}>
        <textarea
          value={data.referencia}
          onChange={setField('referencia')}
          placeholder={isOlvaZone ? 'Indicaciones para el courier' : 'Punto de referencia / indicaciones'}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 52 }}
        />
      </FormField>

      {/* Nombre + Celular */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Nombre">
          <input value={data.nombre} onChange={setField('nombre')} placeholder="Nombre completo" style={inputStyle} />
        </FormField>
        <FormField
          label="Celular"
          error={phoneError ? 'Número inválido' : undefined}
          hint={!phoneError && phoneBlurred && data.telefono ? undefined : 'Ej: 987 654 321'}
        >
          <input
            type="tel"
            value={data.telefono}
            onChange={setField('telefono')}
            onBlur={() => setPhoneBlurred(true)}
            placeholder="9XX XXX XXX"
            maxLength={12}
            style={phoneError ? inputErrorStyle : inputStyle}
          />
        </FormField>
      </div>

      {/* Shipping summary card */}
      <ShippingSummaryCard zone={data.zone} totals={totals} shippingZones={shippingZones} />

      {/* Free shipping progress banner */}
      <FreeShippingBanner totals={totals} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#0f1a14', border: '1px solid #c4b29722', cursor: 'pointer' }}>
        <input type="checkbox" checked={data.acepta} onChange={e => setData(d => ({ ...d, acepta: e.target.checked }))} style={{ accentColor: '#8faf8a', width: 16, height: 16, flexShrink: 0 }} />
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#f2e0cc' }}>
          Acepto las <a href="#" style={{ color: '#c96e4b', textDecoration: 'underline' }}>políticas de compra, privacidad y entrega</a>.
        </span>
      </label>
    </div>
  );
}

// ── How to pay accordion ─────────────────────────────────────────────────────

function HowToPayAccordion({ method, totalFormatted, yapePlin }: { method: 'yape' | 'plin'; totalFormatted: string; yapePlin: YapePlinData }) {
  const [open, setOpen] = useState(false);
  const cfg = yapePlin[method];
  const phoneDisplay = cfg.phone.replace(/^\+51/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
  const steps = yapePlin.instructions?.length
    ? [...yapePlin.instructions.slice(0, -1), `Confirma el monto: ${totalFormatted}`]
    : method === 'yape'
      ? ['Abre la app de Yape', 'Toca el ícono QR (escanear)', 'Apunta la cámara a este código', `Confirma el monto: ${totalFormatted}`]
      : ['Abre tu app bancaria', 'Ingresa a Plin → Pagar con QR', `Escanea o ingresa: ${phoneDisplay}`, `Confirma el monto: ${totalFormatted}`];

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'transparent', border: 'none', color: '#8faf8a', fontFamily: 'Montserrat, sans-serif', fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0 }}>
        <span style={{ display: 'inline-block', transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'none', fontSize: 8 }}>▶</span>
        ¿Cómo pago con {method === 'yape' ? 'Yape' : 'Plin'}?
      </button>
      {open && (
        <ol style={{ margin: '8px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', lineHeight: 1.5 }}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Validation timer ─────────────────────────────────────────────────────────

function ValidationTimer({ totalSeconds = 120, whatsappPhone }: { totalSeconds?: number; whatsappPhone: string }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  useEffect(() => {
    const id = setInterval(() => setRemaining(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const pct = (remaining / totalSeconds) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const expired = remaining === 0;
  const waPhone = whatsappPhone.replace('+', '');
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#c4b29799' }}>Tiempo de verificación</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: expired ? '#c96e4b' : '#f2e0cc', fontWeight: 600 }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: '#f2e0cc1a', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: expired ? '#c96e4b' : '#8faf8a', transition: 'width 1s linear, background .5s ease' }} />
      </div>
      {expired && (
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', textAlign: 'center', marginTop: 2 }}>
          ¿Demora más?{' '}
          <a href={`https://api.whatsapp.com/send/?phone=${waPhone}&text=Hola%2C+realic%C3%A9+un+pago+y+no+recib%C3%AD+confirmaci%C3%B3n`} target="_blank" rel="noopener noreferrer" style={{ color: '#8faf8a', textDecoration: 'underline' }}>
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

// ── Step Pago ────────────────────────────────────────────────────────────────

type PaymentPhase = 'select' | 'qr' | 'validating' | 'failed';

function StepPago({
  items, totals, onSubmit, status, yapePlin,
}: {
  items: CartItem[];
  totals: CartTotals;
  onSubmit: (a: AdapterName) => void;
  status: string;
  yapePlin: YapePlinData;
}) {
  const [selectedMethod, setSelectedMethod] = useState<'yape' | 'plin' | null>(null);
  const [phase, setPhase] = useState<PaymentPhase>('select');
  const [comprobante, setComprobante] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === 'validating' && status === 'idle') setPhase('failed');
  }, [status, phase]);

  const selectMethod = (m: 'yape' | 'plin') => { setSelectedMethod(m); setPhase('qr'); };
  const handlePaid = () => { setPhase('validating'); onSubmit('yapePlin'); };
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `qr-tunay-wasi-${selectedMethod ?? 'pago'}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  const methodBtnStyle = (m: 'yape' | 'plin'): React.CSSProperties => {
    const active = selectedMethod === m && phase !== 'select';
    return {
      background: m === 'yape' ? '#742280' : '#0bb4d9', color: '#f2e0cc',
      padding: '11px 28px', borderRadius: 10,
      fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 800,
      border: active ? '2px solid #c4b297' : '2px solid transparent',
      boxShadow: active ? '0 0 0 3px #c4b29733' : 'none',
      cursor: phase === 'validating' ? 'default' : 'pointer',
      outline: 'none', transition: 'all .2s ease',
    };
  };

  const activeConfig = selectedMethod ? yapePlin[selectedMethod] : null;
  const activePhone = activeConfig?.phone.replace(/^\+51/, '').replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3') ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Order summary */}
      <div style={{ background: '#0f1a14', border: '1px solid #c4b29722', borderRadius: 14, padding: 18 }}>
        <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#8faf8a', textTransform: 'uppercase', marginBottom: 12 }}>Resumen</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.5fr 0.7fr', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.16em', color: '#c4b29799', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid #f2e0cc18' }}>
          <span>Producto</span>
          <span style={{ textAlign: 'right' }}>c/u</span>
          <span style={{ textAlign: 'right' }}>cant.</span>
          <span style={{ textAlign: 'right' }}>total</span>
        </div>
        {items.map(it => (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.5fr 0.7fr', gap: 8, padding: '9px 0', borderBottom: '1px solid #f2e0cc14', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#f2e0cc' }}>
              {it.name} <span style={{ color: '#c4b297', fontSize: 11 }}>({it.weight} · {it.grind})</span>
            </span>
            <span style={{ textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#f2e0cc' }}>{Money.formatPEN(it.unitCents)}</span>
            <span style={{ textAlign: 'right', fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#f2e0cc' }}>{it.qty}</span>
            <span style={{ textAlign: 'right', fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: '#f2e0cc' }}>{Money.formatPEN(it.unitCents * it.qty)}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Row k="Subtotal" v={Money.formatPEN(totals.subtotalCents)} />
          {totals.discountCents > 0 && <Row k="Descuento" v={'– ' + Money.formatPEN(totals.discountCents)} accent="#8faf8a" />}
          <Row k={totals.shippingLabel} v={totals.isFreeShipping ? 'Gratis' : Money.formatPEN(totals.shippingCents)} strike={totals.isFreeShipping ? Money.formatPEN(totals.shippingFlat) : null} accent={totals.isFreeShipping ? '#8faf8a' : null} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '1px solid #f2e0cc22', marginTop: 4 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 20, color: '#f2e0cc' }}>Total</span>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 28, color: '#c96e4b' }}>{Money.formatPEN(totals.totalCents)}</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.16em', color: '#8faf8a' }}>
            {totals.subtotalCents > 0 ? Math.round(totals.producerShareCents / totals.subtotalCents * 100) : 42}% al caficultor: {Money.formatPEN(totals.producerShareCents)}
          </div>
        </div>
      </div>

      {/* Payment section */}
      {phase === 'failed' ? (
        <div style={{ padding: 22, borderRadius: 14, background: '#c4b29709', border: '2px solid #c4b29755', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#c4b29722', border: '2px solid #c4b297', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚠️</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 20, color: '#f2e0cc' }}>No detectamos tu pago automáticamente</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#c4b297', lineHeight: 1.6, maxWidth: 320 }}>
            Si ya realizaste la transferencia, adjunta tu comprobante aquí.
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setComprobante(f.name); }} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, background: '#0f1a14', border: '2px dashed #c4b29766', color: '#f2e0cc', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
            📎 {comprobante ? `✓ ${comprobante}` : 'Subir captura de comprobante'}
          </button>
          {comprobante && (
            <button style={{ padding: '12px 28px', borderRadius: 999, background: '#8faf8a', color: '#1f3028', border: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Enviar comprobante
            </button>
          )}
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#c4b29799', lineHeight: 1.6 }}>
            Validaremos y confirmaremos por WhatsApp en breve
          </div>
          <button onClick={() => { setPhase('select'); setSelectedMethod(null); setComprobante(null); }} style={{ background: 'transparent', border: 'none', color: '#8faf8a', fontFamily: 'Montserrat, sans-serif', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
            Intentar de nuevo
          </button>
        </div>
      ) : (
        <div style={{ padding: 18, borderRadius: 14, background: 'linear-gradient(180deg, #c96e4b14 0%, #1f302800 100%)', border: '1px solid #c96e4b44' }}>
          <SpinnerKeyframes />
          <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 9, letterSpacing: '0.22em', color: '#c96e4b', textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 }}>⚡ Paga rápido con</div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => phase !== 'validating' && selectMethod('yape')} style={methodBtnStyle('yape')}>yape</button>
            <span style={{ color: '#c4b297', fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic' }}>o</span>
            <button onClick={() => phase !== 'validating' && selectMethod('plin')} style={methodBtnStyle('plin')}>plin</button>
          </div>

          {phase === 'select' && (
            <div style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b29799' }}>
              Selecciona tu método de pago para ver el QR
            </div>
          )}

          {phase === 'qr' && selectedMethod && activeConfig && (
            <>
              <div style={{ background: '#0f1a14', borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flexShrink: 0 }}>
                  <div ref={qrRef} style={{ borderRadius: 6, overflow: 'hidden', lineHeight: 0, width: 120, height: 120 }}>
                    {activeConfig.qrImageUrl ? (
                      <img src={activeConfig.qrImageUrl} alt={`QR ${selectedMethod}`} style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <QRCodeSVG value={activeConfig.phone.replace(/^\+51/, '')} size={120} fgColor="#1f3028" bgColor="#ffffff" level="M" />
                    )}
                  </div>
                  <button onClick={downloadQR} style={{ marginTop: 8, width: 120, padding: '6px 0', borderRadius: 6, background: 'transparent', border: '1px solid #c4b29744', color: '#c4b297', fontFamily: 'Montserrat, sans-serif', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    ⬇ Descargar QR
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, justifyContent: 'center', paddingTop: 4, flex: 1 }}>
                  <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', lineHeight: 1.5 }}>
                    Escanea desde <strong style={{ color: selectedMethod === 'yape' ? '#c084fc' : '#38bdf8' }}>{selectedMethod}</strong>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#c4b297', letterSpacing: '0.08em' }}>
                    📱 {activePhone}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#c4b29799', marginBottom: 1 }}>Total a pagar</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: '#c96e4b' }}>{Money.formatPEN(totals.totalCents)}</div>
                  </div>
                  <HowToPayAccordion method={selectedMethod} totalFormatted={Money.formatPEN(totals.totalCents)} yapePlin={yapePlin} />
                </div>
              </div>
              <button onClick={handlePaid} style={{ width: '100%', padding: '13px 16px', background: selectedMethod === 'yape' ? '#742280' : '#0bb4d9', color: '#f2e0cc', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                ✓ Confirmé el pago de {Money.formatPEN(totals.totalCents)}
              </button>
            </>
          )}

          {phase === 'validating' && (
            <div style={{ background: '#0f1a14', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 12, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #f2e0cc1a', borderTopColor: '#c96e4b', borderRadius: '50%', animation: 'tw-spin 1s linear infinite' }} />
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', lineHeight: 1.7 }}>
                <strong>Verificando tu pago…</strong><br />
                <span style={{ fontSize: 11, color: '#c4b297' }}>no cierres esta ventana</span>
              </div>
              <ValidationTimer totalSeconds={120} whatsappPhone={yapePlin.yape.phone} />
            </div>
          )}

          <div style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#c4b29799', marginTop: 2 }}>
            Te contactamos por WhatsApp · Coordinamos entrega
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Checkout ────────────────────────────────────────────────────────────

export default function Checkout() {
  const isOpen = useCartIsCheckoutOpen();
  const step = useCartCheckoutStep();
  const { closeCheckout, setCheckoutStep } = useCartActions();
  const items = useCartItems();
  const { data, setData, status, orderId, totals, canContinue, submitPayment, reset } = useCheckout();
  const { data: cycle } = useActiveCycle();
  const { data: shippingZones } = useShipping();
  const { data: yapePlin } = useYapePlin();

  const activeZones = shippingZones ?? [];
  const activeYapePlin = yapePlin ?? { enabled: true, yape: { phone: '+51917959370', accountName: 'Tunay Wasi' }, plin: { phone: '+51917959370', accountName: 'Tunay Wasi' } };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 110, background: '#0a1410cc', backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '32px 16px' }}
      onClick={closeCheckout}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(680px, 100%)', background: '#1f3028', color: '#f2e0cc', borderRadius: 20, border: '1px solid #c96e4b33', boxShadow: '0 60px 120px -40px #000000ee', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '18px 28px', borderBottom: '1px solid #f2e0cc18', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 26, color: '#f2e0cc', margin: 0, lineHeight: 1.05 }}>
              Checkout — <span style={{ color: '#c96e4b', fontStyle: 'italic' }}>Selección</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <StepPill active={step === 'datos'} done={step === 'pago'} n="1" label="👤 Datos" />
              <span style={{ color: '#c4b29766', fontSize: 12 }}>—</span>
              <StepPill active={step === 'pago'} done={false} n="2" label="💳 Pago" />
            </div>
          </div>
          <button onClick={status === 'done' ? reset : closeCheckout} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500, color: '#c4b297', background: 'transparent', border: '1px solid #c4b29744', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}>Cerrar ✕</button>
        </div>

        {/* Cycle banner */}
        <div style={{ padding: '12px 28px 0' }}>
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#c96e4b22', border: '1px solid #c96e4b66', fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#f2e0cc', lineHeight: 1.5 }}>
            <strong style={{ color: '#c96e4b' }}>☕ Selección</strong>{' '}
            {cycle ? (
              <span style={{ color: '#c4b297' }}>Cierre: <strong style={{ color: '#f2e0cc' }}>{cycle.closeAt}</strong> · Lima: <strong style={{ color: '#f2e0cc' }}>{cycle.deliverLima}</strong> · Nacional: <strong style={{ color: '#f2e0cc' }}>{cycle.deliverProv}</strong></span>
            ) : (
              <span style={{ color: '#c4b297' }}>Cierre: <strong style={{ color: '#f2e0cc' }}>31 may.</strong> · Lima: <strong style={{ color: '#f2e0cc' }}>ago. 1a semana</strong> · Nacional: <strong style={{ color: '#f2e0cc' }}>ago. 2a semana</strong></span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px 24px' }}>
          {status === 'done' ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#8faf8a', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 40, color: '#1f3028' }}>✓</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 32, color: '#f2e0cc', margin: 0 }}>¡Pedido recibido!</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297', marginTop: 12, maxWidth: 380, marginInline: 'auto', lineHeight: 1.6 }}>
                Pedido <strong style={{ color: '#f2e0cc' }}>#{orderId}</strong> registrado. Verificaremos tu pago y te confirmaremos por WhatsApp.
              </p>
              <button onClick={reset} style={{ marginTop: 24, padding: '12px 24px', background: '#c96e4b', color: '#1f3028', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Listo</button>
            </div>
          ) : step === 'datos' ? (
            <StepDatos data={data} setData={setData} totals={totals} shippingZones={activeZones} />
          ) : (
            <StepPago items={items} totals={totals} onSubmit={submitPayment} status={status} yapePlin={activeYapePlin} />
          )}
        </div>

        {/* Footer */}
        {status !== 'done' && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid #f2e0cc18', background: '#182520', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <button onClick={() => step === 'pago' ? setCheckoutStep('datos') : closeCheckout()} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, color: '#c4b297', background: 'transparent', border: '1px solid #c4b29744', borderRadius: 999, padding: '10px 16px', cursor: 'pointer', letterSpacing: '0.04em' }}>
              ← Volver
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <a href={`https://api.whatsapp.com/send/?phone=${activeYapePlin.yape.phone.replace('+', '')}&text=Hola%2C+tengo+dudas+sobre+Tunay+Wasi&type=phone_number&app_absent=0`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#8faf8a', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>💬 ¿Dudas?</a>
              {step === 'datos' && (
                <button onClick={() => setCheckoutStep('pago')} disabled={!canContinue} style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1f3028', background: canContinue ? 'linear-gradient(135deg, #c96e4b 0%, #d68863 100%)' : '#c4b29766', padding: '12px 24px', borderRadius: 999, border: 'none', cursor: canContinue ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
