/**
 * PortalCaficultor.tsx — Dashboard del caficultor
 * Dark mode Netflix-style con sidebar navigation, CRUD de productos, toast
 */
import React, { useEffect, useState } from 'react'
import {
  fetchPedidosByCaficultor, fetchProductos, fetchCaficultor,
  fetchCalificacionesByCaficultor, updateStock,
  crearProducto, updateProducto, updateCaficultor, despacharAgencia,
  fetchUbigeos, fetchLogisticaCaficultor, saveLogisticaCaficultor,
} from '../service'
import {
  demoFetchPedidosByCaficultor, demoFetchProductosByCaficultorLive,
  demoFetchCaficultor, demoUpdateStock,
  demoCrearProducto, demoUpdateProducto, demoUpdateCaficultor,
  demoDespacharAgencia,
  demoFetchUbigeos, demoFetchLogisticaCaficultor, demoSaveLogisticaCaficultor,
} from '../demoService'
import { logout } from '../authService'
import { PROCESO_LABELS, calcularPrecioFinal } from '../config'
import type { PedidoONE, ProductoONE, CaficultorONE, CalificacionCaficultor, UbigeoONE, LogisticaCaficultorONE } from '../types'
import ChatPedido from './ChatPedido'

// ─── Design system dark ───────────────────────────────────────────────────────
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1e1e1e',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  creamMuted: '#a09080',
  terra: '#c96e4b',
  sage: '#8faf8a',
  white: '#ffffff',
  yellow: '#f39c12',
  red: '#e74c3c',
  blue: '#4a90c4',
  text: '#e8e0d8',
  textSub: '#888888',
  muted: '#555555',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: C.blue, natural: C.terra, honey: C.yellow, anaerobico: '#9b59b6',
}

type Tab = 'productos' | 'pedidos' | 'historial' | 'perfil'

// ─── Filter bar shared component ──────────────────────────────────────────────

const FilterBar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, padding: '14px 16px', background: '#0d0d0d', borderRadius: 12, border: `1px solid ${C.border}`, alignItems: 'center' }}>
    {children}
  </div>
)

const FilterChip: React.FC<{ label: string; active: boolean; color?: string; onClick: () => void }> = ({ label, active, color, onClick }) => {
  const col = color ?? C.terra
  return (
    <button onClick={onClick} style={{
      padding: '5px 13px', borderRadius: 20, border: `1px solid ${active ? col : C.border}`,
      background: active ? col + '22' : 'none', color: active ? col : C.textSub,
      fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
      fontFamily: 'Montserrat, sans-serif', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}

const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder ?? 'Buscar...'}
    style={{
      padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
      background: '#141414', color: C.cream, fontSize: 12,
      fontFamily: 'Montserrat, sans-serif', outline: 'none', width: 180,
    }}
  />
)

function formatCents(cents: number): string { return `S/ ${(cents / 100).toFixed(0)}` }
function formatFecha(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) }
  catch { return iso }
}
function colorStock(kg: number): string {
  if (kg > 20) return C.sage
  if (kg > 10) return C.yellow
  return C.red
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; text: string; tipo: 'ok' | 'error' | 'info' }

const Toast: React.FC<{ msgs: ToastMsg[]; onRemove: (id: number) => void }> = ({ msgs, onRemove }) => (
  <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'min(90vw, 360px)' }}>
    {msgs.map(m => (
      <div key={m.id} onClick={() => onRemove(m.id)} style={{
        padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: m.tipo === 'ok' ? C.sage : m.tipo === 'error' ? C.red : C.yellow,
        color: m.tipo === 'info' ? '#000' : C.white,
        pointerEvents: 'all', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {m.tipo === 'ok' ? '✓ ' : m.tipo === 'error' ? '✕ ' : 'ℹ '}{m.text}
      </div>
    ))}
  </div>
)

// ─── Modal producto (crear/editar) ────────────────────────────────────────────

interface ProductoFormData {
  nombre: string; variedad: string; proceso: string; altitudMsnm: string; cosecha: string
  notasSabor: string; descripcion: string; puntajeReferencial: string
  precioBaseKgSoles: string; kgDisponibles: string; fotos: string[]
}

const PROCESOS: { value: string; label: string }[] = [
  { value: 'lavado', label: 'Lavado' },
  { value: 'natural', label: 'Natural' },
  { value: 'honey', label: 'Honey' },
  { value: 'anaerobico', label: 'Anaeróbico' },
]

const ModalProducto: React.FC<{
  caficultorId: string; caficultorNombre: string; producto?: ProductoONE; isDemo: boolean
  onClose: () => void
  onToast: (t: string, tipo?: 'ok' | 'error' | 'info') => void
  onGuardado: (p: ProductoONE) => void
}> = ({ caficultorId, caficultorNombre, producto, isDemo, onClose, onToast, onGuardado }) => {
  const esEdicion = !!producto

  const [form, setForm] = useState<ProductoFormData>({
    nombre: producto?.nombre ?? '',
    variedad: producto?.variedad ?? '',
    proceso: producto?.proceso ?? 'lavado',
    altitudMsnm: String(producto?.altitudMsnm ?? ''),
    cosecha: producto?.cosecha ?? '',
    notasSabor: producto?.notasSabor?.join(', ') ?? '',
    descripcion: producto?.descripcion ?? '',
    puntajeReferencial: String(producto?.puntajeReferencial ?? ''),
    precioBaseKgSoles: producto ? String(Math.round(producto.precioBaseKgCents / 100)) : '',
    kgDisponibles: String(producto?.kgDisponibles ?? ''),
    fotos: producto?.fotos?.length ? producto.fotos : (producto?.foto ? [producto.foto] : ['']),
  })
  const [guardando, setGuardando] = useState(false)

  function set(field: keyof ProductoFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.variedad.trim() || !form.precioBaseKgSoles) {
      onToast('Nombre, variedad y precio base son obligatorios', 'error')
      return
    }
    const precioBaseSoles = parseFloat(form.precioBaseKgSoles)
    const precioBaseCents = Math.round(precioBaseSoles * 100)
    const kg = parseInt(form.kgDisponibles) || 0
    if (isNaN(precioBaseCents) || precioBaseCents <= 0) { onToast('Precio base inválido', 'error'); return }

    setGuardando(true)
    try {
      const notasSabor = form.notasSabor.split(',').map(s => s.trim()).filter(Boolean)
      const fotosValidas = form.fotos.map(f => f.trim()).filter(Boolean)
      const fotosPrincipal = fotosValidas[0] ?? 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1/tunaywasi/placeholder-cafe.jpg'
      const data: Omit<ProductoONE, 'id' | 'createdAt' | 'updatedAt'> = {
        caficultorId, caficultorNombre,
        nombre: form.nombre.trim(),
        variedad: form.variedad.trim(),
        proceso: form.proceso as ProductoONE['proceso'],
        presentacion: (producto?.presentacion ?? 'tostado_grano') as ProductoONE['presentacion'],
        nivelTueste: (producto?.nivelTueste ?? 'medio') as ProductoONE['nivelTueste'],
        costos: producto?.costos ?? { precioVerdeKgCents: precioBaseCents, costoTuesteKgCents: 0, costoBolsaUndCents: 0, margenPct: 0 },
        altitudMsnm: parseInt(form.altitudMsnm) || 0,
        cosecha: form.cosecha.trim(),
        notasSabor,
        descripcion: form.descripcion.trim(),
        puntajeReferencial: form.puntajeReferencial ? parseInt(form.puntajeReferencial) : undefined,
        notaReferencial: 'Puntaje referencial declarado por el caficultor',
        precioBaseKgCents: precioBaseCents,
        kgDisponibles: kg,
        kgReservados: producto?.kgReservados ?? 0,
        status: producto?.status ?? 'activo',
        foto: fotosPrincipal,
        fotos: fotosValidas,
      }

      if (esEdicion && producto) {
        if (isDemo) await demoUpdateProducto(producto.id, data)
        else await updateProducto(producto.id, data)
        onGuardado({ ...data, id: producto.id, createdAt: producto.createdAt, updatedAt: new Date().toISOString() })
        onToast('Producto actualizado', 'ok')
      } else {
        const id = isDemo ? await demoCrearProducto(data) : await crearProducto(data)
        onGuardado({ ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        onToast('Producto creado', 'ok')
      }
      onClose()
    } catch {
      onToast('Error al guardar el producto', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${C.border}`, background: '#0f0f0f',
    fontSize: 13, fontFamily: 'Montserrat, sans-serif', color: C.cream,
    outline: 'none', boxSizing: 'border-box', marginBottom: 12,
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }

  const precioBaseSoles = parseFloat(form.precioBaseKgSoles) || 0
  const precioBaseCentsPreview = Math.round(precioBaseSoles * 100)
  const notasArray = form.notasSabor.split(',').map(s => s.trim()).filter(Boolean)
  const procesoColor = PROCESO_COLORS[form.proceso] ?? C.terra

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: C.bg, overflowY: 'auto', fontFamily: 'Montserrat, sans-serif' }}>
      <style>{`@media (max-width: 720px) { .modal-producto-preview { display: none !important; } }`}</style>

      {/* Header sticky */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', padding: 0 }}>← Volver</button>
        <span style={{ color: C.border }}>|</span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
          {esEdicion ? 'Editar producto' : 'Nuevo producto'}
        </p>
      </header>

      {/* Layout dos columnas */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }}>

        {/* ── Columna izquierda: formulario ── */}
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 11, color: C.sage, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {esEdicion ? 'Editar producto' : 'Nuevo producto'}
          </p>
          <h2 style={{ margin: '0 0 24px', fontSize: 26, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>
            {form.nombre || 'Tu café'}
          </h2>

          <label style={labelStyle}>Nombre del café *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} placeholder="Bourbon Lavado — Finca La Coipa" maxLength={80} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Variedad *</label>
              <input value={form.variedad} onChange={e => set('variedad', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="Bourbon" />
            </div>
            <div>
              <label style={labelStyle}>Proceso *</label>
              <select value={form.proceso} onChange={e => set('proceso', e.target.value)} style={{ ...inputStyle, marginBottom: 0, cursor: 'pointer' }}>
                {PROCESOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Altitud (msnm)</label>
              <input type="number" value={form.altitudMsnm} onChange={e => set('altitudMsnm', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="1800" />
            </div>
            <div>
              <label style={labelStyle}>Cosecha</label>
              <input value={form.cosecha} onChange={e => set('cosecha', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="Junio 2026" />
            </div>
          </div>

          <label style={labelStyle}>Notas de sabor (separadas por coma)</label>
          <input value={form.notasSabor} onChange={e => set('notasSabor', e.target.value)} style={inputStyle} placeholder="chocolate negro, avellana, mandarina" />

          <label style={labelStyle}>Descripción breve</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} maxLength={200} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} placeholder="Perfil del café, origen, proceso..." />

          {/* Precio */}
          <div style={{ background: '#0d0d0d', border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Precio de venta</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Precio /kg (S/) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.textSub, pointerEvents: 'none' }}>S/</span>
                  <input type="number" min="1" step="0.5" value={form.precioBaseKgSoles} onChange={e => set('precioBaseKgSoles', e.target.value)} style={{ ...inputStyle, marginBottom: 0, paddingLeft: 28 }} placeholder="66" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Stock disponible (kg)</label>
                <input type="number" value={form.kgDisponibles} onChange={e => set('kgDisponibles', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="100" />
              </div>
              <div>
                <label style={labelStyle}>Puntaje ref. (SCA)</label>
                <input type="number" value={form.puntajeReferencial} onChange={e => set('puntajeReferencial', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} placeholder="85" min="0" max="100" />
              </div>
            </div>
            {precioBaseSoles > 0 && (
              <div style={{ marginTop: 14 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, color: C.textSub }}>Lo que recibe la cafetería:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {([['1 kg', precioBaseCentsPreview], ['5 kg', precioBaseCentsPreview * 5], ['10 kg', precioBaseCentsPreview * 10], ['25 kg', precioBaseCentsPreview * 25]] as [string, number][]).map(([fmt, val]) => (
                    <div key={fmt} style={{ background: C.card, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 10, color: C.textSub }}>{fmt}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: C.terra }}>S/ {(val/100).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <label style={labelStyle}>Fotos del lote (URLs, hasta 5)</label>
          {form.fotos.map((url, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                value={url}
                onChange={e => setForm(prev => {
                  const fotos = [...prev.fotos]
                  fotos[idx] = e.target.value
                  return { ...prev, fotos }
                })}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                placeholder={idx === 0 ? 'https://... (foto principal)' : `https://... (foto ${idx + 1})`}
                maxLength={300}
              />
              {form.fotos.length > 1 && (
                <button
                  onClick={() => setForm(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== idx) }))}
                  style={{ padding: '0 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.red, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
                >×</button>
              )}
            </div>
          ))}
          {form.fotos.length < 5 && (
            <button
              onClick={() => setForm(prev => ({ ...prev, fotos: [...prev.fotos, ''] }))}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px dashed ${C.border}`, background: 'none', color: C.textSub, fontSize: 12, cursor: 'pointer', marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}
            >
              + Agregar foto
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '14px 0', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', fontSize: 14, fontWeight: 600, color: C.textSub, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: '14px 0', borderRadius: 10, border: 'none', background: C.terra, fontSize: 14, fontWeight: 700, color: C.white, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </div>

        {/* ── Columna derecha: preview ── */}
        <div className="modal-producto-preview">
          <div style={{ position: 'sticky', top: 76 }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Así lo verán las cafeterías
            </p>

            {/* Card producto */}
            <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 12 }}>
              {form.fotos[0] && (
                <div style={{ height: 150, background: '#0a0a0a', overflow: 'hidden' }}>
                  <img src={form.fotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
              )}
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ padding: '3px 9px', borderRadius: 5, background: procesoColor + '22', color: procesoColor, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {PROCESO_LABELS[form.proceso] ?? form.proceso}
                  </span>
                  {form.puntajeReferencial && (
                    <span style={{ fontSize: 11, color: C.sage }}>~{form.puntajeReferencial} pts</span>
                  )}
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.2 }}>
                  {form.nombre || 'Nombre del café'}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: C.textSub }}>
                  {[form.variedad, form.cosecha].filter(Boolean).join(' · ') || 'Variedad · Cosecha'}
                  {form.altitudMsnm ? ` · ${form.altitudMsnm} msnm` : ''}
                </p>
                {notasArray.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {notasArray.map(n => (
                      <span key={n} style={{ padding: '2px 8px', borderRadius: 20, background: '#1a1a1a', color: C.creamMuted, fontSize: 11 }}>{n}</span>
                    ))}
                  </div>
                )}
                {form.descripcion && (
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: C.textSub, fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{form.descripcion}"
                  </p>
                )}
                {precioBaseSoles > 0 && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 11, color: C.textSub }}>Desde</p>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.terra }}>
                      S/ {precioBaseSoles.toFixed(0)} <span style={{ fontSize: 12, color: C.textSub, fontWeight: 400 }}>/ kg</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats del caficultor */}
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tu ventaja competitiva</p>
              {[
                { icon: '📍', texto: 'Trazabilidad verificada — el negocio sabe exactamente de dónde viene el café' },
                { icon: '💰', texto: 'Precio justo directo — sin intermediarios, más margen para ti' },
              ].map(b => (
                <div key={b.icon} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{b.icon}</span>
                  <p style={{ margin: 0, fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>{b.texto}</p>
                </div>
              ))}
            </div>

            <p style={{ margin: '12px 0 0', fontSize: 11, color: C.muted, textAlign: 'center' }}>
              El preview se actualiza en tiempo real
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Formulario editar perfil caficultor ──────────────────────────────────────

const REGIONES_PERU = ['Amazonas', 'Ayacucho', 'Cajamarca', 'Cusco', 'Huánuco', 'Junín', 'La Libertad', 'Loreto', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Ucayali']

const FormEditarPerfil: React.FC<{
  caficultor: CaficultorONE
  isDemo: boolean
  onCancel: () => void
  onSaved: (updates: Partial<CaficultorONE>) => void
  onToast: (t: string, tipo?: 'ok' | 'error') => void
  inputStyle: React.CSSProperties
}> = ({ caficultor, isDemo, onCancel, onSaved, onToast, inputStyle }) => {
  const [nombre, setNombre] = React.useState(caficultor.nombre)
  const [region, setRegion] = React.useState(caficultor.region)
  const [distrito, setDistrito] = React.useState(caficultor.distrito)
  const [altitud, setAltitud] = React.useState(String(caficultor.altitudMsnm))
  const [historia, setHistoria] = React.useState(caficultor.historia)
  const [foto, setFoto] = React.useState(caficultor.foto)
  const [guardando, setGuardando] = React.useState(false)

  async function guardar() {
    if (!nombre.trim()) { onToast('El nombre es obligatorio', 'error'); return }
    setGuardando(true)
    try {
      const updates: Partial<CaficultorONE> = {
        nombre: nombre.trim(),
        region: region.trim(),
        distrito: distrito.trim(),
        altitudMsnm: parseInt(altitud) || caficultor.altitudMsnm,
        historia: historia.trim(),
        foto: foto.trim() || caficultor.foto,
      }
      if (isDemo) await demoUpdateCaficultor(caficultor.id, updates)
      else await updateCaficultor(caficultor.id, updates)
      onSaved(updates)
    } catch {
      onToast('No se pudo guardar el perfil', 'error')
    } finally {
      setGuardando(false)
    }
  }

  const C_local = { border: '#2a2a2a', bg: '#0f0f0f', cream: '#f2e0cc', textSub: '#888888', terra: '#c96e4b', white: '#ffffff', card: '#141414' }

  return (
    <div style={{ background: C_local.card, borderRadius: 16, padding: '24px', border: `1px solid ${C_local.border}`, maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'Cormorant Garamond, serif', color: C_local.cream, fontWeight: 700 }}>Editar perfil</h2>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: C_local.textSub, fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>

      <label style={{ fontSize: 11, color: C_local.textSub, display: 'block', marginBottom: 4 }}>Nombre completo *</label>
      <input value={nombre} onChange={e => setNombre(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} placeholder="Segundo Rojas Herrera" maxLength={80} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: C_local.textSub, display: 'block', marginBottom: 4 }}>Región</label>
          <select value={region} onChange={e => setRegion(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const }}>
            <option value="">Seleccionar...</option>
            {REGIONES_PERU.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: C_local.textSub, display: 'block', marginBottom: 4 }}>Distrito / localidad</label>
          <input value={distrito} onChange={e => setDistrito(e.target.value)} style={inputStyle} placeholder="San Ignacio" maxLength={60} />
        </div>
      </div>

      <label style={{ fontSize: 11, color: C_local.textSub, display: 'block', marginBottom: 4 }}>Altitud (msnm)</label>
      <input value={altitud} onChange={e => setAltitud(e.target.value)} type="number" min="500" max="3500" style={{ ...inputStyle, marginBottom: 12 }} placeholder="1800" />

      <label style={{ fontSize: 11, color: C_local.textSub, display: 'block', marginBottom: 4 }}>Historia / descripción</label>
      <textarea
        value={historia}
        onChange={e => setHistoria(e.target.value)}
        maxLength={400}
        placeholder="Cuéntanos sobre tu finca, tu familia y tu café..."
        style={{ ...inputStyle, minHeight: 100, resize: 'vertical', marginBottom: 12 }}
      />

      <label style={{ fontSize: 11, color: C_local.textSub, display: 'block', marginBottom: 4 }}>URL foto de perfil</label>
      <input value={foto} onChange={e => setFoto(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} placeholder="https://res.cloudinary.com/..." maxLength={300} />

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${C_local.border}`, background: 'none', fontSize: 14, fontWeight: 600, color: C_local.textSub, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={guardar} disabled={guardando} style={{ flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', background: C_local.terra, fontSize: 14, fontWeight: 700, color: C_local.white, cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── Stepper pedido (perspectiva caficultor) ──────────────────────────────────

const CAF_STEPS = ['Recibido', 'Pago OK', 'Despachado', 'Entregado']

function stepCaficultor(p: PedidoONE): number {
  if (p.logisticaStatus === 'entregado') return 3
  if (p.logisticaStatus === 'en_agencia') return 2
  if (p.pagoStatus === 'verificado') return 1
  return 0
}

const StepperPedido: React.FC<{ pedido: PedidoONE }> = ({ pedido }) => {
  const step = stepCaficultor(pedido)
  return (
    <div style={{ margin: '8px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {CAF_STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: step >= i ? C.terra : C.border,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step > i
                  ? <span style={{ color: C.white, fontSize: 10 }}>✓</span>
                  : <span style={{ width: 5, height: 5, borderRadius: '50%', background: step === i ? C.white : C.muted, display: 'block' }} />
                }
              </div>
              <p style={{
                margin: '3px 0 0', fontSize: 8, textAlign: 'center', lineHeight: 1.2,
                color: step >= i ? C.terra : C.muted,
                fontWeight: step === i ? 700 : 400,
                fontFamily: 'Montserrat, sans-serif',
              }}>{label}</p>
            </div>
            {i < CAF_STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, background: step > i ? C.terra : C.border, marginBottom: 16 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'productos',  emoji: '🌱', label: 'Mis cafés' },
  { id: 'pedidos',    emoji: '📦', label: 'Pedidos' },
  { id: 'historial',  emoji: '📋', label: 'Mis ventas' },
  { id: 'perfil',     emoji: '⚙️', label: 'Perfil' },
]

const Sidebar: React.FC<{ tab: Tab; onChange: (t: Tab) => void; nombre: string; caficultorId: string; onLogout: () => void; collapsed?: boolean; onToggle: () => void }> = ({ tab, onChange, nombre, caficultorId, onLogout, collapsed = false, onToggle }) => (
  <nav style={{
    position: 'fixed', left: 0, top: 0, bottom: 0, width: collapsed ? 56 : 220,
    background: '#0d0d0d', borderRight: `1px solid ${C.border}`,
    display: 'flex', flexDirection: 'column', zIndex: 100,
    fontFamily: 'Montserrat, sans-serif', transition: 'width 0.2s ease', overflow: 'hidden',
  }}>
    {/* Toggle button */}
    <div style={{ padding: collapsed ? '14px 0' : '14px 16px 10px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', borderBottom: collapsed ? `1px solid ${C.border}` : 'none' }}>
      <button onClick={onToggle} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
        {collapsed ? '☰' : '←'}
      </button>
    </div>

    {/* Header: caficultor info (only when expanded) */}
    {!collapsed && (
      <div style={{ padding: '10px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, letterSpacing: '0.1em', textTransform: 'uppercase' }}>TUNAY WASI</p>
        <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{nombre}</p>
        <a href={`#/caficultor/${caficultorId}`} style={{ fontSize: 11, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>Ver perfil →</a>
      </div>
    )}

    {/* Nav items */}
    <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
      {NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? 0 : 12,
          padding: collapsed ? '11px 0' : '11px 20px',
          background: tab === item.id ? C.terra + '18' : 'none',
          border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
          cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
        }}>
          <span style={{ fontSize: 16 }}>{item.emoji}</span>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub }}>{item.label}</span>
          )}
        </button>
      ))}
    </div>

    {/* Logout */}
    <div style={{ padding: collapsed ? '16px 8px' : '16px 20px', borderTop: `1px solid ${C.border}` }}>
      {collapsed ? (
        <button onClick={onLogout} style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 14, cursor: 'pointer', display: 'flex', justifyContent: 'center' }} title="Cerrar sesión">⏻</button>
      ) : (
        <button onClick={onLogout} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>Cerrar sesión</button>
      )}
    </div>
  </nav>
)

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  usuarioId: string
  caficultorId: string
  isDemo?: boolean
}

const PortalCaficultor: React.FC<Props> = ({ usuarioId: _usuarioId, caficultorId, isDemo = false }) => {
  const [tab, setTab] = useState<Tab>('productos')
  const [caficultor, setCaficultor] = useState<CaficultorONE | null>(null)
  const [pedidos, setPedidos] = useState<PedidoONE[]>([])
  const [productos, setProductos] = useState<ProductoONE[]>([])
  const [calificaciones, setCalificaciones] = useState<CalificacionCaficultor[]>([])
  const [loading, setLoading] = useState(true)
  const [accionando, setAccionando] = useState<string | null>(null)
  const [stockEditando, setStockEditando] = useState<string | null>(null)
  const [stockValor, setStockValor] = useState<Record<string, string>>({})
  const [modalProducto, setModalProducto] = useState<{ abierto: boolean; editar?: ProductoONE }>({ abierto: false })
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [perfilEnviosAbierto, setPerfilEnviosAbierto] = useState(false)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Filtros productos
  const [filtroProceso, setFiltroProceso] = useState<string>('todos')
  const [filtroStock, setFiltroStock] = useState<'todos' | 'bajo' | 'ok'>('todos')
  const [busquedaProducto, setBusquedaProducto] = useState('')

  // Filtros pedidos
  const [filtroPedidoEstado, setFiltroPedidoEstado] = useState<'todos' | 'preparando' | 'en_agencia'>('todos')
  const [busquedaPedido, setBusquedaPedido] = useState('')

  // Drawer detalle pedido
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoONE | null>(null)

  // Modal despacho por agencia
  const [modalDespacho, setModalDespacho] = useState<{ pedidoId: string; agencia: string } | null>(null)
  const [despachoForm, setDespachoForm] = useState({ codigoAgencia: '', fotoDespacho: '' })

  // Filtros historial
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [historialDesde, setHistorialDesde] = useState('')
  const [historialOrden, setHistorialOrden] = useState<'desc' | 'asc'>('desc')

  // Filtros calificaciones
  const [filtroEstrellas, setFiltroEstrellas] = useState<number | null>(null)

  // Logística
  const [ubigeos, setUbigeos] = useState<UbigeoONE[]>([])
  const [logistica, setLogistica] = useState<LogisticaCaficultorONE | null>(null)
  const [logisticaCargando, setLogisticaCargando] = useState(false)
  const [logisticaGuardando, setLogisticaGuardando] = useState(false)
  // Selección ubigeo en cascada
  const [logDepSel, setLogDepSel] = useState('')
  const [logProvSel, setLogProvSel] = useState('')
  const [logUbigeoSel, setLogUbigeoSel] = useState('')
  // Estado de agencias seleccionadas
  const [logAgenciasActivas, setLogAgenciasActivas] = useState<Record<string, boolean>>({})
  const [logAgenciasDomicilio, setLogAgenciasDomicilio] = useState<Record<string, boolean>>({})

  function toast(text: string, tipo: 'ok' | 'error' | 'info' = 'ok') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, text, tipo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    async function cargar() {
      try {
        const [cafic, peds, prods] = await Promise.all([
          isDemo ? demoFetchCaficultor(caficultorId) : fetchCaficultor(caficultorId).catch(() => null),
          isDemo ? demoFetchPedidosByCaficultor(caficultorId) : fetchPedidosByCaficultor(caficultorId),
          isDemo ? demoFetchProductosByCaficultorLive(caficultorId) : fetchProductos().then(all => all.filter(p => p.caficultorId === caficultorId)),
        ])
        setCaficultor(cafic)
        setPedidos(peds)
        setProductos(prods)
        if (!isDemo) {
          const cals = await fetchCalificacionesByCaficultor(caficultorId).catch(() => [])
          setCalificaciones(cals)
        }
      } catch (e) {
        toast('Error al cargar datos', 'error')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [caficultorId, isDemo])

  const productoIds = new Set(productos.map(p => p.id))

  // Cargar ubigeos y logística al entrar al tab Perfil
  useEffect(() => {
    if (tab !== 'perfil') return
    if (ubigeos.length > 0) return // ya cargado
    setLogisticaCargando(true)
    Promise.all([
      isDemo ? demoFetchUbigeos() : fetchUbigeos(),
      isDemo ? demoFetchLogisticaCaficultor(caficultorId) : fetchLogisticaCaficultor(caficultorId),
    ]).then(([ubs, log]) => {
      setUbigeos(ubs)
      if (log) {
        setLogistica(log)
        // Pre-seleccionar ubigeo guardado
        setLogDepSel(log.departamento)
        setLogProvSel(log.provincia)
        setLogUbigeoSel(log.ubigeo)
        setLogAgenciasActivas(log.agenciasActivas ?? {})
        setLogAgenciasDomicilio(log.agenciasPermiteDomicilio ?? {})
      }
    }).catch(() => toast('Error al cargar datos de logística', 'error'))
      .finally(() => setLogisticaCargando(false))
  }, [tab, caficultorId, isDemo, ubigeos.length])
  function misItems(pedido: PedidoONE) {
    return pedido.items.filter(i => productoIds.has(i.productoId) || i.caficultorId === caficultorId)
  }

  const paraDespachar = pedidos.filter(p => p.pagoStatus === 'verificado' && p.logisticaStatus === 'preparando')
  const enCamino = pedidos.filter(p => p.logisticaStatus === 'en_agencia')
  const entregados = pedidos.filter(p => p.logisticaStatus === 'entregado')

  const scorePromedio = calificaciones.length > 0
    ? Math.round(calificaciones.reduce((s, c) => s + c.estrellas, 0) / calificaciones.length * 10) / 10
    : caficultor?.scoreConfianza ?? 0

  function abrirDespacho(pedido: PedidoONE) {
    setDespachoForm({ codigoAgencia: '', fotoDespacho: '' })
    setModalDespacho({ pedidoId: pedido.id, agencia: pedido.agencia ?? 'olva' })
  }

  async function confirmarDespacho() {
    if (!modalDespacho) return
    const { codigoAgencia, fotoDespacho } = despachoForm
    if (!codigoAgencia.trim()) {
      toast('Ingresa el código de tracking de la agencia', 'error')
      return
    }
    setAccionando(modalDespacho.pedidoId)
    try {
      const data = { codigoAgencia: codigoAgencia.trim(), fotoDespacho: fotoDespacho.trim() || undefined }
      if (isDemo) await demoDespacharAgencia(modalDespacho.pedidoId, data)
      else await despacharAgencia(modalDespacho.pedidoId, data)
      setPedidos(prev => prev.map(p => p.id === modalDespacho.pedidoId
        ? { ...p, logisticaStatus: 'en_agencia', codigoAgencia: codigoAgencia.trim(), fotoDespacho: fotoDespacho.trim() || undefined }
        : p
      ))
      setModalDespacho(null)
      toast('Pedido despachado — la cafetería puede ver el código de tracking', 'ok')
    } catch {
      toast('Error al registrar el despacho', 'error')
    } finally { setAccionando(null) }
  }

  async function guardarStock(productoId: string) {
    const val = parseInt(stockValor[productoId] ?? '')
    if (isNaN(val) || val < 0) { toast('Valor de stock inválido', 'error'); return }
    setAccionando(productoId)
    try {
      if (isDemo) await demoUpdateStock(productoId, val)
      else await updateStock(productoId, val)
      setProductos(prev => prev.map(p => p.id === productoId ? { ...p, kgDisponibles: val } : p))
      setStockEditando(null)
      toast('Stock actualizado', 'ok')
    } catch {
      toast('Error al actualizar stock', 'error')
    } finally { setAccionando(null) }
  }

  async function toggleStatus(producto: ProductoONE) {
    const nuevoStatus = producto.status === 'activo' ? 'pausado' : 'activo'
    setAccionando(producto.id)
    try {
      if (isDemo) await demoUpdateProducto(producto.id, { status: nuevoStatus })
      else await updateProducto(producto.id, { status: nuevoStatus })
      setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, status: nuevoStatus } : p))
      toast(`Producto ${nuevoStatus === 'activo' ? 'activado' : 'pausado'}`, 'info')
    } catch {
      toast('Error al cambiar estado', 'error')
    } finally { setAccionando(null) }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: C.textSub, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>Cargando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const nombreCaficultor = caficultor?.nombre ?? 'Mi portal'

  // ─── Tabs ─────────────────────────────────────────────────────────────────


  function renderPedidos() {
    const todos = pedidos.filter(p => p.logisticaStatus !== 'entregado')
    const filtrados = todos.filter(p => {
      if (filtroPedidoEstado === 'preparando' && p.logisticaStatus !== 'preparando') return false
      if (filtroPedidoEstado === 'en_agencia' && p.logisticaStatus !== 'en_agencia') return false
      if (busquedaPedido && !p.nombreLocal.toLowerCase().includes(busquedaPedido.toLowerCase()) && !p.id.includes(busquedaPedido)) return false
      return true
    })

    return (
      <div>
        <FilterBar>
          <SearchInput value={busquedaPedido} onChange={setBusquedaPedido} placeholder="Buscar cafetería o ID..." />
          <FilterChip label="Todos" active={filtroPedidoEstado === 'todos'} onClick={() => setFiltroPedidoEstado('todos')} />
          <FilterChip label={`Preparando (${paraDespachar.length})`} color={C.yellow} active={filtroPedidoEstado === 'preparando'} onClick={() => setFiltroPedidoEstado('preparando')} />
          <FilterChip label={`En agencia (${enCamino.length})`} color={C.blue} active={filtroPedidoEstado === 'en_agencia'} onClick={() => setFiltroPedidoEstado('en_agencia')} />
        </FilterBar>

        {filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 13, color: C.textSub }}>Sin pedidos para estos filtros</p>
          </div>
        ) : (
          <div className="grid-productos">
            {filtrados.map(p => {
              const isPend = p.logisticaStatus === 'preparando'
              const isAgencia = p.logisticaStatus === 'en_agencia'
              const pagoOk = p.pagoStatus === 'verificado'

              const statusColor = isPend && pagoOk ? C.sage
                : isPend ? C.yellow
                : C.blue
              const statusLabel = isPend && pagoOk ? '✓ Pago OK · Despachar'
                : isPend ? '⏳ Pago pendiente'
                : '🚚 En agencia'

              const total = misItems(p).reduce((s, i) => s + i.subtotalCents, 0)

              return (
                <div key={p.id} style={{
                  background: C.card, borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${statusColor}33`,
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Cabecera coloreada */}
                  <div style={{ padding: '12px 14px', background: statusColor + '11', borderBottom: `1px solid ${statusColor}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, padding: '2px 8px', borderRadius: 10, background: statusColor + '22', border: `1px solid ${statusColor}44` }}>
                      {statusLabel}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.terra }}>{formatCents(total)}</span>
                  </div>

                  {/* Contenido */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.2 }}>{p.nombreLocal}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{p.distritoLocal} · {formatFecha(p.createdAt)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>{p.id}</p>
                    </div>

                    {/* Items compactos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {misItems(p).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: C.bg, borderRadius: 6 }}>
                          <span style={{ fontSize: 11, color: C.text }}>{item.qty}×{item.presentacion} — {item.productoNombre}</span>
                          <span style={{ fontSize: 11, color: C.terra, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{formatCents(item.subtotalCents)}</span>
                        </div>
                      ))}
                    </div>

                    {isAgencia && p.codigoAgencia && (
                      <p style={{ margin: 0, fontSize: 11, color: C.blue, fontWeight: 600 }}>
                        📦 {p.agencia?.toUpperCase()} · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{p.codigoAgencia}</span>
                      </p>
                    )}

                    <StepperPedido pedido={p} />

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      <button
                        onClick={() => setPedidoDetalle(p)}
                        style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        Ver detalle
                      </button>
                      {isPend && pagoOk && (
                        <button
                          onClick={() => abrirDespacho(p)}
                          style={{ flex: 2, padding: '7px', borderRadius: 6, border: 'none', background: C.terra, color: C.white, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                        >
                          🚚 Despachar →
                        </button>
                      )}
                      {isPend && !pagoOk && (
                        <div style={{ flex: 2, padding: '7px', borderRadius: 6, background: C.yellow + '11', border: `1px solid ${C.yellow}33`, fontSize: 11, color: C.yellow, textAlign: 'center' }}>
                          ⏳ Esperando pago
                        </div>
                      )}
                      {isAgencia && (
                        <div style={{ flex: 2, padding: '7px', borderRadius: 6, background: C.blue + '11', border: `1px solid ${C.blue}33`, fontSize: 11, color: C.blue, textAlign: 'center' }}>
                          En tránsito
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Drawer detalle pedido */}
        {pedidoDetalle && (() => {
          const p = pedidoDetalle
          const isPend = p.logisticaStatus === 'preparando'
          const isAgencia = p.logisticaStatus === 'en_agencia'
          const pagoOk = p.pagoStatus === 'verificado'
          const total = misItems(p).reduce((s, i) => s + i.subtotalCents, 0)

          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex' }} onClick={() => setPedidoDetalle(null)}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)' }} />
              <div
                style={{ width: 'min(480px, 100vw)', background: C.card, borderLeft: `1px solid ${C.border}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header drawer */}
                <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 10, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.id}</p>
                    <h2 style={{ margin: '0 0 2px', fontSize: 22, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>{p.nombreLocal}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: C.textSub }}>{p.distritoLocal} · {formatFecha(p.createdAt)}</p>
                  </div>
                  <button onClick={() => setPedidoDetalle(null)} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 22, cursor: 'pointer', padding: '0 0 0 16px', lineHeight: 1 }}>×</button>
                </div>

                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Estado pago */}
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: (pagoOk ? C.sage : C.yellow) + '11', border: `1px solid ${(pagoOk ? C.sage : C.yellow)}33` }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: pagoOk ? C.sage : C.yellow }}>
                      {pagoOk ? '✓ Pago verificado' : p.pagoStatus === 'voucher_subido' ? '🔎 Voucher enviado — verificando' : '⏳ Pago pendiente'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub }}>
                      Método: {p.metodoPago?.toUpperCase() ?? '—'}
                      {p.voucherUrl ? <> · <a href={p.voucherUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.terra }}>Ver voucher →</a></> : null}
                    </p>
                  </div>

                  {/* Items */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Productos</p>
                    {misItems(p).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: C.bg, borderRadius: 8, marginBottom: 6 }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>{item.productoNombre}</p>
                          <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{item.qty} × {item.presentacion}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.terra, flexShrink: 0, marginLeft: 12 }}>{formatCents(item.subtotalCents)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                      <span style={{ fontSize: 13, color: C.textSub }}>Envío</span>
                      <span style={{ fontSize: 13, color: C.textSub }}>{formatCents(p.deliveryCents)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.cream }}>Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: C.terra }}>{formatCents(total + p.deliveryCents)}</span>
                    </div>
                  </div>

                  {/* Dirección */}
                  {p.direccionEntrega && (
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dirección de entrega</p>
                      <p style={{ margin: 0, fontSize: 13, color: C.cream, padding: '10px 12px', background: C.bg, borderRadius: 8 }}>📍 {p.direccionEntrega}</p>
                    </div>
                  )}

                  {/* Chat con el negocio */}
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Chat con el negocio
                    </p>
                    <ChatPedido
                      pedidoId={p.id}
                      usuarioId={caficultorId}
                      usuarioNombre={caficultor?.nombre ?? 'Caficultor'}
                      usuarioRol="caficultor"
                      isDemo={isDemo}
                      codigoTracking={p.codigoAgencia}
                    />
                  </div>

                  {/* Código agencia si está en tránsito */}
                  {isAgencia && p.codigoAgencia && (
                    <div style={{ padding: '12px 14px', background: C.blue + '11', border: `1px solid ${C.blue}33`, borderRadius: 10 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.blue }}>🚚 En agencia {p.agencia?.toUpperCase()}</p>
                      <p style={{ margin: 0, fontSize: 14, color: C.cream, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{p.codigoAgencia}</p>
                    </div>
                  )}

                  {/* Teléfono negocio */}
                  {p.negocioTelefono && (
                    <a
                      href={`https://wa.me/${p.negocioTelefono.replace(/\D/g, '')}?text=Hola, soy el caficultor de Tunay Wasi. Tu pedido ${p.id} está listo.`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#25D36622', border: `1px solid #25D36644`, textDecoration: 'none' }}
                    >
                      <span style={{ fontSize: 18 }}>💬</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream }}>WhatsApp al negocio</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub }}>{p.negocioNombre} · {p.negocioTelefono}</p>
                      </div>
                    </a>
                  )}
                </div>

                {/* Footer acción */}
                {isPend && pagoOk && (
                  <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <button
                      onClick={() => { setPedidoDetalle(null); abrirDespacho(p) }}
                      style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: C.terra, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      🚚 Ingresar código de agencia →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  function renderProductos() {
    const procesosUsados = Array.from(new Set(productos.map(p => p.proceso)))
    const filtrados = productos.filter(p => {
      if (filtroProceso !== 'todos' && p.proceso !== filtroProceso) return false
      if (filtroStock === 'bajo' && p.kgDisponibles > 10) return false
      if (filtroStock === 'ok' && p.kgDisponibles <= 10) return false
      if (busquedaProducto && !p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) && !p.variedad.toLowerCase().includes(busquedaProducto.toLowerCase())) return false
      return true
    })
    const activos = filtrados.filter(p => p.status !== 'pausado')
    const pausados = filtrados.filter(p => p.status === 'pausado')
    const ordenados = [...activos, ...pausados]

    return (
      <div>
        {/* Header con contador y botón */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>
            <span style={{ color: C.cream, fontWeight: 700 }}>{productos.length}</span> productos
            {filtrados.length < productos.length && <span> · <span style={{ color: C.terra }}>{filtrados.length} mostrados</span></span>}
          </p>
          <button onClick={() => setModalProducto({ abierto: true })} style={{ fontSize: 13, color: C.white, background: C.terra, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>+ Nuevo producto</button>
        </div>

        {/* Filtros */}
        <FilterBar>
          <SearchInput value={busquedaProducto} onChange={setBusquedaProducto} placeholder="Buscar por nombre o variedad..." />
          <FilterChip label="Todos" active={filtroProceso === 'todos'} onClick={() => setFiltroProceso('todos')} />
          {procesosUsados.map(pr => (
            <FilterChip key={pr} label={PROCESO_LABELS[pr] ?? pr} color={PROCESO_COLORS[pr]} active={filtroProceso === pr} onClick={() => setFiltroProceso(pr)} />
          ))}
          <span style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} />
          <FilterChip label="Stock bajo" color={C.red} active={filtroStock === 'bajo'} onClick={() => setFiltroStock(filtroStock === 'bajo' ? 'todos' : 'bajo')} />
          <FilterChip label="Stock ok" color={C.sage} active={filtroStock === 'ok'} onClick={() => setFiltroStock(filtroStock === 'ok' ? 'todos' : 'ok')} />
        </FilterBar>

        {/* Empty state */}
        {productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🌱</p>
            <p style={{ fontSize: 18, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Aún no tienes productos</p>
            <p style={{ fontSize: 13, color: C.textSub, marginBottom: 20 }}>Agrega tu primer café para que las cafeterías puedan comprarlo</p>
            <button onClick={() => setModalProducto({ abierto: true })} style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: C.terra, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Agregar primer producto
            </button>
          </div>
        ) : ordenados.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.textSub, fontSize: 13, padding: '30px 0' }}>Sin resultados para estos filtros</p>
        ) : (
          /* Netflix grid */
          <div className="grid-productos">
            {ordenados.map(p => {
              const editando = stockEditando === p.id
              const stockColor = colorStock(p.kgDisponibles)
              const pct = Math.min(100, (p.kgDisponibles / Math.max(p.kgDisponibles + p.kgReservados, 1)) * 100)
              const isPaused = p.status === 'pausado'
              const procesoColor = PROCESO_COLORS[p.proceso] ?? C.terra

              return (
                <div key={p.id} style={{
                  background: C.card, borderRadius: 14, overflow: 'hidden',
                  border: `1px solid ${isPaused ? C.muted + '44' : C.border}`,
                  opacity: isPaused ? 0.65 : 1,
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', height: 130, background: '#0a0a0a', overflow: 'hidden' }}>
                    {p.foto ? (
                      <img src={p.foto} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.4 }}>☕</div>
                    )}
                    {/* Proceso badge */}
                    <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 5, background: procesoColor + 'dd', color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {PROCESO_LABELS[p.proceso] ?? p.proceso}
                    </span>
                    {/* Status badge */}
                    {isPaused && (
                      <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 5, background: '#000000cc', color: C.muted, fontSize: 9, fontWeight: 700 }}>PAUSADO</span>
                    )}
                    {/* Stock bajo overlay */}
                    {p.kgDisponibles <= 10 && p.status === 'activo' && (
                      <span style={{ position: 'absolute', bottom: 8, left: 8, padding: '3px 8px', borderRadius: 5, background: C.red + 'dd', color: '#fff', fontSize: 9, fontWeight: 700 }}>
                        ⚠ {p.kgDisponibles} kg
                      </span>
                    )}
                  </div>

                  {/* Contenido */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.2 }}>{p.nombre}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>
                        {p.variedad}{p.puntajeReferencial ? ` · ~${p.puntajeReferencial} pts` : ''}
                      </p>
                    </div>

                    {/* Precios 4 formatos */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
                      {(['1kg', '5kg', '10kg', '25kg'] as const).map(fmt => (
                        <div key={fmt} style={{ background: C.bg, borderRadius: 6, padding: '4px', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: 9, color: C.muted }}>{fmt}</p>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.terra }}>{formatCents(calcularPrecioFinal(p.precioBaseKgCents, fmt))}</p>
                        </div>
                      ))}
                    </div>

                    {/* Stock bar */}
                    {editando ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input type="number" value={stockValor[p.id] ?? String(p.kgDisponibles)}
                          onChange={e => setStockValor(prev => ({ ...prev, [p.id]: e.target.value }))}
                          style={{ width: 56, padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.cream, fontSize: 12, textAlign: 'right' }}
                        />
                        <span style={{ fontSize: 10, color: C.textSub }}>kg</span>
                        <button onClick={() => guardarStock(p.id)} disabled={accionando === p.id} style={{ padding: '4px 8px', borderRadius: 5, border: 'none', background: C.sage, color: '#000', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                          {accionando === p.id ? '...' : '✓'}
                        </button>
                        <button onClick={() => setStockEditando(null)} style={{ padding: '4px 6px', borderRadius: 5, border: 'none', background: C.border, color: C.textSub, fontSize: 10, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.border, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: stockColor, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 10, color: stockColor, fontWeight: 700, flexShrink: 0 }}>{p.kgDisponibles} kg</span>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                      <button onClick={() => setModalProducto({ abierto: true, editar: p })} style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => { setStockEditando(p.id); setStockValor(prev => ({ ...prev, [p.id]: String(p.kgDisponibles) })) }}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>
                        Stock
                      </button>
                      <button onClick={() => toggleStatus(p)} disabled={accionando === p.id} style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${isPaused ? C.sage + '44' : C.muted + '44'}`, background: 'none', color: isPaused ? C.sage : C.muted, fontSize: 11, cursor: 'pointer' }}>
                        {isPaused ? 'Activar' : 'Pausar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function renderCalificaciones() {
    const calsFiltradas = filtroEstrellas
      ? calificaciones.filter(c => c.estrellas === filtroEstrellas)
      : calificaciones

    const distrib = [5, 4, 3, 2, 1].map(n => ({
      n, count: calificaciones.filter(c => c.estrellas === n).length,
      pct: calificaciones.length > 0 ? (calificaciones.filter(c => c.estrellas === n).length / calificaciones.length) * 100 : 0,
    }))

    return (
      <div>
        {calificaciones.length === 0 && !caficultor?.scoreConfianza ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>★</p>
            <p style={{ fontSize: 18, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, marginBottom: 8 }}>Sin calificaciones aún</p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>Se generan cuando un negocio califica tu café después de recibirlo</p>
          </div>
        ) : (
          <div>
            {/* Resumen + distribución */}
            <div className="grid-score" style={{ marginBottom: 20, padding: '20px', background: C.card, borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: 52, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>
                  {scorePromedio > 0 ? scorePromedio.toFixed(1) : '—'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 6 }}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ fontSize: 16, color: n <= Math.round(scorePromedio) ? C.yellow : C.border }}>★</span>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>
                  {calificaciones.length || caficultor?.totalCalificaciones || 0} reseñas
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
                {distrib.map(({ n, count, pct }) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: C.textSub, width: 16, textAlign: 'right' }}>{n}</span>
                    <span style={{ fontSize: 12, color: C.yellow }}>★</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: C.yellow, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: C.textSub, width: 20, textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro por estrellas */}
            <FilterBar>
              <FilterChip label="Todas" active={filtroEstrellas === null} onClick={() => setFiltroEstrellas(null)} />
              {[5, 4, 3, 2, 1].map(n => (
                <FilterChip key={n} label={`${'★'.repeat(n)} (${calificaciones.filter(c => c.estrellas === n).length})`} color={C.yellow} active={filtroEstrellas === n} onClick={() => setFiltroEstrellas(filtroEstrellas === n ? null : n)} />
              ))}
            </FilterBar>

            {/* Lista completa */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {calsFiltradas.length === 0 ? (
                <p style={{ textAlign: 'center', color: C.textSub, fontSize: 13, padding: '20px 0' }}>Sin calificaciones con este filtro</p>
              ) : calsFiltradas.map(c => (
                <div key={c.id} style={{ background: C.card, borderRadius: 10, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.comentario ? 6 : 0, alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>{c.nombreLocal}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.textSub }}>{formatFecha(c.createdAt)}</p>
                    </div>
                    <span style={{ fontSize: 15, color: C.yellow, letterSpacing: 1 }}>{'★'.repeat(c.estrellas)}{'☆'.repeat(5 - c.estrellas)}</span>
                  </div>
                  {c.comentario && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.textSub, fontStyle: 'italic', lineHeight: 1.5 }}>"{c.comentario}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderHistorial() {
    let histFiltrado = [...entregados]
    if (busquedaHistorial) {
      histFiltrado = histFiltrado.filter(p =>
        p.nombreLocal.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
        p.id.includes(busquedaHistorial)
      )
    }
    if (historialDesde) {
      const desde = new Date(historialDesde).getTime()
      histFiltrado = histFiltrado.filter(p => new Date(p.updatedAt).getTime() >= desde)
    }
    histFiltrado.sort((a, b) => {
      const diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return historialOrden === 'desc' ? -diff : diff
    })

    const totalHistorial = histFiltrado.reduce((acc, p) => acc + misItems(p).reduce((s, i) => s + i.subtotalCents, 0), 0)

    return (
      <div>
        {/* Resumen */}
        {entregados.length > 0 && (
          <div className="grid-historial-kpis" style={{ marginBottom: 16 }}>
            <div style={{ background: C.card, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
              <p style={{ margin: '0 0 4px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entregas completadas</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.sage, fontFamily: 'Cormorant Garamond, serif' }}>{entregados.length}</p>
            </div>
            <div style={{ background: C.card, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
              <p style={{ margin: '0 0 4px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total {histFiltrado.length < entregados.length ? 'filtrado' : 'cobrado'}</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif' }}>{formatCents(totalHistorial)}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <FilterBar>
          <SearchInput value={busquedaHistorial} onChange={setBusquedaHistorial} placeholder="Buscar cafetería o ID..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: C.textSub }}>Desde:</label>
            <input type="date" value={historialDesde} onChange={e => setHistorialDesde(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: '#141414', color: C.cream, fontSize: 12, fontFamily: 'Montserrat, sans-serif', outline: 'none' }}
            />
          </div>
          {historialDesde && (
            <button onClick={() => setHistorialDesde('')} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>✕ Quitar fecha</button>
          )}
          <button onClick={() => setHistorialOrden(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 11, cursor: 'pointer' }}>
            {historialOrden === 'desc' ? '↓ Recientes' : '↑ Antiguos'}
          </button>
        </FilterBar>

        {entregados.length === 0 ? (
          <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Sin entregas completadas aún</p>
        ) : histFiltrado.length === 0 ? (
          <p style={{ color: C.textSub, fontSize: 13, textAlign: 'center', padding: '30px 0' }}>Sin resultados para estos filtros</p>
        ) : (
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {histFiltrado.map((p, idx) => {
              const subtotal = misItems(p).reduce((s, i) => s + i.subtotalCents, 0)
              return (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '14px 18px',
                  borderBottom: idx < histFiltrado.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.cream }}>{p.nombreLocal}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 11, color: C.textSub }}>{p.id} · {formatFecha(p.updatedAt)}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {misItems(p).map((i, k) => (
                        <span key={k} style={{ fontSize: 10, color: C.muted, padding: '2px 6px', background: C.bg, borderRadius: 4 }}>
                          {i.qty}×{i.presentacion}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 11, color: C.sage, fontWeight: 700, display: 'block', marginBottom: 2 }}>✓ Entregado</span>
                    <span style={{ fontSize: 14, color: C.terra, fontWeight: 700 }}>{formatCents(subtotal)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ─── Logística caficultor ─────────────────────────────────────────────────────

  function renderLogistica() {
    const departamentos = Array.from(new Set(ubigeos.map(u => u.departamento))).sort()
    const provincias = Array.from(new Set(ubigeos.filter(u => u.departamento === logDepSel).map(u => u.provincia))).sort()
    const ubigeoSelObj = ubigeos.find(u => u.id === logUbigeoSel)

    async function guardarLogistica() {
      if (!logUbigeoSel) { toast('Selecciona tu distrito de despacho', 'error'); return }
      const agenciasActivas = Object.entries(logAgenciasActivas).filter(([, v]) => v).map(([k]) => k)
      if (agenciasActivas.length === 0) { toast('Activa al menos una agencia de envío', 'error'); return }
      setLogisticaGuardando(true)
      try {
        const ubObj = ubigeos.find(u => u.id === logUbigeoSel)!
        const agenciasMap: Record<string, string> = {}
        for (const ag of ubObj.agencias) agenciasMap[ag.id] = ag.nombre
        const input = {
          caficultorId,
          ubigeo: logUbigeoSel,
          departamento: ubObj.departamento,
          provincia: ubObj.provincia,
          distrito: ubObj.distrito,
          agencias: agenciasActivas,
          agenciasMap,
          agenciasActivas: logAgenciasActivas,
          agenciasPermiteDomicilio: logAgenciasDomicilio,
        }
        if (isDemo) await demoSaveLogisticaCaficultor(input)
        else await saveLogisticaCaficultor(input)
        setLogistica({
          ubigeo: input.ubigeo,
          departamento: input.departamento,
          provincia: input.provincia,
          distrito: input.distrito,
          origenTexto: `${input.distrito}, ${input.provincia}, ${input.departamento}`,
          agencias: agenciasActivas,
          agenciasMap,
          agenciasActivas: logAgenciasActivas,
          agenciasPermiteDomicilio: logAgenciasDomicilio,
        })
        toast('Configuración de logística guardada', 'ok')
      } catch {
        toast('Error al guardar logística', 'error')
      } finally {
        setLogisticaGuardando(false)
      }
    }

    return (
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
            Configuración de logística
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.textSub, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}>
            Define desde dónde despachas y qué agencias de envío están disponibles en tu zona. Los negocios verán estas agencias al hacer un pedido.
          </p>
        </div>

        {logisticaCargando ? (
          <p style={{ color: C.textSub, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>Cargando...</p>
        ) : (
          <>
            {/* Estado actual */}
            {logistica && (
              <div style={{ padding: '14px 18px', borderRadius: 10, background: '#0d1f0d', border: `1px solid ${C.sage}33`, marginBottom: 28 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: C.sage, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Configuración activa
                </p>
                <p style={{ margin: '0 0 2px', fontSize: 14, color: C.cream, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                  📍 {logistica.origenTexto}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: C.textSub, fontFamily: 'Montserrat, sans-serif' }}>
                  Agencias: {Object.entries(logistica.agenciasMap ?? {}).filter(([id]) => logistica.agenciasActivas?.[id]).map(([, nombre]) => nombre).join(', ') || '—'}
                </p>
              </div>
            )}

            {/* Paso 1: Departamento */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                1 · Departamento de despacho
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {departamentos.map(dep => (
                  <button key={dep} onClick={() => { setLogDepSel(dep); setLogProvSel(''); setLogUbigeoSel(''); setLogAgenciasActivas({}); setLogAgenciasDomicilio({}) }}
                    style={{
                      padding: '7px 16px', borderRadius: 20,
                      border: `1px solid ${logDepSel === dep ? C.terra : C.border}`,
                      background: logDepSel === dep ? C.terra + '22' : 'none',
                      color: logDepSel === dep ? C.terra : C.textSub,
                      fontSize: 13, fontWeight: logDepSel === dep ? 700 : 400,
                      cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    {dep}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 2: Provincia */}
            {logDepSel && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  2 · Provincia
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {provincias.map(prov => (
                    <button key={prov} onClick={() => { setLogProvSel(prov); setLogUbigeoSel(''); setLogAgenciasActivas({}); setLogAgenciasDomicilio({}) }}
                      style={{
                        padding: '7px 16px', borderRadius: 20,
                        border: `1px solid ${logProvSel === prov ? C.terra : C.border}`,
                        background: logProvSel === prov ? C.terra + '22' : 'none',
                        color: logProvSel === prov ? C.terra : C.textSub,
                        fontSize: 13, fontWeight: logProvSel === prov ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.15s',
                      }}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 3: Distrito */}
            {logProvSel && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.textSub, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  3 · Distrito
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ubigeos.filter(u => u.departamento === logDepSel && u.provincia === logProvSel).map(u => (
                    <button key={u.id} onClick={() => {
                      setLogUbigeoSel(u.id)
                      // Pre-seleccionar todas las agencias activas
                      const activas: Record<string, boolean> = {}
                      const domicilio: Record<string, boolean> = {}
                      u.agencias.forEach(ag => { activas[ag.id] = true; domicilio[ag.id] = false })
                      setLogAgenciasActivas(activas)
                      setLogAgenciasDomicilio(domicilio)
                    }}
                      style={{
                        padding: '7px 16px', borderRadius: 20,
                        border: `1px solid ${logUbigeoSel === u.id ? C.terra : C.border}`,
                        background: logUbigeoSel === u.id ? C.terra + '22' : 'none',
                        color: logUbigeoSel === u.id ? C.terra : C.textSub,
                        fontSize: 13, fontWeight: logUbigeoSel === u.id ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                        transition: 'all 0.15s',
                      }}
                    >
                      {u.distrito}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 4: Agencias */}
            {logUbigeoSel && ubigeoSelObj && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: C.textSub, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  4 · Agencias disponibles en {ubigeoSelObj.distrito}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ubigeoSelObj.agencias.map(ag => (
                    <div key={ag.id} style={{
                      padding: '14px 16px', borderRadius: 10,
                      border: `1px solid ${logAgenciasActivas[ag.id] ? C.sage + '66' : C.border}`,
                      background: logAgenciasActivas[ag.id] ? '#0d1f0d' : C.card,
                    }}>
                      {/* Toggle activa */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: logAgenciasActivas[ag.id] ? 10 : 0 }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
                            {ag.nombre}
                          </p>
                          {ag.direccion && <p style={{ margin: 0, fontSize: 11, color: C.textSub, fontFamily: 'Montserrat, sans-serif' }}>{ag.direccion}{ag.horario ? ` · ${ag.horario}` : ''}</p>}
                        </div>
                        <button
                          onClick={() => setLogAgenciasActivas(prev => ({ ...prev, [ag.id]: !prev[ag.id] }))}
                          style={{
                            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: logAgenciasActivas[ag.id] ? C.sage : C.border,
                            color: logAgenciasActivas[ag.id] ? '#000' : C.textSub,
                            fontSize: 11, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                            flexShrink: 0, transition: 'all 0.15s',
                          }}
                        >
                          {logAgenciasActivas[ag.id] ? '✓ Activa' : 'Inactiva'}
                        </button>
                      </div>

                      {/* Toggle domicilio — solo si activa */}
                      {logAgenciasActivas[ag.id] && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                          <button
                            onClick={() => setLogAgenciasDomicilio(prev => ({ ...prev, [ag.id]: !prev[ag.id] }))}
                            style={{
                              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                              background: logAgenciasDomicilio[ag.id] ? C.terra : C.muted,
                              position: 'relative',
                            }}
                          >
                            <span style={{
                              position: 'absolute', top: 2, left: logAgenciasDomicilio[ag.id] ? 18 : 2,
                              width: 16, height: 16, borderRadius: '50%', background: C.white, transition: 'left 0.2s',
                            }} />
                          </button>
                          <p style={{ margin: 0, fontSize: 12, color: C.textSub, fontFamily: 'Montserrat, sans-serif' }}>
                            También ofrezco envío a domicilio por esta agencia
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón guardar */}
            {logUbigeoSel && (
              <button
                onClick={guardarLogistica}
                disabled={logisticaGuardando}
                style={{
                  padding: '14px 32px', borderRadius: 10, border: 'none',
                  background: logisticaGuardando ? C.muted : C.terra,
                  color: C.white, fontSize: 14, fontWeight: 700,
                  cursor: logisticaGuardando ? 'not-allowed' : 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {logisticaGuardando ? 'Guardando...' : '💾 Guardar configuración de logística'}
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  // ─── Perfil editable ─────────────────────────────────────────────────────────

  function renderPerfil() {
    if (!caficultor) return null

    const inputStyle: React.CSSProperties = {
      width: '100%', padding: '10px 12px', borderRadius: 8,
      border: `1px solid ${C.border}`, background: '#0f0f0f',
      fontSize: 13, fontFamily: 'Montserrat, sans-serif', color: C.cream,
      outline: 'none', boxSizing: 'border-box',
    }

    if (editandoPerfil) {
      return <FormEditarPerfil
        caficultor={caficultor}
        isDemo={isDemo}
        onCancel={() => setEditandoPerfil(false)}
        onSaved={(updates) => {
          setCaficultor(prev => prev ? { ...prev, ...updates } : prev)
          setEditandoPerfil(false)
          toast('Perfil actualizado', 'ok')
        }}
        onToast={toast}
        inputStyle={inputStyle}
      />
    }

    const stockTotal = productos.reduce((s, p) => s + (p.kgDisponibles ?? 0), 0)
    const menuItemStyle: React.CSSProperties = {
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px', background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
      color: C.cream, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 14,
      textAlign: 'left',
    }

    return (
      <div>
        {/* Banner: sin logística configurada */}
        {!logistica && !logisticaCargando && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#2a1a00', border: `1px solid ${C.yellow}44`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: C.yellow, fontFamily: 'Montserrat, sans-serif' }}>⚠️ Configura tus envíos</p>
              <p style={{ margin: 0, fontSize: 12, color: C.textSub, fontFamily: 'Montserrat, sans-serif' }}>Sin logística configurada no puedes recibir pedidos</p>
            </div>
            <button
              onClick={() => setPerfilEnviosAbierto(true)}
              style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.yellow, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
            >
              Configurar
            </button>
          </div>
        )}

        {/* Foto + nombre */}
        <div style={{ background: C.card, borderRadius: 16, overflow: 'hidden', marginBottom: 14, border: `1px solid ${C.border}` }}>
          {caficultor.foto && (
            <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
              <img src={caficultor.foto} alt={caficultor.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ padding: '16px 18px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{caficultor.nombre}</h2>
            <p style={{ margin: '0 0 2px', fontSize: 12, color: C.textSub }}>{(caficultor as any).email ?? '—'}</p>
            <p style={{ margin: '0 0 2px', fontSize: 12, color: C.textSub }}>{caficultor.region} · {caficultor.distrito}</p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: C.muted }}>{caficultor.altitudMsnm?.toLocaleString() ?? '—'} msnm</p>
            <a href={`#/caficultor/${caficultorId}`} style={{ fontSize: 12, color: C.terra, textDecoration: 'none', fontWeight: 600 }}>
              Ver perfil público →
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-kpis" style={{ marginBottom: 14 }}>
          {[
            { label: 'Pedidos atendidos', value: String(pedidos.length) },
            { label: 'Cafés publicados', value: String(productos.length) },
            { label: 'Stock total', value: `${stockTotal} kg` },
            { label: 'Calificación ★', value: scorePromedio > 0 ? scorePromedio.toFixed(1) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: C.card, borderRadius: 12, padding: '12px 14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <p style={{ margin: '0 0 3px', fontSize: 9, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Menú Android-style */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 14, overflow: 'hidden' }}>
          {/* Yo */}
          <button style={menuItemStyle} onClick={() => setEditandoPerfil(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <span>Yo</span>
            </span>
            <span style={{ color: C.textSub, fontSize: 16 }}>›</span>
          </button>

          {/* Envíos */}
          <button style={{ ...menuItemStyle, borderBottom: perfilEnviosAbierto ? `1px solid ${C.border}` : 'none' }}
            onClick={() => setPerfilEnviosAbierto(prev => !prev)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>🚚</span>
              <span>Envíos</span>
              {logistica && <span style={{ fontSize: 11, color: C.sage, background: C.sage + '22', padding: '2px 8px', borderRadius: 10 }}>Configurado</span>}
            </span>
            <span style={{ color: C.textSub, fontSize: 16 }}>{perfilEnviosAbierto ? '∨' : '›'}</span>
          </button>

          {/* Sección Envíos expandida */}
          {perfilEnviosAbierto && (
            <div style={{ padding: '4px 0 16px', borderBottom: `1px solid ${C.border}` }}>
              {renderLogistica()}
            </div>
          )}

          {/* Cerrar sesión */}
          <button style={{ ...menuItemStyle, borderBottom: 'none', color: C.red }}
            onClick={() => logout().then(() => { window.location.hash = '#/' })}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18 }}>🚪</span>
              <span>Cerrar sesión</span>
            </span>
          </button>
        </div>

        {/* Calificaciones recibidas */}
        {renderCalificaciones()}

        {/* Ayuda */}
        <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}` }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>¿Necesitas ayuda?</p>
          <a
            href={`https://wa.me/51917959370?text=Hola, soy ${caficultor.nombre} y necesito ayuda con mi portal`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#25D36622', border: `1px solid #25D36644`, textDecoration: 'none' }}
          >
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream }}>Hablar con el equipo</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textSub }}>WhatsApp directo con TunayWasi</p>
            </div>
          </a>
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif', display: 'flex' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* ── Sidebar / main ── */
        @media (max-width: 700px) {
          .caf-sidebar        { display: none !important; }
          .caf-main           { margin-left: 0 !important; }
          .caf-mobile-header  { display: flex !important; }
          .caf-bottom-nav     { display: flex !important; }
        }
        @media (min-width: 701px) {
          .caf-sidebar        { display: flex !important; }
          .caf-main           { margin-left: ${sidebarCollapsed ? 56 : 220}px !important; }
          .caf-mobile-header  { display: none !important; }
        }

        /* ── Grids responsive ── */

        /* KPIs: 4 col en desktop, 2×2 en tablet, 2 col en mobile */
        .grid-kpis { display: grid; gap: 10px; }
        @media (min-width: 701px)  { .grid-kpis { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 700px)  { .grid-kpis { grid-template-columns: repeat(2, 1fr); } }

        /* Pedidos: 2 col en desktop ancho, 1 col en tablet/mobile */
        .grid-pedidos { display: grid; gap: 14px; }
        @media (min-width: 1100px) { .grid-pedidos { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 1099px) { .grid-pedidos { grid-template-columns: 1fr; } }

        /* Productos Netflix: 3 col en desktop, 2 col en tablet, 1 col en mobile */
        .grid-productos { display: grid; gap: 14px; }
        @media (min-width: 1000px) { .grid-productos { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 701px) and (max-width: 999px) { .grid-productos { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 700px)  { .grid-productos { grid-template-columns: 1fr; } }

        /* Historial resumen: 2 col siempre, nunca se apila */
        .grid-historial-kpis { display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr); }

        /* Distribución calificaciones: siempre 160px + 1fr */
        .grid-score { display: grid; gap: 20px; grid-template-columns: 160px 1fr; }
        @media (max-width: 600px) { .grid-score { grid-template-columns: 1fr; } }
      `}</style>

      {/* Sidebar desktop */}
      <div className="caf-sidebar" style={{ display: 'none' }}>
        <Sidebar tab={tab} onChange={setTab} nombre={nombreCaficultor} caficultorId={caficultorId} onLogout={() => logout().then(() => { window.location.hash = '#/' })} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(prev => !prev)} />
      </div>

      {/* Mobile header */}
      <div className="caf-mobile-header" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: '#0d0d0d', borderBottom: `1px solid ${C.border}`, padding: '12px 16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{nombreCaficultor}</p>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>☰</button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)' }} onClick={() => setSidebarOpen(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 240, background: '#0d0d0d', borderRight: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream }}>{nombreCaficultor}</p>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: C.textSub, cursor: 'pointer', fontSize: 20, padding: 0 }}>✕</button>
            </div>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                background: tab === item.id ? C.terra + '18' : 'none',
                border: 'none', borderLeft: tab === item.id ? `3px solid ${C.terra}` : '3px solid transparent',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 18 }}>{item.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? C.cream : C.textSub }}>{item.label}</span>
              </button>
            ))}
            <div style={{ padding: '16px 20px' }}>
              <button onClick={() => logout().then(() => { window.location.hash = '#/' })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, cursor: 'pointer' }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="caf-main" style={{ flex: 1, marginLeft: sidebarCollapsed ? 56 : 220, minHeight: '100vh' }}>
        <div style={{ padding: '16px 24px 40px', paddingTop: 'clamp(60px, 8vw, 16px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 11, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {NAV_ITEMS.find(n => n.id === tab)?.emoji} {NAV_ITEMS.find(n => n.id === tab)?.label}
              </p>
              <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>{nombreCaficultor}</h1>
              {caficultor && <p style={{ margin: '2px 0 0', fontSize: 13, color: C.textSub }}>{caficultor.region} · {caficultor.altitudMsnm.toLocaleString()} msnm</p>}
            </div>
            {paraDespachar.length > 0 && (
              <span style={{ fontSize: 12, padding: '6px 14px', borderRadius: 20, background: C.yellow + '22', color: C.yellow, fontWeight: 700, border: `1px solid ${C.yellow}44` }}>
                {paraDespachar.length} por despachar
              </span>
            )}
          </div>

          {tab === 'pedidos' && renderPedidos()}
          {tab === 'productos' && renderProductos()}
          {tab === 'historial' && renderHistorial()}
          {tab === 'perfil' && renderPerfil()}
        </div>
      </div>

      {/* Modal despacho por agencia */}
      {modalDespacho && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModalDespacho(null)}>
          <div style={{ background: C.card, borderRadius: 16, padding: '28px 28px 24px', maxWidth: 440, width: '100%', border: `1px solid ${C.border}`, fontFamily: 'Montserrat, sans-serif' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: C.cream, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700 }}>Despachar por agencia</h3>
              <button onClick={() => setModalDespacho(null)} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
            </div>

            <p style={{ margin: '0 0 6px', fontSize: 11, color: C.textSub }}>Agencia: <span style={{ color: C.cream, fontWeight: 700, textTransform: 'uppercase' }}>{modalDespacho.agencia}</span></p>

            <label style={{ fontSize: 11, color: C.textSub, display: 'block', margin: '16px 0 4px' }}>Código de tracking *</label>
            <input
              value={despachoForm.codigoAgencia}
              onChange={e => setDespachoForm(prev => ({ ...prev, codigoAgencia: e.target.value }))}
              placeholder="Ej: OLV-20260917-1234"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0f0f0f', color: C.cream, fontSize: 13, fontFamily: 'Montserrat, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              autoFocus
            />

            <label style={{ fontSize: 11, color: C.textSub, display: 'block', marginBottom: 4 }}>URL foto del despacho (opcional)</label>
            <input
              value={despachoForm.fotoDespacho}
              onChange={e => setDespachoForm(prev => ({ ...prev, fotoDespacho: e.target.value }))}
              placeholder="https://res.cloudinary.com/..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#0f0f0f', color: C.cream, fontSize: 13, fontFamily: 'Montserrat, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 20 }}
            />

            <p style={{ margin: '0 0 20px', fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              La cafetería recibirá el código de tracking para rastrear su pedido. La calificación se habilita una vez que confirmen la recepción.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalDespacho(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'none', color: C.textSub, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarDespacho} disabled={accionando === modalDespacho.pedidoId} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: accionando === modalDespacho.pedidoId ? C.muted : C.terra, color: C.white, fontSize: 13, fontWeight: 700, cursor: accionando === modalDespacho.pedidoId ? 'not-allowed' : 'pointer' }}>
                {accionando === modalDespacho.pedidoId ? 'Guardando...' : '🚚 Confirmar despacho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal producto */}
      {modalProducto.abierto && (
        <ModalProducto
          caficultorId={caficultorId}
          caficultorNombre={nombreCaficultor}
          producto={modalProducto.editar}
          isDemo={isDemo}
          onClose={() => setModalProducto({ abierto: false })}
          onToast={toast}
          onGuardado={(p) => {
            setProductos(prev => {
              const idx = prev.findIndex(x => x.id === p.id)
              if (idx >= 0) return prev.map(x => x.id === p.id ? p : x)
              return [p, ...prev]
            })
          }}
        />
      )}

      <Toast msgs={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Mobile bottom nav */}
      <nav className="caf-bottom-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 150,
        background: '#0d0d0d', borderTop: `1px solid ${C.border}`,
        justifyContent: 'space-around', alignItems: 'center', padding: '6px 0',
        fontFamily: 'Montserrat, sans-serif',
      }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 8px',
          }}>
            <span style={{ fontSize: 20 }}>{item.emoji}</span>
            <span style={{ fontSize: 9, color: tab === item.id ? C.terra : C.textSub, fontWeight: tab === item.id ? 700 : 400 }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default PortalCaficultor
