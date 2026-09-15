# TunayWasi ONE — Diseño Técnico desde Cero

> Septiembre 2026 — Diseño del sistema simplificado para validar el modelo de negocio

---

## Stack (sin cambios)

```
React 18 + TypeScript + Vite
Firebase Auth (email + OTP)
Firestore
Cloudinary (uploads)
Zustand + React Query
Zod
Yape / Transferencia BCP
```

---

## Estructura de archivos nueva

```
src/
├── main.tsx                          # Entry point — sin cambios
├── AppONE.tsx                        # ← NUEVA app principal TunayWasi ONE
│
├── shared/                           # Reutilizar sin cambios
│   ├── firebase.ts
│   ├── config.ts                     # Ajustar constantes
│   ├── authService.ts
│   ├── useAuth.ts
│   ├── perfilService.ts              # Simplificar roles
│   └── types/
│       └── auth.ts                   # Agregar rol 'emprendedor'
│
└── one/                              # ← NUEVA carpeta TunayWasi ONE
    ├── types.ts                      # Tipos propios
    ├── service.ts                    # Todas las operaciones Firestore
    ├── config.ts                     # Constantes del modelo ONE
    │
    └── components/
        ├── CatalogoPublico.tsx       # Vista pública — 3 cafés
        ├── PerfilCaficultor.tsx      # Historia del caficultor (pública)
        ├── KitIdentidad.tsx          # Post-compra — menú + fichas + QR
        ├── CheckoutONE.tsx           # Checkout simplificado
        ├── PortalEmprendedor.tsx     # Dashboard del cliente
        ├── PortalCaficultor.tsx      # Portal simple del productor
        └── AdminONE.tsx              # Panel admin simplificado
```

---

## Colecciones Firestore — solo 5

```
one_caficultores/      → perfil y catálogo de los 3 productores
one_productos/         → los cafés disponibles (tostado, variedad, precio)
one_pedidos/           → pedidos de emprendedores
one_usuarios/          → perfiles (emprendedor + caficultor + admin)
one_kits/              → kits de identidad generados por pedido
```

---

## Tipos de datos

### `one_caficultores/{caficultorId}`

```typescript
interface CaficultorONE {
  id: string
  nombre: string                  // "María Huamán"
  foto: string                    // URL Cloudinary
  region: string                  // "Cajamarca"
  distrito: string                // "San Ignacio"
  altitudMsnm: number             // 1800
  historia: string                // Texto corto ~100 palabras
  coordenadas?: {
    lat: number
    lng: number
  }
  activo: boolean
  createdAt: string
}
```

---

### `one_productos/{productoId}`

```typescript
interface ProductoONE {
  id: string
  caficultorId: string            // FK → one_caficultores
  caficultorNombre: string        // Desnormalizado para queries rápidas

  // Identidad del café
  nombre: string                  // "Bourbon Lavado — Los Alisos"
  variedad: string                // "Bourbon"
  proceso: 'lavado' | 'natural' | 'honey' | 'anaerobico'
  altitudMsnm: number
  cosecha: string                 // "Junio 2026"
  notasSabor: string[]            // ["durazno", "panela", "chocolate"]
  descripcion: string             // Texto libre ~50 palabras

  // Calidad (referencial, sin Q-Grader por ahora)
  puntajeReferencial?: number     // "~86 pts" — declarado por caficultor
  notaReferencial: string         // "Puntaje referencial — certificación independiente próximamente"

  // Precios por formato
  precios: {
    g250: number                  // Precio en centavos
    kg1: number
    kg5: number
  }

  // Stock
  kgDisponibles: number
  kgReservados: number

  // Estado
  status: 'activo' | 'agotado' | 'pausado'
  foto: string                    // URL Cloudinary

  createdAt: string
  updatedAt: string
}
```

---

### `one_pedidos/{pedidoId}`

```typescript
interface PedidoONE {
  id: string                      // ONE-{año}-{4 dígitos random}

  // Comprador
  emprendedorId: string           // FK → one_usuarios
  emprendedorNombre: string
  emprendedorEmail: string
  emprendedorTelefono: string

  // Negocio del emprendedor
  nombreLocal: string             // "Café El Origen"
  distritoLocal: string           // "Miraflores"

  // Items
  items: {
    productoId: string
    productoNombre: string
    caficultorNombre: string
    formato: '250g' | '1kg' | '5kg'
    cantidad: number              // Número de unidades del formato
    precioUnitarioCents: number
    subtotalCents: number
  }[]

  // Totales
  subtotalCents: number
  deliveryCents: number
  totalCents: number

  // Pago
  metodoPago: 'yape' | 'transferencia'
  pagoStatus: 'pendiente' | 'voucher_subido' | 'verificado' | 'rechazado'
  voucherUrl?: string             // Cloudinary

  // Logística
  direccionEntrega: string
  logisticaStatus: 'preparando' | 'despachado' | 'entregado'
  notasEntrega?: string

  // Kit de identidad
  kitGenerado: boolean            // Si se generó el kit post-compra
  kitId?: string                  // FK → one_kits

  // Compromiso mensual (modelo atado)
  esKitProveedor: boolean         // Si incluyó Kit Proveedor
  compromisoMeses?: number        // 3 meses mínimo si esKitProveedor

  createdAt: string
  updatedAt: string
}
```

---

### `one_usuarios/{uid}`

```typescript
interface UsuarioONE {
  uid: string
  rol: 'emprendedor' | 'caficultor' | 'admin'
  nombre: string
  email?: string
  telefono?: string

  // Solo para emprendedores
  emprendedor?: {
    nombreLocal: string           // Nombre de su cafetería
    distritoLocal: string
    etapa: 'planificando' | 'proxima_apertura' | 'abierto'
    fechaAperturaEstimada?: string
    pedidoIds: string[]
  }

  // Solo para caficultores
  caficultor?: {
    caficultorId: string          // FK → one_caficultores
  }

  createdAt: string
}
```

---

### `one_kits/{kitId}`

```typescript
interface KitIdentidadONE {
  id: string
  pedidoId: string                // FK → one_pedidos
  emprendedorId: string
  nombreLocal: string

  // Contenido generado
  productos: {
    caficultorNombre: string
    caficultorFoto: string
    caficultorRegion: string
    caficultorAltitud: number
    caficultorHistoria: string
    productoNombre: string
    variedad: string
    proceso: string
    notasSabor: string[]
    puntajeReferencial?: number
  }[]

  // URLs de descarga
  menuPdfUrl?: string             // PDF del menú generado
  fichasUrl?: string              // PDF fichas para mesas
  qrUrl?: string                  // QR que apunta a página pública del caficultor
  instagramPackUrl?: string       // Fotos listas para Instagram

  createdAt: string
}
```

---

## Flujo de la aplicación

```
VISITANTE
    ↓
CatalogoPublico.tsx
  → Ve los 3 cafés con foto, historia del caficultor
  → Ve precio por formato
  → Botón: "Quiero este café para mi cafetería"
    ↓
    Si no está logueado → AuthScreen (registro rápido)
    Si está logueado → CheckoutONE
    ↓
CheckoutONE.tsx
  → Selecciona formato y cantidad
  → Ingresa nombre de su local y distrito
  → Elige método de pago (Yape / Transferencia)
  → Sube voucher
    ↓
    PedidoONE creado en Firestore
    Admin recibe notificación
    ↓
PortalEmprendedor.tsx (post-compra)
  → Ve estado del pedido
  → Descarga Kit de Identidad cuando está listo
  → Historial de pedidos
  → Botón de reposición rápida

ADMIN
    ↓
AdminONE.tsx
  → Verifica vouchers de pago
  → Marca pedidos como despachados
  → Genera el kit de identidad del emprendedor
  → Ve métricas simples (pedidos, facturación, clientes activos)

CAFICULTOR
    ↓
PortalCaficultor.tsx
  → Ve pedidos que incluyen su café
  → Ve cuánto va a cobrar
  → Confirma disponibilidad de stock
```

---

## Componentes — diseño detallado

### 1. `CatalogoPublico.tsx`

**Lo que muestra:**
```
┌─────────────────────────────────────────────┐
│  TUNAY WASI                                 │
│  Café peruano directo del productor         │
│  para tu cafetería                          │
├─────────────────────────────────────────────┤
│                                             │
│  [Foto María]  María Huamán                 │
│                Cajamarca · 1,800 msnm       │
│                Bourbon Lavado               │
│                "durazno · panela · chocolate"│
│                                             │
│                250g S/39 · 1kg S/125        │
│                [Quiero este café →]         │
│                                             │
├─────────────────────────────────────────────┤
│  (repite para caficultor 2 y 3)             │
└─────────────────────────────────────────────┘
```

**Sin filtros. Sin búsqueda. Solo los 3 productos.**

---

### 2. `PerfilCaficultor.tsx`

**Página pública** en `/caficultor/:id`

```
[Foto grande de la finca]

María Huamán
San Ignacio, Cajamarca
1,800 msnm

[Mini mapa con pin]

"Cultivo café desde hace 15 años
en Los Alisos. Mi familia..."

Variedad: Bourbon
Proceso: Lavado
Cosecha: Junio 2026

─────────────────────────
Este café lo sirven en:
• [Foto] Café El Origen — Miraflores
• [Foto] La Taza Verde — Barranco
─────────────────────────
```

El QR del kit apunta aquí. Las cafeterías aparecen listadas cuando compran.

---

### 3. `CheckoutONE.tsx`

**Paso 1 — Resumen**
```
Has elegido:
Bourbon Lavado de María Huamán
1 kg — S/ 125

Nombre de tu local: [__________]
Distrito: [__________]

[Continuar →]
```

**Paso 2 — Pago**
```
Total: S/ 125 + S/ 10 delivery = S/ 135

Paga por:
○ Yape  ○ Transferencia BCP

[QR Yape o datos BCP]

Sube tu voucher: [📎 Adjuntar]

[Confirmar pedido →]
```

**Paso 3 — Confirmación**
```
✓ Pedido ONE-2026-4821 recibido

Te avisamos por WhatsApp cuando
esté en camino.

Mientras tanto, tu kit de identidad
se está preparando...

[Ver mi portal →]
```

---

### 4. `KitIdentidad.tsx`

**Lo que recibe el emprendedor post-compra:**

```
Tu Kit de Identidad está listo 🎉

PARA TU CARTA
[📄 Descargar menú PDF]
  → A4 con el origen, variedad,
    notas de sabor y foto del caficultor

PARA TUS MESAS
[📄 Descargar fichas para imprimir]
  → Tarjeta 9×5cm, imprimible en casa

QR DE TRAZABILIDAD
[🔗 Ver página del caficultor]
[📱 Descargar QR para tus mesas]

PARA INSTAGRAM
[📸 Descargar pack de fotos]
  → 3 fotos de la finca con caption sugerido
```

---

### 5. `PortalEmprendedor.tsx`

```
Hola, Café El Origen 👋

─── Tu pedido activo ───────────────────
ONE-2026-4821
1kg Bourbon Lavado · María Huamán
Estado: En camino 🚚
────────────────────────────────────────

─── Tu kit de identidad ────────────────
[Descargar menú] [Descargar fichas] [QR]
────────────────────────────────────────

─── Reposición rápida ──────────────────
¿Necesitas más café?
[Pedir 1kg de nuevo →]
────────────────────────────────────────

─── Historial ──────────────────────────
• ONE-2026-4821  1kg  S/135  Entregado ✓
────────────────────────────────────────
```

---

### 6. `PortalCaficultor.tsx`

**Simple. Solo lo esencial:**

```
Hola, María 👋

─── Pedidos de tu café ─────────────────
Café El Origen (Miraflores)
  1kg Bourbon Lavado
  Estado: Despachado

La Taza Verde (Barranco)
  2kg Bourbon Lavado
  Estado: Entregado ✓
────────────────────────────────────────

─── Tu stock ───────────────────────────
Bourbon Lavado: 45 kg disponibles
[Actualizar stock]
────────────────────────────────────────

─── Tus ganancias ──────────────────────
Este mes: S/ 450
Próximo pago: cuando se entregue el pedido
────────────────────────────────────────
```

---

### 7. `AdminONE.tsx`

**4 tabs únicamente:**

**Tab 1 — Pedidos**
```
Kanban simple:

[Pendiente pago] → [Pago verificado] → [En camino] → [Entregado]

Cada card muestra:
- Nombre del local
- Producto + cantidad
- Total
- Botón de acción del siguiente paso
```

**Tab 2 — Pagos**
```
Lista de vouchers pendientes de verificar:
- Foto del voucher
- Monto declarado vs monto del pedido
- [✓ Verificar] [✗ Rechazar]
```

**Tab 3 — Kits**
```
Pedidos entregados sin kit generado:
- Nombre del local
- Productos comprados
- [Generar Kit →]
```

**Tab 4 — Métricas**
```
Esta semana:
Pedidos: 4
Facturación: S/ 540
Clientes nuevos: 2
Clientes recurrentes: 2

Este mes:
Pedidos: 12
Facturación: S/ 1,620
```

---

## Firestore rules — versión simplificada

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function isAdmin() {
      return request.auth.token.email.matches('.*@tunaywasi\\.pe');
    }
    function rol() {
      return get(/databases/$(database)/documents/one_usuarios/$(uid())).data.rol;
    }

    // Catálogo público — solo lectura
    match /one_caficultores/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /one_productos/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Pedidos — emprendedor crea, admin gestiona
    match /one_pedidos/{id} {
      allow read: if isSignedIn() &&
        (resource.data.emprendedorId == uid() || isAdmin());
      allow create: if isSignedIn() &&
        request.resource.data.emprendedorId == uid();
      allow update: if isAdmin() ||
        (isSignedIn() && resource.data.emprendedorId == uid() &&
         request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['voucherUrl', 'pagoStatus']));
    }

    // Usuarios — cada uno lee/edita el suyo
    match /one_usuarios/{id} {
      allow read: if isSignedIn() && (uid() == id || isAdmin());
      allow create: if isSignedIn() && uid() == id;
      allow update: if isSignedIn() && (uid() == id || isAdmin());
    }

    // Kits — emprendedor lee el suyo, admin crea/edita
    match /one_kits/{id} {
      allow read: if isSignedIn() &&
        (resource.data.emprendedorId == uid() || isAdmin());
      allow write: if isAdmin();
    }
  }
}
```

---

## config.ts — constantes del modelo ONE

```typescript
// src/one/config.ts

export const ONE_CONFIG = {
  // Precios de delivery
  DELIVERY_LIMA_CENTS: 1000,        // S/ 10
  DELIVERY_PROVINCIA_CENTS: 2000,   // S/ 20

  // Compromiso mínimo Kit Proveedor
  COMPROMISO_MESES_MIN: 3,

  // Datos de pago
  YAPE_NUMERO: '+51 XXX XXX XXX',   // Completar
  BCP_CCI: 'XXX XXX XXX XXX',       // Completar
  BCP_TITULAR: 'Tunay Wasi SAC',    // Completar

  // WhatsApp admin para notificaciones
  ADMIN_WHATSAPP: '+51 XXX XXX XXX', // Completar
} as const
```

---

## service.ts — operaciones Firestore

```typescript
// src/one/service.ts

// ─── CATÁLOGO ──────────────────────────────────────────
fetchProductos(): Promise<ProductoONE[]>
fetchProducto(id: string): Promise<ProductoONE>
fetchCaficultor(id: string): Promise<CaficultorONE>
fetchCaficultores(): Promise<CaficultorONE[]>

// ─── PEDIDOS ───────────────────────────────────────────
createPedido(data: CreatePedidoInput): Promise<string>
fetchPedido(id: string): Promise<PedidoONE>
fetchPedidosByEmprendedor(uid: string): Promise<PedidoONE[]>
fetchPedidosAdmin(): Promise<PedidoONE[]>
subirVoucher(pedidoId: string, file: File): Promise<void>
verificarPago(pedidoId: string): Promise<void>
rechazarPago(pedidoId: string): Promise<void>
updateLogistica(pedidoId: string, status: string): Promise<void>

// ─── USUARIOS ──────────────────────────────────────────
crearUsuario(uid: string, data: CreateUsuarioInput): Promise<void>
fetchUsuario(uid: string): Promise<UsuarioONE>
updateUsuario(uid: string, data: Partial<UsuarioONE>): Promise<void>

// ─── KITS ──────────────────────────────────────────────
generarKit(pedidoId: string): Promise<string>
fetchKit(kitId: string): Promise<KitIdentidadONE>
fetchKitByPedido(pedidoId: string): Promise<KitIdentidadONE | null>
```

---

## AppONE.tsx — routing principal

```typescript
// src/AppONE.tsx

// Rutas:
// /                    → CatalogoPublico (público)
// /caficultor/:id      → PerfilCaficultor (público)
// /checkout            → CheckoutONE (requiere auth)
// /portal              → PortalEmprendedor (requiere auth + rol emprendedor)
// /caficultor-portal   → PortalCaficultor (requiere auth + rol caficultor)
// /admin               → AdminONE (requiere auth + isAdmin)
```

---

## main.tsx — agregar target 'one'

```typescript
// Agregar a los targets existentes:
// ?target=one → AppONE

const target = new URLSearchParams(window.location.search).get('target')
  ?? import.meta.env.VITE_APP_TARGET
  ?? 'marketplace';

if (target === 'one') {
  root.render(<AppONE />)
} else if (target === 'marketplace') {
  // ... existente
}
```

---

## Orden de construcción

### Semana 1 — Base funcional
```
Día 1: types.ts + config.ts + service.ts (estructura)
Día 2: AppONE.tsx + routing + AuthScreen reutilizado
Día 3: CatalogoPublico.tsx + seed de los 3 caficultores
Día 4: CheckoutONE.tsx (Paso 1 y 2)
Día 5: AdminONE.tsx Tab Pedidos + Tab Pagos
```

### Semana 2 — Portales y kit
```
Día 1: PortalEmprendedor.tsx
Día 2: PortalCaficultor.tsx
Día 3: KitIdentidad.tsx (descarga manual primero)
Día 4: PerfilCaficultor.tsx (página pública + QR)
Día 5: AdminONE.tsx Tab Kits + Tab Métricas
```

### Semana 3 — Pulir y lanzar
```
Día 1-2: Seed datos reales de los 3 caficultores
Día 3:   Prueba end-to-end del flujo completo
Día 4:   Fix de bugs encontrados
Día 5:   Deploy y primer cliente
```

---

## Lo que NO se construye ahora

```
❌ Q-Grader / certificación SCA
❌ Laboratorios
❌ Hub Lima
❌ Solicitudes de muestra complejas
❌ Diario de proceso
❌ Sistema de calificaciones
❌ Notificaciones in-app
❌ Suscripción automática
❌ Generador de PDF automático (manual primero)
❌ Exportación
```

Cuando haya 10 clientes activos, se evalúa qué agregar.

---

*Documento técnico de referencia para la construcción de TunayWasi ONE.*
*Actualizar con cada decisión de arquitectura que se tome durante el desarrollo.*
