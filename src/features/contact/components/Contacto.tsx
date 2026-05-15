import { useState, type ChangeEvent } from 'react';
import { useLandingConfig } from '@/features/catalog/useLandingConfig';
import { contactoSchema, type ContactoForm } from '@/shared/validation/contactoSchema';
import { sendMail } from '@/services/mailService';
import { emailContactoCliente, emailContactoAdmin } from '@/services/emailTemplates';

type Tema = 'cafe' | 'mayorista' | 'caficultor' | 'prensa';

const TEMAS: [Tema, string][] = [
  ['cafe', 'Comprar café'],
  ['prensa', 'Prensa'],
];

const STATIC_CONTACTS: [string, string][] = [
  ['Correo', 'hola@tunaywasi.pe'],
  ['Lima', 'Jr. Independencia 240, Barranco'],
  ['Cosecha', 'Acopio en Cusco · San Martín · Puno'],
];

export default function Contacto() {
  const [values, setValues] = useState<ContactoForm>({ nombre: '', email: '', tema: 'cafe', mensaje: '' });
  const [touched, setTouched] = useState<Partial<Record<keyof ContactoForm, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const { data: landingConfig } = useLandingConfig();

  const contacts: [string, string][] = landingConfig?.contact
    ? [
        ['Correo', landingConfig.contact.email],
        ['Lima', landingConfig.contact.address.replace(', Lima', '')],
        ['Cosecha', 'Acopio en Cusco · San Martín · Puno'],
      ]
    : STATIC_CONTACTS;

  const result = contactoSchema.safeParse(values);
  const errors: Partial<Record<keyof ContactoForm, string>> = result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      ) as Partial<Record<keyof ContactoForm, string>>;

  const isValid = result.success;

  const showErr = (k: keyof ContactoForm) => touched[k] && errors[k];
  const setField = (k: keyof ContactoForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));
  const onBlur = (k: keyof ContactoForm) => () => setTouched((t) => ({ ...t, [k]: true }));

  const whatsappNumber = landingConfig?.contact?.whatsapp ?? '+51917959370';

  const buildWhatsAppUrl = () => {
    const temaLabels: Record<string, string> = { cafe: 'Comprar café', mayorista: 'Mayorista', caficultor: 'Soy caficultor', prensa: 'Prensa' };
    const msg = `Hola, soy ${values.nombre} (${values.email}).\nTema: ${temaLabels[values.tema] ?? values.tema}.\n${values.mensaje}`;
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(msg)}`;
  };

  const adminEmail = landingConfig?.contact?.adminEmail ?? 'tunaywasi@gmail.com';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nombre: true, email: true, mensaje: true });
    if (!isValid) return;
    setStatus('sending');
    let emailError = false;
    try {
      const { subject: subCliente, html: htmlCliente } = emailContactoCliente(values);
      const { subject: subAdmin, html: htmlAdmin } = emailContactoAdmin(values);
      await Promise.all([
        sendMail({ to: values.email, subject: subCliente, html: htmlCliente }),
        sendMail({ to: adminEmail, subject: subAdmin, html: htmlAdmin }),
      ]);
    } catch {
      emailError = true;
    }
    setStatus(emailError ? 'failed' : 'sent');
  };

  const inputBase: React.CSSProperties = {
    width: '100%', fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: '#1f3028',
    background: 'transparent', border: 'none', borderBottom: '1px solid #1f302844',
    padding: '14px 0 12px', outline: 'none', transition: 'border-color .25s ease',
  };

  return (
    <section id="contacto" style={{ background: '#f2e0cc', padding: '100px 36px', borderTop: '1px solid #1f302822' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 96, alignItems: 'start' }} className="tw-2col">
        <div>
          <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>05 — Conversemos</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 1.0, color: '#1f3028', margin: '24px 0 28px', letterSpacing: '-0.01em' }}>
            Escríbenos.<br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>Te respondemos</span><br />
            en menos de 24h.
          </h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7, color: '#533b22', maxWidth: 420, margin: 0 }}>
            ¿Una cafetería que quiere abastecerse directo? ¿Un periodista trabajando una historia del campo? ¿Un caficultor que quiere unirse al modelo? Esta es la puerta.
          </p>
          <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {contacts.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 18, alignItems: 'baseline', paddingBottom: 14, borderBottom: '1px solid #1f302822' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: '#533b22', textTransform: 'uppercase', minWidth: 80 }}>{k}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: '#1f3028' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} style={{ background: '#1f3028', color: '#f2e0cc', padding: 48, borderRadius: 28, boxShadow: '0 32px 70px -28px #533b22cc', display: 'flex', flexDirection: 'column', gap: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, border: '1px solid #c96e4b66', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: -10, right: -10, width: 160, height: 160, border: '1px solid #c96e4b33', borderRadius: '50%' }} />

          {status === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#8faf8a', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 44, color: '#1f3028' }}>✓</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, margin: 0, color: '#f2e0cc' }}>Mensaje recibido.</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297', marginTop: 14, maxWidth: 360, marginInline: 'auto', lineHeight: 1.6 }}>
                Gracias, {values.nombre.split(' ')[0]}. Te respondemos a {values.email} en menos de un día.
              </p>
            </div>
          ) : status === 'failed' ? (
            <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative' }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#c96e4b66', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 44, color: '#f2e0cc' }}>!</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 600, margin: 0, color: '#f2e0cc' }}>No pudimos enviar tu correo.</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: '#c4b297', marginTop: 14, maxWidth: 360, marginInline: 'auto', lineHeight: 1.6 }}>
                Contáctanos directamente por WhatsApp y te responderemos igual.
              </p>
              <a href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 24, background: '#25D366', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, padding: '16px 32px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 12px 28px -12px #25D36688' }}>
                Escribir por WhatsApp →
              </a>
            </div>
          ) : (
            <>
              <style>{`.tw-form-dark input, .tw-form-dark textarea { color: #f2e0cc !important; border-bottom-color: #f2e0cc44 !important; } .tw-form-dark input:focus, .tw-form-dark textarea:focus { border-bottom-color: #c96e4b !important; } .tw-form-dark label { color: #c4b297 !important; }`}</style>
              <div className="tw-form-dark" style={{ display: 'flex', flexDirection: 'column', gap: 28, position: 'relative' }}>
                {(['nombre', 'email'] as const).map((k) => (
                  <div key={k} style={{ position: 'relative' }}>
                    <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: showErr(k) ? '#c96e4b' : '#533b22', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'color .25s ease' }}>
                      <span>{k === 'nombre' ? 'Tu nombre' : 'Correo'}</span>
                      {showErr(k) && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: '#c96e4b' }}>{errors[k]}</span>}
                      {!showErr(k) && touched[k] && !errors[k] && <span style={{ color: '#8faf8a', fontSize: 13 }}>✓</span>}
                    </label>
                    <input type={k === 'email' ? 'email' : 'text'} value={values[k]} onChange={setField(k)} onBlur={onBlur(k)}
                      style={{ ...inputBase, borderBottomColor: showErr(k) ? '#c96e4b' : (touched[k] && !errors[k] ? '#8faf8a' : '#1f302844') }} />
                  </div>
                ))}

                <div>
                  <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: '#c4b297', textTransform: 'uppercase' }}>¿De qué quieres hablar?</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    {TEMAS.map(([v, l]) => (
                      <button type="button" key={v} onClick={() => setValues((s) => ({ ...s, tema: v }))} style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 500, padding: '10px 16px', borderRadius: 999, cursor: 'pointer', background: values.tema === v ? '#c96e4b' : 'transparent', color: values.tema === v ? '#f2e0cc' : '#c4b297', border: `1px solid ${values.tema === v ? '#c96e4b' : '#c4b29744'}`, transition: 'all .25s ease' }}>{l}</button>
                    ))}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: showErr('mensaje') ? '#c96e4b' : '#533b22', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tu mensaje</span>
                    {showErr('mensaje') && <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, color: '#c96e4b' }}>{errors.mensaje}</span>}
                  </label>
                  <textarea value={values.mensaje} onChange={setField('mensaje')} onBlur={onBlur('mensaje')} rows={4}
                    style={{ ...inputBase, borderBottomColor: showErr('mensaje') ? '#c96e4b' : '#1f302844', minHeight: 110, resize: 'vertical', paddingTop: 14 }} />
                </div>
              </div>

              <button type="submit" disabled={status === 'sending'} style={{ marginTop: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1f3028', background: isValid ? '#c96e4b' : '#c4b29766', padding: '20px 28px', borderRadius: 999, border: 'none', cursor: isValid && status !== 'sending' ? 'pointer' : 'not-allowed', transition: 'all .35s ease', boxShadow: '0 18px 36px -16px #533b22cc' }}
                onMouseEnter={(e) => { if (isValid && status !== 'sending') (e.currentTarget as HTMLElement).style.background = '#f2e0cc'; }}
                onMouseLeave={(e) => { if (isValid && status !== 'sending') (e.currentTarget as HTMLElement).style.background = '#c96e4b'; }}>
                {status === 'sending' ? 'Enviando…' : 'Enviar mensaje →'}
              </button>

            </>
          )}
        </form>
      </div>
    </section>
  );
}
