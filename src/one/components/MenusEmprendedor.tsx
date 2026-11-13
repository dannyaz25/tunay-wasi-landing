/**
 * MenusEmprendedor.tsx — Gestión de menús del emprendedor
 * Cada menú tiene: carta de preparaciones (ESPRESSO/FILTER/FRÍO) + cafés asignados + QR.
 */
import React, { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  demoFetchMenusByNegocio,
  demoCreateMenu,
  demoUpdateMenu,
  demoDeleteMenu,
  demoSetMenuActivo,
  demoFetchMenuNegocio,
} from '../demoService'
import {
  fetchMenusByNegocio,
  createMenu,
  updateMenu,
  deleteMenu,
  setMenuActivo,
  fetchMenuNegocio,
} from '../service'
import type { MenuONE, ProductoONE, PreparacionMenu } from '../types'

// ─── Design system ────────────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  terra: '#c96e4b',
  sage: '#8faf8a',
  green: '#1f3028',
  white: '#ffffff',
  muted: '#555555',
  yellow: '#f39c12',
  textSub: '#888888',
  red: '#e74c3c',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: '#4a90c4',
  natural: '#c96e4b',
  honey: '#f39c12',
  anaerobico: '#9b59b6',
}

const CATEGORIAS: PreparacionMenu['categoria'][] = ['ESPRESSO', 'FILTER', 'FRÍO']

const CAT_LABEL: Record<PreparacionMenu['categoria'], string> = {
  ESPRESSO: 'Espresso',
  FILTER: 'Filtros',
  FRÍO: 'Frío',
}

interface Props {
  usuarioId: string
  isDemo: boolean
  onPedirReposicion: (menuId: string, cafesIds: string[]) => void
}

// ─── Formulario de preparación ────────────────────────────────────────────────

interface FormPrep {
  nombre: string
  precio: string
  metodo: string
  categoria: PreparacionMenu['categoria']
  caficultorNombre: string
  origen: string
  notas: string
}

const PREP_VACIA: FormPrep = { nombre: '', precio: '', metodo: '', categoria: 'ESPRESSO', caficultorNombre: '', origen: '', notas: '' }

function formToPrep(f: FormPrep): PreparacionMenu {
  return {
    nombre: f.nombre.trim(),
    precio: parseFloat(f.precio) || 0,
    metodo: f.metodo.trim(),
    categoria: f.categoria,
    caficultorNombre: f.caficultorNombre.trim(),
    origen: f.origen.trim(),
    notas: f.notas.split(',').map(n => n.trim()).filter(Boolean),
  }
}

function prepToForm(p: PreparacionMenu): FormPrep {
  return {
    nombre: p.nombre,
    precio: String(p.precio),
    metodo: p.metodo,
    categoria: p.categoria,
    caficultorNombre: p.caficultorNombre,
    origen: p.origen,
    notas: p.notas.join(', '),
  }
}

// ─── Modal crear / editar menú ────────────────────────────────────────────────

interface ModalMenuProps {
  menu?: MenuONE
  negocioId: string
  isDemo: boolean
  productos: ProductoONE[]
  onClose: () => void
  onSaved: () => void
  onToast: (text: string, tipo?: 'ok' | 'error') => void
}

const ModalMenu: React.FC<ModalMenuProps> = ({ menu, negocioId, isDemo, productos, onClose, onSaved, onToast }) => {
  const [tab, setTab] = useState<'carta' | 'cafes'>('carta')
  const [nombre, setNombre] = useState(menu?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(menu?.descripcion ?? '')
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(menu?.cafesIds ?? []))
  const [preparaciones, setPreparaciones] = useState<PreparacionMenu[]>(menu?.preparaciones ?? [])
  const [formPrep, setFormPrep] = useState<FormPrep | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)

  function toggleCafe(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function abrirNuevaPrep() {
    setEditIdx(null)
    setFormPrep({ ...PREP_VACIA })
  }

  function abrirEditPrep(idx: number) {
    setEditIdx(idx)
    setFormPrep(prepToForm(preparaciones[idx]))
  }

  function cancelarPrep() {
    setFormPrep(null)
    setEditIdx(null)
  }

  function guardarPrep() {
    if (!formPrep) return
    if (!formPrep.nombre.trim()) return
    const p = formToPrep(formPrep)
    if (editIdx !== null) {
      setPreparaciones(prev => prev.map((x, i) => i === editIdx ? p : x))
    } else {
      setPreparaciones(prev => [...prev, p])
    }
    setFormPrep(null)
    setEditIdx(null)
  }

  function eliminarPrep(idx: number) {
    setPreparaciones(prev => prev.filter((_, i) => i !== idx))
  }

  function moverPrep(idx: number, dir: -1 | 1) {
    const next = [...preparaciones]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setPreparaciones(next)
  }

  async function guardar() {
    if (!nombre.trim()) { onToast('El nombre del menú es obligatorio', 'error'); return }
    setGuardando(true)
    try {
      if (menu) {
        const data = { nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, cafesIds: [...seleccionados], preparaciones }
        if (isDemo) await demoUpdateMenu(menu.id, data)
        else await updateMenu(menu.id, data)
      } else {
        const input = { negocioId, nombre: nombre.trim(), descripcion: descripcion.trim() || undefined, cafesIds: [...seleccionados], preparaciones }
        if (isDemo) await demoCreateMenu(input)
        else await createMenu(input)
      }
      onToast(menu ? 'Menú actualizado' : 'Menú creado', 'ok')
      onSaved()
    } catch {
      onToast('No se pudo guardar el menú', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: '#0f0f0f',
    fontSize: 13, fontFamily: 'Montserrat, sans-serif', color: C.cream,
    outline: 'none', boxSizing: 'border-box',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  }

  // Preview en vivo — misma lógica que PerfilCafeteria
  const previewPreparaciones = preparaciones

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Topbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56, flexShrink: 0,
        borderBottom: `1px solid ${C.border}`, background: C.card,
      }}>
        <button
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          ← Volver a mis menús
        </button>
        <h2 style={{ margin: 0, fontSize: 16, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>
          {menu ? 'Editar menú' : 'Nuevo menú'}
        </h2>
        <button
          onClick={guardar}
          disabled={guardando}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.terra, color: C.white, fontSize: 13, fontWeight: 700, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}
        >
          {guardando ? 'Guardando...' : menu ? 'Guardar cambios' : 'Crear menú →'}
        </button>
      </div>

      {/* ── Layout dos columnas ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* ── Columna izquierda: formulario ── */}
        <div style={{ flex: '0 0 min(520px, 55%)', overflowY: 'auto', padding: '24px 28px', borderRight: `1px solid ${C.border}` }}>

          {/* Nombre del menú */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nombre del menú *</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Menú principal de barra"
              maxLength={60}
              style={inputStyle}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
            {(['carta', 'cafes'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: tab === t ? C.terra : C.textSub,
                  borderBottom: `2px solid ${tab === t ? C.terra : 'transparent'}`,
                  marginBottom: -1,
                }}
              >
                {t === 'carta' ? `Preparaciones (${preparaciones.length})` : `Cafés (${seleccionados.size})`}
              </button>
            ))}
          </div>

          {/* ── TAB: CARTA ── */}
          {tab === 'carta' && (
            <div>
              {/* Lista de preparaciones agrupadas */}
              {CATEGORIAS.map(cat => {
                const preps = preparaciones.map((p, i) => ({ ...p, _idx: i })).filter(p => p.categoria === cat)
                return (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: C.terra, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      {cat}
                    </p>
                    {preps.length === 0 ? (
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Sin preparaciones</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {preps.map((p) => (
                          editIdx === p._idx && formPrep ? (
                            // ── Form inline en la posición del item que se edita ──
                            <div key={p._idx} style={{ padding: '14px', background: '#0f0f0f', borderRadius: 10, border: `1.5px solid ${C.terra}` }}>
                              <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: C.terra, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Editar preparación</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8, marginBottom: 8 }}>
                                <div>
                                  <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Nombre *</label>
                                  <input value={formPrep.nombre} onChange={e => setFormPrep(f => f ? { ...f, nombre: e.target.value } : f)} placeholder="Espresso, V60..." style={inputStyle} autoFocus />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Precio S/</label>
                                  <input value={formPrep.precio} onChange={e => setFormPrep(f => f ? { ...f, precio: e.target.value } : f)} placeholder="12" type="number" min="0" style={inputStyle} />
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                <div>
                                  <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Método</label>
                                  <input value={formPrep.metodo} onChange={e => setFormPrep(f => f ? { ...f, metodo: e.target.value } : f)} placeholder="Filtrado V60..." style={inputStyle} />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Categoría</label>
                                  <select value={formPrep.categoria} onChange={e => setFormPrep(f => f ? { ...f, categoria: e.target.value as PreparacionMenu['categoria'] } : f)} style={selectStyle}>
                                    {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Origen visible en la carta</label>
                                <input value={formPrep.origen} onChange={e => setFormPrep(f => f ? { ...f, origen: e.target.value } : f)} placeholder="Geisha Natural · Aydé Lloclla · Cajamarca" style={inputStyle} />
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Caficultor</label>
                                <input value={formPrep.caficultorNombre} onChange={e => setFormPrep(f => f ? { ...f, caficultorNombre: e.target.value } : f)} placeholder="Aydé Lloclla Díaz" style={inputStyle} />
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Notas de sabor (separadas por coma)</label>
                                <input value={formPrep.notas} onChange={e => setFormPrep(f => f ? { ...f, notas: e.target.value } : f)} placeholder="durazno, panela, jazmín" style={inputStyle} />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={cancelarPrep} style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={guardarPrep} disabled={!formPrep.nombre.trim()} style={{ flex: 2, padding: '9px', borderRadius: 8, border: 'none', background: !formPrep.nombre.trim() ? C.muted : C.terra, color: C.white, fontSize: 12, fontWeight: 700, cursor: !formPrep.nombre.trim() ? 'not-allowed' : 'pointer' }}>Actualizar preparación</button>
                              </div>
                            </div>
                          ) : (
                          <div key={p._idx} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 12px', borderRadius: 8,
                            background: '#0f0f0f', border: `1px solid ${C.border}`,
                            opacity: editIdx !== null && editIdx !== p._idx ? 0.4 : 1,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{p.nombre}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.terra }}>S/ {p.precio}</span>
                              </div>
                              <p style={{ margin: '2px 0 0', fontSize: 10, color: C.sage, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.origen || p.caficultorNombre}</p>
                              {p.notas.length > 0 && (
                                <p style={{ margin: '1px 0 0', fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{p.notas.join(' · ')}</p>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => moverPrep(p._idx, -1)} title="Subir" style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, fontSize: 11, borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>↑</button>
                              <button onClick={() => moverPrep(p._idx, 1)} title="Bajar" style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, fontSize: 11, borderRadius: 6, padding: '4px 6px', cursor: 'pointer' }}>↓</button>
                              <button onClick={() => abrirEditPrep(p._idx)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, fontSize: 11, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>Editar</button>
                              <button onClick={() => eliminarPrep(p._idx)} style={{ background: 'none', border: `1px solid ${C.red}44`, color: C.red, fontSize: 11, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>×</button>
                            </div>
                          </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Formulario nueva preparación — solo al final, solo si no hay edición activa */}
              {formPrep && editIdx === null ? (
                <div style={{ marginTop: 8, padding: '18px', background: '#0f0f0f', borderRadius: 12, border: `1.5px solid ${C.terra}66` }}>
                  <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: C.terra, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Nueva preparación
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Nombre *</label>
                      <input value={formPrep.nombre} onChange={e => setFormPrep(f => f ? { ...f, nombre: e.target.value } : f)} placeholder="Espresso, V60..." style={inputStyle} autoFocus />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Precio S/</label>
                      <input value={formPrep.precio} onChange={e => setFormPrep(f => f ? { ...f, precio: e.target.value } : f)} placeholder="12" type="number" min="0" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Método</label>
                      <input value={formPrep.metodo} onChange={e => setFormPrep(f => f ? { ...f, metodo: e.target.value } : f)} placeholder="Filtrado V60..." style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Categoría</label>
                      <select value={formPrep.categoria} onChange={e => setFormPrep(f => f ? { ...f, categoria: e.target.value as PreparacionMenu['categoria'] } : f)} style={selectStyle}>
                        {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Origen visible en la carta</label>
                    <input value={formPrep.origen} onChange={e => setFormPrep(f => f ? { ...f, origen: e.target.value } : f)} placeholder="Geisha Natural · Aydé Lloclla · Cajamarca" style={inputStyle} />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Caficultor</label>
                    <input value={formPrep.caficultorNombre} onChange={e => setFormPrep(f => f ? { ...f, caficultorNombre: e.target.value } : f)} placeholder="Aydé Lloclla Díaz" style={inputStyle} />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 3 }}>Notas de sabor (separadas por coma)</label>
                    <input value={formPrep.notas} onChange={e => setFormPrep(f => f ? { ...f, notas: e.target.value } : f)} placeholder="durazno, panela, jazmín" style={inputStyle} />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={cancelarPrep} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button
                      onClick={guardarPrep}
                      disabled={!formPrep.nombre.trim()}
                      style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: !formPrep.nombre.trim() ? C.muted : C.terra, color: C.white, fontSize: 13, fontWeight: 700, cursor: !formPrep.nombre.trim() ? 'not-allowed' : 'pointer' }}
                    >
                      Agregar a la carta →
                    </button>
                  </div>
                </div>
              ) : editIdx === null && (
                <button
                  onClick={abrirNuevaPrep}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1.5px dashed ${C.terra}66`, background: 'transparent', color: C.terra, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}
                >
                  + Agregar preparación
                </button>
              )}
            </div>
          )}

          {/* ── TAB: CAFÉS ── */}
          {tab === 'cafes' && (
            <div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: C.textSub }}>
                Selecciona los microlotes que usas para preparar tu carta.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {productos.filter(p => p.status === 'activo').map(p => {
                  const sel = seleccionados.has(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleCafe(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                        border: `1.5px solid ${sel ? C.terra : C.border}`,
                        background: sel ? C.terra + '14' : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PROCESO_COLORS[p.proceso] ?? C.terra, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, color: sel ? C.cream : C.textSub, fontWeight: sel ? 600 : 400 }}>{p.nombre}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: C.muted }}>{p.caficultorNombre} · {p.proceso}</p>
                      </div>
                      {sel && <span style={{ color: C.terra, fontSize: 14, fontWeight: 700 }}>✓</span>}
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 10, color: C.textSub, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción del menú (opcional)</label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  maxLength={120}
                  placeholder="Cafés para preparaciones en barra..."
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Columna derecha: preview en vivo ── */}
        <div className="modal-menu-preview" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#060606' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vista previa de carta</p>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: C.muted }}>Así la ven tus clientes al escanear el QR</p>

          {nombre && (
            <p style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
              {nombre}
            </p>
          )}

          {previewPreparaciones.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>☕</p>
              <p style={{ fontSize: 13, color: C.muted }}>Agrega preparaciones para ver la carta</p>
            </div>
          ) : (
            (['ESPRESSO', 'FILTER', 'FRÍO'] as PreparacionMenu['categoria'][]).map(cat => {
              const preps = previewPreparaciones.filter(p => p.categoria === cat)
              if (preps.length === 0) return null
              return (
                <div key={cat} style={{ marginBottom: 28 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 700, color: C.terra, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{cat}</p>
                  {preps.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                      padding: '12px 0',
                      borderBottom: i < preps.length - 1 ? `1px solid ${C.border}` : 'none',
                      gap: 10,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{p.nombre}</p>
                        {(p.origen || p.caficultorNombre) && (
                          <p style={{ margin: '0 0 2px', fontSize: 10, color: C.sage, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.origen || p.caficultorNombre}</p>
                        )}
                        {p.notas.length > 0 && (
                          <p style={{ margin: 0, fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{p.notas.join(' · ')}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 17, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0 }}>S/ {p.precio}</span>
                    </div>
                  ))}
                </div>
              )
            })
          )}

          {/* Sello de trazabilidad */}
          {previewPreparaciones.length > 0 && (
            <div style={{ marginTop: 24, padding: '14px 16px', background: '#0f0f0f', borderRadius: 10, borderLeft: `3px solid ${C.sage}` }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.sage }}>Café directo del productor</p>
              <p style={{ margin: 0, fontSize: 12, color: '#888', lineHeight: 1.5 }}>Cada origen es trazable hasta el caficultor — sin intermediarios.</p>
            </div>
          )}
        </div>
      </div>

      {/* CSS responsive — ocultar preview en mobile */}
      <style>{`
        @media (max-width: 720px) {
          .modal-menu-preview { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Preview carta (reutilizable en drawer y en modal edición) ────────────────

function PreviewCarta({ preparaciones, negocioId }: { preparaciones: PreparacionMenu[]; negocioId: string }) {
  if (preparaciones.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>☕</p>
        <p style={{ fontSize: 13, color: C.muted }}>Sin preparaciones todavía</p>
      </div>
    )
  }
  return (
    <div>
      {(['ESPRESSO', 'FILTER', 'FRÍO'] as PreparacionMenu['categoria'][]).map(cat => {
        const preps = preparaciones.filter(p => p.categoria === cat)
        if (preps.length === 0) return null
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <p style={{ margin: '0 0 10px', fontSize: 9, fontWeight: 700, color: C.terra, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{cat}</p>
            {preps.map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '11px 0',
                borderBottom: i < preps.length - 1 ? `1px solid ${C.border}` : 'none',
                gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{p.nombre}</p>
                  {(p.origen || p.caficultorNombre) && (
                    <p style={{ margin: '0 0 2px', fontSize: 10, color: C.sage, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.origen || p.caficultorNombre}</p>
                  )}
                  {p.notas.length > 0 && (
                    <p style={{ margin: 0, fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{p.notas.join(' · ')}</p>
                  )}
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0 }}>S/ {p.precio}</span>
              </div>
            ))}
          </div>
        )
      })}
      <div style={{ marginTop: 20, padding: '12px 14px', background: '#0f0f0f', borderRadius: 8, borderLeft: `3px solid ${C.sage}` }}>
        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: C.sage }}>Café directo del productor</p>
        <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>Cada origen es trazable hasta el caficultor — sin intermediarios.</p>
      </div>
      <a
        href={`#/cafeteria/${negocioId}`}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'block', marginTop: 12, padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 11, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
      >
        Ver página pública →
      </a>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const MenusEmprendedor: React.FC<Props> = ({ usuarioId, isDemo, onPedirReposicion }) => {
  const [menus, setMenus] = useState<MenuONE[]>([])
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMenu, setModalMenu] = useState<'nuevo' | MenuONE | null>(null)
  const [drawerMenu, setDrawerMenu] = useState<MenuONE | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; text: string; tipo: 'ok' | 'error' }[]>([])

  // QR ref en drawer
  const drawerQrRef = useRef<SVGSVGElement>(null)

  function toast(text: string, tipo: 'ok' | 'error' = 'ok') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, text, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  async function cargar() {
    setLoading(true)
    try {
      const [ms, ps] = await Promise.all([
        isDemo ? demoFetchMenusByNegocio(usuarioId) : fetchMenusByNegocio(usuarioId),
        isDemo ? demoFetchMenuNegocio(usuarioId) : fetchMenuNegocio(usuarioId),
      ])
      setMenus(ms)
      setProductos(ps)
    } catch {
      toast('No se pudieron cargar los menús', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [usuarioId, isDemo])

  async function activar(menu: MenuONE) {
    try {
      if (isDemo) await demoSetMenuActivo(usuarioId, menu.id)
      else await setMenuActivo(usuarioId, menu.id)
      toast(`"${menu.nombre}" es ahora tu menú activo`, 'ok')
      await cargar()
      setDrawerMenu(null)
    } catch {
      toast('No se pudo activar el menú', 'error')
    }
  }

  async function eliminar(menuId: string) {
    try {
      if (isDemo) await demoDeleteMenu(menuId)
      else await deleteMenu(menuId)
      toast('Menú eliminado', 'ok')
      setConfirmDelete(null)
      setDrawerMenu(null)
      await cargar()
    } catch {
      toast('No se pudo eliminar el menú', 'error')
    }
  }

  function descargarQR() {
    const svg = drawerQrRef.current
    if (!svg || !drawerMenu) return
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const data = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 0, 0, 300, 300)
      const link = document.createElement('a')
      link.download = `qr-${drawerMenu.nombre.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const menusVisibles = menus.filter(m => m.nombre !== 'Sin categorizar')

  function getResumenCarta(menu: MenuONE): string {
    const n = menu.preparaciones.length
    if (n === 0) return 'Carta vacía'
    const cats = Array.from(new Set(menu.preparaciones.map(p => p.categoria)))
    return `${n} preparación${n > 1 ? 'es' : ''} · ${cats.join(', ')}`
  }

  function getCafesResumen(cafesIds: string[]): string {
    if (cafesIds.length === 0) return 'Sin cafés asignados'
    return cafesIds
      .slice(0, 2)
      .map(id => productos.find(p => p.id === id)?.nombre.split(' — ')[0] ?? id)
      .join(', ') + (cafesIds.length > 2 ? ` +${cafesIds.length - 2} más` : '')
  }

  // Sincronizar drawer cuando los menús se recargan
  const drawerMenuActualizado = drawerMenu ? menus.find(m => m.id === drawerMenu.id) ?? null : null

  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Mis menús</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>Configura tu carta — el QR apunta a ella</p>
        </div>
        <button
          onClick={() => setModalMenu('nuevo')}
          style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: C.terra, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          + Nuevo menú
        </button>
      </div>

      {/* ── Grid de cards ── */}
      {menusVisibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
          <p style={{ margin: '0 0 6px', fontSize: 15, color: C.textSub }}>Todavía no tienes menús</p>
          <p style={{ margin: '0 0 24px', fontSize: 13 }}>Crea tu primer menú y configura la carta que verán tus clientes</p>
          <button onClick={() => setModalMenu('nuevo')} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: C.terra, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Crear mi primer menú →
          </button>
        </div>
      ) : (
        <div className="grid-menus">
          {menusVisibles.map(menu => (
            <div
              key={menu.id}
              style={{
                background: C.card,
                border: `1px solid ${menu.activo ? C.sage + '55' : C.border}`,
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header card — color según estado */}
              <div style={{
                padding: '12px 14px 10px',
                background: menu.activo
                  ? `linear-gradient(135deg, ${C.green} 0%, #0f2018 100%)`
                  : '#0f0f0f',
                borderBottom: `1px solid ${menu.activo ? C.sage + '33' : C.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  {menu.activo ? (
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.sage, textTransform: 'uppercase', letterSpacing: '0.1em', background: C.sage + '22', padding: '2px 7px', borderRadius: 4 }}>
                      Activo · QR activo
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Borrador
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{menu.nombre}</p>
              </div>

              {/* Cuerpo */}
              <div style={{ padding: '12px 14px', flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: menu.activo ? C.sage : C.textSub }}>{getResumenCarta(menu)}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{getCafesResumen(menu.cafesIds)}</p>

                {/* Pills de preparaciones */}
                {menu.preparaciones.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {menu.preparaciones.slice(0, 3).map((p, i) => (
                      <span key={i} style={{ fontSize: 9, color: C.cream, background: 'rgba(255,255,255,0.07)', padding: '3px 7px', borderRadius: 20, border: `1px solid ${C.border}` }}>
                        {p.nombre} · S/{p.precio}
                      </span>
                    ))}
                    {menu.preparaciones.length > 3 && (
                      <span style={{ fontSize: 9, color: C.muted, padding: '3px 0' }}>+{menu.preparaciones.length - 3} más</span>
                    )}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div style={{ padding: '10px 14px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDrawerMenu(menu)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Ver detalle
                </button>
                <button
                  onClick={() => setModalMenu(menu)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: C.terra, color: C.white, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Editar →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Drawer de detalle ── */}
      {drawerMenuActualizado && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }} onClick={() => setDrawerMenu(null)}>
          {/* Overlay */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} />
          {/* Panel */}
          <div
            style={{ width: 'min(480px, 100vw)', background: C.card, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.card, zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  {drawerMenuActualizado.activo && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: C.sage, textTransform: 'uppercase', letterSpacing: '0.1em', background: C.sage + '22', padding: '2px 7px', borderRadius: 4, display: 'inline-block', marginBottom: 6 }}>
                      Activo · QR activo
                    </span>
                  )}
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{drawerMenuActualizado.nombre}</p>
                  {drawerMenuActualizado.descripcion && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{drawerMenuActualizado.descripcion}</p>
                  )}
                </div>
                <button onClick={() => setDrawerMenu(null)} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            </div>

            {/* Contenido drawer */}
            <div style={{ padding: '20px', flex: 1 }}>

              {/* QR */}
              <div style={{ background: '#0f0f0f', borderRadius: 12, padding: '16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: '#ffffff', borderRadius: 8, padding: 8, flexShrink: 0 }}>
                  <QRCodeSVG
                    ref={drawerQrRef}
                    value={drawerMenuActualizado.qrUrl.startsWith('#')
                      ? `${window.location.origin}${window.location.pathname}${drawerMenuActualizado.qrUrl}`
                      : drawerMenuActualizado.qrUrl}
                    size={72}
                    fgColor="#1f3028"
                    bgColor="#ffffff"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>QR de trazabilidad</p>
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: C.muted, wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {drawerMenuActualizado.qrUrl.startsWith('#')
                      ? `${window.location.origin}${window.location.pathname}${drawerMenuActualizado.qrUrl}`
                      : drawerMenuActualizado.qrUrl}
                  </p>
                  <button
                    onClick={descargarQR}
                    style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: C.sage, color: '#0a0a0a', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Descargar QR PNG
                  </button>
                </div>
              </div>

              {/* Preview carta */}
              <p style={{ margin: '0 0 14px', fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Vista previa de carta · {drawerMenuActualizado.preparaciones.length} preparaciones
              </p>
              <PreviewCarta preparaciones={drawerMenuActualizado.preparaciones} negocioId={drawerMenuActualizado.negocioId} />
            </div>

            {/* Footer del drawer */}
            <div style={{ padding: '14px 20px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!drawerMenuActualizado.activo && (
                <button
                  onClick={() => activar(drawerMenuActualizado)}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${C.terra}44`, background: 'transparent', color: C.terra, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Activar este menú
                </button>
              )}
              <button
                onClick={() => onPedirReposicion(drawerMenuActualizado.id, drawerMenuActualizado.cafesIds)}
                disabled={drawerMenuActualizado.cafesIds.length === 0}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: drawerMenuActualizado.cafesIds.length === 0 ? C.muted : C.terra, color: C.white, fontSize: 13, fontWeight: 700, cursor: drawerMenuActualizado.cafesIds.length === 0 ? 'not-allowed' : 'pointer', opacity: drawerMenuActualizado.cafesIds.length === 0 ? 0.5 : 1 }}
              >
                Pedir reposición →
              </button>
              {!drawerMenuActualizado.activo && (
                <button
                  onClick={() => setConfirmDelete(drawerMenuActualizado.id)}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${C.red}33`, background: 'transparent', color: C.red, fontSize: 12, cursor: 'pointer' }}
                >
                  Eliminar menú
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(90vw, 340px)' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: t.tipo === 'ok' ? C.sage : C.red, color: t.tipo === 'ok' ? '#0a0a0a' : C.white, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            {t.tipo === 'ok' ? '✓ ' : '✕ '}{t.text}
          </div>
        ))}
      </div>

      {/* CSS grid de cards */}
      <style>{`
        .grid-menus {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 700px) {
          .grid-menus { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1000px) {
          .grid-menus { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* Modal crear / editar */}
      {modalMenu !== null && (
        <ModalMenu
          menu={modalMenu === 'nuevo' ? undefined : modalMenu}
          negocioId={usuarioId}
          isDemo={isDemo}
          productos={productos}
          onClose={() => setModalMenu(null)}
          onSaved={() => { setModalMenu(null); cargar() }}
          onToast={toast}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.card, borderRadius: 16, padding: '24px', width: '100%', maxWidth: 340, fontFamily: 'Montserrat, sans-serif', border: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: C.cream }}>¿Eliminar este menú?</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: C.textSub }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmDelete)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: C.red, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenusEmprendedor
