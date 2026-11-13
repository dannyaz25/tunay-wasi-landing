/**
 * seed-marketplace-emulator.js
 * Pobla el emulador de Firestore con data demo del marketplace.
 * Usar solo en desarrollo local — apunta a localhost:8181
 *
 * Uso: node scripts/seed-marketplace-emulator.js
 */

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8181';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: 'alpaso-app' });
}

const db = getFirestore();

// ─── Data demo ───────────────────────────────────────────────────────────────

const CAFICULTORES = [
  {
    id: 'caficultor-darlyn',
    nombreProductor: 'Darlyn Sánchez',
    nombreFinca: 'Bello Horizonte',
    region: 'Oxapampa, Pasco',
    fotoUrl: 'https://images.unsplash.com/photo-1559181567-c3190ca9d5db?w=200',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'caficultor-yolanda',
    nombreProductor: 'Yolanda Quispe',
    nombreFinca: 'Lechemayo',
    region: 'La Convención, Cusco',
    fotoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'caficultor-marco',
    nombreProductor: 'Marco Quispe',
    nombreFinca: 'Las Naranjas',
    region: 'Chanchamayo, Junín',
    fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'caficultor-rosa',
    nombreProductor: 'Rosa Tarrillo',
    nombreFinca: 'El Paraíso',
    region: 'Bagua, Amazonas',
    fotoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
    createdAt: new Date().toISOString(),
  },
];

const LOTES = [
  {
    id: 'CAJ-001-2026',
    caficultorId: 'caficultor-darlyn',
    nombreLote: 'Bello Horizonte — Geisha Honey',
    cosecha: 'Junio 2026',
    proceso: 'honey',
    variedad: 'Geisha',
    altitud: '1,800 msnm',
    region: 'Oxapampa, Pasco',
    puntajeReferencial: 87.5,
    puntajeOficial: 87.5,
    notasSabor: ['durazno', 'jazmín', 'miel de abeja', 'té blanco'],
    acidez: 8,
    cuerpo: 7,
    balance: 9,
    sacosDisponibles: 10,
    sacosReservados: 4,
    pesoPorSacoKg: 60,
    precioOrigenPEN: 480,
    precioVentaPEN: 620,
    muestraDisponible: true,
    precioMuestraPEN: 18,
    stockMuestrasHub: 8,
    status: 'publicado',
    destacado: true,
    createdAt: '2026-05-10T08:00:00Z',
    publicadoAt: '2026-05-20T10:00:00Z',
    fotoLoteUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600',
  },
  {
    id: 'CUS-002-2026',
    caficultorId: 'caficultor-yolanda',
    nombreLote: 'Finca Lechemayo — Bourbon Natural',
    cosecha: 'Mayo 2026',
    proceso: 'natural',
    variedad: 'Bourbon',
    altitud: '1,650 msnm',
    region: 'La Convención, Cusco',
    puntajeReferencial: 85.0,
    puntajeOficial: 85.25,
    notasSabor: ['chocolate amargo', 'ciruela', 'nuez', 'caramelo'],
    acidez: 6,
    cuerpo: 9,
    balance: 8,
    sacosDisponibles: 15,
    sacosReservados: 2,
    pesoPorSacoKg: 60,
    precioOrigenPEN: 390,
    precioVentaPEN: 510,
    muestraDisponible: true,
    precioMuestraPEN: 15,
    stockMuestrasHub: 5,
    status: 'publicado',
    destacado: false,
    createdAt: '2026-04-28T09:00:00Z',
    publicadoAt: '2026-05-12T11:00:00Z',
    fotoLoteUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
  },
  {
    id: 'JUN-003-2026',
    caficultorId: 'caficultor-marco',
    nombreLote: 'Las Naranjas — Caturra Lavado',
    cosecha: 'Julio 2026',
    proceso: 'lavado',
    variedad: 'Caturra',
    altitud: '1,400 msnm',
    region: 'Chanchamayo, Junín',
    puntajeReferencial: 83.0,
    notasSabor: ['limón', 'mandarina', 'panela'],
    sacosDisponibles: 20,
    sacosReservados: 0,
    pesoPorSacoKg: 60,
    precioOrigenPEN: 320,
    muestraDisponible: false,
    precioMuestraPEN: 15,
    stockMuestrasHub: 0,
    status: 'borrador',
    destacado: false,
    createdAt: '2026-06-01T07:00:00Z',
    fotoLoteUrl: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600',
  },
  {
    id: 'AMA-004-2026',
    caficultorId: 'caficultor-rosa',
    nombreLote: 'Finca El Paraíso — Typica Anaeróbico',
    cosecha: 'Junio 2026',
    proceso: 'anaerobico',
    variedad: 'Typica',
    altitud: '1,920 msnm',
    region: 'Bagua, Amazonas',
    puntajeReferencial: 89.0,
    notasSabor: ['maracuyá', 'rosa', 'fresas', 'vino'],
    sacosDisponibles: 6,
    sacosReservados: 0,
    pesoPorSacoKg: 60,
    precioOrigenPEN: 550,
    muestraDisponible: false,
    precioMuestraPEN: 20,
    stockMuestrasHub: 0,
    status: 'publicado',
    destacado: false,
    createdAt: '2026-06-03T10:00:00Z',
    fotoLoteUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
  },
];

const TOSTADORAS = [
  {
    id: 'tost-001',
    razonSocial: 'Café del Parque S.A.C.',
    nombreComercial: 'Café del Parque',
    ruc: '20601234567',
    tipo: 'tostadora',
    tieneTostadora: true,
    tieneLaboratorio: false,
    contactoNombre: 'Andrés Villanueva',
    email: 'andres@cafedelparque.pe',
    telefono: '+51987654321',
    direccionEntrega: 'Av. La Mar 456, Miraflores, Lima',
    distritoCoberturaLima: 'Miraflores',
    status: 'aprobado',
    createdAt: '2026-04-01T00:00:00Z',
  },
];

const PEDIDOS = [
  {
    id: 'PED-2026-0001',
    loteId: 'CAJ-001-2026',
    tostadoraId: 'tost-001',
    caficultorId: 'caficultor-darlyn',
    sacosSolicitados: 3,
    kgTotal: 180,
    precioSacoPEN: 620,
    subtotalPEN: 1860,
    igvPEN: 335,
    fletePEN: 75,
    totalPEN: 2270,
    metodoPago: 'transferencia',
    pagoStatus: 'verificado',
    reservaExpiraAt: '2026-05-28T14:00:00Z',
    razonSocial: 'Café del Parque S.A.C.',
    ruc: '20123456789',
    contacto: 'Andrés Villanueva',
    email: 'andres@cafedelparque.pe',
    telefono: '+51987654321',
    direccionEntrega: 'Av. La Mar 456, Miraflores, Lima',
    logisticaStatus: 'en_transito',
    pagoCaficultorStatus: 'pendiente',
    montoCaficultorPEN: 1440,
    createdAt: '2026-05-25T14:00:00Z',
    updatedAt: '2026-05-28T09:00:00Z',
  },
  {
    id: 'PED-2026-0002',
    loteId: 'CUS-002-2026',
    tostadoraId: 'tost-001',
    caficultorId: 'caficultor-yolanda',
    sacosSolicitados: 2,
    kgTotal: 120,
    precioSacoPEN: 510,
    subtotalPEN: 1020,
    igvPEN: 184,
    fletePEN: 50,
    totalPEN: 1254,
    metodoPago: 'transferencia',
    pagoStatus: 'verificado',
    reservaExpiraAt: '2026-05-13T11:00:00Z',
    razonSocial: 'Café del Parque S.A.C.',
    ruc: '20123456789',
    contacto: 'Andrés Villanueva',
    email: 'andres@cafedelparque.pe',
    telefono: '+51987654321',
    direccionEntrega: 'Av. La Mar 456, Miraflores, Lima',
    logisticaStatus: 'entregado',
    pagoCaficultorStatus: 'pagado',
    pagoCaficultorAt: '2026-05-20T12:00:00Z',
    montoCaficultorPEN: 780,
    createdAt: '2026-05-10T11:00:00Z',
    updatedAt: '2026-05-20T12:00:00Z',
  },
];

const LABORATORIOS = [
  {
    id: 'lab-001',
    nombreLaboratorio: 'Coffee Lab Lima',
    certificaciones: ['Q-Grader', 'SCA'],
    feeCatacionPEN: 120,
    region: 'Lima',
    activo: true,
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripUndefined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

async function upsertAll(collectionName, docs) {
  const batch = db.batch();
  for (const d of docs) {
    const ref = db.collection(collectionName).doc(d.id);
    batch.set(ref, stripUndefined(d), { merge: true });
  }
  await batch.commit();
  console.log(`  ✓ ${collectionName}: ${docs.length} docs`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Poblando emulador Firestore (localhost:8181)...\n');

  await upsertAll('mkt_caficultores', CAFICULTORES);
  await upsertAll('mkt_lotes', LOTES);
  await upsertAll('mkt_tostadoras', TOSTADORAS);
  await upsertAll('mkt_pedidos', PEDIDOS);
  await upsertAll('mkt_laboratorios', LABORATORIOS);

  console.log('\nListo. Abre http://127.0.0.1:4000/firestore para verificar.');
}

seed().catch((err) => {
  console.error('Error al poblar:', err);
  process.exit(1);
});
