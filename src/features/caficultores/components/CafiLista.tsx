import { useState, useMemo } from 'react';
import { useCafiLandingConfig } from '@/features/caficultores/useCafiLandingConfig';

type Status = 'idle' | 'sending' | 'sent';

interface FormValues {
  email: string;
  telefono: string;
  nombre: string;
  finca: string;
  region: string;
  kg: string;
  sca: string;
}

interface FieldProps {
  label: string;
  error?: string | false;
  ok?: boolean | string;
  children: React.ReactNode;
}

function FormField({ label, error, ok, children }: FieldProps) {
  return (
    <div>
      <div style={{
        fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.22em',
        color: error ? '#c96e4b' : '#c4b297', textTransform: 'uppercase', marginBottom: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'color .25s ease',
      }}>
        <span>{label}</span>
        {error && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>{error}</span>}
        {ok && <span style={{ color: '#8faf8a' }}>✓</span>}
      </div>
      {children}
    </div>
  );
}

export default function CafiLista() {
  const { data } = useCafiLandingConfig();
  const maxSlots = data?.waitlist.maxSlots ?? 15;

  const [values, setValues] = useState<FormValues>({
    email: '', telefono: '', nombre: '', finca: '', region: '', kg: '', sca: '86-87 pts',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormValues, string>> = {};
    if (!values.email.trim()) e.email = 'Necesitamos tu correo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'El correo no se ve bien.';
    if (!values.telefono.trim()) e.telefono = 'Necesitamos tu WhatsApp.';
    else if (values.telefono.replace(/\D/g, '').length < 9) e.telefono = 'Mínimo 9 dígitos.';
    return e;
  }, [values]);

  const isValid = Object.keys(errors).length === 0;

  const change = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues(v => ({ ...v, [k]: e.target.value }));

  const blur = (k: keyof FormValues) => () =>
    setTouched(t => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, telefono: true });
    if (!isValid) return;
    setStatus('sending');
    // TODO: wire to POST /api/caficultores/waitlist
    await new Promise(r => setTimeout(r, 900));
    setStatus('sent');
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    fontFamily: 'Montserrat, sans-serif', fontSize: 14,
    padding: '14px 16px', borderRadius: 12,
    background: '#0f1a14', color: '#f2e0cc',
    border: '1px solid #c4b29733',
    outline: 'none',
    transition: 'all .25s ease',
  };

  return (
    <section id="lista" style={{
      position: 'relative',
      padding: '100px 36px',
      background: '#1f3028',
      color: '#f2e0cc',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800, borderRadius: '50%',
        background: 'radial-gradient(circle, #8faf8a22 0%, #8faf8a00 60%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>03 — Lista de espera</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(38px, 5vw, 68px)', lineHeight: 1.02,
            margin: '20px 0 18px', color: '#f2e0cc', letterSpacing: '-0.01em',
          }}>
            Únete a la
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>
              Lista de Espera.
            </span>
          </h2>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.65,
            color: '#c4b297', maxWidth: 560, margin: '0 auto',
          }}>
            Sé de los primeros caficultores en vender directo al consumidor con transparencia
            desde el origen.
          </p>
        </div>

        <div style={{
          margin: '0 auto 32px',
          padding: '16px 24px',
          background: '#8faf8a22', border: '1px solid #8faf8a66',
          borderRadius: 14, textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#f2e0cc',
        }}>
          🌱 Los primeros <strong style={{ color: '#8faf8a' }}>{maxSlots} caficultores</strong> acceden al primer lote con
          {' '}<strong style={{ color: '#f2e0cc' }}>precio garantizado</strong>.
        </div>

        <form onSubmit={submit} style={{
          background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 60%)',
          border: '1px solid #c4b29722',
          borderRadius: 22,
          padding: 36,
          boxShadow: '0 30px 60px -28px #000000aa',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 24, bottom: 24, width: 3,
            background: 'linear-gradient(180deg, #c96e4b 0%, #8faf8a 100%)',
            borderRadius: 4,
          }} />

          {status === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#8faf8a', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, serif', fontSize: 40, color: '#1f3028',
              }}>✓</div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 600,
                margin: 0, color: '#f2e0cc',
              }}>¡Estás en la lista!</h3>
              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297',
                marginTop: 14, lineHeight: 1.6,
              }}>
                Te escribimos a <strong style={{ color: '#f2e0cc' }}>{values.email}</strong> con los
                siguientes pasos del proceso de cata y recepción.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <FormField label="Correo Electrónico *" error={touched.email && errors.email} ok={touched.email && !errors.email && values.email}>
                <input type="email" placeholder="tu@email.com" value={values.email}
                  onChange={change('email')} onBlur={blur('email')}
                  style={{ ...inputBase, borderColor: (touched.email && errors.email) ? '#c96e4b' : ((touched.email && !errors.email && values.email) ? '#8faf8a' : '#c4b29733') }}
                  onFocus={(e) => { e.target.style.borderColor = '#c96e4b'; }} />
              </FormField>

              <FormField label="Teléfono / WhatsApp *" error={touched.telefono && errors.telefono} ok={touched.telefono && !errors.telefono && values.telefono}>
                <input type="tel" placeholder="+51 999 999 999" value={values.telefono}
                  onChange={change('telefono')} onBlur={blur('telefono')}
                  style={{ ...inputBase, borderColor: (touched.telefono && errors.telefono) ? '#c96e4b' : ((touched.telefono && !errors.telefono && values.telefono) ? '#8faf8a' : '#c4b29733') }}
                  onFocus={(e) => { e.target.style.borderColor = '#c96e4b'; }} />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="tw-cafi-fields">
                <FormField label="Tu nombre">
                  <input placeholder="Tu nombre completo" value={values.nombre}
                    onChange={change('nombre')} style={inputBase}
                    onFocus={(e) => { e.target.style.borderColor = '#c96e4b'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#c4b29733'; }} />
                </FormField>
                <FormField label="Finca / Cooperativa">
                  <input placeholder="Nombre de tu finca" value={values.finca}
                    onChange={change('finca')} style={inputBase}
                    onFocus={(e) => { e.target.style.borderColor = '#c96e4b'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#c4b29733'; }} />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="tw-cafi-fields-3">
                <FormField label="Región">
                  <select value={values.region} onChange={change('region')} style={inputBase}>
                    <option value="">Selecciona…</option>
                    <option>Cusco</option><option>San Martín</option><option>Puno</option>
                    <option>Junín</option><option>Cajamarca</option><option>Amazonas</option>
                    <option>Pasco</option><option>Otro</option>
                  </select>
                </FormField>
                <FormField label="Kg / año (aprox.)">
                  <input type="number" placeholder="500" value={values.kg}
                    onChange={change('kg')} style={inputBase}
                    onFocus={(e) => { e.target.style.borderColor = '#c96e4b'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#c4b29733'; }} />
                </FormField>
                <FormField label="Puntaje SCA est.">
                  <select value={values.sca} onChange={change('sca')} style={inputBase}>
                    <option>82-83 pts</option><option>84-85 pts</option>
                    <option>86-87 pts</option><option>88-89 pts</option>
                    <option>90+ pts</option><option>No lo sé</option>
                  </select>
                </FormField>
              </div>

              <button type="submit" disabled={status === 'sending' || !isValid} style={{
                marginTop: 8,
                fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#1f3028',
                background: isValid
                  ? 'linear-gradient(135deg, #8faf8a 0%, #a5c39e 100%)'
                  : '#c4b29744',
                padding: '20px 28px', borderRadius: 999, border: 'none',
                cursor: (isValid && status !== 'sending') ? 'pointer' : 'not-allowed',
                boxShadow: '0 18px 36px -16px #8faf8a88',
                transition: 'all .3s ease',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                🌱 {status === 'sending' ? 'Enviando…' : 'Registrar mi Finca'}
              </button>

              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
                color: '#c4b29799', textAlign: 'center', textTransform: 'uppercase',
              }}>
                Sin spam · Te escribimos solo cuando abrimos cupos
              </div>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .tw-cafi-fields, .tw-cafi-fields-3 { display: grid; }
        @media (max-width: 640px) {
          .tw-cafi-fields { grid-template-columns: 1fr !important; }
          .tw-cafi-fields-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
