import { useState, useMemo } from 'react';
import CoffeeBranch from '@/components/decor/CoffeeBranch';
import { useSupplyLandingConfig } from '@/features/mayoristas/useSupplyLandingConfig';
import { STATIC_SUPPLY_LANDING } from '@/features/catalog/catalogService';
import { saveSolicitudSupply } from '@/features/mayoristas/supplyFormService';
import { useLoteReservado, setLoteReservado } from '@/features/mayoristas/useLoteReservado';

type Status = 'idle' | 'sending' | 'sent';

interface FormValues {
  empresa: string;
  nombre: string;
  email: string;
  telefono: string;
  volumen: string;
  frecuencia: string;
  sca: string;
  variedad: string[];
  mensaje: string;
}

const VARIEDADES = [
  'Caturra', 'Bourbon', 'Geisha', 'Typica',
  'Catuaí', 'Pache', 'Catimor', 'Mundo Novo',
];

interface InputProps {
  name: keyof FormValues;
  label: string;
  type?: string;
  placeholder: string;
  values: FormValues;
  setVal: (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  blur: (k: keyof FormValues) => () => void;
  errors: Partial<Record<keyof FormValues, string>>;
  touched: Partial<Record<keyof FormValues, boolean>>;
}

function SupplyInput({ name, label, type, placeholder, values, setVal, blur, errors, touched }: InputProps) {
  const showErr = touched[name] && errors[name];
  return (
    <div>
      <label style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
        color: showErr ? '#c96e4b' : '#c4b297', textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
      }}>
        <span>{label}</span>
        {showErr && (
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: '#c96e4b' }}>
            {errors[name]}
          </span>
        )}
        {!showErr && touched[name] && !errors[name] && (
          <span style={{ color: '#8faf8a', fontSize: 13 }}>✓</span>
        )}
      </label>
      <input
        type={type ?? 'text'}
        value={values[name] as string}
        placeholder={placeholder}
        onChange={setVal(name)}
        onBlur={blur(name)}
        style={{
          width: '100%', boxSizing: 'border-box',
          fontFamily: 'Montserrat, sans-serif', fontSize: 14,
          color: '#f2e0cc', background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${showErr ? '#c96e4b' : (touched[name] && !errors[name] ? '#8faf8a' : '#f2e0cc33')}`,
          padding: '12px 0 10px',
          outline: 'none',
          transition: 'border-color .25s ease',
        }}
        onFocus={(e) => { e.target.style.borderBottomColor = '#c96e4b'; }}
        onBlurCapture={(e) => {
          if (!(touched[name] && !errors[name])) e.target.style.borderBottomColor = '#f2e0cc33';
        }}
      />
    </div>
  );
}

interface SelectProps {
  name: keyof FormValues;
  label: string;
  options: [string, string][];
  values: FormValues;
  setVal: (k: keyof FormValues) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function SupplySelect({ name, label, options, values, setVal }: SelectProps) {
  return (
    <div>
      <label style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
        color: '#c4b297', textTransform: 'uppercase',
        display: 'block', marginBottom: 10,
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          value={values[name] as string}
          onChange={setVal(name)}
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: 'Montserrat, sans-serif', fontSize: 14,
            color: '#f2e0cc', background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #f2e0cc33',
            padding: '12px 24px 10px 0',
            outline: 'none', appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map(([v, l]) => (
            <option key={v} value={v} style={{ background: '#1f3028', color: '#f2e0cc' }}>{l}</option>
          ))}
        </select>
        <span style={{
          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-40%)',
          pointerEvents: 'none', color: '#c4b297', fontSize: 12,
        }}>▾</span>
      </div>
    </div>
  );
}

interface MultiChipsProps {
  label: string;
  options: string[];
  selected: string[];
  toggle: (v: string) => void;
}

function SupplyMultiChips({ label, options, selected, toggle }: MultiChipsProps) {
  const labelId = 'supply-variedades-label';
  return (
    <div style={{ gridColumn: '1 / -1' }} role="group" aria-labelledby={labelId}>
      <label id={labelId} style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
        color: '#c4b297', textTransform: 'uppercase',
        display: 'block', marginBottom: 12,
      }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(v => {
          const on = selected.includes(v);
          return (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              aria-pressed={on}
              className="tw-sup-chip"
              style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500,
                padding: '0 18px', minHeight: 44, borderRadius: 999, cursor: 'pointer',
                background: on ? '#c96e4b' : 'transparent',
                color: on ? '#f2e0cc' : '#c4b297',
                border: `1px solid ${on ? '#c96e4b' : '#f2e0cc33'}`,
                transition: 'background .2s ease, color .2s ease, border-color .2s ease',
                letterSpacing: '0.03em',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                touchAction: 'manipulation',
              }}
            >
              {on && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="#f2e0cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SupplyForm() {
  const { data = STATIC_SUPPLY_LANDING } = useSupplyLandingConfig();
  const { email: b2bEmail, whatsapp: b2bWhatsapp, bodega: b2bBodega } = data.contactB2B;
  const loteReservado = useLoteReservado();
  const contacts: [string, string][] = [
    ['Ventas B2B', b2bEmail],
    ['WhatsApp',   b2bWhatsapp],
    ['Bodega Lima', b2bBodega],
  ];
  const [values, setValues] = useState<FormValues>({
    empresa: '', nombre: '', email: '', telefono: '',
    volumen: '46', frecuencia: 'mensual',
    sca: '84', variedad: [], mensaje: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormValues, string>> = {};
    if (!values.empresa.trim()) e.empresa = 'Cuéntanos qué negocio representas.';
    if (!values.nombre.trim()) e.nombre = 'Tu nombre, por favor.';
    if (!values.email.trim()) e.email = 'Necesitamos tu correo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Ese correo no se ve bien.';
    if (!values.telefono.trim()) e.telefono = 'Para coordinar logística.';
    else {
      const digits = values.telefono.replace(/\D/g, '');
      const local = digits.startsWith('51') ? digits.slice(2) : digits;
      if (local.length !== 9) e.telefono = 'Debe tener 9 dígitos.';
      else if (!local.startsWith('9')) e.telefono = 'Celular debe empezar con 9.';
    }
    return e;
  }, [values]);

  const isValid = Object.keys(errors).length === 0;

  const setVal = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues(v => ({ ...v, [k]: e.target.value }));

  const blur = (k: keyof FormValues) => () =>
    setTouched(t => ({ ...t, [k]: true }));

  const toggleVariedad = (v: string) =>
    setValues(vals => ({
      ...vals,
      variedad: vals.variedad.includes(v)
        ? vals.variedad.filter(x => x !== v)
        : [...vals.variedad, v],
    }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(values).map(k => [k, true])));
    if (!isValid) return;
    setStatus('sending');
    setServerError(null);
    try {
      await saveSolicitudSupply({
        empresa: values.empresa,
        contacto: values.nombre,
        email: values.email,
        telefono: values.telefono,
        volumenKg: Number(values.volumen),
        frecuencia: values.frecuencia,
        puntajeMin: Number(values.sca),
        variedad: values.variedad.length > 0 ? values.variedad.join(', ') : undefined,
        mensaje: values.mensaje || undefined,
        loteId: loteReservado?.id,
        loteVariedad: loteReservado?.variedad,
        loteOrigen: loteReservado?.origen,
        loteSca: loteReservado?.sca,
        lotePrecioKg: loteReservado?.precioKg,
      });
      setStatus('sent');
    } catch (err) {
      setServerError((err as Error).message ?? 'Error al enviar. Inténtalo de nuevo.');
      setStatus('idle');
    }
  };

  const inputProps = { values, setVal: setVal as InputProps['setVal'], blur, errors, touched };

  return (
    <section id="solicitud" style={{
      background: '#f2e0cc',
      color: '#1f3028',
      padding: '100px 36px',
      borderTop: '1px solid #1f302822',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -30, top: 80, width: 160, opacity: 0.4, zIndex: 0 }}>
        <CoffeeBranch flip />
      </div>

      <div style={{
        maxWidth: 1320, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 96, alignItems: 'start',
        position: 'relative', zIndex: 1,
      }} className="tw-sup-form-2col">
        {/* LEFT */}
        <div>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>04 — Solicita Información</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 1.0,
            color: '#1f3028', margin: '24px 0 28px', letterSpacing: '-0.01em',
          }}>
            Cuéntanos
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>de tu negocio.</span>
            <br />
            Te respondemos en 24h.
          </h2>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7,
            color: '#533b22', maxWidth: 460, margin: 0,
          }}>
            Cafeterías, tostadoras, hoteles, distribuidores. Si compras desde
            46 kg al mes, te enviamos una propuesta a medida con el lote que
            mejor calce con tu perfil de tueste.
          </p>

          <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {contacts.map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', gap: 18, alignItems: 'baseline',
                paddingBottom: 14, borderBottom: '1px solid #1f302822',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
                  color: '#533b22', textTransform: 'uppercase', minWidth: 110,
                }}>{k}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1f3028' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32, padding: 18,
            background: '#1f30280a', border: '1px dashed #1f302844',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 30, height: 30, flexShrink: 0,
              background: '#c96e4b', color: '#f2e0cc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 700, fontStyle: 'italic',
            }}>!</div>
            <div style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#533b22', lineHeight: 1.55,
            }}>
              ¿Tueste casero o consumo personal? Mejor revisa nuestra{' '}
              <a href="/" style={{ color: '#c96e4b' }}>tienda al consumidor</a>
              {' '}— el café tostado va por ahí.
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <form onSubmit={submit} style={{
          background: '#1f3028', color: '#f2e0cc',
          padding: 48, borderRadius: 28,
          boxShadow: '0 32px 70px -28px #533b22cc',
          display: 'flex', flexDirection: 'column', gap: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 220, height: 220,
            border: '1px solid #c96e4b66', borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', top: -10, right: -10, width: 160, height: 160,
            border: '1px solid #c96e4b33', borderRadius: '50%',
          }} />

          {status === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: '#8faf8a', margin: '0 auto 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, serif', fontSize: 44, color: '#1f3028',
              }}>✓</div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600,
                margin: 0, color: '#f2e0cc',
              }}>Solicitud recibida.</h3>
              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297',
                marginTop: 14, maxWidth: 380, marginInline: 'auto', lineHeight: 1.6,
              }}>
                Gracias, {values.nombre.split(' ')[0]}. Te enviamos una propuesta a{' '}
                {values.email} en menos de 24 horas, con muestras si lo necesitas.
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingBottom: 14, borderBottom: '1px dashed #c4b29744',
              }}>
                <span style={{
                  fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
                  color: '#c96e4b', textTransform: 'uppercase',
                }}>Formulario Mayorista</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.22em',
                  color: '#c4b29766', textTransform: 'uppercase',
                }}>TW-SUP / Q2 · 2026</span>
              </div>

              {loteReservado && (
                <div style={{
                  background: '#c96e4b14', border: '1px solid #c96e4b44', borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                }}>
                  <div>
                    <div style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.2em',
                      color: '#c96e4b', textTransform: 'uppercase', marginBottom: 5,
                    }}>Lote seleccionado</div>
                    <div style={{
                      fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600,
                      color: '#f2e0cc', lineHeight: 1.1,
                    }}>
                      {loteReservado.id} · {loteReservado.variedad}
                    </div>
                    <div style={{
                      fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297', marginTop: 4,
                    }}>
                      {loteReservado.origen} · SCA {loteReservado.sca} pts · S/ {loteReservado.precioKg.toFixed(2)} / kg
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLoteReservado(null)}
                    aria-label="Quitar lote seleccionado"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#c4b29799', padding: 4, flexShrink: 0, lineHeight: 1,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="tw-sup-form-grid">
                <SupplyInput name="empresa" label="Empresa / negocio" placeholder="Mi Negocio" {...inputProps} />
                <SupplyInput name="nombre" label="Nombre de contacto" placeholder="Nombre y Apellidos" {...inputProps} />
                <SupplyInput name="email" label="Email" type="email" placeholder="hola@negocio.pe" {...inputProps} />
                <SupplyInput name="telefono" label="Teléfono" placeholder="+51 987 654 321" {...inputProps} />
                <SupplySelect name="volumen" label="Volumen requerido" values={values} setVal={setVal as SelectProps['setVal']} options={[
                  ['46', '46 kg · 1 saco'],
                  ['92', '92 kg · 2 sacos'],
                  ['138', '138 kg · 3 sacos'],
                  ['276', '276 kg · 6 sacos'],
                  ['500', '500+ kg · contenedor parcial'],
                ]} />
                <SupplySelect name="frecuencia" label="Frecuencia de compra" values={values} setVal={setVal as SelectProps['setVal']} options={[
                  ['unico', 'Pedido único'],
                  ['mensual', 'Mensual'],
                  ['bimestral', 'Bimestral'],
                  ['trimestral', 'Trimestral'],
                ]} />
                <SupplySelect name="sca" label="Puntaje SCA mínimo" values={values} setVal={setVal as SelectProps['setVal']} options={[
                  ['82', '82+ · especialidad básica'],
                  ['84', '84+ · especialidad estándar'],
                  ['86', '86+ · premium'],
                  ['88', '88+ · top lot'],
                  ['90', '90+ · edición limitada'],
                ]} />
                <SupplyMultiChips
                  label="Variedad preferida (opcional)"
                  options={VARIEDADES}
                  selected={values.variedad}
                  toggle={toggleVariedad}
                />
              </div>

              <div>
                <label style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
                  color: '#c4b297', textTransform: 'uppercase',
                  display: 'block', marginBottom: 10,
                }}>Mensaje (opcional)</label>
                <textarea
                  value={values.mensaje}
                  onChange={(e) => setValues(v => ({ ...v, mensaje: e.target.value }))}
                  placeholder="¿Qué perfil de tueste manejas? ¿Origen preferido? ¿Necesitas muestras antes de cerrar?"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    fontFamily: 'Montserrat, sans-serif', fontSize: 14,
                    color: '#f2e0cc', background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #f2e0cc33',
                    padding: '12px 0 10px',
                    outline: 'none',
                    minHeight: 96, resize: 'vertical', paddingTop: 14,
                  }}
                  onFocus={(e) => { e.target.style.borderBottomColor = '#c96e4b'; }}
                  onBlur={(e) => { e.target.style.borderBottomColor = '#f2e0cc33'; }}
                />
              </div>

              {serverError && (
                <div style={{
                  fontFamily: 'Montserrat, sans-serif', fontSize: 12,
                  color: '#c96e4b', padding: '10px 14px',
                  border: '1px solid #c96e4b55', borderRadius: 8,
                }}>
                  {serverError}
                </div>
              )}

              <button type="submit" disabled={status === 'sending'} className="tw-sup-submit" style={{
                marginTop: 8,
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#1f3028',
                background: isValid ? '#c96e4b' : '#c4b29766',
                padding: '20px 28px', borderRadius: 999, border: 'none',
                cursor: (isValid && status !== 'sending') ? 'pointer' : 'not-allowed',
                transition: 'all .35s ease',
                boxShadow: '0 18px 36px -16px #533b22cc',
              }}>
                {status === 'sending' ? 'Enviando…' : 'Enviar solicitud →'}
              </button>

              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
                color: '#c4b29799', textAlign: 'center', textTransform: 'uppercase',
              }}>
                Respondemos en menos de 24h · {b2bEmail}
              </div>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .tw-sup-submit:hover:not(:disabled) { background: #f2e0cc !important; }
        .tw-sup-chip:focus-visible { outline: 2px solid #c96e4b; outline-offset: 2px; }
        @media (max-width: 980px) {
          .tw-sup-form-2col { grid-template-columns: 1fr !important; gap: 56px !important; }
          .tw-sup-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
