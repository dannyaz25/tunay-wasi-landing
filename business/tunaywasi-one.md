# TunayWasi ONE — Modelo Simplificado

> Versión 1.1 — Septiembre 2026
> Este documento define el modelo de negocio simplificado para validar el mercado antes de activar el marketplace completo.

---

## El modelo en una frase

**Tunay Wasi conecta caficultores peruanos con emprendedores que van a abrir su cafetería — dándoles el café y la identidad de origen lista desde el día uno.**

---

## Por qué este modelo primero

El marketplace completo (Q-Grader, certificación, laboratorios, hub Lima) es el destino correcto a largo plazo. Pero tiene el problema del huevo y la gallina: necesita caficultores para atraer compradores y compradores para atraer caficultores.

TunayWasi ONE resuelve eso:
- Arranca con 3 caficultores ya disponibles (incluyendo proveedor directo)
- Enfoca el 100% en un solo cliente: el emprendedor que va a abrir su cafetería
- Genera caja recurrente desde el primer mes
- Construye la base de cafeterías que después alimenta el marketplace

---

## Los actores

### Actor 1 — El caficultor (proveedor)

Tres caficultores reales desde el inicio:

| Caficultor | Región | Estado |
|---|---|---|
| Proveedor 1 (familiar) | Por confirmar | Disponible |
| Proveedor 2 | Por confirmar | Disponible |
| Proveedor 3 | Por confirmar | Disponible |

**Lo que hace en el negocio:**
- Vende café verde a Tunay Wasi a precio acordado
- Provee foto, historia y datos de su finca
- Garantiza abastecimiento mensual mínimo

**Lo que hace en la plataforma — Portal del Caficultor (`#/caficultor-portal`):**

| Sección | Contenido | Acción disponible |
|---|---|---|
| Mis pedidos | Lista de pedidos donde aparece su café — local, formato, cantidad, estado | Solo lectura |
| Mis ganancias | Total generado este mes + proyección del próximo pago | Solo lectura |
| Mi stock | Kg disponibles por producto | Solo lectura — actualización vía admin en fase 1 |

**Lo que NO hace en la plataforma en fase 1:**
- No publica lotes directamente
- No fija precios (se acuerdan fuera de la plataforma)
- No interactúa con emprendedores directamente
- No gestiona certificaciones SCA

**Por qué tiene portal de todas formas:**
La promesa central de Tunay Wasi al caficultor es transparencia — "sabes cuánto te pagan y cuándo". Sin portal, esa promesa es solo palabras. El portal es la prueba visible de que el modelo cumple.

---

### Actor 2 — La tostaduria aliada (operador)

Una tostaduria aliada (Violet / Vicoffee / Narsacoffee) que:
- Recibe el café verde de Tunay Wasi
- Tuesta con perfil acordado
- Fracciona en bolsas de 250g y 1kg
- Sella con etiqueta Tunay Wasi
- Entrega listo para despachar

**Tunay Wasi paga por kilo procesado.** Sin inversión en equipamiento.

**No tiene portal en la plataforma.** La coordinación es por WhatsApp y llamada en fase 1.

---

### Actor 3 — El emprendedor (cliente principal)

**Quién es:**
- Persona que está a 1–3 meses de abrir su cafetería
- No tiene proveedor de café definido todavía
- Busca diferenciarse desde el primer día
- Necesita una historia que contar a sus clientes

**Dónde está:**
- Grupos de Facebook de emprendedores gastronómicos
- Cursos de barismo en Lima
- Redes sociales siguiendo a cafeterías y baristas
- Programas de emprendimiento (COFIDE, StartUp Perú)

**Lo que necesita:**
1. Café de calidad con historia verificable
2. Identidad de origen lista para su carta y sus mesas
3. Proveedor confiable para reposición mensual
4. Sin complicaciones de volumen mínimo alto

---

### Actor 4 — Tunay Wasi (coordinador)

**Lo que hace:**
- Compra café verde al caficultor
- Coordina tueste con la tostaduria
- Vende al emprendedor
- Construye la identidad de origen (menú, fichas, QR)
- Gestiona la reposición mensual
- Cobra y distribuye pagos

**Lo que NO hace en esta fase:**
- No certifica con Q-Grader independiente
- No opera el marketplace abierto
- No gestiona laboratorios
- No maneja hub Lima

---

## El modelo atado — la clave del negocio

Inspirado en el modelo de máquina dispensadora:

```
Tunay Wasi construye gratis la identidad
de origen de la cafetería del emprendedor
        ↓
A cambio el emprendedor se compromete
a comprar el café a Tunay Wasi
        ↓
Relación recurrente mensual sin fricción
```

### Lo que recibe el emprendedor (gratis o casi gratis)

| Entregable | Descripción | Costo para TW |
|---|---|---|
| Menú personalizado | Su carta con el nombre del caficultor, región, variedad, notas de sabor | S/ 0 (Canva, 30 min) |
| Fichas para las mesas | Tarjeta con foto del caficultor + historia + QR | S/ 30–50 impresión |
| QR de trazabilidad | Link a página con historia del caficultor y mapa de la finca | S/ 0 (Notion/link) |
| Kit Instagram | 3 fotos de la finca listas para publicar con caption | S/ 0 |
| Asesoría de inicio | Qué café servir según su concepto de local | S/ 0 |

**Inversión total por cliente nuevo: S/ 80–150 (una vez)**

---

## El producto

### Catálogo inicial — 3 orígenes

```
┌─────────────────────────────────────────┐
│           TUNAY WASI                    │
│     Café Peruano de Especialidad        │
├─────────────────────────────────────────┤
│                                         │
│  [Nombre caficultor 1]                  │
│  Región · Variedad · Proceso            │
│  Notas de sabor                         │
│  250g S/XX · 1kg S/XX                   │
│                                         │
│  [Nombre caficultor 2]                  │
│  Región · Variedad · Proceso            │
│  Notas de sabor                         │
│  250g S/XX · 1kg S/XX                   │
│                                         │
│  [Nombre caficultor 3]                  │
│  Región · Variedad · Proceso            │
│  Notas de sabor                         │
│  250g S/XX · 1kg S/XX                   │
│                                         │
└─────────────────────────────────────────┘
```

### Formatos y precios (referenciales — ajustar con costos reales)

| Formato | Uso | Precio venta | Para quién |
|---|---|---|---|
| 250g | Degustación / prueba | S/ 35–45 | Consumidor / emprendedor explorando |
| 1kg | Cafetería pequeña | S/ 120–140 | Emprendedor abriendo |
| Saco 5kg | Cafetería en operación | S/ 550–650 | Cliente recurrente |

### Kits de entrada

| Kit | Contenido | Precio | Objetivo |
|---|---|---|---|
| **Kit Degustación** | 3 × 250g de orígenes distintos | S/ 99 | Primera compra / regalo |
| **Kit Apertura** | 1kg + fichas impresas + menú personalizado | S/ 149 | Emprendedor a punto de abrir |
| **Kit Proveedor** | 5kg + identidad completa + compromiso mensual | S/ 680 | Cafetería nueva en operación |

---

## El modelo financiero

### Estructura de costos por kg (referencial)

```
Café verde al caficultor        S/ 25–35 /kg
Tueste + bolsa + etiqueta       S/ 18–25 /kg
Delivery al cliente             S/  5–10 /kg
─────────────────────────────────────────────
Costo total                     S/ 48–70 /kg

Precio de venta                 S/ 85–100 /kg

Margen bruto                    S/ 15–50 /kg
```

> ⚠️ Estos números son referenciales. Confirmar con llamadas a caficultores y tostaduria esta semana.

### Proyección por número de clientes recurrentes

| Clientes activos | Kg/mes promedio | Facturación | Margen estimado |
|---|---|---|---|
| 5 cafeterías | 5 kg c/u = 25 kg | S/ 2,125 | S/ 750 |
| 10 cafeterías | 5 kg c/u = 50 kg | S/ 4,250 | S/ 1,500 |
| 20 cafeterías | 5 kg c/u = 100 kg | S/ 8,500 | S/ 3,000 |
| 30 cafeterías | 5 kg c/u = 150 kg | S/ 12,750 | S/ 4,500 |

---

## El flujo de una venta

```
1. Emprendedor encontrado
   (grupo Facebook / curso barismo / referido)
        ↓
2. Primera conversación
   Escuchar su proyecto
   No vender todavía
        ↓
3. Enviar propuesta personalizada
   PDF con su carta ya diseñada con su nombre
   y el origen del caficultor
        ↓
4. Cierre del trato
   Kit Apertura o Kit Proveedor
   Compromiso mínimo 3 meses
        ↓
5. Coordinar tueste con tostaduria
   (5–7 días de tiempo de proceso)
        ↓
6. Entregar café + kit de identidad completo
   Bolsas selladas
   Fichas impresas
   Menú descargable
   QR activo
        ↓
7. Reposición mensual automática
   WhatsApp o plataforma
   Sin que el cliente tenga que pedir
```

---

## Lo que se rescata del código actual

Del marketplace completo, estos componentes son reutilizables directamente o con ajustes menores:

### Rescatar sin cambios

| Componente / Servicio | Por qué rescatar |
|---|---|
| `CheckoutB2B.tsx` | El flujo de pago (Yape, transferencia, Izipay) es exactamente lo que necesita el emprendedor |
| `marketplaceService.ts` → `createMktPedido()` | La lógica de crear pedido y reservar stock sirve igual |
| `marketplaceService.ts` → `subirVoucherPedido()` | El emprendedor sube su voucher de pago igual |
| `perfilService.ts` → `crearPerfil()` | El registro de usuario con rol funciona igual |
| `src/shared/types/marketplace.ts` → `LoteDoc` | La estructura del lote es válida, solo simplificar campos |
| `firestore.rules` → reglas de `mkt_lotes` y `mkt_pedidos` | Las reglas de seguridad base sirven |
| `FincaPerfil.tsx` | El perfil de la finca del caficultor se usa en el kit de identidad |

### Rescatar con ajustes

| Componente | Ajuste necesario |
|---|---|
| `CaficultorPortal.tsx` | Simplificar: quitar tabs de certificación, lab, hub Lima. Dejar solo: mis lotes, mis pedidos, mi perfil |
| `AdminPanel.tsx` | Simplificar: quitar gestión de labs y hub. Dejar solo: pedidos, pagos, despachos |
| `MarketplaceLotes.tsx` | Convertir en catálogo para el emprendedor: quitar flujo de muestra complejo, simplificar a ver → elegir → comprar |

### No usar en esta fase

| Componente | Por qué no |
|---|---|
| `LaboratorioPortal.tsx` | No hay Q-Grader en TunayWasi ONE |
| `DiarioProceso.tsx` | Demasiado técnico para esta fase — el caficultor no lo necesita ahora |
| `FeedbackSCA.tsx` | Sin catación oficial no hay retroalimentación SCA |
| Flujo de certificación (Uber) | Sin laboratorio no hay certificación |
| `SolicitudCertificacionDoc` | No aplica |
| `SolicitudHubDoc` | Sin hub Lima activo |
| `mkt_laboratorios` colección | Sin laboratorios registrados |

---

## Las colecciones Firestore necesarias

### Fase 1 — TunayWasi ONE

Solo estas 5 colecciones:

```
mkt_usuarios/         → perfiles de emprendedores y caficultores
mkt_lotes/            → catálogo simplificado (sin campos de certificación)
mkt_pedidos/          → pedidos del emprendedor (checkout existente)
mkt_caficultores/     → directorio de los 3 caficultores
mkt_notificaciones/   → alertas para admin y caficultor
```

### Campos de LoteDoc que SÍ se usan

```typescript
// Identidad
nombreLote, cosecha, proceso, variedad, altitud, region
caficultorId, caficultorNombre, caficultorFoto

// Calidad (referencial, no certificado)
puntajeReferencial     // nuevo campo — reemplaza puntajeOficial
notasSabor

// Stock
kgDisponibles, kgReservados, precioKgPEN, precioVentaKgPEN

// Estado simplificado
status: 'borrador' | 'publicado' | 'agotado'
// ❌ Eliminar: 'en_catacion' | 'rechazado'
```

### Campos de LoteDoc que NO se usan en fase 1

```
❌ laboratorioId
❌ catado, puntajeOficial
❌ _cataciones[], _catacionesCount
❌ stockMuestrasHub
❌ muestraDisponible, precioMuestraPEN
❌ sacosDisponibles, precioSacoPEN (legacy)
```

---

## Los cambios de código necesarios

### Prioridad 1 — Para lanzar (esta semana)

**1. Nuevo campo en LoteDoc**
```typescript
// En src/shared/types/marketplace.ts
puntajeReferencial?: number   // Reemplaza puntajeOficial en fase 1
// Con nota visible en UI: "Puntaje referencial — certificación independiente próximamente"
```

**2. Simplificar LoteStatus**
```typescript
// Antes
type LoteStatus = 'borrador' | 'en_catacion' | 'publicado' | 'agotado' | 'rechazado'

// Después (fase 1)
type LoteStatus = 'borrador' | 'publicado' | 'agotado'
```

**3. Nueva página de catálogo simplificado**
- Basada en `MarketplaceLotes.tsx`
- Sin tab de muestras
- Sin filtro por laboratorio
- CTA claro: "Quiero este café para mi cafetería"
- Muestra puntaje referencial con disclaimer

**4. Portal del caficultor simplificado**
- Basado en `CaficultorPortal.tsx`
- Solo 3 tabs: Mis lotes · Mis pedidos · Mi perfil
- Sin flujo de certificación
- Sin solicitudes de hub

**5. AdminPanel simplificado**
- Solo: Pedidos · Pagos · Despachos
- Sin gestión de laboratorios
- Sin hub Lima

### Prioridad 2 — Semana 2

**6. Generador de kit de identidad**
- Nueva página post-compra
- Genera PDF del menú con datos del caficultor
- Genera ficha para mesas (printable)
- Genera QR apuntando a página del caficultor

**7. Página pública del caficultor**
- URL: `/caficultor/[nombre-finca]`
- Foto, historia, región, variedad
- Mapa con coordenadas
- "Este café lo sirven en [cafeterías que lo usan]"

### Prioridad 3 — Cuando haya 10 clientes

**8. Suscripción mensual**
- Plan Base / Medio / Pro
- Reposición automática
- Notificación WhatsApp

---

## Las métricas de TunayWasi ONE

### Semana 1–2 (validación)
```
□ 20 emprendedores contactados
□ 5 conversaciones reales (>3 mensajes)
□ 1 primera venta (Kit Degustación o Kit Apertura)
```

### Mes 1 (tracción)
```
□ 3 clientes con pedido realizado
□ 1 cliente con segundo pedido (recompra)
□ Costo de tueste confirmado con tostaduria
□ Margen real calculado
```

### Mes 2–3 (recurrencia)
```
□ 10 clientes activos
□ 5 con suscripción mensual
□ S/ 3,000–4,000 facturación mensual
□ 2–3 referidos de clientes actuales
```

### Mes 4–6 (escala)
```
□ 20+ clientes activos
□ S/ 8,000+ facturación mensual
□ Activar Q-Grader como diferenciador premium
□ Abrir marketplace a más caficultores
```

---

## El stack técnico en fase 1

Sin cambios en el stack. Solo simplificación de lo que se usa:

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | ✅ Listo |
| Auth | Firebase Auth | ✅ Listo |
| Base de datos | Firestore (5 colecciones en vez de 13) | ✅ Simplificar |
| Storage | Cloudinary | ✅ Listo |
| Pagos | Yape + Transferencia BCP (Izipay después) | ✅ Listo |
| Notificaciones | WhatsApp manual → automatizar después | 🔄 Manual en fase 1 |
| Kit identidad | Canva manual → generador automático después | 🔄 Manual en fase 1 |

---

## El caficultor ve el catálogo completo — y debe verlo

**Decisión de negocio:** El portal del caficultor incluye acceso directo al catálogo público (`#/` con link "Ver catálogo →" en el sidebar).

### Por qué es correcto

| Razón | Justificación |
|---|---|
| **Inteligencia competitiva legítima** | El caficultor necesita saber qué otros cafés compiten con el suyo en precio, proceso y variedad para posicionarse |
| **Referencia de precios de mercado** | Si su Bourbon lavado está en S/66/kg y el promedio del catálogo es S/55, debe saberlo para ajustar o justificar su premium |
| **Señales de demanda** | Ver qué variedades y procesos tienen más pedidos orienta qué producir en la siguiente cosecha |
| **Colaboración entre pares** | Ver a otros caficultores con 85+ pts SCA inspira a mejorar la calidad propia |
| **Confianza en la plataforma** | Sin visibilidad del ecosistema, el caficultor no entiende el mercado en el que participa — la transparencia es la promesa central de Tunay Wasi |

### Lo que SÍ ve

- Todos los productos del catálogo: nombre, variedad, proceso, puntaje, precios de venta, foto
- Historia y perfil de los otros caficultores (página pública `#/caficultor/:id`)

### Lo que NO ve

- **Costos privados** (`CostosProductoONE`: precio verde, costo tueste, margen) — solo visibles para el dueño del producto en su portal
- **Datos de contacto directo** de otros caficultores — para evitar bypass de la plataforma

### Implementación

El catálogo público ya es accesible para cualquier visitante. El portal del caficultor agrega un link directo en el sidebar: **"Ver catálogo →"** que navega a `#/`.

---

## Capacidades por actor en la plataforma

> Versión definitiva — septiembre 2026
> Esta sección define exactamente qué puede ver y hacer cada tipo de usuario en la plataforma web.

---

### Actor: Caficultor (`#/portal` con rol `caficultor`)

#### Tab 1 — Catálogo (pantalla de inicio)

El caficultor **aterriza en el catálogo público**, no en un dashboard KPI.

| Acción | Disponible | Notas |
|---|---|---|
| Ver todos los productos publicados | ✅ | Misma vista que cualquier visitante |
| Ver detalle del producto (drawer) | ✅ | Foto, variedad, proceso, puntaje, notas de sabor |
| Ver precios de venta de todos los productos | ✅ | Para referencia de mercado |
| Ver el perfil público de otros caficultores | ✅ | `#/caficultor/:id` |
| Ver costos privados de otros caficultores | ❌ | Solo el dueño ve sus márgenes |
| Agregar productos al carrito | ❌ | El caficultor no compra, provee |
| Ver aviso de pedidos pendientes de despacho | ✅ | Banner amarillo si hay pedidos en `preparando` |

**Por qué el catálogo como inicio:** el caficultor necesita inteligencia de mercado — ver precios, variedades y procesos de sus pares para posicionar su propio café. Sin visibilidad del ecosistema, la promesa de transparencia de Tunay Wasi es solo palabras.

#### Tab 2 — Mis pedidos

| Acción | Disponible | Notas |
|---|---|---|
| Ver lista de pedidos donde aparece su café | ✅ | Filtrado por `items[].caficultorId` |
| Filtrar pedidos por estado | ✅ | Todos / Preparando / En agencia / Entregado |
| Despachar un pedido (`preparando` → `en_agencia`) | ✅ | Modal con código de tracking requerido + foto opcional |
| Ingresar agencia (Olva / Shalom / Servientrega / Otra) | ✅ | Campo en modal de despacho |
| Ingresar código de tracking | ✅ | Obligatorio para confirmar despacho |
| Subir foto del paquete al despachar | ✅ | Opcional — URL Cloudinary |
| Marcar pedido como entregado | ❌ | Solo el emprendedor puede confirmar recepción |
| Ver estado de pago (pendiente / verificado / rechazado) | ✅ | Solo lectura |

**Anti-fraude:** el caficultor ingresa el código de tracking al despachar. El emprendedor ve ese código y confirma recepción. Si el código no coincide con lo recibido, el emprendedor no confirma — la calificación queda bloqueada.

#### Tab 3 — Mis lotes

| Acción | Disponible | Notas |
|---|---|---|
| Ver sus productos publicados | ✅ | Solo los propios |
| Ver stock disponible y reservado | ✅ | Solo lectura en fase 1 |
| Ver puntaje referencial de sus productos | ✅ | |
| Crear nuevos productos | ❌ | El admin crea — fase 1 |
| Modificar precios | ❌ | Se acuerdan fuera de plataforma |
| Publicar / despublicar productos | ❌ | El admin gestiona |

#### Tab 4 — Mis ganancias

| Acción | Disponible | Notas |
|---|---|---|
| Ver total generado este mes | ✅ | Calculado de pedidos `verificado` |
| Ver proyección del próximo pago | ✅ | Estimado según stock reservado |
| Ver historial de pagos anteriores | ✅ | Solo lectura |
| Recibir pago desde la plataforma | ❌ | Pago coordinado fuera — transferencia BCP / Yape |

#### Tab 5 — Mi perfil (finca)

| Acción | Disponible | Notas |
|---|---|---|
| Ver su perfil público (igual que `#/caficultor/:id`) | ✅ | |
| Editar nombre, región, historia, foto | ✅ | Datos que aparecen en el catálogo |
| Editar altitud, variedad, proceso | ✅ | |
| Ver qué cafeterías usan su café | ✅ | Lista de emprendedores que compraron |

#### Lo que el caficultor NO hace en la plataforma (fase 1)

- No fija precios (se acuerdan por llamada/WhatsApp)
- No publica lotes directamente (el admin los crea)
- No interactúa directamente con emprendedores
- No gestiona certificaciones SCA
- No solicita hub Lima

---

### Actor: Emprendedor (`#/portal` con rol `emprendedor`)

#### Tab 1 — Catálogo (pantalla de inicio)

El emprendedor **aterriza en el catálogo público**, no en un resumen financiero.

| Acción | Disponible | Notas |
|---|---|---|
| Ver todos los productos publicados | ✅ | Misma vista que cualquier visitante |
| Ver detalle del producto (drawer) | ✅ | Foto, variedad, proceso, puntaje, notas de sabor |
| Agregar productos al carrito | ✅ | Abre checkout completo |
| Ver perfil del caficultor del producto | ✅ | `#/caficultor/:id` |
| Ver aviso de pago pendiente | ✅ | Banner amarillo si tiene pedido sin voucher |
| Ver aviso de paquete en agencia | ✅ | Banner azul con código de tracking + CTA "Confirmar recepción" |

**Por qué el catálogo como inicio:** el emprendedor necesita volver a comprar fácilmente. Ver el catálogo al entrar reduce el fricción de recompra — en vez de navegar a otra sección, encuentra directamente los productos disponibles.

#### Tab 2 — Mis pedidos

| Acción | Disponible | Notas |
|---|---|---|
| Ver lista de sus pedidos activos | ✅ | Estado actual + stepper de 5 pasos |
| Filtrar por estado | ✅ | Todos / Pago pendiente / Verificado / En agencia |
| Subir voucher de pago | ✅ | Foto de Yape / transferencia BCP |
| Ver código de tracking cuando el pedido está en agencia | ✅ | Ingresado por el caficultor al despachar |
| Confirmar recepción del pedido | ✅ | Solo disponible en estado `en_agencia` |
| Calificar al caficultor | ✅ | Solo disponible si `recepcionConfirmada === true` |
| Cancelar un pedido | ❌ | Coordinación manual vía WhatsApp |

**Stepper de 5 pasos:** `Pendiente` → `Pago verificado` → `En agencia` → `Recibido` → `Calificado ✓`

**Anti-fraude:** la calificación está bloqueada hasta que el emprendedor confirme recepción. El botón "Calificar" no aparece si `recepcionConfirmada === false` — el texto muestra "Confirma la recepción para calificar".

#### Tab 3 — Historial

| Acción | Disponible | Notas |
|---|---|---|
| Ver todos los pedidos entregados | ✅ | |
| Buscar por texto (ID, caficultor, producto) | ✅ | |
| Filtrar por fecha desde / hasta | ✅ | |
| Ordenar por fecha (más reciente / más antiguo) | ✅ | |
| Ver detalle de cada pedido antiguo | ✅ | |

#### Tab 4 — Mi menú

| Acción | Disponible | Notas |
|---|---|---|
| Crear menú personalizado | ✅ | Nombre + descripción + selección de cafés |
| Activar un menú (uno activo a la vez) | ✅ | QR público apunta al menú activo |
| Editar menú existente | ✅ | |
| Eliminar menú | ✅ | |
| Compartir menú vía QR | ✅ | URL: `#/cafeteria/:id?menu=:menuId` |
| Ver menú como lo ven los clientes | ✅ | Link público |

#### Tab 5 — Mi perfil

| Acción | Disponible | Notas |
|---|---|---|
| Ver y editar nombre de local | ✅ | |
| Ver y editar distrito | ✅ | |
| Ver y editar teléfono | ✅ | |
| Cerrar sesión | ✅ | |

#### Lo que el emprendedor NO hace en la plataforma (fase 1)

- No fija precios de compra
- No ve los costos del caficultor (precio verde, tueste, margen)
- No contacta directamente al caficultor (para evitar bypass)
- No gestiona múltiples locales (una cuenta = un local en fase 1)

---

### Comparación rápida: ¿quién ve qué?

| Información | Visitante anónimo | Emprendedor | Caficultor | Admin |
|---|---|---|---|---|
| Catálogo completo (productos, precios de venta) | ✅ | ✅ | ✅ | ✅ |
| Perfil público del caficultor | ✅ | ✅ | ✅ | ✅ |
| Costos privados del producto (precio verde, tueste, margen) | ❌ | ❌ | Solo los propios | ✅ |
| Datos de contacto de otros caficultores | ❌ | ❌ | ❌ | ✅ |
| Pedidos del emprendedor | ❌ | Solo los propios | Solo los que incluyen su café | ✅ |
| Vouchers de pago | ❌ | Solo los propios | ❌ | ✅ |
| Código de tracking | ❌ | Cuando aplica | Los que él ingresó | ✅ |
| Ganancias del caficultor | ❌ | ❌ | Solo las propias | ✅ |
| Menú de la cafetería (QR) | ✅ (link público) | Solo el propio | ✅ | ✅ |

---

## Lo que activas después (roadmap)

```
FASE 1 — TunayWasi ONE (ahora)
├── 3 caficultores fijos
├── 1 tostaduria aliada
├── Venta directa a emprendedores
└── Kit de identidad manual

FASE 2 — TunayWasi + Certificación (mes 4–6)
├── Q-Grader activado como diferenciador premium
├── Puntaje oficial visible en catálogo
└── "Certificado por Q-Grader independiente" en el kit

FASE 3 — Marketplace abierto (mes 6–12)
├── Caficultores se registran solos
├── Laboratorios se integran (modelo Uber)
├── Cafeterías establecidas como clientes B2B
└── Hub Lima activo para muestras

FASE 4 — Escala (año 2)
├── Exportación
├── Suscripciones B2C
└── App móvil
```

---

## El siguiente paso concreto

**Esta semana, en orden:**

```
Lunes    → Llamar a los 3 caficultores
           → Precio por kg verde y kg disponibles

Martes   → Llamar a Violet o Vicoffee
           → Costo por kg tostado + fraccionado + bolsa con etiqueta

Miércoles → Calcular margen real
            → Si margen > S/ 20/kg → seguir
            → Si no → renegociar o cambiar tostaduria

Jueves   → Armar el catálogo en Canva (3 orígenes)
           → Diseñar Kit Apertura (menú + fichas)

Viernes  → Entrar a 3 grupos de Facebook de emprendedores
           → Enviar 10 mensajes a emprendedores identificados
```

**Sin escribir código hasta tener la primera venta.**

---

*Documento vivo — actualizar con cada aprendizaje de venta.*
*Próxima revisión: cuando se concrete la primera venta recurrente.*
