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

// Placeholder para componentes no construidos aún
const Placeholder: React.FC<{ nombre: string }> = ({ nombre }) => (
  <div style={{ padding: 40, textAlign: 'center', color: '#1f3028', fontFamily: 'Montserrat, sans-serif' }}>
    <h2>{nombre}</h2>
    <p style={{ color: '#c4b297' }}>En construcción...</p>
  </div>
)

// ─── Auth state ───────────────────────────────────────────────────────────────

function useAuthONE() {
  const [user, setUser] = useState<User | null>(null)
  const [usuarioONE, setUsuarioONE] = useState<UsuarioONE | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const u = await fetchUsuario(firebaseUser.uid)
          setUsuarioONE(u)
        } catch {
          // Usuario autenticado pero sin doc en one_usuarios aún
          setUsuarioONE(null)
        }
      } else {
        setUsuarioONE(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const isAdmin = user?.email?.endsWith('@tunaywasi.pe') ?? false

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
  const { user, usuarioONE, loading, isAdmin } = useAuthONE()
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
    if (!user) {
      window.location.hash = '#/login'
      return null
    }
    return carritoProducto
      ? <CheckoutONE
          producto={carritoProducto}
          usuarioId={user.uid}
          usuarioNombre={usuarioONE?.nombre ?? user.displayName ?? 'Emprendedor'}
          usuarioEmail={user.email ?? ''}
          usuarioTelefono={usuarioONE?.telefono ?? ''}
        />
      : <CatalogoPublico onSeleccionar={(p: ProductoONE) => {
          setCarritoProducto(p)
          window.location.hash = '#/checkout'
        }} />
  }

  if (hash === '#/portal') {
    if (!user) {
      window.location.hash = '#/login'
      return null
    }
    return <Placeholder nombre="Portal Emprendedor" />
  }

  if (hash === '#/caficultor-portal') {
    if (!user || usuarioONE?.rol !== 'caficultor') {
      window.location.hash = '#/'
      return null
    }
    return <Placeholder nombre="Portal Caficultor" />
  }

  if (hash === '#/admin') {
    if (!isAdmin) {
      window.location.hash = '#/'
      return null
    }
    return <Placeholder nombre="Admin ONE" />
  }

  if (hash === '#/login') {
    return <Placeholder nombre="Login / Registro" />
  }

  // Ruta por defecto: catálogo público
  return (
    <CatalogoPublico
      onSeleccionar={(producto: ProductoONE) => {
        setCarritoProducto(producto)
        if (!user) {
          window.location.hash = '#/login'
        } else {
          window.location.hash = '#/checkout'
        }
      }}
    />
  )
}

export default AppONE
