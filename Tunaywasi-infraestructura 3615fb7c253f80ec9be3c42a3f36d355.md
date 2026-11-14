# Tunaywasi — Infraestructura del Sistema

Owner: tunaywasi
Created time: May 15, 2026 5:03 PM
Last updated: May 16, 2026

Especificación completa de los **Casos de Uso** por fase y el **Modelado de Datos unificado** en Firestore para Tunay Wasi como plataforma SaaS intermediaria y ligera en activos (*asset-light*).

---

## Principios del modelo

1. **Tunay Wasi es intermediario** — no compra grano, no tiene bodega propia. Conecta caficultor con consumidor final.
2. **El caficultor cobra cuando su lote se vende** — el pago proviene de la recaudación de la preventa, no de Tunay Wasi directamente.
3. **Todo caficultor empieza con 12 kg** — el tamaño del lote sube según historial de ventas y calificación SCA acumulada.
4. **El microlote se crea automáticamente** — cuando el caficultor llena el formulario del landing, el sistema genera el lote con `estadoLote: pendiente_aprobacion`. El admin lo aprueba antes de que pase a cata.

---

## Sistema de niveles de caficultor

El tamaño del lote no es fijo — escala con el desempeño:

| Nivel | Requisito | Kg por lote |
|---|---|---|
| **Inicio** | Primer lote | 12 kg |
| **Bronce** | 1 lote vendido + SCA ≥ 84 | 25 kg |
| **Plata** | 3 lotes vendidos + SCA ≥ 86 | 50 kg |
| **Oro** | 5 lotes vendidos + SCA ≥ 88 | 100 kg |
| **Élite** | 8 lotes vendidos + SCA ≥ 90 | Negociable |

El campo `nivel` en `caficultores` controla el tamaño del próximo lote. El admin puede ajustarlo manualmente.

---

## Casos de Uso por Fase

### Fase 0: Registro (Landing → Admin)

- **CU00 - Registro desde Landing (Caficultor):** El productor llena el formulario del landing con sus datos de finca y microlote. El sistema crea automáticamente:
  1. Doc en `caficultores` con `status: pendiente_aprobacion`
  2. Doc en `lotes_verdes` con `estadoLote: pendiente_aprobacion` y `kgComprometidos` según el nivel del caficultor (12 kg para primeros lotes)
  3. Envía alerta al admin: *"Nuevo caficultor registrado — revisar"*

- **CU00b - Aprobación Admin:** El admin revisa el perfil en `tunaywasi-landing-admin`. Si aprueba:
  - `caficultores.status` → `aprobado`
  - `lotes_verdes.estadoLote` → `esperando_muestra`
  - Sistema notifica al caficultor: *"Tu lote fue aprobado, envía la muestra física a Lima"*

---

### Fase 1: Origen y Laboratorio (Cata y Filtro Técnico)

- **CU01 - Envío de Muestra Física (Caficultor):** El productor envía ~300g de muestra verde a Lima. El lote queda en `esperando_muestra` hasta que el Q-Grader la recibe.

- **CU02 - Registro Técnico de Laboratorio (Q-Grader):** El catador recibe la muestra, realiza las pruebas e ingresa humedad, densidad, defectos y puntaje SCA con sus notas de cata. Estado cambia a `esperando_aprobacion_productor`.

- **CU03 - Cierre de Trato (Caficultor):** El productor revisa el puntaje en su portal. Dos opciones:
  - **"Confirmar Venta"** → `estadoLote: disponible_verde` — lote visible en preventa. El costo de cata (S/ 100) se descuenta de la liquidación final.
  - **"Retirar Lote"** → `estadoLote: pendiente_pago_cata` — el sistema cobra S/ 100 via pasarela antes de devolver el grano.

---

### Fase 2: Preventa y Financiamiento

- **CU04 - Publicación Automática de Preventa (Sistema):** Al pasar a `disponible_verde`, el lote se abre en el e-commerce como "Preventa" con precio calculado automáticamente desde el tier SCA en `configuration/pricing`.

- **CU05 - Reserva de Bolsa (Cliente):** El cliente compra su café (grano o molienda). La web descuenta del inventario virtual y genera un doc en `pedidos` con `estado: por_empacar`.

---

### Fase 3: Transformación (Tostadero)

- **CU06 - Emisión de Manifiesto de Tueste (Sistema):** Cuando el lote se agota (o cierra la fecha límite de preventa), el sistema calcula el café verde necesario + excedente para muestra del tostador. Envía alerta al tostadero. Estado: `en_tueste`.

- **CU07 - Registro de Yield Post-Tueste (Tostador):** El tostador ingresa los kilos netos obtenidos. El sistema calcula el `roastYield` y el lote pasa a `en_reposo` (bloqueado 24h mínimo).

---

### Fase 4: Empaque (PWA Operario)

- **CU08 - Consolidación de Cubetas (Sistema):** Tras el reposo, `estadoLote: listo_empacar`. El sistema lee todos los pedidos del lote y agrupa las bolsas en cubetas por molienda + peso.

- **CU09 - Impresión y Descuento Atómico (Operario):** El operario procesa cubeta por cubeta en la PWA. Por cada impresión: envía ZPL por Bluetooth, genera ID de etiqueta, descuenta stock, vincula QR.

- **CU10 - Finalización de Sesión (Operario):** Al completar la última cubeta: lote → `completado`, pedidos → `listo_despacho`, URLs de historia QR activadas globalmente.

- **CU10b - Liquidación al Caficultor (Sistema/Admin):** Al marcar el lote como `completado`, el sistema calcula automáticamente:
  ```
  totalPagadoProductor = (kgComprometidos × precioVerdePorKg) - costoCata
  ```
  El admin revisa y ejecuta la transferencia. El historial queda en `caficultores.historialLotes`.

---

### Fase 5: Distribución (Cliente Final)

- **CU11 - Despacho Cross-Docking (Courier):** El repartidor recoge directamente en el tostadero. El sistema vincula el tracking al pedido → `en_ruta`.

- **CU12 - Historia Inversa (Cliente):** El cliente escanea el QR de su bolsa. La página `/historia/:loteNumero` muestra el viaje completo del lote desde finca hasta su taza.

---

## Modelado de Datos (Firestore)

### 1. Colección: `caficultores`

```typescript
interface CaficultorDoc {
  id: string;                    // UUID — Firestore auto-id

  // Identidad
  nombreProductor: string;
  email: string;
  telefono: string;

  // Finca
  nombreFinca: string;
  departamento: string;
  provincia: string;
  distrito: string;
  altitud: string;               // msnm
  hectareas?: string;
  variedad: string;
  proceso: string;
  generacion?: string;
  produccionAnual?: string;      // kg/año
  experienciaAnos?: string;

  // Historia y media
  historia?: string;
  resumen?: string;
  impactoSocial?: string;
  fotoPerfilUrl?: string;
  fotosUrls?: string[];

  // Nivel y desempeño — escala con historial
  nivel: 'inicio' | 'bronce' | 'plata' | 'oro' | 'elite';
  kgPorLote: number;             // 12 | 25 | 50 | 100 | negociable
  lotesCompletados: number;      // contador acumulado
  scaPromedio?: number;          // promedio SCA de lotes completados
  historialLotes?: string[];     // array de IDs de lotes_verdes completados

  // Admin
  status: 'pendiente_aprobacion' | 'aprobado' | 'rechazado';
  puntajeSCA?: string;           // asignado por Q-Grader post-cata
  source: string;                // 'caficultor-landing'
  createdAt: string;             // ISO 8601
  aprobadoAt?: string;           // ISO 8601
}
```

---

### 2. Colección: `lotes_verdes`

Creado automáticamente al enviar el formulario del landing. El admin lo aprueba antes de que avance.

```typescript
interface LoteVerde {
  id: string;                    // L-2026-XXX — generado por el sistema

  caficultorId: string;          // FK → caficultores
  organizationId: string;        // 'tunaywasi' — preparado para multi-marca

  // Datos del grano (vienen del formulario)
  finca: string;
  region: string;
  variedad: string;
  proceso: string;
  altitudMsnm: number;
  estadoGrano: 'cosecha' | 'beneficio' | 'secado' | 'trilla' | 'en_transito' | 'recibido';

  // Tamaño del lote — nace en 12 kg, sube con el nivel del caficultor
  kgComprometidos: number;       // 12 para nivel inicio

  // Estado del lote en el sistema
  estadoLote:
    | 'pendiente_aprobacion'     // recién registrado — admin debe aprobar
    | 'esperando_muestra'        // aprobado — caficultor debe enviar muestra física
    | 'en_analisis'              // muestra recibida — Q-Grader catando
    | 'esperando_aprobacion_productor' // cata lista — caficultor decide
    | 'pendiente_pago_cata'      // caficultor retiró — debe pagar S/100
    | 'disponible_verde'         // confirmado — abierto en preventa
    | 'en_tueste'                // preventa agotada — en tostadero
    | 'completado'               // lote empacado y despachado
    | 'devuelto';                // devuelto al caficultor

  // Laboratorio (llenado por Q-Grader)
  analisisQC?: {
    humedadPorcentaje: number;
    densidadGral: number;
    defectosPrimarios: number;
    puntajeSCA: number;
    notas: string[];             // ['Mora', 'Cítrico', 'Azúcar rubia']
    qGraderId: string;
    fechaCata: Timestamp;
  };

  // Finanzas
  finanzas: {
    costoCata: number;           // S/100 fijo
    cataPagada: boolean;
    precioVerdePorKg?: number;   // calculado desde tier SCA al confirmar
    totalPagadoProductor?: number; // (kgComprometidos × precioVerdePorKg) - costoCata
    liquidadoAt?: string;        // ISO 8601 — cuando se ejecutó el pago
  };

  fechaCreacion: Timestamp;
}
```

---

### 3. Colección: `lotes_tostados`

```typescript
interface LoteTostado {
  id: string;
  loteVerdeId: string;           // FK → lotes_verdes
  organizationId: string;
  tostaderoId: string;

  estado: 'en_tueste' | 'en_reposo' | 'listo_empacar' | 'completado';

  planificacion: {
    kilosVerdeEnviados: number;  // kgComprometidos + 0.5kg muestra tostador
    perfilTueste: string;        // 'Omniroast' | 'Filtro' | etc.
  };

  resultado?: {
    kilosTostadosObtenidos: number;
    roastYield: number;          // kilosTostadosObtenidos / kilosVerdeEnviados
    fechaTueste: Timestamp;
    finReposo: Timestamp;        // fechaTueste + 24h mínimo
  };
}
```

---

### 4. Colección: `sesiones_empaque`

```typescript
interface SesionEmpaque {
  id: string;
  loteTostadoId: string;         // FK → lotes_tostados
  operario: string;
  estado: 'activa' | 'pausada' | 'completada';

  cubetas: {
    molienda: 'grano' | 'media' | 'fina' | 'espresso';
    peso: '250g' | '1kg' | '3kg';
    nivelMolino: number | null;  // null para grano entero
    kilosAMoler: number;
    totalBolsas: number;
    impresas: number;
  }[];

  inicio: Timestamp;
  fin: Timestamp | null;
}
```

---

### 5. Colección: `etiquetas`

```typescript
interface Etiqueta {
  id: string;                    // ID en el QR → tunaywasi.com/historia/:loteNumero
  loteTostadoId: string;         // FK → lotes_tostados
  pedidoId: string | null;       // FK → pedidos (null = stock libre)
  organizationId: string;

  producto: {
    peso: '250g' | '1kg' | '3kg';
    molienda: string;
    zplPayload: string;
  };

  impresaEn: Timestamp;
}
```

---

### 6. Colección: `pedidos`

```typescript
interface Pedido {
  id: string;
  organizationId: string;

  cliente: {
    nombre: string;
    celular: string;
    direccion: string;
  };

  estado: 'pagado' | 'por_empacar' | 'listo_despacho' | 'en_ruta' | 'entregado';

  items: {
    productoId: string;          // FK → productos
    loteVerdeId: string;         // FK → lotes_verdes (trazabilidad desde preventa)
    cantidad: number;
    peso: string;
    molienda: string;
    etiquetasAsignadas: string[];
  }[];

  tracking?: {
    courier: string;
    numeroSeguimiento: string;
    urlTracking: string;
  };
}
```

---

## Flujo completo resumido

```
[Landing caficultor]
    ↓ llena formulario (finca + microlote)
    ↓ sistema crea caficultores{status:pendiente} + lotes_verdes{estadoLote:pendiente_aprobacion}

[Admin aprueba]
    ↓ caficultores{status:aprobado} + lotes_verdes{estadoLote:esperando_muestra}
    ↓ caficultor notificado → envía muestra física a Lima

[Q-Grader cata]
    ↓ lotes_verdes{estadoLote:esperando_aprobacion_productor, analisisQC:{...}}

[Caficultor confirma]
    ↓ lotes_verdes{estadoLote:disponible_verde}
    ↓ sistema abre preventa automáticamente en la web

[Clientes compran — preventa agotada]
    ↓ pedidos creados
    ↓ lotes_verdes{estadoLote:en_tueste}
    ↓ alerta al tostadero

[Tostadero procesa]
    ↓ lotes_tostados creado → en_reposo → listo_empacar

[Operario empaca — PWA]
    ↓ sesiones_empaque + etiquetas
    ↓ lotes_tostados{estado:completado}

[Liquidación]
    ↓ sistema calcula totalPagadoProductor
    ↓ admin ejecuta transferencia
    ↓ caficultores.lotesCompletados++ → posible subida de nivel

[Cliente escanea QR]
    ↓ /historia/:loteNumero → viaje completo del lote
```

---

## Sistema de niveles — lógica de ascenso

El admin puede subir el nivel manualmente o el sistema lo sugiere automáticamente:

```
lotesCompletados >= 1 AND scaPromedio >= 84  →  sugerir nivel: bronce  (25 kg)
lotesCompletados >= 3 AND scaPromedio >= 86  →  sugerir nivel: plata   (50 kg)
lotesCompletados >= 5 AND scaPromedio >= 88  →  sugerir nivel: oro     (100 kg)
lotesCompletados >= 8 AND scaPromedio >= 90  →  sugerir nivel: elite   (negociable)
```

El admin confirma el ascenso. El próximo lote que registre el caficultor usará el nuevo `kgPorLote`.

---

## Repos del ecosistema

| Repo | Función |
|---|---|
| `tunay-wasi-landing` | Landings públicas: B2C, caficultores, mayoristas, historia lote QR |
| `tunay-wasi-packaging` | PWA tablet operario — empaque e impresión etiquetas |
| `tunaywasi-landing-admin` | Dashboard admin (tú) + portales futuros: caficultor, Q-Grader, mayorista |

---

## Pendiente de implementar

- [ ] Formulario landing caficultor → crear `caficultores` + `lotes_verdes` automáticamente
- [ ] Panel admin: aprobar caficultor + lote (CU00b)
- [ ] Portal Q-Grader: formulario `analisisQC` (CU02)
- [ ] Portal caficultor: confirmar/retirar lote (CU03)
- [ ] Automatización apertura preventa desde `disponible_verde` (CU04)
- [ ] Panel admin: `lotes_verdes` con pipeline visual de estados
- [ ] Lógica de liquidación y niveles de caficultor
- [ ] Pasarela pago cata para lotes retirados (CU03 — retirar)
