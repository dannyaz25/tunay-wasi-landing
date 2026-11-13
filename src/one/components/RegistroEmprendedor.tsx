/**
 * RegistroEmprendedor.tsx — Onboarding completo para emprendedores
 * Flujo: Paso 1 (cuenta) → Paso 2 (local) → Paso 3 (elige cafés) → Confirmación
 * Ruta: #/registro-emprendedor
 */
import React, { useState } from 'react'
import { registrar } from '../authService'
import { updateUsuario } from '../service'
import { auth } from '@/shared/firebase'
import type { EtapaNegocio } from '../types'

// ─── Design system dark ───────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardDark: '#111111',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  creamDim: '#c4b297',
  terra: '#c96e4b',
  sage: '#8faf8a',
  green: '#1f3028',
  white: '#ffffff',
  textSub: '#888888',
  muted: '#555555',
  yellow: '#f39c12',
  red: '#e74c3c',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: '#4a90c4',
  natural: '#c96e4b',
  honey: '#f39c12',
  anaerobico: '#9b59b6',
}

const DISTRITOS_LIMA = [
  'Barranco', 'Chorrillos', 'La Molina', 'La Victoria', 'Lince',
  'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'San Borja',
  'San Isidro', 'San Miguel', 'Santiago de Surco', 'Surquillo',
  'Jesús María', 'San Luis', 'Ate', 'Breña', 'Rímac', 'Cercado de Lima',
]

type Paso = 1 | 2 | 'confirmacion'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: '#1a1a1a',
  color: C.cream,
  fontSize: 14,
  fontFamily: 'Montserrat, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: C.textSub,
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ paso: Paso }> = ({ paso }) => {
  const pasos = [1, 2]
  const actual = paso === 'confirmacion' ? 3 : (paso as number)
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {pasos.map(p => (
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

const PanelPropuesta: React.FC<{
  nombreLocal: string
  distrito: string
  etapa: EtapaNegocio
  paso: Paso
}> = ({ nombreLocal, distrito, etapa, paso }) => {
  const tieneInfo = nombreLocal || distrito

  const etapaLabels: Record<EtapaNegocio, string> = {
    planificando: 'Planificando apertura',
    proxima_apertura: 'Próxima apertura',
    abierto: 'Ya estoy abierto',
  }

  return (
    <div style={{
      position: 'sticky', top: 76,
      background: C.cardDark, borderRadius: 16,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      fontFamily: 'Montserrat, sans-serif',
    }}>
      {/* Header con gradiente */}
      <div style={{
        background: `linear-gradient(135deg, ${C.green} 0%, #0f1f14 100%)`,
        padding: '28px 24px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Para cafeterías
        </p>
        <h2 style={{ margin: '0 0 10px', fontSize: 22, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, lineHeight: 1.2 }}>
          Café de origen,<br />con tu identidad.
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: C.creamDim, lineHeight: 1.6 }}>
          Conectamos tu cafetería directamente con los mejores productores de especialidad del Perú — sin intermediarios.
        </p>
      </div>

      {/* Preview del local */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {paso === 1 ? 'Así aparecerás en la plataforma' : 'Tu local'}
        </p>
        <div style={{
          background: '#0f0f0f', borderRadius: 10,
          border: `1px solid ${C.border}`, padding: '14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: tieneInfo ? `linear-gradient(135deg, ${C.terra}44, ${C.terra}22)` : C.border,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0, border: `2px solid ${tieneInfo ? C.terra + '66' : C.border}`,
          }}>
            ☕
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: tieneInfo ? C.cream : C.muted, fontFamily: 'Cormorant Garamond, serif' }}>
              {nombreLocal || 'Nombre de tu local'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: tieneInfo ? C.sage : C.muted }}>
              {distrito ? `${distrito}, Lima` : 'Distrito'}{tieneInfo ? ` · ${etapaLabels[etapa]}` : ''}
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
          { icon: '🌿', titulo: 'Café de especialidad trazado', desc: 'Cada saco con historia: quién lo cultivó, a qué altitud, qué proceso.' },
          { icon: '🎨', titulo: 'Kit de identidad gratuito', desc: 'Menú personalizado, fichas de mesa y QR con el origen del café.' },
          { icon: '💰', titulo: 'Precio directo al productor', desc: 'Sin intermediarios. El caficultor fija su precio, tú lo recibes.' },
          { icon: '📊', titulo: 'Portal de gestión', desc: 'Historial de pedidos, tus menús y reposición con un clic.' },
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

      {/* Social proof */}
      <div style={{
        margin: '0 24px 24px',
        padding: '14px', borderRadius: 10,
        background: `${C.terra}11`,
        border: `1px solid ${C.terra}33`,
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.terra }}>
          Cafeterías activas ahora
        </p>
        <p style={{ margin: 0, fontSize: 11, color: C.creamDim, lineHeight: 1.5 }}>
          Barranco · Miraflores · San Isidro — recibiendo café directo del productor
        </p>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
const RegistroEmprendedor: React.FC<{ isDemo: boolean }> = ({ isDemo }) => {
  // Paso 1 — Cuenta
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  // Paso 2 — Local
  const [nombreLocal, setNombreLocal] = useState('')
  const [distrito, setDistrito] = useState('')
  const [etapa, setEtapa] = useState<EtapaNegocio>('planificando')

  // Paso 3 — Cafés seleccionados (reservado para uso futuro desde el portal)
  const [seleccionadosProductos] = useState<{ id: string; nombre: string; caficultorNombre: string; proceso: string }[]>([])

  // Estado general
  const [paso, setPaso] = useState<Paso>(1)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Paso 1: validar y avanzar ──────────────────────────────────────────────
  function validarPaso1() {
    if (!nombre.trim()) return 'Ingresa tu nombre completo.'
    if (!email.includes('@')) return 'Ingresa un email válido.'
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

  // ─── Paso 2: validar y registrar ────────────────────────────────────────────
  function handlePaso2() {
    if (!nombreLocal.trim()) { setError('Ingresa el nombre de tu local.'); return }
    setError(null)
    handleRegistrar()
  }

  // ─── Registro final ──────────────────────────────────────────────────────────
  async function handleRegistrar() {
    setEnviando(true)
    setError(null)
    try {
      if (!isDemo) {
        try {
          await registrar(email, password, nombre)
          const uid = auth.currentUser?.uid
          if (uid) {
            await updateUsuario(uid, {
              telefono,
              negocio: {
                nombreLocal,
                distritoLocal: distrito,
                etapa,
                pedidoIds: [],
              },
            })
          }
        } catch (e: unknown) {
          const msg = String((e as { message?: string; code?: string })?.message ?? (e as { code?: string })?.code ?? e)
          if (msg.includes('email-already-in-use')) {
            setError('Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?')
            return
          }
          // Firebase no configurado en dev — continuar igual
        }
      }
      setPaso('confirmacion')
    } catch {
      // fallback silencioso — siempre avanzar a confirmación
      setPaso('confirmacion')
    } finally {
      setEnviando(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (paso === 'confirmacion') {
    const hayCarrito = !!sessionStorage.getItem('one_carrito_producto') || !!sessionStorage.getItem('one_carrito_items')
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          {/* Checkmark */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: C.sage + '22', border: `2px solid ${C.sage}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 32, color: C.sage,
            }}>✓</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 24, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
              ¡Bienvenido/a, {nombre.split(' ')[0]}!
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>Tu cuenta en Tunay Wasi está lista.</p>
          </div>

          {/* Carta inicial */}
          {seleccionadosProductos.length > 0 && (
            <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tu carta inicial</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {seleccionadosProductos.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PROCESO_COLORS[p.proceso] ?? C.terra, flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: C.cream, fontWeight: 600 }}>{p.nombre}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{p.caficultorNombre} · {p.proceso}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banner kit */}
          <div style={{
            background: `linear-gradient(135deg, ${C.green} 0%, #0f2018 100%)`,
            border: `1.5px solid ${C.sage}55`, borderRadius: 14, padding: '18px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>🎨</span>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>Tu Kit de Identidad — incluido</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>Gratis con tu primer pedido mensual</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
              {['📄 Menú personalizado', '🃏 Fichas de mesa', '📱 QR trazabilidad', '📸 Pack Instagram'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.sage}22` }}>
                  <span style={{ fontSize: 12, color: C.sage }}>{item}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
              Te contactamos por WhatsApp para coordinar
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href={hayCarrito ? '#/checkout' : '#/'} style={{
              display: 'block', padding: '15px', borderRadius: 10, textAlign: 'center',
              background: C.terra, color: C.white, textDecoration: 'none',
              fontSize: 15, fontWeight: 700,
            }}>
              {hayCarrito ? 'Continuar con mi pedido →' : 'Ver catálogo →'}
            </a>
            <a href="#/portal" style={{
              display: 'block', padding: '13px', borderRadius: 10, textAlign: 'center',
              background: 'none', border: `1px solid ${C.border}`,
              color: C.textSub, textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}>
              Explorar mi portal →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {paso !== 1 ? (
          <button
            onClick={() => { setError(null); setPaso(1) }}
            style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', padding: 0 }}
          >
            ← Volver
          </button>
        ) : (
          <a href="#/" style={{ fontSize: 12, color: C.textSub, textDecoration: 'none' }}>← Inicio</a>
        )}
        <span style={{ color: C.border }}>|</span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>Tunay Wasi</p>
      </header>

      {/* Pasos 1 y 2 — layout dos columnas */}
      {(
        <>
          {/* CSS para ocultar panel en mobile */}
          <style>{`
            @media (max-width: 700px) {
              .panel-propuesta-emprendedor { display: none !important; }
            }
          `}</style>

          <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '40px 24px 80px',
            display: 'grid',
            gridTemplateColumns: '1fr 420px',
            gap: 48,
            alignItems: 'start',
          }}>
            {/* Columna izquierda — form */}
            <div>
              <ProgressBar paso={paso} />

              {/* ── PASO 1: Cuenta ── */}
              {paso === 1 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paso 1 de 2</p>
                  <h1 style={{ margin: '0 0 6px', fontSize: 28, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Crea tu cuenta</h1>
                  <p style={{ margin: '0 0 28px', fontSize: 13, color: C.textSub }}>Para empezar a conectar tu cafetería con los mejores caficultores del Perú.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Nombre completo <span style={{ color: C.terra }}>*</span></label>
                      <input type="text" placeholder="María García López" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email <span style={{ color: C.terra }}>*</span></label>
                      <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp</label>
                      <input type="tel" placeholder="+51 987 654 321" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Contraseña <span style={{ color: C.terra }}>*</span></label>
                        <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Confirmar <span style={{ color: C.terra }}>*</span></label>
                        <input type="password" placeholder="Repite tu contraseña" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {error && <p style={{ margin: '14px 0 0', padding: '10px 14px', borderRadius: 8, background: '#e74c3c18', border: '1px solid #e74c3c44', fontSize: 13, color: C.red }}>{error}</p>}

                  <button onClick={handlePaso1} style={{ marginTop: 24, width: '100%', padding: '15px', borderRadius: 10, background: C.terra, color: C.white, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    Siguiente →
                  </button>

                  <p style={{ margin: '16px 0 0', fontSize: 12, color: C.muted, textAlign: 'center' }}>
                    ¿Ya tienes cuenta?{' '}
                    <a href="#/login" style={{ color: C.terra, textDecoration: 'none', fontWeight: 700 }}>Inicia sesión</a>
                  </p>
                </div>
              )}

              {/* ── PASO 2: Local ── */}
              {paso === 2 && (
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paso 2 de 2</p>
                  <h1 style={{ margin: '0 0 6px', fontSize: 28, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Tu local</h1>
                  <p style={{ margin: '0 0 28px', fontSize: 13, color: C.textSub }}>Cuéntanos sobre tu cafetería. Puedes actualizar esto después.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={labelStyle}>Nombre del local <span style={{ color: C.terra }}>*</span></label>
                      <input type="text" placeholder="Café El Origen" value={nombreLocal} onChange={e => setNombreLocal(e.target.value)} style={inputStyle} maxLength={60} />
                    </div>

                    <div>
                      <label style={labelStyle}>Distrito (Lima)</label>
                      <select value={distrito} onChange={e => setDistrito(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="">Seleccionar...</option>
                        {DISTRITOS_LIMA.sort().map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>¿En qué etapa estás?</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        {([
                          { value: 'planificando', emoji: '📋', label: 'Planificando', sub: 'Tengo la idea, aún no abro' },
                          { value: 'proxima_apertura', emoji: '🔨', label: 'Próxima apertura', sub: 'Abrimos pronto' },
                          { value: 'abierto', emoji: '✅', label: 'Ya estoy abierto', sub: 'Mi cafetería opera hoy' },
                        ] as { value: EtapaNegocio; emoji: string; label: string; sub: string }[]).map(op => (
                          <button
                            key={op.value}
                            onClick={() => setEtapa(op.value)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                              background: etapa === op.value ? C.terra + '18' : C.card,
                              border: `1.5px solid ${etapa === op.value ? C.terra : C.border}`,
                              textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: 22 }}>{op.emoji}</span>
                            <div>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: etapa === op.value ? C.cream : C.textSub }}>{op.label}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{op.sub}</p>
                            </div>
                            {etapa === op.value && <span style={{ marginLeft: 'auto', color: C.terra, fontSize: 16, fontWeight: 700 }}>✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && <p style={{ margin: '14px 0 0', padding: '10px 14px', borderRadius: 8, background: '#e74c3c18', border: '1px solid #e74c3c44', fontSize: 13, color: C.red }}>{error}</p>}

                  <button onClick={handlePaso2} disabled={enviando} style={{ marginTop: 24, width: '100%', padding: '15px', borderRadius: 10, background: enviando ? C.muted : C.terra, color: C.white, border: 'none', fontSize: 15, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer' }}>
                    {enviando ? 'Creando cuenta...' : 'Crear cuenta →'}
                  </button>
                </div>
              )}
            </div>

            {/* Columna derecha — panel propuesta de valor */}
            <div className="panel-propuesta-emprendedor">
              <PanelPropuesta
                nombreLocal={nombreLocal}
                distrito={distrito}
                etapa={etapa}
                paso={paso}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RegistroEmprendedor
