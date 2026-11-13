/**
 * BetaRegistro.tsx — Formulario de registro para beta de TunayWasi ONE
 * POST a la Lambda (API Gateway) → agrega tester en App Distribution + envía email
 */
import React, { useState } from 'react'

const C = {
  bg:         '#0a0a0a',
  bgCard:     '#141414',
  cream:      '#f2e0cc',
  creamDim:   '#c4b297',
  terra:      '#c96e4b',
  sage:       '#8faf8a',
  border:     '#222222',
  muted:      '#555555',
  mutedLight: '#777777',
  white:      '#ffffff',
  error:      '#e05c5c',
}

// Se setea después del deploy de la Lambda.
// En desarrollo apunta a localhost con serverless-offline si quieres probar.
const LAMBDA_URL = import.meta.env.VITE_BETA_INVITE_URL || ''

const PLAY_STORE_URL = 'https://appdistribution.firebase.google.com/testerapps/1:399522765847:android:98ef173a366e5ba6ddd052/releases/3snss7d78jr78'

type Rol = 'emprendedor' | 'caficultor'
type Estado = 'idle' | 'loading' | 'success' | 'error'

interface BetaRegistroProps {
  rolDefecto?: Rol
  acento?: string
  titulo?: string
  subtitulo?: string
  origen?: string
}

export const BetaRegistro: React.FC<BetaRegistroProps> = ({
  rolDefecto = 'emprendedor',
  acento = C.terra,
  titulo = 'Únete a la beta',
  subtitulo = 'Regístrate y te enviamos el link de descarga directo a tu correo.',
  origen = 'landing',
}) => {
  const [nombre, setNombre] = useState('')
  const [email, setEmail]   = useState('')
  const [rol, setRol]       = useState<Rol>(rolDefecto)
  const [estado, setEstado] = useState<Estado>('idle')
  const [msg, setMsg]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !email.trim()) return
    setEstado('loading')

    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim().toLowerCase(), rol, origen }),
      })

      const data = await res.json() as { ok: boolean; error?: string }

      if (!res.ok || !data.ok) {
        setMsg(data.error || 'Error al registrarse')
        setEstado('error')
        return
      }

      setEstado('success')
    } catch (err) {
      console.error('BetaRegistro error', err)
      setMsg('No se pudo conectar. Intenta de nuevo.')
      setEstado('error')
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (estado === 'success') {
    return (
      <div style={{
        background: '#0a1f13', border: `1px solid ${C.sage}55`,
        borderRadius: 16, padding: '32px 28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 24,
          fontWeight: 700, color: C.cream, margin: '0 0 8px',
        }}>
          ¡Listo! Revisa tu correo
        </h3>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 13,
          color: C.creamDim, lineHeight: 1.7, margin: '0 0 20px',
        }}>
          Te enviamos el link de descarga a <strong style={{ color: C.cream }}>{email}</strong>.
          Puede tardar unos minutos — revisa también tu carpeta de spam.
        </p>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 24px', borderRadius: 8,
          background: `linear-gradient(135deg, ${acento}, ${acento}cc)`,
          color: C.white, fontSize: 13, fontWeight: 700,
          fontFamily: 'Montserrat, sans-serif', textDecoration: 'none',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
          Descargar ahora
        </a>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${acento}33`,
      borderRadius: 16, padding: '28px 24px',
    }}>
      <h3 style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: 22,
        fontWeight: 700, color: C.cream, margin: '0 0 6px',
      }}>
        {titulo}
      </h3>
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: 13,
        color: C.creamDim, lineHeight: 1.6, margin: '0 0 20px',
      }}>
        {subtitulo}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Nombre */}
        <div>
          <label style={{
            display: 'block', marginBottom: 5,
            fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600,
            color: C.mutedLight, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Nombre</label>
          <input
            type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre" required
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', borderRadius: 8,
              background: '#0a0a0a', border: `1px solid ${C.border}`,
              color: C.cream, fontFamily: 'Montserrat, sans-serif', fontSize: 14, outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = acento + '88' }}
            onBlur={e => { e.currentTarget.style.borderColor = C.border }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{
            display: 'block', marginBottom: 5,
            fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600,
            color: C.mutedLight, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Correo electrónico</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tucorreo@gmail.com" required
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', borderRadius: 8,
              background: '#0a0a0a', border: `1px solid ${C.border}`,
              color: C.cream, fontFamily: 'Montserrat, sans-serif', fontSize: 14, outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = acento + '88' }}
            onBlur={e => { e.currentTarget.style.borderColor = C.border }}
          />
        </div>

        {/* Rol */}
        <div>
          <label style={{
            display: 'block', marginBottom: 8,
            fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 600,
            color: C.mutedLight, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Soy</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['emprendedor', 'caficultor'] as Rol[]).map(r => (
              <button key={r} type="button" onClick={() => setRol(r)} style={{
                flex: 1, padding: '9px 12px', borderRadius: 8,
                border: `1px solid ${rol === r ? acento : C.border}`,
                background: rol === r ? `${acento}18` : 'transparent',
                color: rol === r ? acento : C.mutedLight,
                fontFamily: 'Montserrat, sans-serif', fontSize: 13,
                fontWeight: rol === r ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {r === 'emprendedor' ? '☕ Negocio' : '🌱 Caficultor'}
              </button>
            ))}
          </div>
        </div>

        {estado === 'error' && (
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.error, margin: 0 }}>
            {msg || 'Hubo un error. Intenta de nuevo o escríbenos por WhatsApp.'}
          </p>
        )}

        <button
          type="submit" disabled={estado === 'loading'}
          style={{
            marginTop: 4, padding: '12px', borderRadius: 8, border: 'none',
            background: estado === 'loading' ? C.muted : `linear-gradient(135deg, ${acento}, ${acento}cc)`,
            color: C.white, fontSize: 14, fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            cursor: estado === 'loading' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {estado === 'loading' ? 'Registrando...' : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.97.24.37 0 .73-.1 1.05-.29l13.54-7.8-3.06-3.06-12.5 10.91zm-1.68-21.5C1.19 2.61 1 3.07 1 3.58v16.84c0 .51.19.97.5 1.32l.07.07L10.93 12l-9.36-9.81-.07.07zM20.8 9.4l-2.44-1.41-3.41 3.41 3.41 3.41 2.47-1.43c.7-.41.7-1.57-.03-1.98zm-17.6-7.3l12.5 10.91 3.06-3.06L5.22.56C4.9.37 4.54.27 4.17.27c-.33 0-.67.07-.97.24L3.2 2.1z"/></svg>
              Quiero acceso beta
            </>
          )}
        </button>

        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontSize: 11,
          color: C.muted, margin: 0, textAlign: 'center',
        }}>
          Beta gratuita · Android 8.0+ · Sin spam
        </p>
      </form>
    </div>
  )
}

export default BetaRegistro
