import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/shared/firebase';
import type { Caficultor, CaficultorDoc, CicloActivo, Producto } from '@/shared/types/catalog';

function mapCaficultorDoc(id: string, raw: CaficultorDoc): Caficultor {
  return {
    id,
    name: raw.nombreProductor,
    farm: raw.nombreFinca,
    region: `${raw.provincia} · ${raw.departamento}`,
    alt: `${raw.altitud} m`,
    variety: raw.variedad,
    process: raw.proceso,
    score: raw.puntajeSCA,
    color: 'green',
    quote: raw.historia ?? '',
    summary: raw.resumen ?? '',
    bio: raw.historia,
    socialImpact: raw.impactoSocial,
    yearsExp: raw.experienciaAnos ? Number(raw.experienciaAnos) : undefined,
    farmHa: raw.hectareas ? Number(raw.hectareas) : undefined,
    photo: raw.fotoPerfilUrl,
    photos: raw.fotosUrls,
    location: `${raw.distrito}, ${raw.provincia}, ${raw.departamento}`,
    status: raw.status,
  };
}

const STATIC_PRODUCTS: Producto[] = [
  {
    id: 'bello-horizonte-geisha', code: '01', name: 'Bello Horizonte - Geisha', sub: 'Lavado · Oxapampa',
    region: 'Perú · Pasco · Oxapampa', alt: '800 m',
    farm: 'Finca Darlyn Sánchez', producer: 'Darlyn Sánchez Hilario',
    notes: ['Caramelo', 'Naranja sanguina', 'Cacao'],
    body: 'Medio', acidity: 'Cítrica brillante',
    score: '87.5+', tag: 'Versátil', tagTone: 'sage',
    brews: ['V60', 'Chemex', 'French Press'],
    weights: [['250g', 3900], ['1kg', 15000], ['3kg', 46000]],
    producerPct: 42,
    tone: 'green', stockKg: 9.2,
    desc: 'Café de pequeño productor, secado al sol y proceso lavado clásico — el equilibrio andino.',
    photo: '/imgs/geishaBello-HorizonteOxapampa2.png',
    label: 'PREVENTA' as const,
  },
  /*{
    id: 'yanapay-honey', code: '02', name: 'Yanapay Honey', sub: 'Honey naranja · San Martín',
    region: 'Perú · San Martín · Lamas', alt: '1,420 m',
    farm: 'Finca Yanapay', producer: 'Mateo Huamán',
    notes: ['Miel', 'Durazno', 'Almendra'],
    body: 'Sedoso', acidity: 'Suave, frutal',
    score: '88.0', tag: 'Filtrado / floral', tagTone: 'terra',
    brews: ['V60', 'Chemex', 'Clever'],
    weights: [['250g', 9200], ['1kg', 32000], ['3kg', 90000]],
    tone: 'tan', stockKg: 4.1,
    desc: 'Honey naranja con fermentación natural — dulzor de miel de palma y final largo.',
  },
  {
    id: 'wayra-punku', code: '03', name: 'Wayra Punku', sub: 'Natural · Puno',
    region: 'Perú · Puno · Sandia', alt: '1,820 m',
    farm: 'Finca Wayra Punku', producer: 'Familia Mamani',
    notes: ['Frutos rojos', 'Vino tinto', 'Chocolate'],
    body: 'Pleno', acidity: 'Madura, vinosa',
    score: '87.2', tag: 'Espresso / clásico', tagTone: 'deep',
    brews: ['Espresso', 'Moka', 'French Press'],
    weights: [['250g', 8400], ['1kg', 29000], ['3kg', 82000]],
    tone: 'terra', stockKg: 6.8,
    desc: 'Naturales secados en cama africana, con perfil intenso y notas de fruta madura.',
  },*/
];

const STATIC_CAFICULTORES: Caficultor[] = [
  {
    id: 'Darlyn-Sánchez', name: 'Darlyn Sánchez Hilario', farm: 'Finca Darlyn Sánchez',
    region: 'Oxapampa · Pasco', alt: '800 m', variety: 'Geisha',
    process: 'Honey', score: '87.5+', color: 'green',
    quote: 'Darlyn ha transformado la finca en un laboratorio de alta gama, enfocándose en micro-lotes de puntajes sobresalientes (87.5+ puntos) en lugar de volumen comercial. Maestría en el Proceso Honey: La familia se ha especializado en el proceso Honey, una técnica que requiere un monitoreo minucioso durante el secado para preservar el mucílago (la "miel") del grano, logrando esas notas características a jalea y caramelo que lo llevaron a ganar la subasta.',
    summary: 'El café se siembra con la mano, pero se cuida con el oído — escuchando la lluvia.',
    photo: '/imgs/darlynsanchez.jpg',
    yearsExp: 8,
    farmHa: 5,
    socialImpact: 'Invertir en camas africanas (secadores elevados) con control de temperatura para perfeccionar sus procesos Honey y evitar que la humedad de la selva afecte los lotes.'
  },
  /* {
     id: 'mateo-huaman', name: 'Mateo Huamán', farm: 'Finca Yanapay',
     region: 'San Martín · Lamas', alt: '1,420 m', variety: 'Caturra · Geisha',
     process: 'Honey Naranja', score: '88.0', color: 'tan',
     quote: 'Cuando alguien toma mi café en Lima, una parte de la chacra viaja con él.',
   },
   {
     id: 'familia-mamani', name: 'Familia Mamani', farm: 'Finca Wayra Punku',
     region: 'Puno · Sandia', alt: '1,820 m', variety: 'Catuaí Rojo',
     process: 'Natural', score: '87.2', color: 'terra',
     quote: 'Tunay Wasi nos pagó antes de la cosecha. Eso, aquí arriba, no se había visto.',
   },*/
];

const STATIC_CYCLE: CicloActivo = {
  closeAt: '31 may.',
  deliverLima: 'ago. (1a semana)',
  deliverProv: 'ago. (2a semana)',
  cutoffTimestamp: new Date('2026-05-31T23:59:59-05:00').getTime(),
};

type WeightEntry = { label: string; cents: number };

function mapProductoDoc(id: string, raw: Record<string, unknown>): Producto {
  const weights = (raw.weights as WeightEntry[]).map(
    (w) => [w.label, w.cents] as [string, number],
  );
  return { ...(raw as Omit<Producto, 'id' | 'weights'>), id, weights };
}

export async function fetchProductos(): Promise<Producto[]> {
  try {
    const snap = await getDocs(collection(db, 'productos'));
    if (snap.empty) return STATIC_PRODUCTS;
    const mapped = snap.docs.map((d) => mapProductoDoc(d.id, d.data()));
    const valid = mapped.filter((p) => p.name && p.weights);
    return valid.length > 0 ? valid : STATIC_PRODUCTS;
  } catch {
    return STATIC_PRODUCTS;
  }
}

export async function fetchCaficultores(): Promise<Caficultor[]> {
  try {
    const snap = await getDocs(collection(db, 'caficultores'));
    if (snap.empty) return STATIC_CAFICULTORES;
    const mapped = snap.docs
      .map((d) => mapCaficultorDoc(d.id, d.data() as CaficultorDoc))
      .filter((c) => c.name && c.farm);
    return mapped.length > 0 ? mapped : STATIC_CAFICULTORES;
  } catch {
    return STATIC_CAFICULTORES;
  }
}

export async function fetchActiveCycle(): Promise<CicloActivo> {
  try {
    const snap = await getDoc(doc(db, 'configurations', 'ciclo_activo'));
    if (!snap.exists()) return STATIC_CYCLE;
    return snap.data() as CicloActivo;
  } catch {
    return STATIC_CYCLE;
  }
}

// ── Comisiones ───────────────────────────────────────────────────────────────

export interface B2CSlice { key: string; pct: number; label: string; detail: string; color: string }
export interface ComisionesData { b2c: B2CSlice[]; producerShareFactor: number }

export const STATIC_COMISIONES: ComisionesData = {
  b2c: [
    { key: 'caficultor',  pct: 42, label: 'Caficultor',             color: '#c96e4b', detail: 'Pago directo a la finca, antes de que el grano viaje.' },
    { key: 'tostador',   pct: 15, label: 'Tueste + Cata Q-Grader', color: '#8faf8a', detail: 'Tostado artesanal y certificación de calidad SCA.' },
    { key: 'logistica',  pct:  6, label: 'Flete y Empaque',         color: '#c4b297', detail: 'Transporte desde origen y embalaje kraft reciclado.' },
    { key: 'igv',        pct: 15, label: 'IGV (18%)',               color: '#533b22', detail: 'Impuesto al consumo incluido en el precio final.' },
    { key: 'plataforma', pct: 22, label: 'Tunay Wasi',              color: '#1f3028', detail: 'Plataforma, tecnología y operación del marketplace.' },
  ],
  producerShareFactor: 0.421,
};

export async function fetchComisiones(): Promise<ComisionesData> {
  try {
    const snap = await getDoc(doc(db, 'configurations', 'comisiones'));
    if (!snap.exists()) return STATIC_COMISIONES;
    return snap.data() as ComisionesData;
  } catch {
    return STATIC_COMISIONES;
  }
}

// ── Shipping zones ───────────────────────────────────────────────────────────

export interface ShippingZoneRule {
  key: string;
  label: string;
  flatCents: number;
  freeThresholdCents: number;
  carrier?: string;
  transitDays?: string;
  recojoFlatCents?: number;
  domicilioFlatCents?: number;
}

export const STATIC_SHIPPING_ZONES: ShippingZoneRule[] = [
  { key: 'lima',      label: 'Delivery a domicilio',        flatCents:  800, freeThresholdCents: 10000 },
  { key: 'limaExt',  label: 'Olva Courier · Lima',          flatCents: 1200, freeThresholdCents: 12000, carrier: 'Olva Courier', transitDays: '2-3', recojoFlatCents: 1000, domicilioFlatCents: 1200 },
  { key: 'provincia',label: 'Olva Courier · Nacional',       flatCents: 1500, freeThresholdCents: 15000, carrier: 'Olva Courier', transitDays: '3-5', recojoFlatCents: 1200, domicilioFlatCents: 1500 },
  { key: 'recojo',   label: 'Recojo en Olva · Barranca',    flatCents:    0, freeThresholdCents:     0 },
];

export async function fetchShippingZones(): Promise<ShippingZoneRule[]> {
  try {
    const snap = await getDoc(doc(db, 'configurations', 'shipping'));
    if (!snap.exists()) return STATIC_SHIPPING_ZONES;
    const data = snap.data() as { zones?: ShippingZoneRule[] };
    return data.zones?.length ? data.zones : STATIC_SHIPPING_ZONES;
  } catch {
    return STATIC_SHIPPING_ZONES;
  }
}

// ── Landing config ───────────────────────────────────────────────────────────

export interface LandingContact {
  email: string;
  whatsapp: string;
  address: string;
  appUrl?: string;
  adminEmail: string;
}

export interface LandingConfigData {
  contact: LandingContact;
  heroMetrics?: { producerPctDisplay: number; farmCount: number; altitudMedia: string };
  orderIdPrefix?: string;
}

export const STATIC_LANDING_CONFIG: LandingConfigData = {
  contact: {
    email: 'tunaywasi@gmail.com',
    whatsapp: '+51917959370',
    address: 'Jr. Independencia 240, Barranco, Lima',
    appUrl: 'https://app.tunaywasi.pe',
    adminEmail: 'tunaywasi@gmail.com',
  },
};

export async function fetchLandingConfig(): Promise<LandingConfigData> {
  try {
    const snap = await getDoc(doc(db, 'configurations', 'landing'));
    if (!snap.exists()) return STATIC_LANDING_CONFIG;
    return snap.data() as LandingConfigData;
  } catch {
    return STATIC_LANDING_CONFIG;
  }
}

// ── Yape / Plin ──────────────────────────────────────────────────────────────

export interface YapeOrPlinConfig { phone: string; accountName: string; qrImageUrl?: string }
export interface YapePlinData {
  enabled: boolean;
  yape: YapeOrPlinConfig;
  plin: YapeOrPlinConfig;
  instructions?: string[];
}

export const STATIC_YAPE_PLIN: YapePlinData = {
  enabled: true,
  yape: { phone: '+51917959370', accountName: 'Tunay Wasi' },
  plin: { phone: '+51917959370', accountName: 'Tunay Wasi' },
  instructions: ['Abre Yape o tu app bancaria', 'Escanea el QR o busca el número', 'Confirma el monto exacto', 'Sube la captura del comprobante'],
};

export async function fetchYapePlin(): Promise<YapePlinData> {
  try {
    const snap = await getDoc(doc(db, 'configurations', 'yapePlin'));
    if (!snap.exists()) return STATIC_YAPE_PLIN;
    return snap.data() as YapePlinData;
  } catch {
    return STATIC_YAPE_PLIN;
  }
}

// ── Transferencia ─────────────────────────────────────────────────────────────

export interface TransferenciaBankData {
  name: string;
  accountType: string;
  accountNumber: string;
  cci: string;
}

export interface TransferenciaData {
  enabled: boolean;
  accountHolder: string;
  banks: TransferenciaBankData[];
  instructions: string[];
}

export const STATIC_TRANSFERENCIA: TransferenciaData = {
  enabled: true,
  accountHolder: 'ALPASO LIVE COMMERCE SAC',
  banks: [{ name: 'BCP', accountType: 'Cuenta Corriente', accountNumber: '193-7332599054', cci: '002-193-0073325990541-4' }],
  instructions: ['Transfiere el monto exacto a la cuenta indicada', 'Usa como referencia tu número de pedido', 'Sube la captura del comprobante', 'Tu pedido se confirma en máximo 24 horas'],
};

export async function fetchTransferencia(): Promise<TransferenciaData> {
  try {
    const snap = await getDoc(doc(db, 'configurations', 'transferencia'));
    if (!snap.exists()) return STATIC_TRANSFERENCIA;
    return snap.data() as TransferenciaData;
  } catch {
    return STATIC_TRANSFERENCIA;
  }
}
