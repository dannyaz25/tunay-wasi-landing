/**
 * firestore.ts — Canonical schema for every Firestore collection and config
 * document consumed by tunay-wasi-landing.
 *
 * Conventions:
 *   - All money values are integer centavos (S/1.00 = 100 cents).
 *   - Raw Firestore shapes use the exact field names stored in Firestore.
 *   - Collections with Spanish field names are mapped to English domain
 *     interfaces in catalog.ts via mapper functions in catalogService.ts.
 *   - Config docs under /configuration/* use English field names directly.
 *
 * Firestore project: alpaso-app
 * Last updated: May 2026 — Fase 1 active
 */

// ═══════════════════════════════════════════════════════════════════════════
// COLECCIÓN: caficultores
// Path:  /caficultores/{waitlistId}
// Owner: formulario de onboarding → aprobación admin → status: 'aprobado'
// Only docs with status === 'aprobado' are shown on the landing.
// ═══════════════════════════════════════════════════════════════════════════

export interface CaficultorDoc {
  // ── Identity ──────────────────────────────────────────────────────────
  id: string;                      // UUID — stored inside doc, mirrors Firestore doc id
  nombreProductor: string;         // "Darlyn Johnn Sánchez Hilario"
  email: string;                   // "dannyzeta25@gmail.com"
  telefono: string;                // "+51928772157"
  waitlistId?: string;             // legacy alias for id (kept for backwards compat)

  // ── Farm ──────────────────────────────────────────────────────────────
  nombreFinca: string;             // "Bello Horizonte"
  departamento: string;            // "Pasco"
  provincia: string;               // "Oxapampa"
  distrito: string;                // "Puerto Bermúdez"
  altitud: string;                 // "1800"  (msnm — stored as string)
  hectareas: string;               // "5"     (ha — stored as string)
  variedad: string;                // "Geisha"
  proceso: string;                 // "Honey"
  generacion: string;              // "Segunda"
  produccionAnual: string;         // "200"   (kg/año — stored as string)
  experienciaAnos: string;         // "8"     (stored as string)

  // ── Quality (set by admin after cata) ─────────────────────────────────
  puntajeSCA: string;              // "87.5"  (set post-cata)

  // ── Story & media ─────────────────────────────────────────────────────
  historia?: string;               // long producer bio / story (→ quote & bio)
  resumen?: string;               // short producer bio (→ card subline)
  impactoSocial?: string;          // investment goal / social mission
  fotoPerfilUrl?: string;          // Cloudinary profile photo URL
  fotosUrls?: string[];            // Cloudinary farm/process photo URLs (max 5)
  fotosCount?: number;

  // ── Admin metadata ────────────────────────────────────────────────────
  status: 'pendiente' | 'aprobado' | 'rechazado';
  source: string;                  // "alpaso-landings"
  datosCompletadosPorAdmin?: boolean;
  createdAt: string;               // ISO 8601
  aprobadoAt?: string;             // ISO 8601
  fechaCompletado?: string;        // ISO 8601
}

// ═══════════════════════════════════════════════════════════════════════════
// COLECCIÓN: productos
// Path:  /productos/{productoId}
// Note:  Field names are in English and match the Producto domain interface.
//        fetchProductos() casts directly — no mapper needed.
//        Prices (weights[][1]) are integer centavos.
// ═══════════════════════════════════════════════════════════════════════════

export type GrindKey = 'grano' | 'espresso' | 'v60' | 'prensa' | 'moka';
import type { WeightOption } from '@/shared/types/cart';
import type { ToneOption, TagTone } from '@/shared/types/catalog';
export type WeightLabel = WeightOption;
export type { ToneOption, TagTone };

export interface ProductoDoc {
  id: string;                      // UUID — stored inside doc, mirrors Firestore doc id
  caficultorId: string;            // FK → /caficultores/{id}  (required — every product has a producer)
  code: string;                    // "01" — display order
  name: string;                    // "Bello Horizonte - Geisha"
  sub: string;                     // "Honey · Oxapampa"
  region: string;                  // "Perú · Pasco · Oxapampa"
  alt: string;                     // "1800 m"
  farm: string;                    // "Finca Bello Horizonte"
  producer: string;                // "Darlyn Sánchez Hilario" (display snapshot)

  // ── Sensory ───────────────────────────────────────────────────────────
  notes: string[];                 // ["Caramelo", "Naranja sanguina", "Cacao"]
  body: string;                    // "Medio"
  acidity: string;                 // "Cítrica brillante"
  score: string;                   // "87.5"
  brews: string[];                 // ["V60", "Chemex", "AeroPress"]

  // ── Commerce ──────────────────────────────────────────────────────────
  // weights: tuples of [display label, price in centavos]
  // e.g. [["250g", 3900], ["1kg", 15000], ["3kg", 46000]]
  weights: [WeightLabel, number][];
  // producerPct: % of net (ex-IGV) price paid to producer
  // Applied as: netCents = unitCents / 1.18 → producerCents = netCents × (producerPct/100)
  producerPct: number;             // 42

  // ── Display ───────────────────────────────────────────────────────────
  tag: string;                     // "Versátil"
  tagTone: TagTone;
  tone: ToneOption;
  desc: string;                    // short card description
  photo?: string;                  // image URL
  label?: 'PREVENTA' | 'NEW';

  // ── Inventory ─────────────────────────────────────────────────────────
  stockKg: number;                 // kg verde disponible en bodega
  stockReservedKg?: number;        // kg verde reservado por pedidos pendiente_pago (default 0)
  // stockDisponibleKg = stockKg - (stockReservedKg ?? 0)  — calculado, no almacenado
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/ciclo_activo
// Path:  /configuration/ciclo_activo
// Controls preventa countdown, cart banner, and checkout delivery dates.
// Update this doc to open/close a preventa cycle without deploying code.
// ═══════════════════════════════════════════════════════════════════════════

export interface CicloActivoDoc {
  // Display strings — shown in CartDrawer, Checkout banner, Preventa section
  closeAt: string;              // "31 may."
  deliverLima: string;          // "ago. (1a semana)"
  deliverProv: string;          // "ago. (2a semana)"

  // Drives the countdown timer in Preventa.tsx
  // Current cycle: new Date('2026-06-01T04:59:59Z').getTime()
  // = 31 mayo 2026 23:59:59 Lima (UTC-5)
  cutoffTimestamp: number;      // Unix ms UTC
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/comisiones
// Path:  /configuration/comisiones
// Price breakdown displayed in the Modelo section (bar/donut chart).
//
// Percentages are calculated over precio FINAL (con IGV) for display.
// The caficultor % shown (42%) is for Especialidad Estándar — it ranges
// 40–52% across SCA tiers (see PricingDoc).
//
// Real accounting: the distribution operates on precio neto (sin IGV):
//   netCents = finalCents / 1.18
//   caficultorCents = netCents × (producerPct / 100)
//
// Source: pricing_rules § 9 + DATA_SYNC_PROMPT § 1.1
// ═══════════════════════════════════════════════════════════════════════════

export interface ComisionSlice {
  key: string;    // "caficultor" | "tostador" | "logistica" | "igv" | "plataforma"
  pct: number;    // integer display percentage (sums to 99 by rounding — use 22 for plataforma if UI requires 100)
  label: string;  // "Caficultor"
  detail: string; // tooltip / expand text
  color: string;  // hex, must match design tokens
}

export interface ComisionesDoc {
  // b2c slices — rendered in Modelo section
  // Current values (Especialidad Estándar reference):
  //   { key: 'caficultor',  pct: 42, label: 'Caficultor',            color: '#c96e4b',
  //     detail: 'Pago directo a la finca, antes de que el grano viaje.' }
  //   { key: 'tostador',    pct: 15, label: 'Tueste + Cata Q-Grader', color: '#8faf8a',
  //     detail: 'Tostado artesanal y certificación de calidad SCA.' }
  //   { key: 'logistica',   pct:  6, label: 'Flete y Empaque',        color: '#c4b297',
  //     detail: 'Transporte desde origen y embalaje kraft reciclado.' }
  //   { key: 'igv',         pct: 15, label: 'IGV (18%)',              color: '#533b22',
  //     detail: 'Impuesto al consumo incluido en el precio final.' }
  //   { key: 'plataforma',  pct: 21, label: 'Tunay Wasi',             color: '#1f3028',
  //     detail: 'Plataforma, tecnología y operación del marketplace.' }
  b2c: ComisionSlice[];

  // Factor applied to net (ex-IGV) unit price to compute producer share in cart
  // useCartTotals: producerShareCents = Math.round(netCents * producerShareFactor)
  // Source: pricing_rules § 9 (Especialidad Estándar: 42.1%)
  producerShareFactor: number;   // 0.421
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/pricing
// Path:  /configuration/pricing
// SCA-score-driven price matrix — drives product prices and caficultor pay.
// All money values are integer centavos (S/1.00 = 100).
// Source: pricing_rules § 5, § 8, § 12, § 13
// ═══════════════════════════════════════════════════════════════════════════

export type ScaTier =
  | 'selecto'               // 82.0 – 83.9 pts
  | 'especialidadEstandar'  // 84.0 – 85.9 pts
  | 'especialidadAlta'      // 86.0 – 87.9 pts
  | 'joyaDeFinca'           // 88.0 – 89.9 pts
  | 'exclusivo';            // 90.0+ pts  (Geisha, Bourbon Sidra, etc.)

export interface ScaTierEntry {
  tier: ScaTier;
  label: string;                  // "Especialidad Alta"
  scaMin: number;                 // 86.0
  scaMax: number | null;          // 87.9  (null = unbounded for exclusivo)

  // Caficultor payment — in S/ per kg of café verde
  caficultorPerKgCents: number;
  // S/34.65→3465 | S/38.44→3844 | S/55.48→5548 | S/66.84→6684 | S/85.78→8578

  // B2C consumer price — per 250g bag, con IGV, Fase 1 (lote 12kg)
  b2cPer250gCents: number;
  // S/25.66→2566 | S/27.46→2746 | S/35.53→3553 | S/39.33→3933 | S/49.88→4988

  // B2B wholesale price — per kg of café verde oro, con IGV
  b2bPerKgCents: number;
  // S/48.10→4810 | S/53.36→5336 | S/77.02→7702 | S/92.80→9280 | S/119.09→11909
}

export interface PricingDoc {
  fase: 1 | 2 | 3;                 // active pricing phase (affects twMarginPct)
  twMarginPct: number;             // 25 (Fase 1) — over base imponible (ex-IGV)
  // Fase 2: 20%  |  Fase 3: 14%

  // Conversion factors
  tuesteYield: number;             // 0.83 — kg tostado / kg verde
  greenKgPer250gBag: number;       // 0.301 — kg verde needed per 250g bag

  // SCA qualification threshold
  scaMinQualifying: number;        // 82.0 — below this, lote is returned to caficultor

  tiers: ScaTierEntry[];

  // Fixed processing costs per 250g bag — reference lote 12kg, Violet tostadora
  // Used to recalculate prices when lote size changes
  fixedCostsPerBagCents: {
    tueste: number;                // 168  (S/1.68 @ 12kg Probat)
    cata: number;                  // 251  (S/2.51 cata estándar S/100 / 39.9 bolsas)
    flete: number;                 // 88   (S/35 flete fijo / 39.9 bolsas)
    empaque: number;               // 81   (S/0.81 bolsa + etiqueta + tinta)
    // total: 588 (S/5.88/bolsa)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/shipping
// Path:  /configuration/shipping
// Shipping zones and rates charged to the end customer.
// These values drive useCartTotals — change here to update site-wide.
// Source: shippingRules.ts (production values as of May 2026)
// ═══════════════════════════════════════════════════════════════════════════

export type ShippingZoneKey = 'lima' | 'limaExt' | 'provincia' | 'recojo';

export interface ShippingZoneEntry {
  key: ShippingZoneKey;
  label: string;                   // "Delivery Lima"
  carrier?: string;                // "Olva" | "propio" | etc.
  flatCents: number;               // 800 → S/8.00  (0 for recojo)
  freeThresholdCents: number;      // 10000 → S/100.00  (0 = never free)
}

export interface ShippingDoc {
  zones: ShippingZoneEntry[];
  // Current zones:
  // lima:     S/8.00  — gratis desde S/100.00
  // limaExt:  S/12.00 — gratis desde S/120.00  (Olva Lima extendida)
  // provincia:S/15.00 — gratis desde S/150.00  (Olva nacional)
  // recojo:   S/0.00  — Recojo en Olva · Barranca
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/landing
// Path:  /configuration/landing
// Misc landing-wide parametrizable values: grind options, contact info,
// hero metrics, order ID format.
// ═══════════════════════════════════════════════════════════════════════════

export interface GrindDef {
  key: GrindKey;
  label: string;   // "V60 / Chemex"
  icon: string;    // "🌊"
  desc: string;    // "Molido medio-grueso para goteo."
}

// Current grind options (source: DATA_SYNC_PROMPT § Apéndice):
// { key: 'grano',    label: 'Grano entero',     icon: '🫘', desc: 'Máxima frescura. Muele en casa.' }
// { key: 'espresso', label: 'Espresso',          icon: '⚡', desc: 'Molido fino para máquina a 9 bar.' }
// { key: 'v60',      label: 'V60 / Chemex',      icon: '🌊', desc: 'Molido medio-grueso para goteo.' }
// { key: 'prensa',   label: 'Prensa francesa',   icon: '🫖', desc: 'Molido grueso para infusión 4 min.' }
// { key: 'moka',     label: 'Moka',              icon: '🔥', desc: 'Molido medio-fino para cafetera italiana.' }

export interface LandingConfigDoc {
  moliendas: GrindDef[];

  contact: {
    email: string;        // "hola@tunaywasi.pe"
    whatsapp: string;     // "+51917959370"
    address: string;      // "Jr. Independencia 240, Barranco, Lima"
    appUrl: string;       // "https://tunay-wasi.web.app"
    adminEmail: string;   // "tunaywasi@gmail.com"
  };

  // Hero section — marketing-facing numbers (not accounting figures)
  heroMetrics: {
    // "50% directo al productor" — marketing claim, not the 42% accounting figure
    // The 42% is shown in Modelo section; keep these two intentionally different.
    producerPctDisplay: number;    // 50
    farmCount: number;             // 12 — update as caficultores are onboarded
    altitudMedia: string;          // "+1,400 m"
  };

  // Format: orderIdPrefix + Math.floor(Math.random() * 9000 + 1000)
  // e.g. "TW-4281"
  orderIdPrefix: string;           // "TW-"
}

// ═══════════════════════════════════════════════════════════════════════════
// COLECCIÓN: pedidos
// Path:  /pedidos/{orderId}
// Created by the client on successful payment (or on voucher upload for Yape).
// Updated by admin / webhook when payment is confirmed and order ships.
//
// orderId format: "TW-" + 4-digit random  e.g. "TW-4281"
// ═══════════════════════════════════════════════════════════════════════════

export type PedidoStatus =
  | 'pendiente_pago'   // voucher uploaded, awaiting admin confirm
  | 'pago_confirmado'  // admin confirmed payment — stockKg deducted
  | 'en_preparacion'   // roasting + packing in progress
  | 'despachado'       // handed to carrier — trackingCode available
  | 'entregado'        // delivery confirmed
  | 'cancelado'        // cancelled — reason in cancelReason
  | 'reembolsado'      // post-confirmation refund issued
  // legacy aliases kept for backward compat with existing Firestore docs:
  | 'confirmado'
  | 'enviado';

export type PaymentAdapter = 'yape' | 'plin' | 'transferencia' | 'niubiz' | 'stripe';

// CartItem snapshot — matches CartItem in cart.ts
// Stored inside PedidoDoc so the order is self-contained even if source docs change.
// FKs are preserved alongside display snapshots for traceability.
export interface PedidoItem {
  productoId: string;    // FK → /productos/{id}
  caficultorId: string;  // FK → /caficultores/{id}
  sku: string;           // e.g. "bello-horizonte-geisha-250g-v60"
  name: string;          // "Bello Horizonte - Geisha"          (snapshot)
  weight: WeightLabel;   // "250g"
  grind: string;         // display label — "V60 / Chemex"
  unitCents: number;     // price per unit at purchase time     (immutable snapshot)
  qty: number;
  caficultor: string;    // "Darlyn Sánchez Hilario"            (snapshot)
  finca: string;         // "Bello Horizonte"                   (snapshot)
  producerPct: number;   // % of net price to producer          (snapshot)
}

// ShippingData snapshot — matches ShippingData in checkout.ts
export interface PedidoShipping {
  nombre: string;
  telefono: string;
  departamento: string;
  distrito: string;
  direccion: string;
  referencia: string;
  zone: ShippingZoneKey;
}

// CartTotals snapshot — matches CartTotals in cart.ts
export interface PedidoTotals {
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  taxIncludedCents: number;   // IGV embedded in subtotal
  totalCents: number;
  producerShareCents: number; // total amount going to producers
}

export interface PedidoDoc {
  id: string;                  // UUID — Firestore doc id, stored inside doc
  orderId: string;             // "TW-4281" — human-readable display reference
  status: PedidoStatus;
  adapter: PaymentAdapter;

  items: PedidoItem[];
  shipping: PedidoShipping;
  totals: PedidoTotals;

  // Cycle reference — links order to the active preventa cycle
  cicloCloseAt: string;        // snapshot of CicloActivoDoc.closeAt at purchase time
  deliverEstimate: string;     // snapshot of deliverLima or deliverProv based on zone

  // Payment evidence
  paymentRef?: string;         // Niubiz/Stripe transaction ID, or Yape operation number
  voucherUrl?: string;         // Firebase Storage URL of uploaded Yape/Plin screenshot

  // Admin
  notes?: string;              // internal admin notes
  confirmedAt?: string;        // ISO 8601 — when admin confirmed payment (→ pago_confirmado)
  shippedAt?: string;          // ISO 8601 — when handed to carrier (→ despachado)
  deliveredAt?: string;        // ISO 8601 — when delivery confirmed (→ entregado)
  trackingCode?: string;       // carrier tracking number
  trackingUrl?: string;        // carrier tracking URL
  cancelledAt?: string;        // ISO 8601 — when order was cancelled
  cancelReason?: string;       // reason for cancellation / refund

  createdAt: string;           // ISO 8601 — client timestamp at order creation
  updatedAt: string;           // ISO 8601 — last status change
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/yapePlin
// Path:  /configuration/yapePlin
// Controls the Yape/Plin QR payment step in Checkout.tsx.
// Update phone/QR here without deploying code.
//
// SECURITY: this doc is public (client reads it). Only store non-secret data.
// Never store API keys or webhook secrets here — use Cloud Functions env vars.
// ═══════════════════════════════════════════════════════════════════════════

export interface YapePlinConfigDoc {
  enabled: boolean;

  yape: {
    phone: string;          // "+51 917 959 370" — displayed on QR step
    accountName: string;    // "Tunay Wasi S.A.C."
    // If qrImageUrl is set, show it instead of generating QR from phone.
    // Leave empty to let QRCodeSVG generate from phone number.
    qrImageUrl?: string;    // Firebase Storage URL of official Yape QR
  };

  plin: {
    phone: string;
    accountName: string;
    qrImageUrl?: string;
  };

  // Instructions shown to user after selecting Yape/Plin
  instructions: string[];
  // e.g. ["Abre Yape en tu celular", "Escanea el QR o busca el número", "Sube el voucher"]

  // Voucher upload destination in Firebase Storage
  // Actual upload path: gs://alpaso-app.appspot.com/{voucherStoragePath}/{orderId}.jpg
  voucherStoragePath: string;   // "pedidos/vouchers"
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/cafiLanding
// Path:  /configuration/cafiLanding
// Owner: landing/caficultores — B2B producer acquisition landing.
// Controls waitlist cap and the calculator's acopiador reference ranges.
// SCA tier prices (tunay side) come from configuration/pricing.tiers.
// ═══════════════════════════════════════════════════════════════════════════

export interface CafiAcopiadorRange {
  acopMin: number;  // S/ per kg verde, lower bound (MIDAGRI reference)
  acopMax: number;  // S/ per kg verde, upper bound (MIDAGRI reference)
}


// ═══════════════════════════════════════════════════════════════════════════
// COLECCIÓN: microlotesLanding
// Path:  /microlotesLanding/{loteId}   e.g. /microlotesLanding/TW-068
// One Firestore doc per available B2B lot. Decoupled from supplyLanding so
// lots can be added/updated/removed without touching the rest of the config.
// Static fallback: scripts/data/microlotesLanding.json  (lotes[])
// ═══════════════════════════════════════════════════════════════════════════

export type LoteTag   = 'washed' | 'honey' | 'natural';
export type LoteTone  = 'green' | 'terra' | 'gold' | 'cream';

export interface MicroloteLandingDoc {
  id: string;         // "TW-068" — lot reference number (display)
  origen: string;     // "Cusco · Quillabamba"
  finca: string;      // "Finca Quillabamba"
  variedad: string;   // "Caturra"
  proceso: string;    // "Lavado"
  altitud: string;    // "1,720 m"
  sca: number;        // 87.5
  sacos: number;      // 12
  kg: number;         // 552
  precio: number;     // 62.40 — S/ FOB Lima / kg (decimal, not cents — B2B wholesale)
  tag: LoteTag;       // used for filter tabs
  notas: string;      // "Naranja sanguina · chocolate de leche · panela"
  tone: LoteTone;     // drives accent color in card
  estado: string;     // "disponible" | "edición limitada" | "agotado"
  featured?: boolean; // true on the single lot spotlighted in SupplyHero spec card
}


export interface CafiLandingConfigDoc {
  waitlist: {
    maxSlots: number;   // 15 — first N producers get guaranteed price
  };
  calculator: {
    sliderMinKg: number;      // 50
    sliderMaxKg: number;      // 3000
    sliderStepKg: number;     // 50
    defaultKg: number;        // 500
    defaultTierIndex: number; // 2 (86–87 pts)
    footnote: string;         // MIDAGRI data attribution text
    // One entry per pricing tier, same order as PricingDoc.tiers
    acopiadorRanges: CafiAcopiadorRange[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/supplyLanding
// Path:  /configuration/supplyLanding
// Owner: landing/mayoristas — B2B wholesale landing.
// Controls cosechaLabel, logistics strip, contactB2B and heroCard.
// Static fallback: scripts/data/config.json → supplyLanding
//
// NOTA: los lotes ya NO están aquí.
// Lotes → colección propia /microlotesLanding/{loteId}
//          Static fallback: scripts/data/microlotesLanding.json
// ═══════════════════════════════════════════════════════════════════════════

export interface SupplyLogisticsItem {
  key: string;    // "MOQ" | "Pago" | "Plazos" | "Provincias"
  value: string;  // "1 saco (46 kg)"
}

export interface SupplyLandingConfigDoc {
  // Label shown in the lotes section heading  e.g. "abril 2026"
  cosechaLabel: string;

  // Logistics strip shown in SupplyProceso — 4 entries expected
  logistics: SupplyLogisticsItem[];

  // B2B-specific contact info shown in SupplyForm left column
  contactB2B: {
    email: string;    // "supply@tunaywasi.pe"
    whatsapp: string; // "+51 917 959 370"
    bodega: string;   // "Av. San Borja Norte 1065 · L–V · 9 — 17h"
  };

  // Featured lote shown in SupplyHero spec card
  heroCard: {
    procesoDisplay: string;  // italic label next to variedad e.g. "washed"
    notasCata: string;       // extended tasting note for cup-notes ticket
    qGrader: string;         // attribution e.g. "Q-Grader · M. Quispe · 04 · 2026"
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COLECCIÓN: solicitudes_b2b
// Path:  /solicitudes_b2b/{solicitudId}
// Created by SupplyForm on submit. Same collection read by tunaywasi admin
// (AdminMayoristas page) — source field distinguishes origin.
// ═══════════════════════════════════════════════════════════════════════════

export type SolicitudB2BStatus = 'nuevo' | 'sin_stock' | 'en_negociacion' | 'cerrado' | 'perdido';

export interface SolicitudSupplyDoc {
  empresa: string;          // "Tostadora El Origen"
  contacto: string;         // "María Quispe"  (maps to FormValues.nombre)
  email: string;            // normalised lowercase
  telefono: string;         // "+51 987 654 321"
  volumenKg: number;        // 46 | 92 | 138 | 276 | 500
  frecuencia: string;       // "mensual" | "bimestral" | "trimestral" | "unico"
  puntajeMin: number;       // 82 | 84 | 86 | 88 | 90  (SCA floor)
  variedad?: string;        // optional — "Caturra, Geisha"
  mensaje?: string;         // optional free-text

  // Set by saveSolicitudSupply — not from form
  status: SolicitudB2BStatus;   // always 'nuevo' on create
  source: 'mayoristas-landing'; // distinguishes from tunaywasi admin entries ('web')
  createdAt: unknown;           // Firestore ServerTimestamp
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTO: configuration/paymentGateway
// Path:  /configuration/paymentGateway
// Non-secret gateway metadata (public). Secret keys → Cloud Functions env vars.
// ═══════════════════════════════════════════════════════════════════════════

export interface PaymentGatewayConfigDoc {
  niubiz: {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    merchantId: string;          // public merchant ID (safe to expose)
    // Secret API key → NIUBIZ_API_KEY env var in Cloud Functions
  };

  stripe: {
    enabled: boolean;
    publishableKey: string;      // pk_live_... or pk_test_... (safe to expose)
    // Secret key → STRIPE_SECRET_KEY env var in Cloud Functions
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK REFERENCE — Firestore paths, IDs & FK relationships
// ═══════════════════════════════════════════════════════════════════════════
//
// Collections (each doc stores its own id: string = Firestore doc id):
//
//   /caficultores/{id}    → CaficultorDoc        id = UUID (Firestore auto-id)
//   /productos/{id}       → ProductoDoc           id = UUID (Firestore auto-id)
//   /pedidos/{id}         → PedidoDoc             id = UUID (Firestore auto-id)
//                                                  orderId = "TW-4281" (display)
//
// Foreign keys (FK):
//
//   ProductoDoc.caficultorId      → CaficultorDoc.id       (required)
//   PedidoItem.productoId         → ProductoDoc.id          (required)
//   PedidoItem.caficultorId       → CaficultorDoc.id        (required)
//
//   Relationship diagram:
//   CaficultorDoc ←── ProductoDoc ←── PedidoItem ──┐
//        └─────────────────────────────────────────── PedidoDoc
//
// Configurations (single docs — no id field, accessed by fixed path):
//   /configurations/ciclo_activo          → CicloActivoDoc
//   /configurations/comisiones            → ComisionesDoc
//   /configurations/pricing               → PricingDoc
//   /configurations/shipping              → ShippingDoc
//   /configurations/landing               → LandingConfigDoc
//   /configurations/yapePlin              → YapePlinConfigDoc
//   /configurations/supplyLanding         → SupplyLandingConfigDoc
//   /microlotesLanding/{loteId}           → MicroloteLandingDoc   (e.g. TW-068)
//   /configurations/paymentGateway        → PaymentGatewayConfigDoc
//
// Collections — B2B:
//   /solicitudes_b2b/{id}  → SolicitudSupplyDoc   source: 'mayoristas-landing'
//                                                   (same collection as tunaywasi admin reads)
//
// Firebase Storage paths:
//   tunaywasi/caficultores/{id}/  → producer profile + farm photos
//   pedidos/vouchers/{id}.jpg     → Yape/Plin payment vouchers (keyed by pedido id)
//
// Fetching a collection doc:
//   const snap = await getDoc(doc(db, 'caficultores', id));
//   return snap.exists() ? (snap.data() as CaficultorDoc) : null;
//
// Writing a pedido:
//   const id = crypto.randomUUID();
//   await setDoc(doc(db, 'pedidos', id), { id, orderId, ...rest });
