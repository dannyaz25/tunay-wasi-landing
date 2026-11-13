/**
 * analytics.ts — Trazabilidad propia TunayWasi ONE
 *
 * Captura eventos clave (sin PII) y los escribe en Firestore colección `one_analytics`.
 * Funciona para usuarios autenticados y anónimos.
 * No depende de terceros ni de quota de pago.
 *
 * Límites free tier Firestore: 20k escrituras/día — más que suficiente para fase beta.
 * Cada evento pesa ~300 bytes → 1 GB free cubre ~3M eventos.
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/shared/firebase'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EventoAnalytics =
  | 'catalogo_visto'
  | 'producto_visto'           // abrió el drawer de detalle
  | 'carrito_agregado'         // agregó un producto
  | 'carrito_quitado'          // quitó un producto
  | 'checkout_intentado'       // pulsó "Ir al checkout"
  | 'login_requerido'          // checkout bloqueado por falta de sesión
  | 'login_iniciado'           // entró a la pantalla de login
  | 'login_exitoso'            // autenticación completada
  | 'registro_completado'      // cuenta nueva creada
  | 'checkout_inicio'          // llegó al paso 1 con sesión activa
  | 'checkout_paso2'           // avanzó a pago
  | 'checkout_confirmado'      // pedido creado en Firestore
  | 'portal_negocio_visto'     // entró al portal del negocio
  | 'portal_caficultor_visto'  // entró al portal del caficultor
  | 'error_capturado'          // error JS no manejado

export interface PropiedadesEvento {
  productoId?: string
  productoNombre?: string
  caficultorId?: string
  cantidadKg?: number
  totalCents?: number
  itemCount?: number
  metodoPago?: string
  pedidoId?: string
  rolUsuario?: string
  pasoDesde?: string          // desde qué paso/ruta venía
  mensaje?: string            // para errores
  [key: string]: string | number | boolean | undefined
}

// ─── Session ID ───────────────────────────────────────────────────────────────
// Persiste durante la sesión del browser, nuevo al reabrir la pestaña.

function getSessionId(): string {
  const KEY = 'tw_session_id'
  let sid = sessionStorage.getItem(KEY)
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem(KEY, sid)
  }
  return sid
}

// ─── Device fingerprint (sin PII) ─────────────────────────────────────────────

function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent.slice(0, 120),
    lang: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    mobile: /Mobi|Android/i.test(navigator.userAgent),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

// ─── Función principal ────────────────────────────────────────────────────────

let _userId = 'anonimo'
let _rolUsuario = 'anonimo'

/** Llama esto cuando el usuario inicia sesión para enriquecer los eventos */
export function setAnalyticsUser(uid: string, rol: string) {
  _userId = uid
  _rolUsuario = rol
  // Guardar en sessionStorage para que el context persista entre rerenders
  try {
    sessionStorage.setItem('tw_analytics_uid', uid)
    sessionStorage.setItem('tw_analytics_rol', rol)
  } catch { /* ok */ }
}

/** Inicializa desde sessionStorage si ya había sesión */
export function initAnalytics() {
  try {
    const uid = sessionStorage.getItem('tw_analytics_uid')
    const rol = sessionStorage.getItem('tw_analytics_rol')
    if (uid) _userId = uid
    if (rol) _rolUsuario = rol
  } catch { /* ok */ }
}

/**
 * Registra un evento de analytics en Firestore.
 * Fire-and-forget: nunca bloquea la UI ni lanza errores al usuario.
 */
export function track(
  evento: EventoAnalytics,
  propiedades: PropiedadesEvento = {}
): void {
  // Ejecutar async sin await para no bloquear
  void (async () => {
    try {
      const doc = {
        // Identificadores
        sessionId: getSessionId(),
        userId: _userId,
        rolUsuario: propiedades.rolUsuario ?? _rolUsuario,

        // Evento
        evento,
        ...propiedades,

        // Contexto
        url: window.location.hash,
        ...getDeviceInfo(),

        // Tiempo (serverTimestamp para que sea consistente con zona Lima en Firestore)
        fecha: new Date().toISOString().slice(0, 10),   // 'YYYY-MM-DD' para queries por día
        ts: serverTimestamp(),
      }
      await addDoc(collection(db, 'one_analytics'), doc)
    } catch {
      // Silencioso — analytics nunca debe romper la app
    }
  })()
}

// ─── Captura global de errores JS ─────────────────────────────────────────────

export function setupErrorTracking() {
  window.addEventListener('error', (e) => {
    track('error_capturado', {
      mensaje: `${e.message} @ ${e.filename}:${e.lineno}`,
    })
  })
  window.addEventListener('unhandledrejection', (e) => {
    track('error_capturado', {
      mensaje: String(e.reason).slice(0, 200),
    })
  })
}
