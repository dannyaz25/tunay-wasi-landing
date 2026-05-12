import { useState, type ChangeEvent } from 'react';

const VARIEDADES = ['Bourbon', 'Caturra', 'Catuai', 'Gesha/Geisha', 'Pache', 'Typica', 'Catimor', 'Otra'];
const PROCESOS = ['Natural', 'Lavado', 'Honey', 'Anaeróbico', 'Otro'];
const FASES = ['Pre-cosecha (flores)', 'Cosecha en curso', 'Post-cosecha (secado)', 'Listo para envío'];

interface MicroloteForm {
  nombreApellidos: string;
  email: string;
  nombreMicrolote: string;
  variedad: string;
  altitud: string;
  proceso: string;
  faseActual: string;
  fechaEstimadaEntrega: string;
  cantidadKg: string;
}

const EMPTY: MicroloteForm = {
  nombreApellidos: '',
  email: '',
  nombreMicrolote: '',
  variedad: '',
  altitud: '',
  proceso: '',
  faseActual: '',
  fechaEstimadaEntrega: '',
  cantidadKg: '',
};

const inputStyle: React.CSSProperties = {
  width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: 14,
  color: '#f2e0cc', background: 'transparent', border: 'none',
  borderBottom: '1px solid #f2e0cc33', padding: '12px 0 10px',
  outline: 'none', transition: 'border-color .25s ease', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.22em', color: error ? '#c96e4b' : '#c4b297', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span>{label}</span>
        {error && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: '#c96e4b' }}>{error}</span>}
      </label>
      {children}
    </div>
  );
}

export default function RegistroMicrolote() {
  const [values, setValues] = useState<MicroloteForm>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof MicroloteForm, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const setField = (k: keyof MicroloteForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues(v => ({ ...v, [k]: e.target.value }));
  const onBlur = (k: keyof MicroloteForm) => () => setTouched(t => ({ ...t, [k]: true }));

  const required: (keyof MicroloteForm)[] = ['nombreApellidos', 'email', 'nombreMicrolote', 'variedad', 'altitud', 'proceso', 'faseActual', 'cantidadKg'];
  const errors: Partial<Record<keyof MicroloteForm, string>> = {};
  for (const k of required) {
    if (!values[k].trim()) errors[k] = 'Requerido';
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Correo inválido';
  const isValid = Object.keys(errors).length === 0;

  const showErr = (k: keyof MicroloteForm) => touched[k] ? errors[k] : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(required.map(k => [k, true])) as Partial<Record<keyof MicroloteForm, boolean>>;
    setTouched(allTouched);
    if (!isValid) return;
    setStatus('sending');
    // Construimos mensaje WhatsApp como canal principal mientras se integra Firestore
    const lines = [
      `*FICHA TÉCNICA DE MICROLOTE*`,
      `Nombre: ${values.nombreApellidos}`,
      `Email: ${values.email}`,
      `Microlote: ${values.nombreMicrolote}`,
      `Variedad: ${values.variedad}`,
      `Altitud: ${values.altitud} msnm`,
      `Proceso: ${values.proceso}`,
      `Fase actual: ${values.faseActual}`,
      `Fecha estimada de entrega: ${values.fechaEstimadaEntrega || 'Por definir'}`,
      `Cantidad total: ${values.cantidadKg} kg`,
      `Fecha de registro: ${new Date().toLocaleDateString('es-PE')}`,
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/51917959370?text=${msg}`, '_blank');
    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <section id="registro" style={{ padding: '100px 36px', background: '#1f3028' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#8faf8a', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 44, color: '#1f3028' }}>✓</div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, margin: 0, color: '#f2e0cc' }}>¡Ficha enviada!</h3>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297', marginTop: 14, lineHeight: 1.6 }}>
            Nos llegó tu ficha de microlote. Coordinamos contigo en las próximas 24 horas para el siguiente paso.
          </p>
          <button onClick={() => { setValues(EMPTY); setTouched({}); setStatus('idle'); }}
            style={{ marginTop: 24, padding: '14px 28px', background: '#c96e4b', color: '#1f3028', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Registrar otro microlote
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="registro" style={{ padding: '100px 36px', background: '#1f3028' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 80, alignItems: 'start' }} className="tw-2col">

        {/* columna izquierda — copy */}
        <div>
          <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>05 — Registro de microlote</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.0, color: '#f2e0cc', margin: '20px 0 20px', letterSpacing: '-0.01em' }}>
            Registra tu café.<br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>Tu historia llega</span><br />
            al consumidor.
          </h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#c4b297', maxWidth: 380 }}>
            Completa la ficha técnica de tu microlote. Nuestro equipo se contactará contigo para coordinar el recojo, la cata y el precio final según tu puntaje SCA.
          </p>
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              ['📦', 'Lote mínimo: 12 kg verde oro'],
              ['☕', 'Cata Q-Grader sin costo — cubierta por Tunay Wasi'],
              ['💰', 'Pago a los 7 días hábiles post-venta'],
              ['🔍', 'Tu nombre en cada bolsa que se vende'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* columna derecha — formulario */}
        <form onSubmit={handleSubmit} style={{ background: '#f2e0cc', color: '#1f3028', padding: 40, borderRadius: 28, boxShadow: '0 32px 70px -28px #000000cc', display: 'flex', flexDirection: 'column', gap: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, border: '1px solid #c96e4b33', borderRadius: '50%' }} />

          <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.22em', color: '#533b22', textTransform: 'uppercase', marginBottom: 4 }}>
            Ficha técnica de microlote
          </div>

          {/* Nombre y email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Nombre y apellidos" error={showErr('nombreApellidos')}>
              <input value={values.nombreApellidos} onChange={setField('nombreApellidos')} onBlur={onBlur('nombreApellidos')} placeholder="Juan Quispe Huanca"
                style={{ ...inputStyle, color: '#1f3028', borderBottomColor: showErr('nombreApellidos') ? '#c96e4b' : '#1f302844' }} />
            </Field>
            <Field label="Correo electrónico" error={showErr('email')}>
              <input type="email" value={values.email} onChange={setField('email')} onBlur={onBlur('email')} placeholder="tu@correo.com"
                style={{ ...inputStyle, color: '#1f3028', borderBottomColor: showErr('email') ? '#c96e4b' : '#1f302844' }} />
            </Field>
          </div>

          {/* Nombre microlote */}
          <Field label="Nombre del microlote" error={showErr('nombreMicrolote')}>
            <input value={values.nombreMicrolote} onChange={setField('nombreMicrolote')} onBlur={onBlur('nombreMicrolote')} placeholder="Ej: Finca Vista Hermosa · Lote Rojo"
              style={{ ...inputStyle, color: '#1f3028', borderBottomColor: showErr('nombreMicrolote') ? '#c96e4b' : '#1f302844' }} />
          </Field>

          {/* Variedad + Altitud */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Variedad" error={showErr('variedad')}>
              <select value={values.variedad} onChange={setField('variedad')} onBlur={onBlur('variedad')}
                style={{ ...selectStyle, color: values.variedad ? '#1f3028' : '#1f302866', borderBottomColor: showErr('variedad') ? '#c96e4b' : '#1f302844' }}>
                <option value="">Seleccionar</option>
                {VARIEDADES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Altitud (msnm)" error={showErr('altitud')}>
              <input type="number" value={values.altitud} onChange={setField('altitud')} onBlur={onBlur('altitud')} placeholder="1800"
                style={{ ...inputStyle, color: '#1f3028', borderBottomColor: showErr('altitud') ? '#c96e4b' : '#1f302844' }} />
            </Field>
          </div>

          {/* Proceso + Fase */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Proceso" error={showErr('proceso')}>
              <select value={values.proceso} onChange={setField('proceso')} onBlur={onBlur('proceso')}
                style={{ ...selectStyle, color: values.proceso ? '#1f3028' : '#1f302866', borderBottomColor: showErr('proceso') ? '#c96e4b' : '#1f302844' }}>
                <option value="">Seleccionar</option>
                {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Fase actual" error={showErr('faseActual')}>
              <select value={values.faseActual} onChange={setField('faseActual')} onBlur={onBlur('faseActual')}
                style={{ ...selectStyle, color: values.faseActual ? '#1f3028' : '#1f302866', borderBottomColor: showErr('faseActual') ? '#c96e4b' : '#1f302844' }}>
                <option value="">Seleccionar</option>
                {FASES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          {/* Fecha entrega + Cantidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Fecha est. entrega">
              <input type="date" value={values.fechaEstimadaEntrega} onChange={setField('fechaEstimadaEntrega')}
                style={{ ...inputStyle, color: '#1f3028', borderBottomColor: '#1f302844' }} />
            </Field>
            <Field label="Cantidad total (kg)" error={showErr('cantidadKg')}>
              <input type="number" value={values.cantidadKg} onChange={setField('cantidadKg')} onBlur={onBlur('cantidadKg')} placeholder="12"
                style={{ ...inputStyle, color: '#1f3028', borderBottomColor: showErr('cantidadKg') ? '#c96e4b' : '#1f302844' }} />
            </Field>
          </div>

          <button type="submit" disabled={status === 'sending'}
            style={{ marginTop: 8, padding: '18px 28px', background: isValid ? '#c96e4b' : '#c4b29766', color: '#1f3028', border: 'none', borderRadius: 999, cursor: isValid ? 'pointer' : 'not-allowed', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: isValid ? '0 18px 36px -16px #533b22cc' : 'none', transition: 'all .25s ease' }}
            onMouseEnter={e => { if (isValid) (e.currentTarget as HTMLElement).style.background = '#1f3028'; (e.currentTarget as HTMLElement).style.color = '#f2e0cc'; }}
            onMouseLeave={e => { if (isValid) (e.currentTarget as HTMLElement).style.background = '#c96e4b'; (e.currentTarget as HTMLElement).style.color = '#1f3028'; }}>
            {status === 'sending' ? 'Enviando…' : '📱 Registrar mi café por WhatsApp →'}
          </button>

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#533b2299', textAlign: 'center', margin: 0 }}>
            Se abrirá WhatsApp con tu ficha precargada. Coordinamos el resto contigo.
          </p>
        </form>
      </div>

      <style>{`
        @media (max-width: 768px) { .tw-2col { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
