/**
 * RegistroCaficultor.tsx — Registro público para caficultores
 * Flujo 2 pasos: Paso 1 (cuenta) → Paso 2 (finca) → Portal
 * Ruta: #/registro-caficultor
 */
import React, { useState } from 'react'
import { registrarCaficultor } from '../authService'

// ─── Design system ────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  bgCard: '#111111',
  bgInput: '#181818',
  border: '#222222',
  borderFocus: '#c96e4b',
  cream: '#f2e0cc',
  creamDim: '#c4b297',
  terra: '#c96e4b',
  terraLight: '#d4825f',
  sage: '#8faf8a',
  green: '#1f3028',
  white: '#ffffff',
  muted: '#555555',
  textSub: '#888888',
  red: '#e05a4e',
}

const REGIONES = ['Cajamarca', 'Amazonas', 'San Martín', 'Cusco', 'Puno', 'Junín', 'Pasco', 'Huánuco', 'Ayacucho']
const VARIEDADES = ['Bourbon', 'Caturra', 'Typica', 'Geisha', 'Catimor', 'Pache', 'Wush Wush', 'Otra']

type Paso = 1 | 2 | 'confirmacion'

// ─── Atoms ────────────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 8,
  background: C.bgInput, color: C.cream,
  fontSize: 14, fontFamily: 'Montserrat, sans-serif',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: C.textSub, marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label style={labelStyle}>
      {label}{required && <span style={{ color: C.terra }}> *</span>}
    </label>
    {children}
  </div>
)

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ paso: Paso }> = ({ paso }) => {
  const actual = paso === 'confirmacion' ? 3 : (paso as number)
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {[1, 2].map(p => (
        <div key={p} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: p <= actual ? C.terra : C.border,
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

// ─── Panel derecho — propuesta de valor ───────────────────────────────────────

const PanelPropuesta: React.FC<{ nombre: string; region: string; kgDisponibles: number; paso: Paso }> = ({ nombre, region, kgDisponibles, paso }) => {
  const tieneInfo = nombre || region

  return (
    <div style={{
      position: 'sticky', top: 76,
      background: C.bgCard, borderRadius: 16,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.green} 0%, #0f1f14 100%)`,
        padding: '28px 24px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Para caficultores
        </p>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, lineHeight: 1.2 }}>
          Tu café,<br />tu precio.
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: C.creamDim, lineHeight: 1.6 }}>
          Conectamos tu lote directamente con cafeterías peruanas que buscan café de especialidad con origen trazado.
        </p>
      </div>

      {/* Preview del perfil */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {paso === 1 ? 'Así aparecerás en la plataforma' : 'Tu perfil'}
        </p>
        <div style={{
          background: '#0f0f0f', borderRadius: 10,
          border: `1px solid ${C.border}`, padding: '14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: tieneInfo ? `linear-gradient(135deg, ${C.green}, ${C.sage}44)` : C.border,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0, border: `2px solid ${tieneInfo ? C.sage + '66' : C.border}`,
          }}>
            🧑‍🌾
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: tieneInfo ? C.cream : C.muted, fontFamily: 'Cormorant Garamond, serif' }}>
              {nombre || 'Tu nombre aquí'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: tieneInfo ? C.sage : C.muted }}>
              {region || 'Región'}{kgDisponibles > 0 ? ` · ${kgDisponibles} kg disponibles` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div style={{ padding: '20px 24px' }}>
        <p style={{ margin: '0 0 14px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Lo que obtienes
        </p>
        {[
          { icon: '💰', titulo: 'Tú fijas el precio', desc: 'Ingresa tus costos y elige tu margen. Sin negociaciones.' },
          { icon: '🌿', titulo: 'Sin comisión en fase 1', desc: 'Mientras validamos el modelo juntos, el 100% es tuyo.' },
          { icon: '📊', titulo: 'Dashboard de pedidos', desc: 'Gestiona stock, despachos y pagos desde tu portal.' },
        ].map(b => (
          <div key={b.titulo} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.cream }}>{b.titulo}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ margin: '0 24px 24px', padding: '14px', borderRadius: 10, background: `${C.terra}11`, border: `1px solid ${C.terra}33` }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.terra }}>3 caficultores activos ahora</p>
        <p style={{ margin: 0, fontSize: 11, color: C.creamDim, lineHeight: 1.5 }}>
          Cajamarca · San Ignacio · Jaén — vendiendo a cafeterías en Lima
        </p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const RegistroCaficultor: React.FC<{ isDemo?: boolean }> = ({ isDemo = false }) => {
  // Paso 1 — Cuenta
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // Paso 2 — Finca
  const [region, setRegion] = useState('')
  const [distrito, setDistrito] = useState('')
  const [altitudMsnm, setAltitudMsnm] = useState<number>(0)
  const [kgDisponibles, setKgDisponibles] = useState<number>(0)
  const [variedadPrincipal, setVariedadPrincipal] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')

  const [paso, setPaso] = useState<Paso>(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  function inputStyle(field: string): React.CSSProperties {
    return {
      ...inputBase,
      border: `1px solid ${focused === field ? C.borderFocus : C.border}`,
      boxShadow: focused === field ? `0 0 0 3px ${C.terra}18` : 'none',
    }
  }

  function validarPaso1() {
    if (!nombre.trim()) return 'Ingresa tu nombre completo.'
    if (!email.includes('@')) return 'Ingresa un email válido.'
    if (!telefono.trim()) return 'Ingresa tu número de WhatsApp.'
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    if (password !== passwordConfirm) return 'Las contraseñas no coinciden.'
    return null
  }

  function handlePaso1() {
    const err = validarPaso1()
    if (err) { setError(err); return }
    setError(null)
    setPaso(2)
  }

  async function handlePaso2() {
    if (!region || !distrito || !variedadPrincipal) {
      setError('Completa los campos obligatorios.')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      if (!isDemo) {
        await registrarCaficultor(email, password, nombre, {
          region, distrito, altitudMsnm, kgDisponibles, variedadPrincipal, telefono,
          fotoUrl: fotoUrl || undefined,
        })
      }
      window.location.hash = '#/caficultor-portal'
    } catch (e: unknown) {
      const msg = String((e as { message?: string; code?: string })?.message ?? (e as { code?: string })?.code ?? e)
      if (msg.includes('email-already-in-use')) {
        setError('Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?')
      } else {
        setError('No se pudo crear tu cuenta. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`
        @media (max-width: 700px) {
          .registro-caf-grid { grid-template-columns: 1fr !important; }
          .panel-propuesta-caf { display: none !important; }
          .reg-caf-grid-2col { grid-template-columns: 1fr !important; }
        }
        input::placeholder, textarea::placeholder, select option { color: #555; }
        select { appearance: none; }
      `}</style>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px', height: 60,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {paso === 2 ? (
          <button onClick={() => { setError(null); setPaso(1) }} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', padding: 0 }}>
            ← Volver
          </button>
        ) : (
          <a href="#/" style={{ fontSize: 12, color: C.textSub, textDecoration: 'none' }}>← Inicio</a>
        )}
        <div style={{ width: 1, height: 16, background: C.border }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>Tunay Wasi</span>
      </header>

      <div
        className="registro-caf-grid"
        style={{
          maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px',
          display: 'grid', gridTemplateColumns: '1fr 420px',
          gap: 48, alignItems: 'start',
        }}
      >
        {/* Columna izquierda — form */}
        <div>
          <ProgressBar paso={paso} />

          {/* ── PASO 1: Cuenta ── */}
          {paso === 1 && (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paso 1 de 2</p>
              <h1 style={{ margin: '0 0 6px', fontSize: 28, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Crea tu cuenta</h1>
              <p style={{ margin: '0 0 28px', fontSize: 13, color: C.textSub }}>Para empezar a vender tu café directamente a negocios peruanos.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Nombre completo" required>
                  <input type="text" placeholder="Ej. María Quispe Condori" value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)}
                    style={inputStyle('nombre')} />
                </Field>
                <Field label="WhatsApp" required>
                  <input type="tel" placeholder="+51 987 654 321" value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    onFocus={() => setFocused('tel')} onBlur={() => setFocused(null)}
                    style={inputStyle('tel')} />
                </Field>
                <Field label="Email" required>
                  <input type="email" placeholder="tu@correo.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    style={inputStyle('email')} />
                </Field>
                <div className="reg-caf-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Contraseña" required>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                      style={inputStyle('pass')} />
                  </Field>
                  <Field label="Confirmar" required>
                    <input type="password" placeholder="Repite tu contraseña" value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      onFocus={() => setFocused('passConfirm')} onBlur={() => setFocused(null)}
                      style={inputStyle('passConfirm')} />
                  </Field>
                </div>
              </div>

              {error && <p style={{ margin: '14px 0 0', padding: '10px 14px', borderRadius: 8, background: `${C.red}18`, border: `1px solid ${C.red}44`, fontSize: 13, color: C.red }}>{error}</p>}

              <button onClick={handlePaso1} style={{ marginTop: 24, width: '100%', padding: '15px', borderRadius: 10, background: C.terra, color: C.white, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Siguiente →
              </button>

              <p style={{ margin: '16px 0 0', fontSize: 12, color: C.muted, textAlign: 'center' }}>
                ¿Ya tienes cuenta?{' '}
                <a href="#/login" style={{ color: C.terra, textDecoration: 'none', fontWeight: 700 }}>Inicia sesión</a>
              </p>
            </div>
          )}

          {/* ── PASO 2: Finca ── */}
          {paso === 2 && (
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paso 2 de 2</p>
              <h1 style={{ margin: '0 0 6px', fontSize: 28, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Tu finca</h1>
              <p style={{ margin: '0 0 28px', fontSize: 13, color: C.textSub }}>Cuéntanos sobre tu producción. Puedes actualizar esto después.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="reg-caf-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Región" required>
                    <select value={region} onChange={e => setRegion(e.target.value)}
                      onFocus={() => setFocused('region')} onBlur={() => setFocused(null)}
                      style={{ ...inputStyle('region'), cursor: 'pointer' }}>
                      <option value="">Seleccionar...</option>
                      {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Distrito / localidad" required>
                    <input type="text" placeholder="Ej. San Ignacio" value={distrito}
                      onChange={e => setDistrito(e.target.value)}
                      onFocus={() => setFocused('distrito')} onBlur={() => setFocused(null)}
                      style={inputStyle('distrito')} />
                  </Field>
                </div>

                <div className="reg-caf-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Altitud aprox. (msnm)">
                    <input type="number" placeholder="1800" value={altitudMsnm || ''}
                      onChange={e => setAltitudMsnm(Number(e.target.value))}
                      onFocus={() => setFocused('altitud')} onBlur={() => setFocused(null)}
                      style={inputStyle('altitud')} min={0} max={5000} />
                  </Field>
                  <Field label="Kg disponibles ahora">
                    <input type="number" placeholder="100" value={kgDisponibles || ''}
                      onChange={e => setKgDisponibles(Number(e.target.value))}
                      onFocus={() => setFocused('kg')} onBlur={() => setFocused(null)}
                      style={inputStyle('kg')} min={0} />
                  </Field>
                </div>

                <Field label="Variedad principal" required>
                  <select value={variedadPrincipal} onChange={e => setVariedadPrincipal(e.target.value)}
                    onFocus={() => setFocused('variedad')} onBlur={() => setFocused(null)}
                    style={{ ...inputStyle('variedad'), cursor: 'pointer' }}>
                    <option value="">Seleccionar...</option>
                    {VARIEDADES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>

                <Field label="Foto de tu finca (URL — opcional)">
                  <input type="url" placeholder="https://..." value={fotoUrl}
                    onChange={e => setFotoUrl(e.target.value)}
                    onFocus={() => setFocused('foto')} onBlur={() => setFocused(null)}
                    style={inputStyle('foto')} />
                </Field>
              </div>

              {error && <p style={{ margin: '14px 0 0', padding: '10px 14px', borderRadius: 8, background: `${C.red}18`, border: `1px solid ${C.red}44`, fontSize: 13, color: C.red }}>{error}</p>}

              <button onClick={handlePaso2} disabled={enviando} style={{
                marginTop: 24, width: '100%', padding: '15px', borderRadius: 10,
                background: enviando ? C.muted : C.terra,
                color: C.white, border: 'none', fontSize: 15, fontWeight: 700,
                cursor: enviando ? 'not-allowed' : 'pointer',
              }}>
                {enviando ? 'Creando cuenta...' : 'Crear cuenta →'}
              </button>
            </div>
          )}
        </div>

        {/* Columna derecha — panel propuesta de valor */}
        <div className="panel-propuesta-caf">
          <PanelPropuesta nombre={nombre} region={region} kgDisponibles={kgDisponibles} paso={paso} />
        </div>
      </div>
    </div>
  )
}

export default RegistroCaficultor
