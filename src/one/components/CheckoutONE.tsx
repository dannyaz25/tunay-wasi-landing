/**
 * CheckoutONE.tsx — Checkout multi-ítem de TunayWasi ONE
 *
 * Layout desktop: 2 columnas — izquierda formulario, derecha resumen sticky
 * Layout mobile: 1 columna — resumen arriba plegable, formulario abajo
 *
 * Paso 1 — Carrito: ítems editables + local + dirección + menú
 * Paso 2 — Pago: Yape / Transferencia + voucher
 * Paso 3 — Confirmación
 */
import React, { useState, useRef, useEffect } from 'react'
import type { FormatoONE, LogisticaCaficultorONE } from '../types'
import { createPedido, subirVoucher, fetchMenusByNegocio, fetchLogisticaCaficultor } from '../service'
import {
  demoCreatePedido,
  demoSubirVoucher,
  demoUploadVoucher,
  demoFetchMenusByNegocio,
  demoFetchLogisticaCaficultor,
} from '../demoService'
import { ONE_CONFIG, FORMATO_LABELS, calcularPrecioFinal } from '../config'
import type { ItemCarrito } from '../../AppONE'
import type { MenuONE } from '../types'

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  bg:          '#0a0a0a',
  bgCard:      '#111111',
  bgInput:     '#181818',
  bgHover:     '#1a1a1a',
  cream:       '#f2e0cc',
  creamDim:    '#c4b297',
  green:       '#1f3028',
  terra:       '#c96e4b',
  terraLight:  '#d4825f',
  sage:        '#8faf8a',
  white:       '#ffffff',
  red:         '#e05a4e',
  border:      '#222222',
  borderFocus: '#c96e4b',
  muted:       '#555555',
  mutedLight:  '#777777',
}

const PROCESO_COLORS: Record<string, string> = {
  lavado: '#4a90c4', natural: '#c96e4b', honey: '#d4a017', anaerobico: '#9b59b6',
}

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

async function uploadToCloudinary(file: File, isDemo: boolean): Promise<string> {
  if (isDemo) return demoUploadVoucher(file)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'one_vouchers')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Error al subir el voucher')
  const data = await res.json()
  return data.secure_url as string
}

// ─── Átomos ───────────────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{
    display: 'block', marginBottom: 8,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase',
  }}>
    {children}
  </label>
)

const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '13px 16px', borderRadius: 8,
        border: `1px solid ${focused ? C.borderFocus : C.border}`,
        fontSize: 14, fontFamily: 'Montserrat, sans-serif',
        color: C.cream, background: C.bgInput,
        outline: 'none', transition: 'border-color 0.15s',
        ...props.style,
      }}
    />
  )
}

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '13px 16px', borderRadius: 8,
        border: `1px solid ${focused ? C.borderFocus : C.border}`,
        fontSize: 14, fontFamily: 'Montserrat, sans-serif',
        color: props.value ? C.cream : C.muted,
        background: C.bgInput, outline: 'none',
        transition: 'border-color 0.15s', cursor: 'pointer',
        ...props.style,
      }}
    />
  )
}

const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      width: '100%', padding: '16px 0', borderRadius: 10, border: 'none',
      fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
      fontFamily: 'Montserrat, sans-serif',
      background: props.disabled
        ? C.border
        : `linear-gradient(135deg, ${C.terra} 0%, ${C.terraLight} 100%)`,
      color: props.disabled ? C.muted : C.white,
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      transition: 'opacity 0.15s, transform 0.1s',
      boxShadow: props.disabled ? 'none' : `0 4px 20px ${C.terra}44`,
      ...props.style,
    }}
  >
    {children}
  </button>
)

const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      width: '100%', padding: '13px 0', borderRadius: 10,
      border: `1px solid ${C.border}`, background: 'transparent',
      fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
      color: C.mutedLight, cursor: 'pointer',
      ...props.style,
    }}
  >
    {children}
  </button>
)

// ─── StepIndicator ────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
    {(['Carrito', 'Pago', 'Listo'] as const).map((label, i) => {
      const n = i + 1
      const active = step >= n
      const current = step === n
      return (
        <React.Fragment key={n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: active ? C.terra : C.bgCard,
              border: `1px solid ${active ? C.terra : C.border}`,
              color: active ? C.white : C.muted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.2s',
              boxShadow: current ? `0 0 0 3px ${C.terra}33` : 'none',
            }}>
              {step > n ? '✓' : n}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: active ? C.creamDim : C.muted, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em' }}>
              {label}
            </span>
          </div>
          {n < 3 && <div style={{ width: 56, height: 1, background: step > n ? C.terra : C.border, margin: '0 4px 16px', transition: 'background 0.3s' }} />}
        </React.Fragment>
      )
    })}
  </div>
)

// ─── Panel de resumen (derecha / mobile-top) ──────────────────────────────────

const ResumenPedido: React.FC<{
  lineas: ItemCarrito[]
  menuNombre: string
  totalCents: number
  agenciaNombre?: string
  compact?: boolean
}> = ({ lineas, menuNombre, totalCents, agenciaNombre, compact }) => {
  const [expandido, setExpandido] = useState(!compact)
  const subtotalCents = lineas.reduce((s, l) => {
    const p = calcularPrecioFinal(l.producto.precioBaseKgCents, l.formato)
    return s + p * l.qty
  }, 0)

  return (
    <div style={{
      background: C.bgCard, borderRadius: 16,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
    }}>
      {/* Cabecera del resumen */}
      <div
        style={{
          padding: '18px 22px',
          background: `linear-gradient(135deg, ${C.green}cc, #0d1e14)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: compact ? 'pointer' : 'default',
        }}
        onClick={() => compact && setExpandido(v => !v)}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.sage, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase' }}>
            Tu pedido
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif' }}>
            {formatCents(totalCents)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 24, display: 'block' }}>☕</span>
          {compact && (
            <span style={{ fontSize: 12, color: C.sage }}>{expandido ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {expandido && (
        <div style={{ padding: '16px 22px 20px' }}>
          {/* Ítems */}
          <div style={{ marginBottom: 16 }}>
            {lineas.map((l, i) => {
              const precio = calcularPrecioFinal(l.producto.precioBaseKgCents, l.formato)
              const procesoColor = PROCESO_COLORS[l.producto.proceso] ?? C.terra
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  paddingBottom: 12, marginBottom: 12,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                      background: procesoColor + '22',
                      border: `1px solid ${procesoColor}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>☕</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.3 }}>
                        {l.producto.nombre.split(' — ')[0]}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
                        {FORMATO_LABELS[l.formato]} × {l.qty}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.creamDim, fontFamily: 'Montserrat, sans-serif', flexShrink: 0, marginLeft: 8 }}>
                    {formatCents(precio * l.qty)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Subtotal + delivery */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>Subtotal</span>
            <span style={{ fontSize: 12, color: C.creamDim, fontFamily: 'Montserrat, sans-serif' }}>{formatCents(subtotalCents)}</span>
          </div>
          {ONE_CONFIG.DELIVERY_CENTS > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>Delivery</span>
              <span style={{ fontSize: 12, color: C.creamDim, fontFamily: 'Montserrat, sans-serif' }}>{formatCents(ONE_CONFIG.DELIVERY_CENTS)}</span>
            </div>
          )}

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 6,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>{formatCents(totalCents)}</span>
          </div>

          {/* Agencia seleccionada */}
          {agenciaNombre && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 8,
              background: '#0d1a0d', border: `1px solid ${C.sage}33`,
            }}>
              <span style={{ fontSize: 11, color: C.sage, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                📦 Envío por: {agenciaNombre}
              </span>
            </div>
          )}

          {/* Menú asignado */}
          {menuNombre && menuNombre !== 'Sin categorizar' && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 8,
              background: C.green + '33', border: `1px solid ${C.sage}33`,
            }}>
              <span style={{ fontSize: 11, color: C.sage, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                📋 Asignado a: {menuNombre}
              </span>
            </div>
          )}


          {/* Garantía */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🔒</span>
            <p style={{ margin: 0, fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
              Pedido confirmado solo cuando verificamos tu pago. Sin riesgo.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Paso 1: Carrito + datos del local ───────────────────────────────────────

const DISTRITOS_LIMA = [
  'Ate', 'Barranco', 'Breña', 'Chorrillos', 'Jesús María',
  'La Molina', 'La Victoria', 'Lima Cercado', 'Lince',
  'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'San Borja',
  'San Isidro', 'San Miguel', 'Santiago de Surco', 'Surquillo',
]

interface Paso1Props {
  lineas: ItemCarrito[]
  menuId: string
  menus: MenuONE[]
  nombreLocal: string
  distritoLocal: string
  direccionEntrega: string
  logisticas: LogisticaCaficultorONE[]
  agenciaSeleccionada: string
  onLineasChange: (l: ItemCarrito[]) => void
  onMenuIdChange: (id: string) => void
  onNombreLocalChange: (v: string) => void
  onDistritoLocalChange: (v: string) => void
  onDireccionChange: (v: string) => void
  onAgenciaChange: (id: string) => void
  onNext: () => void
}

const Paso1Form: React.FC<Paso1Props> = ({
  lineas, menuId, menus, nombreLocal, distritoLocal, direccionEntrega,
  logisticas, agenciaSeleccionada,
  onLineasChange, onMenuIdChange, onNombreLocalChange, onDistritoLocalChange, onDireccionChange,
  onAgenciaChange, onNext,
}) => {
  function setFormato(idx: number, formato: FormatoONE) {
    onLineasChange(lineas.map((l, i) => i === idx ? { ...l, formato } : l))
  }
  function setQty(idx: number, delta: number) {
    onLineasChange(lineas.map((l, i) => i === idx ? { ...l, qty: Math.max(1, l.qty + delta) } : l))
  }
  function quitar(idx: number) {
    onLineasChange(lineas.filter((_, i) => i !== idx))
  }

  // Unir todas las agencias activas de todos los caficultores del pedido, sin duplicados
  const agenciasDisponibles: { id: string; nombre: string; domicilio: boolean; origen: string }[] = []
  const agenciasSeen = new Set<string>()
  for (const log of logisticas) {
    for (const agId of Object.keys(log.agenciasActivas ?? {})) {
      if (log.agenciasActivas[agId] && !agenciasSeen.has(agId)) {
        agenciasSeen.add(agId)
        agenciasDisponibles.push({
          id: agId,
          nombre: log.agenciasMap?.[agId] ?? agId,
          domicilio: log.agenciasPermiteDomicilio?.[agId] ?? false,
          origen: log.origenTexto ?? '',
        })
      }
    }
  }

  const hayAgencias = agenciasDisponibles.length > 0
  const canContinue = lineas.length > 0
    && direccionEntrega.trim().length > 3
    && nombreLocal.trim().length > 0
    && (!hayAgencias || agenciaSeleccionada !== '')

  if (lineas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🛒</p>
        <p style={{ color: C.mutedLight, fontFamily: 'Montserrat, sans-serif', fontSize: 15, marginBottom: 24 }}>
          Tu carrito está vacío
        </p>
        <a href="#/" style={{
          display: 'inline-block', padding: '14px 32px', borderRadius: 10,
          background: C.terra, color: C.white, textDecoration: 'none',
          fontSize: 14, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
        }}>
          Explorar catálogo →
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* ── Sección: Tus cafés ── */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Tus cafés ({lineas.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lineas.map((linea, idx) => {
            const precioFormato = calcularPrecioFinal(linea.producto.precioBaseKgCents, linea.formato)
            const subtotal = precioFormato * linea.qty
            const procesoColor = PROCESO_COLORS[linea.producto.proceso] ?? C.terra
            return (
              <div key={idx} style={{
                background: C.bgCard, borderRadius: 12, border: `1px solid ${C.border}`,
                overflow: 'hidden',
              }}>
                {/* Franja superior de color del proceso */}
                <div style={{ height: 3, background: procesoColor }} />
                <div style={{ padding: '14px 16px' }}>
                  {/* Header producto */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.3 }}>
                        {linea.producto.nombre}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
                        {linea.producto.caficultorNombre}
                      </p>
                    </div>
                    <button
                      onClick={() => quitar(idx)}
                      style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 15, padding: '2px', lineHeight: 1, flexShrink: 0 }}
                      title="Quitar"
                    >✕</button>
                  </div>

                  {/* Selector de formato */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
                    {(['1kg', '5kg', '10kg', '25kg'] as FormatoONE[]).map(f => {
                      const precio = calcularPrecioFinal(linea.producto.precioBaseKgCents, f)
                      const activo = linea.formato === f
                      return (
                        <button
                          key={f}
                          onClick={() => setFormato(idx, f)}
                          style={{
                            padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${activo ? procesoColor : C.border}`,
                            background: activo ? procesoColor + '18' : C.bgHover,
                            textAlign: 'center', transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 11, fontWeight: 700, color: activo ? procesoColor : C.creamDim, fontFamily: 'Montserrat, sans-serif' }}>
                            {FORMATO_LABELS[f]}
                          </div>
                          <div style={{ fontSize: 11, color: activo ? procesoColor : C.muted, marginTop: 2, fontFamily: 'Montserrat, sans-serif' }}>
                            {formatCents(precio)}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Cantidad + subtotal */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.bgHover, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                      <button
                        onClick={() => setQty(idx, -1)}
                        style={{ width: 36, height: 36, background: 'none', border: 'none', color: C.creamDim, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >−</button>
                      <span style={{ minWidth: 32, textAlign: 'center', fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
                        {linea.qty}
                      </span>
                      <button
                        onClick={() => setQty(idx, 1)}
                        style={{ width: 36, height: 36, background: 'none', border: 'none', color: C.creamDim, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >+</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
                        {formatCents(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <a href="#/" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: C.terra, textDecoration: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
          + Agregar más cafés al catálogo
        </a>
      </div>

      {/* ── Sección: Envío ── */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Agencia de envío
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
          El caficultor despacha por estas agencias. Elige una y coordina el costo directo con él.
        </p>

        {!hayAgencias ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: '#1a1200', border: '1px solid #c4901822', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#d4a017', fontFamily: 'Montserrat, sans-serif' }}>El caficultor aún no configuró sus envíos</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>Puedes continuar — coordinarán la agencia por el chat del pedido.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agenciasDisponibles.map(ag => {
              const activa = agenciaSeleccionada === ag.id
              return (
                <button
                  key={ag.id}
                  onClick={() => onAgenciaChange(activa ? '' : ag.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${activa ? C.sage + '88' : C.border}`,
                    background: activa ? '#0d1f0d' : C.bgCard,
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>📦</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
                        {ag.nombre}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
                        Despacho desde: {ag.origen}
                        {ag.domicilio && <span style={{ marginLeft: 8, color: C.sage }}>· Entrega a domicilio disponible</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${activa ? C.sage : C.border}`,
                    background: activa ? C.sage : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activa && <span style={{ fontSize: 10, color: '#000', fontWeight: 700 }}>✓</span>}
                  </div>
                </button>
              )
            })}
            <p style={{ margin: '6px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
              El costo de envío se coordina directamente con el caficultor por el chat del pedido.
            </p>
          </div>
        )}
      </div>

      {/* ── Sección: Datos del local ── */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Tu local
        </h3>

        <div style={{ marginBottom: 14 }}>
          <Label>Nombre del local</Label>
          <Field
            placeholder="Ej. Café La Punta"
            value={nombreLocal}
            onChange={e => onNombreLocalChange(e.target.value)}
          />
        </div>

        <div className="checkout-local-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <Label>Distrito</Label>
            <Select value={distritoLocal} onChange={e => onDistritoLocalChange(e.target.value)}>
              <option value="">Seleccionar...</option>
              {DISTRITOS_LIMA.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <div>
            <Label>Ciudad</Label>
            <Field value="Lima" disabled style={{ color: C.muted, cursor: 'not-allowed' }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <Label>Dirección de entrega</Label>
          <Field
            placeholder="Ej. Av. Larco 123, Miraflores"
            value={direccionEntrega}
            onChange={e => onDireccionChange(e.target.value)}
          />
        </div>
      </div>

      {/* ── Sección: Menú (opcional) ── */}
      {menus.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Asignar a menú
          </h3>
          <Select value={menuId} onChange={e => onMenuIdChange(e.target.value)}>
            <option value="sin-categorizar">Sin categorizar</option>
            {menus.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}{m.activo ? ' ★' : ''}</option>
            ))}
          </Select>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
            Podrás cambiar esto desde "Mis menús" en tu portal.
          </p>
        </div>
      )}

      <PrimaryBtn onClick={onNext} disabled={!canContinue}>
        {canContinue ? 'Continuar al pago →' : 'Completa los campos para continuar'}
      </PrimaryBtn>

      {!canContinue && (
        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 8, fontFamily: 'Montserrat, sans-serif' }}>
          {!nombreLocal.trim() ? 'Falta el nombre de tu local · ' : ''}
          {!direccionEntrega.trim() ? 'Falta la dirección de entrega · ' : ''}
          {hayAgencias && !agenciaSeleccionada ? 'Selecciona una agencia de envío' : ''}
        </p>
      )}
    </div>
  )
}

// ─── Paso 2: Pago + voucher ───────────────────────────────────────────────────

function copiarAlPortapapeles(texto: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(texto).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  })
}

interface Paso2FormProps {
  totalCents: number
  metodoPago: 'yape' | 'transferencia'
  onMetodoChange: (m: 'yape' | 'transferencia') => void
  onVoucherSubido: (url: string) => void
  onNext: () => void
  onBack: () => void
  cargando: boolean
  error: string | null
  isDemo: boolean
}

const Paso2Form: React.FC<Paso2FormProps> = ({
  totalCents, metodoPago, onMetodoChange, onVoucherSubido,
  onNext, onBack, cargando, error, isDemo,
}) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [copiedNumero, setCopiedNumero] = useState(false)
  const [copiedCuenta, setCopiedCuenta] = useState(false)
  const [copiedCci, setCopiedCci] = useState(false)
  const [yapePagado, setYapePagado] = useState(false)

  // Al cambiar método, resetear estado de voucher y yape
  function handleMetodoChange(m: 'yape' | 'transferencia') {
    onMetodoChange(m)
    setVoucherPreview(null)
    setVoucherUrl(null)
    setUploadError(null)
    setYapePagado(false)
    onVoucherSubido('')
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVoucherPreview(URL.createObjectURL(file))
    setSubiendoArchivo(true)
    setUploadError(null)
    try {
      const url = await uploadToCloudinary(file, isDemo)
      setVoucherUrl(url)
      onVoucherSubido(url)
    } catch {
      setVoucherPreview(null)
      setVoucherUrl(null)
      setUploadError('No se pudo subir el comprobante. Verifica tu conexión e inténtalo de nuevo.')
    } finally {
      setSubiendoArchivo(false)
    }
  }

  // Para Yape: puede confirmar sin voucher (voucher es opcional)
  // Para transferencia: voucher es obligatorio
  const puedeConfirmar = metodoPago === 'yape'
    ? yapePagado
    : !!(voucherUrl) && !subiendoArchivo

  return (
    <div>
      {/* Datos de pago — preview rápido antes de elegir método */}
      <div style={{
        marginBottom: 20, padding: '12px 16px', borderRadius: 10,
        background: '#0d1020', border: `1px solid ${C.border}`,
        display: 'flex', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📱</span>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Yape</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>{ONE_CONFIG.YAPE_NUMERO}</p>
          </div>
        </div>
        <div style={{ width: 1, background: C.border, flexShrink: 0, alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏦</span>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em' }}>BCP · {ONE_CONFIG.BCP_TITULAR}</p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>{ONE_CONFIG.BCP_CUENTA}</p>
          </div>
        </div>
      </div>

      {/* Método de pago */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Método de pago
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['yape', 'transferencia'] as const).map(m => {
            const activo = metodoPago === m
            return (
              <button
                key={m}
                onClick={() => handleMetodoChange(m)}
                style={{
                  padding: '16px 12px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${activo ? C.terra : C.border}`,
                  background: activo ? C.terra + '18' : C.bgCard,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                  boxShadow: activo ? `0 0 0 2px ${C.terra}44` : 'none',
                }}
              >
                <span style={{ fontSize: 26 }}>{m === 'yape' ? '📱' : '🏦'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: activo ? C.terra : C.creamDim, fontFamily: 'Montserrat, sans-serif' }}>
                  {m === 'yape' ? 'Yape' : 'Transferencia'}
                </span>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
                  {m === 'yape' ? 'Más rápido' : 'BCP'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── YAPE ── */}
      {metodoPago === 'yape' && (
        <div style={{ marginBottom: 28 }}>
          {/* Monto destacado */}
          <div style={{
            padding: '20px', borderRadius: 14, marginBottom: 14,
            background: `linear-gradient(135deg, ${C.terra}22, ${C.terra}0a)`,
            border: `1px solid ${C.terra}44`, textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Monto a Yapear
            </p>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
              {formatCents(totalCents)}
            </p>
          </div>

          {/* Número Yape con copy */}
          <div style={{ padding: '16px 18px', borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Número Yape
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.cream, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}>
                {ONE_CONFIG.YAPE_NUMERO}
              </p>
              <button
                onClick={() => copiarAlPortapapeles(ONE_CONFIG.YAPE_NUMERO, setCopiedNumero)}
                style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 8,
                  border: `1px solid ${copiedNumero ? C.sage : C.border}`,
                  background: copiedNumero ? C.sage + '22' : C.bgHover,
                  color: copiedNumero ? C.sage : C.creamDim,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif', transition: 'all 0.2s',
                }}
              >
                {copiedNumero ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
              A nombre de {ONE_CONFIG.BCP_TITULAR}
            </p>
          </div>

          {/* Instrucciones */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: '#0d1a0d', border: `1px solid ${C.sage}33`, marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: C.sage, fontFamily: 'Montserrat, sans-serif' }}>Pasos:</p>
            {['Abre Yape en tu celular', `Ingresa el número y el monto (${formatCents(totalCents)})`, 'Regresa aquí y toca "Ya pagué con Yape"'].map((paso, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, color: C.terra, fontWeight: 700, minWidth: 16, fontFamily: 'Montserrat, sans-serif' }}>{i + 1}.</span>
                <span style={{ fontSize: 12, color: C.creamDim, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.4 }}>{paso}</span>
              </div>
            ))}
          </div>

          {/* Voucher opcional para Yape */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
              Opcionalmente puedes adjuntar el screenshot de tu Yape:
            </p>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
            {!voucherPreview ? (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `1px dashed ${C.border}`, borderRadius: 10,
                  padding: '20px 16px', textAlign: 'center',
                  cursor: 'pointer', background: C.bgCard,
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
                  📎 Adjuntar screenshot (opcional)
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img src={voucherPreview} alt="Voucher" style={{ width: '100%', borderRadius: 10, maxHeight: 160, objectFit: 'cover' }} />
                {subiendoArchivo && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: C.cream, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>Subiendo...</span>
                  </div>
                )}
                {!subiendoArchivo && voucherUrl && (
                  <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 6, background: '#25a244', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.white, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>✓ Subido</span>
                  </div>
                )}
                <button
                  onClick={() => { setVoucherPreview(null); setVoucherUrl(null); onVoucherSubido('') }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', color: C.cream, border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 13 }}
                >✕</button>
              </div>
            )}
          </div>

          {uploadError && (
            <p style={{ margin: '0 0 14px', fontSize: 12, color: C.red, fontFamily: 'Montserrat, sans-serif' }}>{uploadError}</p>
          )}

          {/* Botón "Ya pagué" */}
          {!yapePagado ? (
            <PrimaryBtn onClick={() => setYapePagado(true)}>
              ✓ Ya pagué con Yape
            </PrimaryBtn>
          ) : (
            <div style={{ padding: '16px', borderRadius: 10, background: '#0d1f0d', border: `1px solid ${C.sage}55`, marginBottom: 0, textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.sage, fontFamily: 'Montserrat, sans-serif' }}>✓ Pago confirmado</p>
              <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>Verificamos en menos de 2 horas y te avisamos por WhatsApp</p>
            </div>
          )}
        </div>
      )}

      {/* ── TRANSFERENCIA ── */}
      {metodoPago === 'transferencia' && (
        <div style={{ marginBottom: 28 }}>
          {/* Monto destacado */}
          <div style={{
            padding: '20px', borderRadius: 14, marginBottom: 14,
            background: `linear-gradient(135deg, ${C.terra}22, ${C.terra}0a)`,
            border: `1px solid ${C.terra}44`, textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Monto a transferir
            </p>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
              {formatCents(totalCents)}
            </p>
          </div>

          {/* Datos bancarios con copy */}
          <div style={{ padding: '18px 20px', borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, marginBottom: 14 }}>
            <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: C.muted, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Datos BCP
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>Titular</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>{ONE_CONFIG.BCP_TITULAR}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>N° Cuenta</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>{ONE_CONFIG.BCP_CUENTA}</p>
                  <button onClick={() => copiarAlPortapapeles(ONE_CONFIG.BCP_CUENTA, setCopiedCuenta)}
                    style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 6, border: `1px solid ${copiedCuenta ? C.sage : C.border}`, background: copiedCuenta ? C.sage + '22' : C.bgHover, color: copiedCuenta ? C.sage : C.creamDim, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', transition: 'all 0.2s' }}>
                    {copiedCuenta ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>CCI</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>{ONE_CONFIG.BCP_CCI}</p>
                  <button onClick={() => copiarAlPortapapeles(ONE_CONFIG.BCP_CCI, setCopiedCci)}
                    style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 6, border: `1px solid ${copiedCci ? C.sage : C.border}`, background: copiedCci ? C.sage + '22' : C.bgHover, color: copiedCci ? C.sage : C.creamDim, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', transition: 'all 0.2s' }}>
                    {copiedCci ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upload voucher — obligatorio para transferencia */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
              Sube el comprobante de transferencia <span style={{ color: C.terra }}>*</span>
            </p>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
            {!voucherPreview ? (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${C.border}`, borderRadius: 12,
                  padding: '36px 16px', textAlign: 'center',
                  cursor: 'pointer', background: C.bgCard,
                  transition: 'border-color 0.15s',
                }}
              >
                <p style={{ margin: '0 0 8px', fontSize: 32 }}>📎</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.creamDim, fontFamily: 'Montserrat, sans-serif' }}>
                  Subir comprobante
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
                  Foto o PDF · JPG, PNG, PDF
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img src={voucherPreview} alt="Voucher" style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }} />
                {subiendoArchivo && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: C.cream, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>Subiendo...</span>
                  </div>
                )}
                {!subiendoArchivo && voucherUrl && (
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 6, background: '#25a244', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: C.white, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>✓ Subido</span>
                  </div>
                )}
                <button
                  onClick={() => { setVoucherPreview(null); setVoucherUrl(null); onVoucherSubido('') }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: C.cream, border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}
                >✕</button>
              </div>
            )}
          </div>

          {uploadError && (
            <p style={{ margin: '0 0 14px', fontSize: 12, color: C.red, fontFamily: 'Montserrat, sans-serif' }}>{uploadError}</p>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: C.red + '18', border: `1px solid ${C.red}44` }}>
          <p style={{ margin: 0, color: C.red, fontSize: 13, fontFamily: 'Montserrat, sans-serif' }}>{error}</p>
        </div>
      )}

      {puedeConfirmar && (
        <PrimaryBtn onClick={onNext} disabled={cargando} style={{ marginTop: metodoPago === 'yape' ? 16 : 0 }}>
          {cargando ? 'Confirmando pedido...' : 'Confirmar pedido →'}
        </PrimaryBtn>
      )}
      {metodoPago === 'transferencia' && !puedeConfirmar && (
        <PrimaryBtn onClick={onNext} disabled>
          Sube el comprobante para continuar
        </PrimaryBtn>
      )}
      <GhostBtn onClick={onBack} style={{ marginTop: 10 }}>← Volver al carrito</GhostBtn>
    </div>
  )
}

// ─── Paso 3: Confirmación ─────────────────────────────────────────────────────

const Paso3Screen: React.FC<{ pedidoId: string; nombreLocal: string }> = ({ pedidoId, nombreLocal }) => (
  <div style={{ textAlign: 'center' }}>
    {/* Check animado */}
    <div className="tw-check-bounce" style={{
      width: 80, height: 80, borderRadius: '50%',
      background: `linear-gradient(135deg, ${C.terra}, ${C.terraLight})`,
      margin: '0 auto 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 36, boxShadow: `0 8px 32px ${C.terra}44`,
    }}>✓</div>

    <h2 style={{ margin: '0 0 6px', fontSize: 28, fontFamily: 'Cormorant Garamond, serif', color: C.cream, fontWeight: 700 }}>
      ¡Pedido recibido!
    </h2>
    <p style={{ margin: '0 0 4px', color: C.mutedLight, fontFamily: 'Montserrat, sans-serif', fontSize: 13 }}>
      Código de pedido
    </p>
    <p style={{ margin: '0 0 32px', color: C.terra, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700 }}>
      {pedidoId}
    </p>

    {/* Pasos siguientes */}
    <div style={{ textAlign: 'left', marginBottom: 28 }}>
      {[
        { n: '1', titulo: 'Verificamos tu pago', sub: 'Revisamos tu comprobante en menos de 2 horas', color: C.terra },
        { n: '2', titulo: 'Te escribimos por WhatsApp', sub: 'Coordinamos la entrega y los detalles de tu kit', color: C.terra },
        { n: '3', titulo: 'Recibes tu café y tu kit', sub: 'Directo del caficultor peruano a tu local', color: C.sage },
      ].map(({ n, titulo, sub, color }) => (
        <div key={n} className={`tw-step-${n}`} style={{
          display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start',
          padding: '14px', borderRadius: 10,
          background: C.bgCard, border: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: color + '22', border: `1px solid ${color}55`,
            color, fontWeight: 700, fontSize: 13, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Montserrat, sans-serif',
          }}>{n}</div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.cream, fontFamily: 'Montserrat, sans-serif' }}>{titulo}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>{sub}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="tw-confirm-ctas">
    <a
      href={`https://wa.me/${ONE_CONFIG.ADMIN_WHATSAPP.replace(/\s+/g, '')}?text=Hola%2C%20soy%20${encodeURIComponent(nombreLocal)}%20%E2%80%94%20pedido%20${encodeURIComponent(pedidoId)}`}
      target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '16px', borderRadius: 10, background: '#25D366',
        color: C.white, textDecoration: 'none',
        fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
        marginBottom: 10, boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
      }}
    >
      <span style={{ fontSize: 20 }}>💬</span> Escríbenos por WhatsApp
    </a>
    <a href="#/portal" style={{
      display: 'block', padding: '15px', borderRadius: 10,
      background: C.terra, color: C.white, textDecoration: 'none',
      fontSize: 14, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', textAlign: 'center',
      marginBottom: 14,
    }}>
      Ver mi portal →
    </a>
    <a href="#/" style={{ fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif', textDecoration: 'none' }}>
      Volver al catálogo
    </a>
    </div>
  </div>
)

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  items: ItemCarrito[]
  usuarioId: string
  usuarioNombre: string
  usuarioEmail: string
  usuarioTelefono: string
  nombreLocalInicial?: string
  distritoLocalInicial?: string
  isDemo?: boolean
  onPedidoConfirmado?: () => void
  onPasoChange?: (paso: string) => void
}

const CheckoutONE: React.FC<Props> = ({
  items, usuarioId, usuarioNombre, usuarioEmail, usuarioTelefono,
  nombreLocalInicial = '', distritoLocalInicial = '',
  isDemo = false, onPedidoConfirmado, onPasoChange,
}) => {
  const [step, setStep] = useState(1)

  const [lineas, setLineas] = useState<ItemCarrito[]>(items)
  const [menuId, setMenuId] = useState('sin-categorizar')
  const [menus, setMenus] = useState<MenuONE[]>([])
  const [nombreLocal, setNombreLocal] = useState(nombreLocalInicial)
  const [distritoLocal, setDistritoLocal] = useState(distritoLocalInicial)
  const [direccionEntrega, setDireccionEntrega] = useState('')
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState('')
  const [logisticas, setLogisticas] = useState<LogisticaCaficultorONE[]>([])

  const [metodoPago, setMetodoPago] = useState<'yape' | 'transferencia'>('yape')
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null)

  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pedidoId, setPedidoId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 700)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const cargarMenus = async () => {
      try {
        const uid = usuarioId === 'demo-user' ? 'user-negocio-001' : usuarioId
        const ms = isDemo ? await demoFetchMenusByNegocio(uid) : await fetchMenusByNegocio(usuarioId)
        setMenus(ms.filter(m => m.nombre !== 'Sin categorizar'))
        const activo = ms.find(m => m.activo)
        if (activo) setMenuId(activo.id)
      } catch { /* ok */ }
    }
    cargarMenus()
  }, [usuarioId, isDemo])

  // Cargar logística de cada caficultor único del pedido
  useEffect(() => {
    const caficultorIds = [...new Set(items.map(i => i.producto.caficultorId).filter(Boolean))]
    if (caficultorIds.length === 0) return
    async function cargarLogisticas() {
      const resultados = await Promise.all(
        caficultorIds.map(id =>
          isDemo
            ? demoFetchLogisticaCaficultor(id)
            : fetchLogisticaCaficultor(id)
        )
      )
      setLogisticas(resultados.filter((l): l is LogisticaCaficultorONE => l !== null))
    }
    cargarLogisticas()
  }, [items, isDemo])

  const subtotalCents = lineas.reduce((s, l) => {
    const p = calcularPrecioFinal(l.producto.precioBaseKgCents, l.formato)
    return s + p * l.qty
  }, 0)
  const totalCents = subtotalCents + ONE_CONFIG.DELIVERY_CENTS

  const menuNombre = menus.find(m => m.id === menuId)?.nombre ?? (menuId === 'sin-categorizar' ? 'Sin categorizar' : '')

  async function confirmarPedido() {
    if (metodoPago === 'transferencia' && !voucherUrl) return
    setCargando(true)
    setError(null)
    try {
      const resolvedMenuId = menuId === 'sin-categorizar' ? undefined : menuId
      const input = {
        negocioId: usuarioId,
        negocioNombre: usuarioNombre,
        negocioEmail: usuarioEmail,
        negocioTelefono: usuarioTelefono,
        nombreLocal, distritoLocal,
        items: lineas.map(l => {
          const precio = calcularPrecioFinal(l.producto.precioBaseKgCents, l.formato)
          return {
            productoId: l.producto.id,
            productoNombre: l.producto.nombre,
            caficultorId: l.producto.caficultorId,
            caficultorNombre: l.producto.caficultorNombre,
            presentacion: l.formato,
            qty: l.qty,
            unitCents: precio,
            menuId: resolvedMenuId,
          }
        }),
        metodoPago,
        direccionEntrega,
        agencia: agenciaSeleccionada as import('../types').AgenciaONE | undefined || undefined,
        esKitProveedor: false,
      }
      const id = isDemo ? await demoCreatePedido(input) : await createPedido(input)
      if (isDemo) await demoSubirVoucher(id, voucherUrl ?? '')
      else await subirVoucher(id, voucherUrl ?? '')
      setPedidoId(id)
      setStep(3)
      onPedidoConfirmado?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear el pedido. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '0 4%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {step < 3 && (
            <button
              onClick={() => step === 1 ? window.history.back() : setStep(step - 1)}
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22, padding: 0, display: 'flex', alignItems: 'center' }}
            >←</button>
          )}
          <span style={{ fontSize: 18, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif', letterSpacing: '0.06em' }}>
            TUNAY WASI
          </span>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.1em' }}>
            {step === 1 ? 'CARRITO' : step === 2 ? 'PAGO' : 'CONFIRMACIÓN'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {step < 3 && (
            <button
              onClick={() => { window.location.hash = '#/' }}
              style={{
                background: 'none', border: 'none', color: C.mutedLight,
                fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                padding: '6px 0', whiteSpace: 'nowrap', letterSpacing: '0.02em',
              }}
            >
              + Seguir comprando
            </button>
          )}
          {step < 3 && (
            <div style={{ fontSize: 13, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
              {formatCents(totalCents)}
            </div>
          )}
        </div>
      </header>

      {/* ── Contenido principal ── */}
      {step === 3 && pedidoId ? (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px 80px' }}>
          <Paso3Screen pedidoId={pedidoId} nombreLocal={nombreLocal} />
        </div>
      ) : (
        <div
          className="checkout-grid"
          style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '40px 4% 80px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 32,
          alignItems: 'start',
        }}>
          {/* ── Columna izquierda: formulario ── */}
          <div>
            {/* Step indicator */}
            <div style={{ marginBottom: 36 }}>
              <StepIndicator step={step} />
            </div>

            {step === 1 && (
              <Paso1Form
                lineas={lineas}
                menuId={menuId}
                menus={menus}
                nombreLocal={nombreLocal}
                distritoLocal={distritoLocal}
                direccionEntrega={direccionEntrega}
                logisticas={logisticas}
                agenciaSeleccionada={agenciaSeleccionada}
                onLineasChange={setLineas}
                onMenuIdChange={setMenuId}
                onNombreLocalChange={setNombreLocal}
                onDistritoLocalChange={setDistritoLocal}
                onDireccionChange={setDireccionEntrega}
                onAgenciaChange={setAgenciaSeleccionada}
                onNext={() => { setStep(2); onPasoChange?.('paso2_pago') }}
              />
            )}

            {step === 2 && (
              <Paso2Form
                totalCents={totalCents}
                metodoPago={metodoPago}
                onMetodoChange={setMetodoPago}
                onVoucherSubido={setVoucherUrl}
                onNext={confirmarPedido}
                onBack={() => { setStep(1); onPasoChange?.('paso1_carrito') }}
                cargando={cargando}
                error={error}
                isDemo={isDemo}
              />
            )}
          </div>

          {/* ── Columna derecha: resumen sticky ── */}
          <div className="checkout-summary" style={{ position: 'sticky', top: 76 }}>
            <ResumenPedido
              lineas={lineas}
              menuNombre={menuNombre}
              totalCents={totalCents}
              agenciaNombre={
                agenciaSeleccionada
                  ? (logisticas.flatMap(l => Object.entries(l.agenciasMap ?? {})).find(([id]) => id === agenciaSeleccionada)?.[1] ?? agenciaSeleccionada)
                  : undefined
              }
              compact={isMobile}
            />

            {/* Confianza */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Badge entrega estimada */}
              <div style={{
                display: 'flex', gap: 10, alignItems: 'center',
                padding: '8px 12px', borderRadius: 8,
                background: '#0d1a0d', border: `1px solid ${C.sage}33`,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>📦</span>
                <span style={{ fontSize: 11, color: C.sage, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.4, fontWeight: 600 }}>
                  Entrega estimada: 2-5 días hábiles
                </span>
              </div>
              {[
                { icon: '🌿', text: 'Café directo del productor peruano' },
                { icon: '🔒', text: 'Pago verificado antes de despachar' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.4 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Responsive: en mobile el grid colapsa a 1 columna */}
      <style>{`
        @media (max-width: 700px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .checkout-summary { position: static !important; }
          .checkout-local-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes checkBounce {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          50%  { transform: scale(1.2) rotate(3deg);  opacity: 1; }
          75%  { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg);    opacity: 1; }
        }
        .tw-check-bounce { animation: checkBounce 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
        @keyframes stepFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tw-step-1 { animation: stepFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        .tw-step-2 { animation: stepFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
        .tw-step-3 { animation: stepFadeUp 0.35s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tw-confirm-title { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
        .tw-confirm-code  { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
        .tw-confirm-ctas  { animation: fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) 1.0s both; }
      `}</style>
    </div>
  )
}

export default CheckoutONE
