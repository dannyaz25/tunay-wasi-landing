/**
 * AuthScreen.tsx — Login y registro para TunayWasi ONE
 *
 * Modo login: email + password
 * Modo registro: nombre + email + password
 * Post-registro: crea doc en one_usuarios con rol emprendedor
 */
import React, { useState } from 'react'
import { login, registrar, resetPassword } from '../authService'

const C = {
  cream: '#f2e0cc',
  green: '#1f3028',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  brown: '#533b22',
  white: '#ffffff',
  red: '#c0392b',
}

type Modo = 'login' | 'registro' | 'reset'

interface Props {
  onSuccess: () => void
  mensajePrevia?: string   // Ej: "Para continuar con tu pedido, inicia sesión"
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{
    display: 'block', marginBottom: 6,
    fontSize: 12, fontWeight: 600,
    color: C.brown, fontFamily: 'Montserrat, sans-serif',
    letterSpacing: '0.05em', textTransform: 'uppercase',
  }}>
    {children}
  </label>
)

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: '100%', boxSizing: 'border-box',
      padding: '12px 14px', borderRadius: 8,
      border: `1.5px solid ${C.tan}`,
      fontSize: 15, fontFamily: 'Montserrat, sans-serif',
      color: C.green, background: C.white,
      outline: 'none', marginBottom: 16,
      ...props.style,
    }}
  />
)

const AuthScreen: React.FC<Props> = ({ onSuccess, mensajePrevia }) => {
  const [modo, setModo] = useState<Modo>('login')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetEnviado, setResetEnviado] = useState(false)

  function traducirError(code: string): string {
    const errores: Record<string, string> = {
      'auth/user-not-found': 'No encontramos una cuenta con ese email.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese email. Inicia sesión.',
      'auth/invalid-email': 'El email no es válido.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
      'auth/invalid-credential': 'Email o contraseña incorrectos.',
    }
    return errores[code] ?? 'Ocurrió un error. Intenta de nuevo.'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      if (modo === 'login') {
        await login(email, password)
      } else if (modo === 'registro') {
        if (!nombre.trim()) { setError('Ingresa tu nombre.'); setCargando(false); return }
        await registrar(email, password, nombre.trim())
      } else {
        await resetPassword(email)
        setResetEnviado(true)
        setCargando(false)
        return
      }
      onSuccess()
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      setError(traducirError(code))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{ background: C.green, padding: '20px 24px' }}>
        <h1 style={{
          margin: 0, color: C.cream, fontSize: 22,
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
        }}>
          TUNAY WASI
        </h1>
        <p style={{ margin: 0, color: C.sage, fontSize: 11, letterSpacing: '0.06em' }}>
          CAFÉ PERUANO · DIRECTO DEL PRODUCTOR
        </p>
      </header>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Mensaje contextual */}
        {mensajePrevia && (
          <div style={{
            background: C.terra + '18', border: `1px solid ${C.terra}55`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 28,
          }}>
            <p style={{ margin: 0, fontSize: 14, color: C.brown, lineHeight: 1.5 }}>
              {mensajePrevia}
            </p>
          </div>
        )}

        {/* Título */}
        <h2 style={{
          margin: '0 0 28px', fontSize: 26,
          fontFamily: 'Cormorant Garamond, serif', color: C.green, fontWeight: 700,
        }}>
          {modo === 'login' && 'Ingresa a tu cuenta'}
          {modo === 'registro' && 'Crea tu cuenta'}
          {modo === 'reset' && 'Recuperar contraseña'}
        </h2>

        {/* Reset enviado */}
        {resetEnviado ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📬</p>
            <p style={{ fontSize: 15, color: C.green, lineHeight: 1.6 }}>
              Te enviamos un link para restablecer tu contraseña a <strong>{email}</strong>.
            </p>
            <button onClick={() => { setModo('login'); setResetEnviado(false) }}
              style={{
                marginTop: 20, background: 'none', border: 'none',
                color: C.terra, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}>
              Volver al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Nombre — solo en registro */}
            {modo === 'registro' && (
              <div>
                <Label>Tu nombre</Label>
                <Input
                  type="text"
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Password — no en reset */}
            {modo !== 'reset' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <Label>Contraseña</Label>
                  {modo === 'login' && (
                    <button type="button" onClick={() => setModo('reset')}
                      style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 12 }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p style={{
                color: C.red, fontSize: 13, marginBottom: 16,
                padding: '10px 14px', background: C.red + '10',
                borderRadius: 8, lineHeight: 1.4,
              }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 10,
                border: 'none', background: C.terra, color: C.white,
                fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                cursor: cargando ? 'not-allowed' : 'pointer',
                opacity: cargando ? 0.6 : 1, letterSpacing: '0.03em',
              }}>
              {cargando
                ? 'Cargando...'
                : modo === 'login'
                  ? 'Ingresar →'
                  : modo === 'registro'
                    ? 'Crear cuenta →'
                    : 'Enviar link de recuperación →'
              }
            </button>
          </form>
        )}

        {/* Switch entre login / registro */}
        {!resetEnviado && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            {modo === 'login' ? (
              <p style={{ fontSize: 14, color: C.brown }}>
                ¿No tienes cuenta?{' '}
                <button onClick={() => { setModo('registro'); setError(null) }}
                  style={{ background: 'none', border: 'none', color: C.terra, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  Regístrate
                </button>
              </p>
            ) : modo === 'registro' ? (
              <p style={{ fontSize: 14, color: C.brown }}>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => { setModo('login'); setError(null) }}
                  style={{ background: 'none', border: 'none', color: C.terra, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                  Ingresar
                </button>
              </p>
            ) : (
              <button onClick={() => { setModo('login'); setError(null) }}
                style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 13 }}>
                ← Volver al login
              </button>
            )}
          </div>
        )}

        {/* Footer legal mínimo */}
        {modo === 'registro' && (
          <p style={{
            marginTop: 20, fontSize: 11, color: C.tan,
            textAlign: 'center', lineHeight: 1.5,
          }}>
            Al crear tu cuenta aceptas recibir comunicaciones relacionadas con tu pedido vía WhatsApp.
          </p>
        )}
      </div>
    </div>
  )
}

export default AuthScreen
