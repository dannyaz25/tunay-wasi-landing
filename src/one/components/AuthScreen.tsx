/**
 * AuthScreen.tsx — Login para TunayWasi ONE
 * Opciones: Google Sign-In + Email/Password
 */
import React, { useState } from 'react'
import { loginConGoogle, completarRegistroGoogle, login, registrar, resetPassword } from '../authService'
import { fetchUsuario } from '../service'
import type { RolONE } from '../types'
import { track, setAnalyticsUser } from '../analytics'

const C = {
  bg: '#0a0a0a',
  bgCard: '#141414',
  bgCard2: '#1a1a1a',
  cream: '#f2e0cc',
  terra: '#c96e4b',
  sage: '#8faf8a',
  tan: '#c4b297',
  white: '#ffffff',
  border: '#2a2a2a',
  red: '#e74c3c',
}

interface Props {
  onSuccess?: () => void
  mensajePrevia?: string
}

type Paso = 'inicio' | 'email_login' | 'email_registro' | 'reset' | 'seleccion_rol' | 'cargando'

const AuthScreen: React.FC<Props> = ({ mensajePrevia }) => {
  const [paso, setPaso] = useState<Paso>('inicio')
  const [error, setError] = useState<string | null>(null)
  const [resetEnviado, setResetEnviado] = useState(false)

  // Google pending
  const [pendingUid, setPendingUid] = useState<string | null>(null)
  const [pendingNombre, setPendingNombre] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  // Email form
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 8,
    border: `1px solid ${C.border}`,
    fontSize: 14, fontFamily: 'Montserrat, sans-serif',
    color: C.cream, background: '#1a1a1a',
    outline: 'none', marginBottom: 14,
  }

  function traducirError(code: string): string {
    const map: Record<string, string> = {
      'auth/user-not-found': 'No encontramos una cuenta con ese email.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
      'auth/invalid-email': 'El email no es válido.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
      'auth/invalid-credential': 'Email o contraseña incorrectos.',
    }
    return map[code] ?? 'Ocurrió un error. Intenta de nuevo.'
  }

  function redirigirSegunRol(rol: RolONE) {
    // Si hay carrito guardado (localStorage), retomar el checkout
    try {
      if (rol !== 'caficultor' && rol !== 'admin' && localStorage.getItem('one_carrito_items')) {
        window.location.hash = '#/checkout'
        return
      }
    } catch { /* ok */ }
    if (rol === 'caficultor') { window.location.hash = '#/caficultor-portal'; return }
    if (rol === 'admin') { window.location.hash = '#/admin'; return }
    window.location.hash = '#/portal'
  }

  // ── Google ──────────────────────────────────────────────────────────────────

  async function handleGoogle() {
    setError(null)
    setPaso('cargando')
    try {
      const { uid, esNuevo } = await loginConGoogle()
      if (esNuevo) {
        const user = (await import('@/shared/firebase')).auth.currentUser
        setPendingUid(uid)
        setPendingNombre(user?.displayName ?? '')
        setPendingEmail(user?.email ?? '')
        setPaso('seleccion_rol')
      } else {
        const u = await fetchUsuario(uid)
        setAnalyticsUser(uid, u.rol)
        track('login_exitoso', { rolUsuario: u.rol })
        redirigirSegunRol(u.rol)
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setPaso('inicio'); return
      }
      setError(traducirError(code))
      setPaso('inicio')
    }
  }

  async function handleSeleccionarRol(rol: RolONE) {
    if (!pendingUid) return
    setPaso('cargando')
    try {
      await completarRegistroGoogle(pendingUid, pendingNombre, pendingEmail, rol)
      setAnalyticsUser(pendingUid, rol)
      track('registro_completado', { rolUsuario: rol })
      redirigirSegunRol(rol)
    } catch {
      setError('Error al guardar tu perfil. Intenta de nuevo.')
      setPaso('seleccion_rol')
    }
  }

  // ── Email/Password ───────────────────────────────────────────────────────────

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await login(email, password)
      const { auth } = await import('@/shared/firebase')
      const uid = auth.currentUser?.uid
      if (uid) {
        const u = await fetchUsuario(uid)
        setAnalyticsUser(uid, u.rol)
        track('login_exitoso', { rolUsuario: u.rol })
        redirigirSegunRol(u.rol)
      } else {
        window.location.hash = '#/portal'
      }
    } catch (e: unknown) {
      setError(traducirError((e as { code?: string }).code ?? ''))
    } finally {
      setCargando(false)
    }
  }

  async function handleEmailRegistro(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('Ingresa tu nombre.'); return }
    setError(null)
    setCargando(true)
    try {
      await registrar(email, password, nombre.trim())
      const { auth } = await import('@/shared/firebase')
      const uid = auth.currentUser?.uid
      if (uid) { setAnalyticsUser(uid, 'negocio') }
      track('registro_completado', { rolUsuario: 'negocio' })
      redirigirSegunRol('negocio')
    } catch (e: unknown) {
      setError(traducirError((e as { code?: string }).code ?? ''))
    } finally {
      setCargando(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await resetPassword(email)
      setResetEnviado(true)
    } catch (e: unknown) {
      setError(traducirError((e as { code?: string }).code ?? ''))
    } finally {
      setCargando(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 5%',
        background: 'rgba(10,10,10,0.95)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.08em' }}>
            TUNAY WASI
          </span>
        </a>
        <a href="#/" style={{ fontSize: 12, color: C.tan, textDecoration: 'none' }}>← Ver catálogo</a>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '80px 20px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400, background: C.bgCard, borderRadius: 16, border: `1px solid ${C.border}`, padding: '36px 28px' }}>

          {/* ── Cargando ── */}
          {paso === 'cargando' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: C.tan, fontSize: 14 }}>Cargando...</p>
            </div>
          )}

          {/* ── Inicio ── */}
          {paso === 'inicio' && (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: 26, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>
                Bienvenido
              </h2>
              <p style={{ margin: '0 0 28px', fontSize: 12, color: C.tan }}>Café peruano directo del productor</p>

              {mensajePrevia && (
                <div style={{ background: `${C.terra}18`, border: `1px solid ${C.terra}44`, borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: C.cream, lineHeight: 1.5 }}>{mensajePrevia}</p>
                </div>
              )}

              {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 16, padding: '10px 14px', background: `${C.red}15`, borderRadius: 8 }}>{error}</p>}

              {/* Google */}
              <button onClick={handleGoogle} style={{
                width: '100%', padding: '13px 0', borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.white,
                color: '#1a1a1a', fontSize: 14, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginBottom: 12,
              }}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Continuar con Google
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, color: C.tan }}>o</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* Email buttons */}
              <button onClick={() => { setError(null); setPaso('email_login') }} style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                border: 'none', background: C.terra,
                color: C.white, fontSize: 14, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
                marginBottom: 8,
              }}>
                Ingresar con email
              </button>

              <button onClick={() => { setError(null); setPaso('email_registro') }} style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                border: `1px solid ${C.border}`, background: 'none',
                color: C.cream, fontSize: 14, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
              }}>
                Registrarme
              </button>

              <p style={{ marginTop: 16, fontSize: 11, color: C.tan, textAlign: 'center', lineHeight: 1.6 }}>
                Al ingresar aceptas recibir comunicaciones de tu pedido por WhatsApp.
              </p>
            </>
          )}

          {/* ── Login email ── */}
          {paso === 'email_login' && (
            <>
              <button onClick={() => { setError(null); setPaso('inicio') }} style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 12, marginBottom: 16, padding: 0 }}>
                ← Volver
              </button>
              <h2 style={{ margin: '0 0 24px', fontSize: 24, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>Ingresar</h2>

              {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 14, padding: '10px 14px', background: `${C.red}15`, borderRadius: 8 }}>{error}</p>}

              <form onSubmit={handleEmailLogin}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.tan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
                <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.tan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Contraseña</label>
                  <button type="button" onClick={() => { setError(null); setPaso('reset') }} style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 11 }}>
                    ¿Olvidaste la contraseña?
                  </button>
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required style={inputStyle} />

                <button type="submit" disabled={cargando} style={{
                  width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
                  background: C.terra, color: C.white, fontSize: 14, fontWeight: 700,
                  fontFamily: 'Montserrat, sans-serif', cursor: cargando ? 'not-allowed' : 'pointer',
                  opacity: cargando ? 0.6 : 1, marginTop: 4,
                }}>
                  {cargando ? 'Cargando...' : 'Ingresar →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <p style={{ margin: 0, fontSize: 13, color: C.tan }}>
                  ¿No tienes cuenta?{' '}
                  <button onClick={() => { setError(null); setPaso('email_registro') }} style={{ background: 'none', border: 'none', color: C.terra, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    Regístrate
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── Registro email ── */}
          {paso === 'email_registro' && (
            <>
              <button onClick={() => { setError(null); setPaso('inicio') }} style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 12, marginBottom: 16, padding: 0 }}>
                ← Volver
              </button>
              <h2 style={{ margin: '0 0 24px', fontSize: 24, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>Crear cuenta</h2>

              {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 14, padding: '10px 14px', background: `${C.red}15`, borderRadius: 8 }}>{error}</p>}

              <form onSubmit={handleEmailRegistro}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.tan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tu nombre</label>
                <input type="text" placeholder="Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} autoComplete="name" required style={inputStyle} />

                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.tan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
                <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} />

                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.tan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required style={inputStyle} />

                <button type="submit" disabled={cargando} style={{
                  width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
                  background: C.terra, color: C.white, fontSize: 14, fontWeight: 700,
                  fontFamily: 'Montserrat, sans-serif', cursor: cargando ? 'not-allowed' : 'pointer',
                  opacity: cargando ? 0.6 : 1, marginTop: 4,
                }}>
                  {cargando ? 'Cargando...' : 'Crear cuenta →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <p style={{ margin: 0, fontSize: 13, color: C.tan }}>
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => { setError(null); setPaso('email_login') }} style={{ background: 'none', border: 'none', color: C.terra, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                    Ingresar
                  </button>
                </p>
              </div>

              <p style={{ marginTop: 12, fontSize: 11, color: C.tan, textAlign: 'center', lineHeight: 1.5 }}>
                Al crear tu cuenta aceptas recibir comunicaciones de tu pedido por WhatsApp.
              </p>
            </>
          )}

          {/* ── Reset password ── */}
          {paso === 'reset' && (
            <>
              <button onClick={() => { setError(null); setResetEnviado(false); setPaso('email_login') }} style={{ background: 'none', border: 'none', color: C.tan, cursor: 'pointer', fontSize: 12, marginBottom: 16, padding: 0 }}>
                ← Volver
              </button>
              <h2 style={{ margin: '0 0 6px', fontSize: 24, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>Recuperar contraseña</h2>
              <p style={{ margin: '0 0 24px', fontSize: 12, color: C.tan }}>Te enviamos un link a tu email</p>

              {resetEnviado ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: 36, marginBottom: 12 }}>📬</p>
                  <p style={{ fontSize: 14, color: C.cream, lineHeight: 1.6 }}>
                    Enviamos el link a <strong>{email}</strong>
                  </p>
                </div>
              ) : (
                <>
                  {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 14, padding: '10px 14px', background: `${C.red}15`, borderRadius: 8 }}>{error}</p>}
                  <form onSubmit={handleReset}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: C.tan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
                    <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required style={inputStyle} />
                    <button type="submit" disabled={cargando} style={{
                      width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
                      background: C.terra, color: C.white, fontSize: 14, fontWeight: 700,
                      fontFamily: 'Montserrat, sans-serif', cursor: cargando ? 'not-allowed' : 'pointer',
                      opacity: cargando ? 0.6 : 1,
                    }}>
                      {cargando ? 'Enviando...' : 'Enviar link →'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}

          {/* ── Selección de rol (primera vez con Google) ── */}
          {paso === 'seleccion_rol' && (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: 24, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>
                ¿Cómo usarás TunayWasi?
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: C.tan, lineHeight: 1.5 }}>
                Elige tu perfil. Podrás cambiarlo después.
              </p>

              {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 16, padding: '10px 14px', background: `${C.red}15`, borderRadius: 8 }}>{error}</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => handleSeleccionarRol('negocio')}
                  style={{ background: C.bgCard2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.terra)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>☕ Tengo una cafetería o negocio</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.tan, lineHeight: 1.4 }}>Quiero comprar café directamente a productores.</p>
                </button>

                <button
                  onClick={() => handleSeleccionarRol('caficultor')}
                  style={{ background: C.bgCard2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.sage)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>🌿 Soy caficultor</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.tan, lineHeight: 1.4 }}>Quiero vender mi café directo a las cafeterías.</p>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default AuthScreen
