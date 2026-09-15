/**
 * CheckoutONE.tsx — Checkout de TunayWasi ONE
 *
 * Paso 1 — Resumen: selecciona formato/cantidad + nombre local + distrito + dirección
 * Paso 2 — Pago: elige Yape o Transferencia + sube voucher (Cloudinary)
 * Paso 3 — Confirmación: ID del pedido + siguiente paso
 */
import React, { useState, useRef } from 'react'
import type { ProductoONE } from '../types'
import { createPedido, subirVoucher } from '../service'
import { ONE_CONFIG, FORMATO_LABELS } from '../config'
import type { FormatoONE } from '../types'

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `S/ ${(cents / 100).toFixed(0)}`
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'one_vouchers')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('Error al subir el voucher')
  const data = await res.json()
  return data.secure_url as string
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ step: number }> = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
    {[1, 2, 3].map((n) => (
      <React.Fragment key={n}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: step >= n ? C.terra : C.tan + '55',
          color: step >= n ? C.white : C.tan,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
          transition: 'background 0.2s',
        }}>
          {n}
        </div>
        {n < 3 && (
          <div style={{
            width: 48, height: 2,
            background: step > n ? C.terra : C.tan + '55',
            transition: 'background 0.2s',
          }} />
        )}
      </React.Fragment>
    ))}
  </div>
)

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
      outline: 'none',
      ...props.style,
    }}
  />
)

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }> = ({
  variant = 'primary', children, ...props
}) => (
  <button
    {...props}
    style={{
      width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
      fontSize: 15, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      letterSpacing: '0.03em',
      background: variant === 'primary' ? C.terra : 'transparent',
      color: variant === 'primary' ? C.white : C.tan,
      opacity: props.disabled ? 0.5 : 1,
      transition: 'opacity 0.15s',
      ...props.style,
    }}
  >
    {children}
  </button>
)

// ─── Paso 1: Resumen + datos del local ───────────────────────────────────────

interface Paso1Props {
  producto: ProductoONE
  formato: FormatoONE
  cantidad: number
  nombreLocal: string
  distritoLocal: string
  direccionEntrega: string
  esKitProveedor: boolean
  onFormatoChange: (f: FormatoONE) => void
  onCantidadChange: (n: number) => void
  onNombreLocalChange: (v: string) => void
  onDistritoLocalChange: (v: string) => void
  onDireccionChange: (v: string) => void
  onKitProveedorChange: (v: boolean) => void
  onNext: () => void
}

const Paso1: React.FC<Paso1Props> = ({
  producto, formato, cantidad, nombreLocal, distritoLocal, direccionEntrega, esKitProveedor,
  onFormatoChange, onCantidadChange, onNombreLocalChange, onDistritoLocalChange,
  onDireccionChange, onKitProveedorChange, onNext,
}) => {
  const precioFormato = formato === '250g' ? producto.precios.g250 : formato === '1kg' ? producto.precios.kg1 : producto.precios.kg5
  const subtotal = precioFormato * cantidad
  const total = subtotal + ONE_CONFIG.DELIVERY_LIMA_CENTS
  const canContinue = nombreLocal.trim() && distritoLocal.trim() && direccionEntrega.trim()

  return (
    <div>
      {/* Resumen del producto */}
      <div style={{
        background: C.green, borderRadius: 12, padding: '16px 18px', marginBottom: 24,
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        {producto.foto ? (
          <img src={producto.foto} alt={producto.nombre}
            style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 8, background: C.tan + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>☕</div>
        )}
        <div>
          <p style={{ margin: 0, color: C.cream, fontSize: 15, fontWeight: 700, fontFamily: 'Cormorant Garamond, serif' }}>
            {producto.nombre}
          </p>
          <p style={{ margin: '2px 0 0', color: C.sage, fontSize: 12, fontFamily: 'Montserrat, sans-serif' }}>
            {producto.caficultorNombre}
          </p>
        </div>
      </div>

      {/* Selección de formato */}
      <div style={{ marginBottom: 20 }}>
        <Label>Formato</Label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['250g', '1kg', '5kg'] as FormatoONE[]).map((f) => {
            const precio = f === '250g' ? producto.precios.g250 : f === '1kg' ? producto.precios.kg1 : producto.precios.kg5
            return (
              <button key={f} onClick={() => onFormatoChange(f)}
                style={{
                  flex: 1, padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${formato === f ? C.terra : C.tan}`,
                  background: formato === f ? C.terra + '15' : C.white,
                  fontFamily: 'Montserrat, sans-serif',
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: formato === f ? C.terra : C.green }}>
                  {FORMATO_LABELS[f]}
                </div>
                <div style={{ fontSize: 12, color: C.tan, marginTop: 2 }}>
                  {formatCents(precio)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cantidad */}
      <div style={{ marginBottom: 20 }}>
        <Label>Cantidad</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.tan}`, background: C.white, fontSize: 18, cursor: 'pointer', color: C.green }}>
            −
          </button>
          <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: C.green, minWidth: 24, textAlign: 'center' }}>
            {cantidad}
          </span>
          <button onClick={() => onCantidadChange(cantidad + 1)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.tan}`, background: C.white, fontSize: 18, cursor: 'pointer', color: C.green }}>
            +
          </button>
          <span style={{ fontSize: 13, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
            unidades de {FORMATO_LABELS[formato]}
          </span>
        </div>
      </div>

      {/* Datos del local */}
      <div style={{ marginBottom: 16 }}>
        <Label>Nombre de tu local</Label>
        <Input
          placeholder="Ej: Café El Origen"
          value={nombreLocal}
          onChange={(e) => onNombreLocalChange(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <Label>Distrito</Label>
        <Input
          placeholder="Ej: Miraflores"
          value={distritoLocal}
          onChange={(e) => onDistritoLocalChange(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <Label>Dirección de entrega</Label>
        <Input
          placeholder="Av. Larco 123, Miraflores"
          value={direccionEntrega}
          onChange={(e) => onDireccionChange(e.target.value)}
        />
      </div>

      {/* Kit Proveedor */}
      <div style={{
        background: esKitProveedor ? C.terra + '12' : C.cream,
        border: `1.5px solid ${esKitProveedor ? C.terra : C.tan}`,
        borderRadius: 10, padding: '14px 16px', marginBottom: 24,
        cursor: 'pointer',
      }} onClick={() => onKitProveedorChange(!esKitProveedor)}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4, border: `2px solid ${esKitProveedor ? C.terra : C.tan}`,
            background: esKitProveedor ? C.terra : C.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1,
          }}>
            {esKitProveedor && <span style={{ color: C.white, fontSize: 12 }}>✓</span>}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              Quiero el Kit de Identidad
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.brown, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
              Menú personalizado · Fichas para mesas · QR de trazabilidad · Pack Instagram
              <br />
              <span style={{ color: C.tan }}>Compromiso mínimo {ONE_CONFIG.COMPROMISO_MESES_MIN} meses de reposición</span>
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de precio */}
      <div style={{ background: C.cream, borderRadius: 10, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>
            {cantidad} × {FORMATO_LABELS[formato]}
          </span>
          <span style={{ fontSize: 13, color: C.green, fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
            {formatCents(subtotal)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>Delivery Lima</span>
          <span style={{ fontSize: 13, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
            {formatCents(ONE_CONFIG.DELIVERY_LIMA_CENTS)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.tan}`, paddingTop: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>Total</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.terra, fontFamily: 'Montserrat, sans-serif' }}>
            {formatCents(total)}
          </span>
        </div>
      </div>

      <Btn onClick={onNext} disabled={!canContinue}>
        Continuar al pago →
      </Btn>
    </div>
  )
}

// ─── Paso 2: Pago + upload de voucher ────────────────────────────────────────

interface Paso2Props {
  totalCents: number
  metodoPago: 'yape' | 'transferencia'
  onMetodoChange: (m: 'yape' | 'transferencia') => void
  onVoucherSubido: (url: string) => void
  onNext: () => void
  onBack: () => void
  cargando: boolean
  error: string | null
}

const Paso2: React.FC<Paso2Props> = ({
  totalCents, metodoPago, onMetodoChange, onVoucherSubido, onNext, onBack, cargando, error,
}) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [voucherPreview, setVoucherPreview] = useState<string | null>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setVoucherPreview(URL.createObjectURL(file))
    setSubiendoArchivo(true)
    try {
      const url = await uploadToCloudinary(file)
      setVoucherUrl(url)
      onVoucherSubido(url)
    } catch {
      setVoucherPreview(null)
    } finally {
      setSubiendoArchivo(false)
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: C.terra, fontFamily: 'Cormorant Garamond, serif', textAlign: 'center' }}>
        Total: {formatCents(totalCents)}
      </p>

      {/* Selector de método */}
      <div style={{ marginBottom: 24 }}>
        <Label>Paga por</Label>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['yape', 'transferencia'] as const).map((m) => (
            <button key={m} onClick={() => onMetodoChange(m)}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${metodoPago === m ? C.terra : C.tan}`,
                background: metodoPago === m ? C.terra + '15' : C.white,
                fontSize: 14, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
                color: metodoPago === m ? C.terra : C.green,
                transition: 'all 0.15s',
              }}>
              {m === 'yape' ? '📱 Yape' : '🏦 Transferencia BCP'}
            </button>
          ))}
        </div>
      </div>

      {/* Datos de pago */}
      <div style={{ background: C.cream, borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
        {metodoPago === 'yape' ? (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: C.brown, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Datos Yape
            </p>
            <p style={{ margin: '4px 0', fontSize: 15, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              Número: <strong>{ONE_CONFIG.YAPE_NUMERO}</strong>
            </p>
            <p style={{ margin: '4px 0', fontSize: 13, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
              A nombre de: {ONE_CONFIG.BCP_TITULAR}
            </p>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: C.brown, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Datos BCP
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              Titular: <strong>{ONE_CONFIG.BCP_TITULAR}</strong>
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              Cuenta: <strong>{ONE_CONFIG.BCP_CUENTA}</strong>
            </p>
            <p style={{ margin: '4px 0', fontSize: 14, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              CCI: <strong>{ONE_CONFIG.BCP_CCI}</strong>
            </p>
          </>
        )}
      </div>

      {/* Upload voucher */}
      <div style={{ marginBottom: 24 }}>
        <Label>Sube tu comprobante de pago</Label>
        <input ref={fileRef} type="file" accept="image/*,application/pdf"
          style={{ display: 'none' }} onChange={handleFile} />

        {!voucherPreview ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${C.tan}`, borderRadius: 10,
              padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
              background: C.white, transition: 'border-color 0.15s',
            }}>
            <p style={{ margin: 0, fontSize: 28 }}>📎</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: C.tan, fontFamily: 'Montserrat, sans-serif' }}>
              Toca para adjuntar foto o PDF del voucher
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <img src={voucherPreview} alt="Voucher"
              style={{ width: '100%', borderRadius: 10, maxHeight: 200, objectFit: 'cover' }} />
            {subiendoArchivo && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(31,48,40,0.6)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: C.cream, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>
                  Subiendo...
                </span>
              </div>
            )}
            {!subiendoArchivo && (
              <button onClick={() => { setVoucherPreview(null); setVoucherUrl(null) }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: C.terra, color: C.white, border: 'none',
                  borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14,
                }}>
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p style={{ color: C.red, fontSize: 13, fontFamily: 'Montserrat, sans-serif', marginBottom: 12, textAlign: 'center' }}>
          {error}
        </p>
      )}

      <Btn onClick={onNext} disabled={!voucherUrl || cargando || subiendoArchivo}>
        {cargando ? 'Confirmando pedido...' : 'Confirmar pedido →'}
      </Btn>
      <Btn variant="secondary" onClick={onBack} style={{ marginTop: 8 }}>
        ← Volver
      </Btn>
    </div>
  )
}

// ─── Paso 3: Confirmación ────────────────────────────────────────────────────

const Paso3: React.FC<{ pedidoId: string; nombreLocal: string }> = ({ pedidoId, nombreLocal }) => (
  <div style={{ textAlign: 'center', padding: '16px 0' }}>
    <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
    <h2 style={{
      margin: '0 0 8px', fontSize: 24,
      fontFamily: 'Cormorant Garamond, serif', color: C.green, fontWeight: 700,
    }}>
      ¡Pedido recibido!
    </h2>
    <p style={{ margin: '0 0 20px', color: C.brown, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>
      {pedidoId}
    </p>

    <div style={{ background: C.cream, borderRadius: 12, padding: '20px 18px', marginBottom: 28, textAlign: 'left' }}>
      <p style={{ margin: '0 0 10px', fontSize: 14, color: C.green, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}>
        Hola <strong>{nombreLocal}</strong> — te avisamos por WhatsApp cuando tu pedido esté en camino.
      </p>
      <p style={{ margin: 0, fontSize: 14, color: C.brown, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}>
        Mientras tanto, tu <strong>Kit de Identidad</strong> se está preparando. Lo encontrarás en tu portal cuando el pago sea verificado.
      </p>
    </div>

    <a href="#/portal"
      style={{
        display: 'block', padding: '14px 0', borderRadius: 10,
        background: C.terra, color: C.white, textDecoration: 'none',
        fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif',
        textAlign: 'center',
      }}>
      Ver mi portal →
    </a>

    <a href="#/"
      style={{
        display: 'block', marginTop: 12, fontSize: 13, color: C.tan,
        fontFamily: 'Montserrat, sans-serif', textDecoration: 'none',
      }}>
      Volver al catálogo
    </a>
  </div>
)

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  producto: ProductoONE
  usuarioId: string
  usuarioNombre: string
  usuarioEmail: string
  usuarioTelefono: string
}

const CheckoutONE: React.FC<Props> = ({
  producto, usuarioId, usuarioNombre, usuarioEmail, usuarioTelefono,
}) => {
  const [step, setStep] = useState(1)

  // Paso 1 — datos del pedido
  const [formato, setFormato] = useState<FormatoONE>('1kg')
  const [cantidad, setCantidad] = useState(1)
  const [nombreLocal, setNombreLocal] = useState('')
  const [distritoLocal, setDistritoLocal] = useState('')
  const [direccionEntrega, setDireccionEntrega] = useState('')
  const [esKitProveedor, setEsKitProveedor] = useState(false)

  // Paso 2 — pago
  const [metodoPago, setMetodoPago] = useState<'yape' | 'transferencia'>('yape')
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null)

  // Estado global
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pedidoId, setPedidoId] = useState<string | null>(null)

  const precioFormato = formato === '250g' ? producto.precios.g250 : formato === '1kg' ? producto.precios.kg1 : producto.precios.kg5
  const subtotalCents = precioFormato * cantidad
  const totalCents = subtotalCents + ONE_CONFIG.DELIVERY_LIMA_CENTS

  async function confirmarPedido() {
    if (!voucherUrl) return
    setCargando(true)
    setError(null)
    try {
      const id = await createPedido({
        emprendedorId: usuarioId,
        emprendedorNombre: usuarioNombre,
        emprendedorEmail: usuarioEmail,
        emprendedorTelefono: usuarioTelefono,
        nombreLocal,
        distritoLocal,
        items: [{
          productoId: producto.id,
          productoNombre: producto.nombre,
          caficultorNombre: producto.caficultorNombre,
          formato,
          cantidad,
          precioUnitarioCents: precioFormato,
        }],
        metodoPago,
        direccionEntrega,
        esKitProveedor,
        compromisoMeses: esKitProveedor ? ONE_CONFIG.COMPROMISO_MESES_MIN : undefined,
      })
      await subirVoucher(id, voucherUrl)
      setPedidoId(id)
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear el pedido. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: C.green, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {step < 3 && (
          <button onClick={() => step === 1 ? window.history.back() : setStep(step - 1)}
            style={{ background: 'none', border: 'none', color: C.cream, cursor: 'pointer', fontSize: 20, padding: 0 }}>
            ←
          </button>
        )}
        <h1 style={{
          margin: 0, color: C.cream, fontSize: 17,
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
        }}>
          {step === 1 ? 'Tu pedido' : step === 2 ? 'Pago' : '¡Listo!'}
        </h1>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '28px 20px 60px' }}>
        <StepIndicator step={step} />

        {step === 1 && (
          <Paso1
            producto={producto}
            formato={formato}
            cantidad={cantidad}
            nombreLocal={nombreLocal}
            distritoLocal={distritoLocal}
            direccionEntrega={direccionEntrega}
            esKitProveedor={esKitProveedor}
            onFormatoChange={setFormato}
            onCantidadChange={setCantidad}
            onNombreLocalChange={setNombreLocal}
            onDistritoLocalChange={setDistritoLocal}
            onDireccionChange={setDireccionEntrega}
            onKitProveedorChange={setEsKitProveedor}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <Paso2
            totalCents={totalCents}
            metodoPago={metodoPago}
            onMetodoChange={setMetodoPago}
            onVoucherSubido={setVoucherUrl}
            onNext={confirmarPedido}
            onBack={() => setStep(1)}
            cargando={cargando}
            error={error}
          />
        )}

        {step === 3 && pedidoId && (
          <Paso3 pedidoId={pedidoId} nombreLocal={nombreLocal} />
        )}
      </div>
    </div>
  )
}

export default CheckoutONE
