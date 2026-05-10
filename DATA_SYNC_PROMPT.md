# DATA SYNC PROMPT — tunay-wasi-landing
> Pega este documento completo en una nueva sesión de Claude Code para sincronizar los datos del prototipo con producción.

---

## Instrucción para el agente

Actúa como **Senior Frontend Engineer** especializado en React y sistemas de diseño.

Tienes acceso **únicamente** al proyecto `tunay-wasi-landing/` (prototipo de diseño con React + Babel standalone, sin build step). **No intentes leer ni acceder al repo `tunaywasi/`** — todos los valores de producción que necesitas están embebidos en la Sección 6 (Apéndice) de este documento.

**Objetivo:** Reemplazar datos placeholder en el prototipo con valores reales del negocio. No es un refactor; es una sustitución quirúrgica de valores. Los cambios están organizados por prioridad.

---

## Reglas inmutables

1. **Solo cambiar valores de datos** — nunca modificar estructura JSX, props, funciones ni estilos inline
2. **No tocar ningún `ImageSlot`** — las imágenes reales vendrán de Firebase Storage
3. **No añadir TypeScript** — el prototipo usa Babel/JSX plano
4. **No modificar `lib/checkout.js` ni `lib/cartSchema.js`** — quedan fuera del alcance de este sync
5. **Anotar los números de línea tocados** después de cada cambio de archivo
6. Ejecutar `npx serve .` para verificar el resultado visual al final

---

## Prioridad 1 — Cambios críticos (datos incorrectos o confusos hoy)

### 1.1 · `components/Modelo.jsx` — Desglose de precio

**Qué cambiar:** el array `slices` (actualmente con porcentajes demo 50/18/12/14/6) debe reflejar la estructura real de comisiones.

Reemplazar el array `slices` con:
```js
const slices = [
  { pct: 42, label: 'Caficultor',            color: '#c96e4b', detail: 'Pago directo a la finca, antes de que el grano viaje.' },
  { pct: 15, label: 'Tueste + Cata Q-Grader',color: '#8faf8a', detail: 'Tostado artesanal y certificación de calidad SCA.' },
  { pct:  6, label: 'Flete y Empaque',        color: '#c4b297', detail: 'Transporte desde origen y embalaje kraft reciclado.' },
  { pct: 15, label: 'IGV (18%)',              color: '#533b22', detail: 'Impuesto al consumo incluido en el precio final.' },
  { pct: 21, label: 'Tunay Wasi',             color: '#1f3028', detail: 'Plataforma, tecnología y operación del marketplace.' },
];
```

> **Nota de redondeo:** los porcentajes suman 99 (42+15+6+15+21). Esto es correcto por redondeo del 42.1%, 15.3%, 6.1%, 15.3%, 21.2% real. Si el código valida suma=100, ajustar el último slice a 22.

**También cambiar en el mismo archivo:**
- El callout grande central (donde aparece el texto "50%") → reemplazar con **"42%"**
- La referencia de fecha de cosecha: texto "abril 2026" → **"mayo 2026"**
- Sub-descripción de la sección (si existe "Modelo 50 / 50") → mantener en la navegación como brand shorthand, pero añadir debajo: `"Desglose verificado del precio al consumidor"`

---

### 1.2 · `components/Preventa.jsx` — Countdown y fechas de entrega

**Qué cambiar:**

**a) Countdown target** — reemplazar el cálculo dinámico (`now + 1d 16h`) con la fecha real de cierre de preventa:

```js
// ANTES (demo):
const cutoff = React.useMemo(() => {
  const now = new Date();
  const target = new Date(now);
  target.setDate(now.getDate() + 1);
  target.setHours(23, 59, 0, 0);
  return target.getTime();
}, []);

// DESPUÉS (real — 31 mayo 2026 a las 23:59 Lima / UTC-5):
const cutoff = new Date('2026-06-01T04:59:59Z').getTime();
```

> Eliminar el `useMemo` y dejar `cutoff` como constante de módulo fuera del componente.

**b) Fechas de entrega** — reemplazar todas las referencias a fechas de mayo con las reales de agosto:

| Texto actual | Reemplazar con |
|-------------|----------------|
| `"Lima 7 mayo"` | `"Lima primera semana de agosto"` |
| `"desde 8 mayo"` | `"desde segunda semana de agosto"` |
| `"entrega Lima 14 mayo"` | `"entrega Lima segunda semana de agosto"` |
| `"Prov. desde 15 mayo"` | `"Prov. desde mediados de agosto"` |

**c) Precio "desde"** — actualizar precio de referencia:

```
"desde S/ 24.43 · 250 g"  →  "desde S/ 49.88 · 250 g"
```

---

### 1.3 · `lib/cartStore.js` — Objeto `cycle`

Localizar el objeto `cycle` (aprox. línea 48) y reemplazar sus fechas:

```js
// ANTES:
cycle: { closeAt: '06 may.', deliverLima: '07 may.', deliverProv: '10 may.' }

// DESPUÉS:
cycle: { closeAt: '31 may.', deliverLima: 'ago. (1a semana)', deliverProv: 'ago. (2a semana)' }
```

---

### 1.4 · `components/CartDrawer.jsx` — Porcentaje al productor

Reemplazar todas las apariciones de `"50%"` que se refieran al porcentaje del caficultor en el drawer con **`"42%"`**.

> Buscar específicamente en el drawer los textos tipo "50% al caficultor", "50 % del precio" o similares. No cambiar texto puramente decorativo o de marketing si no hace referencia a la distribución del precio.

---

### 1.5 · `lib/useCartTotals.js` — Factor de cálculo del productor

Localizar el cálculo de `producerShareCents` (o similar) que multiplica por `0.5` y reemplazar con el factor real:

```js
// ANTES:
producerShareCents: subtotalCents * 0.5

// DESPUÉS:
producerShareCents: subtotalCents * 0.421
```

---

### 1.6 · `components/Checkout.jsx` — Banner de ciclo y fechas

**Banner de ciclo** — reemplazar las tres fechas del banner de confirmación/resumen:

```
"Cierre: 06 may."       →  "Cierre: 31 may."
"Lima desde 07 may."    →  "Lima ago. (1a semana)"
"Nacional desde 10 may."→  "Nacional ago. (2a semana)"
```

---

### 1.7 · `components/Cafe.jsx` — Botón de reserva

Localizar el botón "Reservar" en las tarjetas de producto que incluye la fecha de entrega:

```
"Reservar — entrega 7 mayo"  →  "Reservar — entrega agosto"
```

---

## Prioridad 2 — Precisión y TODOs (no urgente)

### 2.1 · `components/Hero.jsx` — Métricas placeholder

Las tres métricas del Hero (`50%`, `12 fincas`, `+1,400 m`) requieren tratamiento diferenciado:

- **`"50% directo al productor"`** → **mantener tal cual** (es el claim de marketing; el 42% exacto se muestra en la sección Modelo)
- **`"12 fincas asociadas"`** → añadir comentario de código:
  ```js
  // TODO: reemplazar con count real de la colección 'caficultores' en Firebase
  ['12', 'fincas asociadas'],
  ```
- **`"+1,400 m"`** → añadir comentario de código:
  ```js
  // TODO: confirmar altitud media con datos reales de Firebase
  ['+1,400 m', 'altitud media'],
  ```

---

### 2.2 · `components/Caficultores.jsx` — Referencias a "12 fincas"

Localizar las tres referencias a "12 fincas" / "Doce familias" y añadir un comentario `// TODO` en cada una indicando que el número real vendrá de `getCaficultores()` de Firebase:

1. Badge `"№ 0{idx + 1} / 12"` → añadir `{/* TODO: total real de Firebase */}`
2. Heading `"Doce familias."` → añadir `{/* TODO: count real de Firebase */}`
3. CTA `"Ver las 12 fincas →"` → añadir `{/* TODO: count real de Firebase */}`

---

## NO tocar — Lista explícita

Los siguientes elementos deben quedar **exactamente como están** después de este sync:

| Elemento | Razón |
|----------|-------|
| Todos los `<ImageSlot />` | Imágenes reales vienen de Firebase Storage (pendiente) |
| `PRODUCERS` array en `Caficultores.jsx` | Será reemplazado por datos reales de Firebase |
| `PRODUCTS` array en `Cafe.jsx` | Será reemplazado por `getCafesEnVenta()` de Firebase |
| `lib/checkout.js` — adaptadores Yape/Niubiz/Stripe | Stubs pendientes de integración real con SDKs |
| `lib/checkout.js` — función `checkStock()` | Pendiente endpoint `POST /api/stock/check` |
| `components/Contacto.jsx` — función `submit` | Pendiente endpoint `POST /api/contact` |
| `components/Contacto.jsx` — email y dirección | `hola@tunaywasi.pe` y `Jr. Independencia 240, Barranco` ya son **correctos** |
| `lib/useCartTotals.js` — `SHIPPING_RULES` | Ya coincide con producción (Lima S/8 free@S/100, Prov S/15 free@S/150) |
| `components/Nav.jsx` | Copy y links ya son correctos |
| `components/Footer.jsx` | Correcto |
| `components/Origen.jsx` | Todo el copy es real y correcto |
| `index.html` — orden de `<script>` | El orden define el árbol de dependencias; no modificar |

---

## Sección 6 — Apéndice: Valores de producción (fuente de verdad)

```
══════════════════════════════════════════════════
COMISIONES_B2C — Distribución real del precio
══════════════════════════════════════════════════
caficultor:   42.1%   "Pago Directo al Caficultor"   #c96e4b
tostador:     15.3%   "Tueste + Cata Q-Grader"       #8faf8a
logistica:     6.1%   "Flete y Empaque"               #c4b297
igvPasarela:  15.3%   "IGV (18%)"                    #533b22
alpaso:       21.2%   "Tunay Wasi"                    #1f3028
TOTAL:       100.0%

Factor producerShare para cálculos: 0.421

══════════════════════════════════════════════════
PREVENTA — Fechas reales (ciclo mayo-agosto 2026)
══════════════════════════════════════════════════
Cierre preventa:    31 mayo 2026 · 23:59:59 Lima (UTC-5)
JS timestamp:       new Date('2026-06-01T04:59:59Z').getTime()
Display corto:      '31 may.'

Entrega Lima:       primera semana de agosto 2026
Display corto:      'ago. (1a semana)'

Entrega Provincia:  segunda semana de agosto 2026
Display corto:      'ago. (2a semana)'

Precio referencia:  S/ 49.88  (bolsa 250g)
  Producto:         Café Geisha · Finca La Quina · Cusco
  Caficultor:       Don Pedro Páez
  SCA score:        87 puntos
  Proceso:          Lavado prolongado
  Altitud:          1,900 msnm

══════════════════════════════════════════════════
CONTACTO
══════════════════════════════════════════════════
Email:              hola@tunaywasi.pe
Oficina:            Jr. Independencia 240, Barranco, Lima
WhatsApp:           +51 917 959 370
App URL:            https://tunay-wasi.web.app
Admin email:        tunaywasi@gmail.com

══════════════════════════════════════════════════
PEDIDOS
══════════════════════════════════════════════════
Formato orden ID:   'TW-' + Math.floor(Math.random() * 9000 + 1000)
  Ejemplo:          TW-4281

══════════════════════════════════════════════════
MOLIENDAS (del enum de producción)
══════════════════════════════════════════════════
grano   → "Grano entero"      🫘  Máxima frescura. Muele en casa.
espresso→ "Espresso"          ⚡  Molido fino para máquina a 9 bar.
v60     → "V60 / Chemex"      🌊  Molido medio-grueso para goteo.
prensa  → "Prensa francesa"   🫖  Molido grueso para infusión 4 min.
moka    → "Moka"              🔥  Molido medio-fino para cafetera italiana.
```

---

## Checklist de verificación post-cambio

Ejecutar `npx serve .` y abrir el navegador:

- [ ] **Preventa:** el countdown apunta correctamente a 31 mayo 2026
- [ ] **Preventa:** se lee "desde S/ 49.88 · 250 g"
- [ ] **Preventa:** entrega dice "primera semana de agosto"
- [ ] **Modelo:** el desglose muestra 5 barras: 42 / 15 / 6 / 15 / 21 (suman ~99%)
- [ ] **Modelo:** el callout central muestra "42%" (no "50%")
- [ ] **Cafe:** botón reservar dice "entrega agosto"
- [ ] **Carrito:** agregar un producto → CartDrawer muestra "Cierra 31 may."
- [ ] **Carrito:** el porcentaje al caficultor dice "42%" (no "50%")
- [ ] **Checkout:** banner ciclo muestra "31 may." y "agosto"
- [ ] **ImageSlot** no fue modificado en ninguna sección
- [ ] **Contacto:** `hola@tunaywasi.pe` y dirección Barranco intactos
- [ ] **Envíos:** Lima S/8 gratis desde S/100 (sin cambios)
- [ ] **Hero:** "12 fincas" y "+1,400 m" tienen comentario TODO en el código

---

*Documento generado el 2026-05-06 a partir del análisis cruzado de `tunaywasi/src/constants/comisiones.ts`, `moliendas.ts`, `brand.ts` y `pages/LandingB2C.tsx`.*
