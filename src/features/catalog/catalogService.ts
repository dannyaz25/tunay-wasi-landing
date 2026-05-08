import { collection, doc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/shared/firebase';
import type { Producto, Caficultor, CicloActivo } from '@/shared/types/catalog';

const STATIC_PRODUCTS: Producto[] = [
  {
    id: 'bello-horizonte-geisha', code: '01', name: 'Bello Horizonte - Geisha', sub: 'Lavado · Oxapampa',
    region: 'Perú · Pasco · Oxapampa', alt: '800 m',
    farm: 'Finca Darlyn Sánchez', producer: 'Darlyn Sánchez Hilario',
    notes: ['Caramelo', 'Naranja sanguina', 'Cacao'],
    body: 'Medio', acidity: 'Cítrica brillante',
    score: '88', tag: 'Versátil', tagTone: 'sage',
    brews: ['V60', 'Chemex', 'AeroPress'],
    weights: [['250g', 3900], ['1kg', 15000], ['3kg', 46000]],
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
    quote: 'El café se siembra con la mano, pero se cuida con el oído — escuchando la lluvia.',
    photo: '/imgs/darlynsanchez.jpg',
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

export async function fetchProductos(): Promise<Producto[]> {
  try {
    const snap = await getDocs(collection(db, 'productos'));
    if (snap.empty) return STATIC_PRODUCTS;
    const mapped = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Producto));
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
    const mapped = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Caficultor));
    const valid = mapped.filter((c) => c.name && c.farm);
    return valid.length > 0 ? valid : STATIC_CAFICULTORES;
  } catch {
    return STATIC_CAFICULTORES;
  }
}

export async function fetchActiveCycle(): Promise<CicloActivo> {
  try {
    const snap = await getDoc(doc(db, 'config', 'ciclo_activo'));
    if (!snap.exists()) return STATIC_CYCLE;
    return snap.data() as CicloActivo;
  } catch {
    return STATIC_CYCLE;
  }
}
