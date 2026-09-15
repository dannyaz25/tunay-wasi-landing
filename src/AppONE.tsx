/**
 * AppONE.tsx — App principal TunayWasi ONE
 *
 * Rutas (via hash routing simple):
 *   #/              → CatalogoPublico (público)
 *   #/caficultor/:id → PerfilCaficultor (público)
 *   #/checkout      → CheckoutONE (requiere auth)
 *   #/portal        → PortalEmprendedor (requiere auth + rol emprendedor)
 *   #/caficultor-portal → PortalCaficultor (requiere auth + rol caficultor)
 *   #/admin         → AdminONE (requiere auth + admin)
 */
import React, { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/shared/firebase'
import type { User } from 'firebase/auth'
import { fetchUsuario } from '@/one/service'
import type { UsuarioONE, ProductoONE } from '@/one/types'

// Lazy imports de componentes (se crearán en los próximos días)
import CatalogoPublico from '@/one/components/CatalogoPublico'
import CheckoutONE from '@/one/components/CheckoutONE'
import AuthScreen from '@/one/components/AuthScreen'
import AdminONE from '@/one/components/AdminONE'
import PortalEmprendedor from '@/one/components/PortalEmprendedor'
import PortalCaficultor from '@/one/components/PortalCaficultor'
import { DEMO_USER } from '@/one/demoService'

// Placeholder para componentes no construidos aún
const Placeholder: React.FC<{ nombre: string }> = ({ nombre }) => (
  <div style={{ padding: 40, textAlign: 'center', color: '#1f3028', fontFamily: 'Montserrat, sans-serif' }}>
    <h2>{nombre}</h2>
    <p style={{ color: '#c4b297' }}>En construcción...</p>
  </div>
)

// ─── Auth state ───────────────────────────────────────────────────────────────

function useAuthONE(isDemo = false) {
  const [user, setUser] = useState<User | null>(null)
  const [usuarioONE, setUsuarioONE] = useState<UsuarioONE | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemo) {
      // En modo demo: usuario pre-autenticado, sin Firebase
      setUser({ uid: DEMO_USER.uid, email: DEMO_USER.email, displayName: DEMO_USER.nombre } as User)
      setUsuarioONE({ uid: DEMO_USER.uid, rol: DEMO_USER.rol, nombre: DEMO_USER.nombre, email: DEMO_USER.email, telefono: DEMO_USER.telefono, createdAt: '2026-01-01T00:00:00.000Z' })
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const u = await fetchUsuario(firebaseUser.uid)
          setUsuarioONE(u)
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

// ─── App ──────────────────────────────────────────────────────────────────────

const AppONE: React.FC = () => {
  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1'
  const { user, usuarioONE, loading, isAdmin } = useAuthONE(isDemo)
  const hash = useHash()
  const [carritoProducto, setCarritoProducto] = useState<ProductoONE | null>(null)

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f2e0cc',
      }}>
        <div style={{ color: '#1f3028', fontFamily: 'Montserrat, sans-serif' }}>
          Cargando...
        </div>
      </div>
    )
  }

  // Rutas que coinciden con el hash
  if (hash.startsWith('#/caficultor/') && !hash.endsWith('/portal')) {
    const caficultorId = hash.replace('#/caficultor/', '')
    return <Placeholder nombre={`Perfil Caficultor: ${caficultorId}`} />
  }

  if (hash === '#/checkout') {
    if (!user && !isDemo) {
      window.location.hash = '#/login'
      return null
    }
    return carritoProducto
      ? <CheckoutONE
          producto={carritoProducto}
          usuarioId={user?.uid ?? DEMO_USER.uid}
          usuarioNombre={usuarioONE?.nombre ?? user?.displayName ?? 'Emprendedor'}
          usuarioEmail={user?.email ?? ''}
          usuarioTelefono={usuarioONE?.telefono ?? ''}
          isDemo={isDemo}
        />
      : <CatalogoPublico onSeleccionar={(p: ProductoONE) => {
          setCarritoProducto(p)
          window.location.hash = '#/checkout'
        }} />
  }

  if (hash === '#/portal') {
    if (!user && !isDemo) {
      window.location.hash = '#/login'
      return null
    }
    return (
      <PortalEmprendedor
        usuarioId={user?.uid ?? DEMO_USER.uid}
        nombreUsuario={usuarioONE?.nombre ?? user?.displayName ?? 'Emprendedor'}
        isDemo={isDemo}
      />
    )
  }

  if (hash === '#/caficultor-portal') {
    if (!user && !isDemo) {
      window.location.hash = '#/login'
      return null
    }
    // En demo: usar caficultor-001 como demo
    const caficultorId = usuarioONE?.caficultor?.caficultorId ?? 'caficultor-001'
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
    if (user || isDemo) {
      window.location.hash = carritoProducto ? '#/checkout' : '#/'
      return null
    }
    return (
      <AuthScreen
        mensajePrevia={carritoProducto ? 'Para continuar con tu pedido, ingresa o crea tu cuenta.' : undefined}
        onSuccess={() => {
          window.location.hash = carritoProducto ? '#/checkout' : '#/'
        }}
      />
    )
  }

  // Ruta por defecto: catálogo público
  return (
    <CatalogoPublico
      onSeleccionar={(producto: ProductoONE) => {
        setCarritoProducto(producto)
        if (!user && !isDemo) {
          window.location.hash = '#/login'
        } else {
          window.location.hash = '#/checkout'
        }
      }}
    />
  )
}

export default AppONE
