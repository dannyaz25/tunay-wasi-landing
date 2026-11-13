/**
 * AppONE.tsx — App principal TunayWasi ONE
 *
 * Rutas (via hash routing simple):
 *   #/                    → CatalogoPublico (público)
 *   #/caficultor/:id      → PerfilCaficultor (público)
 *   #/registro-caficultor → RegistroCaficultor (público, sin auth)
 *   #/checkout            → CheckoutONE (requiere auth)
 *   #/portal              → PortalEmprendedor (requiere auth + rol negocio)
 *   #/caficultor-portal   → PortalCaficultor (requiere auth + rol caficultor)
 *   #/admin               → AdminONE (requiere auth + admin)
 */
import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/shared/firebase'
import type { User } from 'firebase/auth'
import { fetchUsuario } from '@/one/service'
import type { UsuarioONE, ProductoONE, FormatoONE } from '@/one/types'
import { calcularPrecioFinal } from '@/one/config'
import { track, setAnalyticsUser, initAnalytics, setupErrorTracking } from '@/one/analytics'

import CatalogoPublico from '@/one/components/CatalogoPublico'
import CheckoutONE from '@/one/components/CheckoutONE'
import AuthScreen from '@/one/components/AuthScreen'
import AdminONE from '@/one/components/AdminONE'
import PortalEmprendedor from '@/one/components/PortalEmprendedor'
import PortalCaficultor from '@/one/components/PortalCaficultor'
import PerfilCaficultor from '@/one/components/PerfilCaficultor'
import DirectorioCafeterias from '@/one/components/DirectorioCafeterias'
import RegistroEmprendedor from '@/one/components/RegistroEmprendedor'
import PerfilCafeteria from '@/one/components/PerfilCafeteria'
import RegistroCaficultor from '@/one/components/RegistroCaficultor'
import LandingCaficultores from '@/one/components/LandingCaficultores'
import LandingEmprendedor from '@/one/components/LandingEmprendedor'
import DocsONE from '@/one/components/DocsONE'
import SoporteONE from '@/one/components/SoporteONE'
import { DEMO_USER } from '@/one/demoService'

// ─── Tipo carrito ─────────────────────────────────────────────────────────────

export interface ItemCarrito {
  producto: ProductoONE
  formato: FormatoONE
  qty: number
}

// ─── Auth state ───────────────────────────────────────────────────────────────

function useAuthONE(isDemo = false) {
  const [user, setUser] = useState<User | null>(null)
  const [usuarioONE, setUsuarioONE] = useState<UsuarioONE | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Inicializar analytics (restaura uid/rol de sessionStorage si existía)
    initAnalytics()
    setupErrorTracking()

    if (isDemo) {
      setUser({ uid: DEMO_USER.uid, email: DEMO_USER.email, displayName: DEMO_USER.nombre } as User)
      setUsuarioONE({ uid: DEMO_USER.uid, rol: DEMO_USER.rol, nombre: DEMO_USER.nombre, email: DEMO_USER.email, telefono: DEMO_USER.telefono, createdAt: '2026-01-01T00:00:00.000Z' })
      setAnalyticsUser(DEMO_USER.uid, DEMO_USER.rol)
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const u = await fetchUsuario(firebaseUser.uid)
          setUsuarioONE(u)
          setAnalyticsUser(firebaseUser.uid, u.rol)
        } catch {
          setUsuarioONE(null)
        }
      } else {
        setUsuarioONE(null)
      }
      setLoading(false)
    })
    return unsub
  }, [isDemo])

  const isAdmin = isDemo ? false : (user?.email?.endsWith('@tunaywasi.pe') ?? false)

  return { user, usuarioONE, loading, isAdmin }
}

// ─── Hash router simple ───────────────────────────────────────────────────────

function useHash() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const handler = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return hash
}

// ─── Helpers localStorage — carrito persistente ───────────────────────────────

const CARRITO_KEY = 'one_carrito_items'
const CARRITO_META_KEY = 'one_carrito_meta'

function leerCarritoStorage(): ItemCarrito[] {
  try {
    // Prioridad: localStorage (persiste entre sesiones)
    const stored = localStorage.getItem(CARRITO_KEY)
    if (stored) return JSON.parse(stored) as ItemCarrito[]
    // Retrocompatibilidad: sessionStorage antiguo
    const session = sessionStorage.getItem('one_carrito_items')
    if (session) {
      sessionStorage.removeItem('one_carrito_items')
      return JSON.parse(session) as ItemCarrito[]
    }
    const legacy = sessionStorage.getItem('one_carrito_producto')
    if (legacy) {
      sessionStorage.removeItem('one_carrito_producto')
      const p = JSON.parse(legacy) as ProductoONE
      return [{ producto: p, formato: '1kg', qty: 1 }]
    }
  } catch { /* ok */ }
  return []
}

function guardarCarritoStorage(items: ItemCarrito[]) {
  try {
    if (items.length > 0) {
      localStorage.setItem(CARRITO_KEY, JSON.stringify(items))
    } else {
      localStorage.removeItem(CARRITO_KEY)
    }
  } catch { /* ok */ }
}

/** Registra el paso actual del carrito para análisis de abandono */
function trackCarritoMeta(paso: string, extra?: Record<string, unknown>) {
  try {
    const meta = {
      paso,
      timestamp: new Date().toISOString(),
      itemCount: 0,
      ...extra,
    }
    localStorage.setItem(CARRITO_META_KEY, JSON.stringify(meta))
  } catch { /* ok */ }
}


// ─── App ──────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://tunaywasi.com'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`

function PageMeta({ title, description, image, canonical }: {
  title: string
  description: string
  image?: string
  canonical?: string
}) {
  const fullTitle = title.includes('Tunay Wasi') ? title : `${title} | Tunay Wasi`
  const img = image ?? DEFAULT_OG_IMAGE
  const url = canonical ?? BASE_URL
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  )
}

const AppONE: React.FC = () => {
  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1'
  const { user, usuarioONE, loading, isAdmin } = useAuthONE(isDemo)
  const hash = useHash()

  const [carritoItems, setCarritoItems] = useState<ItemCarrito[]>(leerCarritoStorage)
  const [kitSeleccionados, setKitSeleccionados] = useState<Set<string>>(new Set())
  const [kitConfirmando, setKitConfirmando] = useState(false)

  // Persistir carrito en localStorage en cada cambio
  useEffect(() => {
    guardarCarritoStorage(carritoItems)
    if (carritoItems.length > 0) {
      trackCarritoMeta('catalogo', { itemCount: carritoItems.length })
    }
  }, [carritoItems])

  function agregarAlCarrito(producto: ProductoONE, formato: FormatoONE = '1kg') {
    setCarritoItems(prev => {
      const existente = prev.find(i => i.producto.id === producto.id && i.formato === formato)
      const siguiente = existente
        ? prev.map(i => i.producto.id === producto.id && i.formato === formato ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { producto, formato, qty: 1 }]
      track('carrito_agregado', {
        productoId: producto.id,
        productoNombre: producto.nombre,
        caficultorId: producto.caficultorId,
        itemCount: siguiente.length,
      })
      return siguiente
    })
  }

  const hayCarrito = carritoItems.length > 0
  const totalCarritoCents = carritoItems.reduce((s, i) => {
    const precio = calcularPrecioFinal(i.producto.precioBaseKgCents, i.formato)
    return s + precio * i.qty
  }, 0)
  const carritoProductoIds = new Set(carritoItems.map(i => i.producto.id))

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f2e0cc' }}>
        <div style={{ color: '#1f3028', fontFamily: 'Montserrat, sans-serif' }}>Cargando...</div>
      </div>
    )
  }

  // ─── Rutas ────────────────────────────────────────────────────────────────

  if (hash.startsWith('#/caficultor/') && !hash.endsWith('/portal')) {
    const caficultorId = hash.replace('#/caficultor/', '')
    return (
      <>
        <PageMeta
          title="Perfil del caficultor"
          description="Conoce al caficultor, su finca y los cafés de especialidad que produce directamente. Transparencia radical desde el origen."
          canonical={`${BASE_URL}/#/caficultor/${caficultorId}`}
        />
        <PerfilCaficultor caficultorId={caficultorId} isDemo={isDemo} />
      </>
    )
  }

  if (hash === '#/cafeterias') {
    return (
      <>
        <PageMeta
          title="Directorio de cafeterías de especialidad"
          description="Descubre cafeterías que sirven café de especialidad peruano directo del caficultor. Encuentra tu próxima taza perfecta."
          canonical={`${BASE_URL}/#/cafeterias`}
        />
        <DirectorioCafeterias isDemo={isDemo} />
      </>
    )
  }

  if (hash.startsWith('#/cafeteria/')) {
    const cafeteriaId = hash.replace('#/cafeteria/', '')
    return (
      <>
        <PageMeta
          title="Perfil de cafetería"
          description="Cafetería especializada en café peruano de origen. Menú, ubicación y más."
          canonical={`${BASE_URL}/#/cafeteria/${cafeteriaId}`}
        />
        <PerfilCafeteria cafeteriaId={cafeteriaId} isDemo={isDemo} />
      </>
    )
  }

  if (hash === '#/para-caficultores') {
    return (
      <>
        <PageMeta
          title="Vende tu café a precio real — Para caficultores"
          description="Únete a Tunay Wasi y vende tu café de especialidad directamente a cafeterías y negocios. Sin intermediarios, con transparencia total y pago justo."
          canonical={`${BASE_URL}/#/para-caficultores`}
        />
        <LandingCaficultores />
      </>
    )
  }

  if (hash === '#/para-cafeterias') {
    return (
      <>
        <PageMeta
          title="Abastece tu cafetería con café de especialidad — Para emprendedores"
          description="Compra café de especialidad directamente del caficultor peruano. Trazabilidad completa, precios justos y despacho directo a tu local."
          canonical={`${BASE_URL}/#/para-cafeterias`}
        />
        <LandingEmprendedor />
      </>
    )
  }

  if (hash === '#/docs' || hash.startsWith('#/docs/')) {
    return (
      <>
        <PageMeta
          title="Documentación"
          description="Guías y documentación para caficultores y emprendedores en Tunay Wasi."
          canonical={`${BASE_URL}/#/docs`}
        />
        <DocsONE hash={hash} />
      </>
    )
  }

  if (hash === '#/soporte') {
    return (
      <>
        <PageMeta
          title="Soporte"
          description="¿Tienes alguna duda? El equipo de Tunay Wasi está aquí para ayudarte."
          canonical={`${BASE_URL}/#/soporte`}
        />
        <SoporteONE />
      </>
    )
  }

  if (hash === '#/armar-kit') {
    function handleKitConfirmar() {
      setKitConfirmando(true)
      setTimeout(() => {
        if (!user && !isDemo) {
          trackCarritoMeta('ir_a_login', { itemCount: carritoItems.length })
          window.location.hash = '#/login'
        } else {
          window.location.hash = '#/checkout'
        }
        setKitConfirmando(false)
      }, 50)
    }

    return (
      <CatalogoPublico
        onSeleccionar={(producto, fmt) => agregarAlCarrito(producto, fmt ?? '1kg')}
        isDemo={isDemo}
        modoSeleccion={{
          seleccionados: kitSeleccionados,
          max: 3,
          confirmando: kitConfirmando,
          onToggle: (p) => {
            setKitSeleccionados(prev => {
              const next = new Set(prev)
              if (next.has(p.id)) {
                next.delete(p.id)
                setCarritoItems(ci => ci.filter(i => i.producto.id !== p.id))
              } else if (next.size < 3) {
                next.add(p.id)
                agregarAlCarrito(p, '1kg')
              }
              return next
            })
          },
          onConfirmar: handleKitConfirmar,
        }}
      />
    )
  }

  if (hash === '#/registro-caficultor') {
    return (
      <>
        <PageMeta
          title="Regístrate como caficultor"
          description="Crea tu perfil de caficultor en Tunay Wasi y empieza a vender tu café de especialidad directamente a negocios de todo el Perú."
          canonical={`${BASE_URL}/#/registro-caficultor`}
        />
        <RegistroCaficultor isDemo={isDemo} />
      </>
    )
  }

  if (hash === '#/registro-emprendedor') {
    return (
      <>
        <PageMeta
          title="Regístrate como negocio"
          description="Crea tu cuenta de negocio en Tunay Wasi y accede al catálogo de café de especialidad directo del caficultor peruano."
          canonical={`${BASE_URL}/#/registro-emprendedor`}
        />
        <RegistroEmprendedor isDemo={isDemo} />
      </>
    )
  }

  // Limpiar flag de pedido confirmado al salir del checkout
  if (hash !== '#/checkout') {
    sessionStorage.removeItem('one_pedido_confirmado')
  }

  if (hash === '#/checkout') {
    if (!user && !isDemo) {
      // Carrito ya está en localStorage — solo redirigir a login
      trackCarritoMeta('login_requerido', { itemCount: carritoItems.length })
      track('login_requerido', { itemCount: carritoItems.length, pasoDesde: 'checkout' })
      window.location.hash = '#/login'
      return null
    }
    trackCarritoMeta('checkout', { itemCount: carritoItems.length })
    track('checkout_inicio', { itemCount: carritoItems.length, totalCents: totalCarritoCents })
    // Mostrar checkout si hay carrito O si el pedido acaba de confirmarse (carrito recién vaciado)
    return (hayCarrito || sessionStorage.getItem('one_pedido_confirmado'))
      ? <CheckoutONE
          items={carritoItems}
          usuarioId={user?.uid ?? DEMO_USER.uid}
          usuarioNombre={usuarioONE?.nombre ?? user?.displayName ?? 'Negocio'}
          usuarioEmail={user?.email ?? ''}
          usuarioTelefono={usuarioONE?.telefono ?? ''}
          nombreLocalInicial={usuarioONE?.negocio?.nombreLocal ?? ''}
          distritoLocalInicial={usuarioONE?.negocio?.distritoLocal ?? ''}
          isDemo={isDemo}
          onPasoChange={(paso) => {
            trackCarritoMeta(paso, { itemCount: carritoItems.length })
            track(paso === 'paso2_pago' ? 'checkout_paso2' : 'checkout_inicio', { itemCount: carritoItems.length })
          }}
          onPedidoConfirmado={() => {
            track('checkout_confirmado', { itemCount: carritoItems.length, totalCents: totalCarritoCents })
            sessionStorage.setItem('one_pedido_confirmado', '1')
            localStorage.removeItem(CARRITO_KEY)
            localStorage.removeItem(CARRITO_META_KEY)
            setCarritoItems([])
          }}
        />
      : <CatalogoPublico
          onSeleccionar={(p, fmt) => { agregarAlCarrito(p, fmt) }}
          carritoCount={carritoItems.length}
          totalCarritoCents={totalCarritoCents}
          carritoProductoIds={carritoProductoIds}
          carritoLineas={carritoItems}
          onIrAlCheckout={() => { window.location.hash = '#/checkout' }}
          isDemo={isDemo}
        />
  }

  if (hash === '#/portal') {
    if (!user && !isDemo) {
      window.location.hash = '#/login'
      return null
    }
    track('portal_negocio_visto', { rolUsuario: usuarioONE?.rol ?? 'negocio' })
    return (
      <PortalEmprendedor
        usuarioId={user?.uid ?? DEMO_USER.uid}
        nombreUsuario={usuarioONE?.nombre ?? user?.displayName ?? 'Negocio'}
        isDemo={isDemo}
      />
    )
  }

  if (hash === '#/caficultor-portal' || hash === '#/portal-caficultores') {
    if (!user && !isDemo) {
      window.location.hash = '#/login'
      return null
    }
    track('portal_caficultor_visto', { rolUsuario: 'caficultor' })
    // El caficultorId es el uid del usuario (rol=caficultor)
    const caficultorId = user?.uid ?? DEMO_USER.uid
    return (
      <PortalCaficultor
        usuarioId={user?.uid ?? DEMO_USER.uid}
        caficultorId={caficultorId}
        isDemo={isDemo}
      />
    )
  }

  if (hash === '#/admin') {
    if (!isAdmin && !isDemo) {
      window.location.hash = '#/'
      return null
    }
    return <AdminONE isDemo={isDemo} />
  }

  if (hash === '#/login') {
    track('login_iniciado', { itemCount: carritoItems.length })
    if (user || isDemo) {
      // Ya hay sesión activa — redirigir según rol
      if (hayCarrito) {
        window.location.hash = '#/checkout'
      } else if (usuarioONE?.rol === 'caficultor') {
        window.location.hash = '#/caficultor-portal'
      } else if (usuarioONE?.rol === 'negocio') {
        window.location.hash = '#/portal'
      } else if (usuarioONE?.rol === 'admin') {
        window.location.hash = '#/admin'
      }
      // Si usuarioONE aún no cargó, esperar — no redirigir a '/'
      return null
    }
    return (
      <AuthScreen
        mensajePrevia={hayCarrito ? 'Para continuar con tu pedido, ingresa o crea tu cuenta.' : undefined}
        onSuccess={() => { /* AuthScreen maneja la redirección directamente */ }}
      />
    )
  }

  // Ruta por defecto: catálogo público
  return (
    <>
      <PageMeta
        title="Tunay Wasi — Café de especialidad con transparencia radical"
        description="Compra café de especialidad directamente del caficultor peruano. Lavado, Natural, Honey. Trazabilidad completa, precio justo y despacho directo desde el origen."
        canonical={BASE_URL}
      />
      <CatalogoPublico
        onSeleccionar={(producto, fmt) => { agregarAlCarrito(producto, fmt) }}
        carritoCount={carritoItems.length}
        totalCarritoCents={totalCarritoCents}
        carritoProductoIds={carritoProductoIds}
        carritoLineas={carritoItems}
        isDemo={isDemo}
        onIrAlCheckout={() => {
          if (!user && !isDemo) {
            trackCarritoMeta('ir_a_login', { itemCount: carritoItems.length })
            track('checkout_intentado', { itemCount: carritoItems.length, pasoDesde: 'catalogo', totalCents: totalCarritoCents })
            window.location.hash = '#/login'
          } else {
            track('checkout_intentado', { itemCount: carritoItems.length, totalCents: totalCarritoCents })
            window.location.hash = '#/checkout'
          }
        }}
      />
    </>
  )
}

export default AppONE
