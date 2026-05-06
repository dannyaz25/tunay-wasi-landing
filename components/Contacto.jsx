// Contact form with realtime validation. Serverless-ready (POST to /api/contact).
const Contacto = () => {
  const [values, setValues] = React.useState({ nombre: '', email: '', tema: 'cafe', mensaje: '' });
  const [touched, setTouched] = React.useState({});
  const [status, setStatus] = React.useState('idle'); // idle | sending | sent | error

  const errors = React.useMemo(() => {
    const e = {};
    if (!values.nombre.trim()) e.nombre = 'Cuéntanos cómo te llamas.';
    else if (values.nombre.trim().length < 2) e.nombre = 'Necesitamos al menos 2 caracteres.';
    if (!values.email.trim()) e.email = 'Tu correo, por favor.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Ese correo no se ve bien.';
    if (!values.mensaje.trim()) e.mensaje = 'Escríbenos algo, aunque sea breve.';
    else if (values.mensaje.trim().length < 10) e.mensaje = 'Un poquito más — al menos 10 caracteres.';
    return e;
  }, [values]);

  const isValid = Object.keys(errors).length === 0;
  const showErr = (k) => touched[k] && errors[k];

  const handleChange = (k) => (e) => setValues(v => ({ ...v, [k]: e.target.value }));
  const handleBlur = (k) => () => setTouched(t => ({ ...t, [k]: true }));

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ nombre: true, email: true, mensaje: true });
    if (!isValid) return;
    setStatus('sending');
    // Simulated serverless call.
    await new Promise(r => setTimeout(r, 900));
    setStatus('sent');
  };

  const inputBase = {
    width: '100%',
    fontFamily: 'Montserrat, sans-serif', fontSize: 15,
    color: '#1f3028',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #1f302844',
    padding: '14px 0 12px',
    outline: 'none',
    transition: 'border-color .25s ease',
  };

  const Field = ({ label, name, type = 'text', as = 'input', children }) => {
    const Tag = as;
    return (
      <div style={{ position: 'relative' }}>
        <label style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
          color: showErr(name) ? '#c96e4b' : '#533b22', textTransform: 'uppercase',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'color .25s ease',
        }}>
          <span>{label}</span>
          {showErr(name) && (
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: '#c96e4b' }}>
              {errors[name]}
            </span>
          )}
          {!showErr(name) && touched[name] && !errors[name] && (
            <span style={{ color: '#8faf8a', fontSize: 13 }}>✓</span>
          )}
        </label>
        {children || (
          <Tag
            type={type}
            value={values[name]}
            onChange={handleChange(name)}
            onBlur={handleBlur(name)}
            style={{
              ...inputBase,
              borderBottomColor: showErr(name) ? '#c96e4b' : (touched[name] && !errors[name] ? '#8faf8a' : '#1f302844'),
              ...(as === 'textarea' ? { minHeight: 110, resize: 'vertical', paddingTop: 14 } : {}),
            }}
            onFocus={(e) => { e.target.style.borderBottomColor = '#1f3028'; }}
          />
        )}
      </div>
    );
  };

  return (
    <section id="contacto" style={{
      background: '#f2e0cc', padding: '140px 36px',
      borderTop: '1px solid #1f302822',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 96, alignItems: 'start',
      }} className="tw-2col">
        {/* left column: invitation */}
        <div>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>05 — Conversemos</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 1.0,
            color: '#1f3028', margin: '24px 0 28px', letterSpacing: '-0.01em',
          }}>
            Escríbenos.
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>
              Te respondemos
            </span>
            <br />
            en menos de 24h.
          </h2>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7,
            color: '#533b22', maxWidth: 420, margin: 0,
          }}>
            ¿Una cafetería que quiere abastecerse directo? ¿Un periodista trabajando una historia
            del campo? ¿Un caficultor que quiere unirse al modelo? Esta es la puerta.
          </p>

          <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              ['Correo', 'hola@tunaywasi.pe'],
              ['Lima', 'Jr. Independencia 240, Barranco'],
              ['Cosecha', 'Acopio en Cusco · San Martín · Puno'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', gap: 18, alignItems: 'baseline',
                paddingBottom: 14, borderBottom: '1px solid #1f302822',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
                  color: '#533b22', textTransform: 'uppercase', minWidth: 80,
                }}>{k}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1f3028' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right column: form */}
        <form onSubmit={submit} style={{
          background: '#1f3028', color: '#f2e0cc',
          padding: 48, borderRadius: 28,
          boxShadow: '0 32px 70px -28px #533b22cc',
          display: 'flex', flexDirection: 'column', gap: 28,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle pattern */}
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
              }}>Mensaje recibido.</h3>
              <p style={{
                fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297',
                marginTop: 14, maxWidth: 360, marginInline: 'auto', lineHeight: 1.6,
              }}>
                Gracias, {values.nombre.split(' ')[0]}. Te respondemos a {values.email} en menos de un día.
              </p>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                <style>{`
                  .tw-form-dark input, .tw-form-dark textarea {
                    color: #f2e0cc !important;
                    border-bottom-color: #f2e0cc44 !important;
                  }
                  .tw-form-dark input:focus, .tw-form-dark textarea:focus {
                    border-bottom-color: #c96e4b !important;
                  }
                  .tw-form-dark label { color: #c4b297 !important; }
                `}</style>
              </div>
              <div className="tw-form-dark" style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative' }}>
                <Field label="Tu nombre" name="nombre" />
                <Field label="Correo" name="email" type="email" />
                <div>
                  <label style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em',
                    color: '#c4b297', textTransform: 'uppercase',
                  }}>¿De qué quieres hablar?</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    {[
                      ['cafe', 'Comprar café'],
                      ['mayorista', 'Mayorista / cafetería'],
                      ['caficultor', 'Soy caficultor'],
                      ['prensa', 'Prensa'],
                    ].map(([v, l]) => (
                      <button type="button" key={v} onClick={() => setValues(s => ({ ...s, tema: v }))} style={{
                        fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500,
                        padding: '10px 16px', borderRadius: 999, cursor: 'pointer',
                        background: values.tema === v ? '#c96e4b' : 'transparent',
                        color: values.tema === v ? '#f2e0cc' : '#c4b297',
                        border: `1px solid ${values.tema === v ? '#c96e4b' : '#c4b29744'}`,
                        transition: 'all .25s ease',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
                <Field label="Tu mensaje" name="mensaje" as="textarea" />
              </div>

              <button type="submit" disabled={status === 'sending'} style={{
                marginTop: 12,
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#1f3028',
                background: isValid ? '#c96e4b' : '#c4b29766',
                padding: '20px 28px', borderRadius: 999, border: 'none',
                cursor: isValid && status !== 'sending' ? 'pointer' : 'not-allowed',
                transition: 'all .35s ease',
                boxShadow: '0 18px 36px -16px #533b22cc',
                position: 'relative',
              }}
              onMouseEnter={e => { if (isValid && status !== 'sending') e.currentTarget.style.background = '#f2e0cc'; }}
              onMouseLeave={e => { if (isValid && status !== 'sending') e.currentTarget.style.background = '#c96e4b'; }}>
                {status === 'sending' ? 'Enviando…' : 'Enviar mensaje →'}
              </button>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.18em',
                color: '#c4b29799', textAlign: 'center', textTransform: 'uppercase',
              }}>
                Procesado vía API serverless · /api/contact
              </div>
            </>
          )}
        </form>
      </div>
    </section>
  );
};

window.Contacto = Contacto;
