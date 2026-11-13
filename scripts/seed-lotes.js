#!/usr/bin/env node
/**
 * seed-lotes.js — usa firebase-admin con ADC (Application Default Credentials)
 * Instala: npm install firebase-admin --save-dev
 * Corre:   node scripts/seed-lotes.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'tunay-wasi' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true, databaseId: '(default)' });

const productos = [
  {
    id: 'geisha-honey-aydee-2026',
    code: '01',
    name: 'Aydee Rojas - Geisha Honey',
    sub: 'Honey · Amazonas',
    region: 'Perú · Amazonas',
    alt: '1500 m',
    farm: 'Finca Vista Hermosas',
    producer: 'Aydee Rojas Saldivar',
    notes: ['Frutal', 'Miel', 'Floral'],
    body: 'Medio',
    acidity: 'Brillante',
    score: '82.5+',
    tag: 'Geisha Honey',
    tagTone: 'terra',
    brews: ['V60', 'Chemex', 'Aeropress'],
    weights: [
      { label: '250g', cents: 7800 }
    ],
    producerPct: 34.65,
    tone: 'green',
    stockKg: 24,
    stockReservedKg: 0,
    desc: 'Microlote Geisha proceso Honey de Aydee Rojas, en secado. Cosecha 2026. Cantidad limitada: 24 kg.',
    label: 'PREVENTA',
  },
  {
    id: 'bourbon-lavado-jon-milan-2026',
    code: '02',
    name: 'Las Travesuras de Milán - Bourbon',
    sub: 'Lavado · Cajamarca',
    region: 'Perú · Cajamarca',
    alt: '1550 m',
    farm: 'Finca Bello Horizonte',
    producer: 'Darlyn John Sánchez Hilario',
    notes: ['Caramelo', 'Cítrico', 'Chocolate'],
    body: 'Medio-alto',
    acidity: 'Cítrica limpia',
    score: '87.5+',
    tag: 'Bourbon Lavado',
    tagTone: 'sage',
    brews: ['V60', 'French Press', 'Espresso'],
    weights: [
      { label: '250g', cents: 7200 }
    ],
    producerPct: 56,
    tone: 'tan',
    stockKg: 300,
    stockReservedKg: 0,
    desc: 'Microlote Bourbon proceso Lavado de Jon Sánchez. En fermentación, disponible julio 2026. 300 kg.',
    label: 'PREVENTA',
  },
];

const cicloActivo = {
  closeAt: '31 may.',
  deliverLima: 'jun. (1a semana)',
  deliverProv: 'jun. (2a semana)',
  cutoffTimestamp: new Date('2026-05-31T23:59:59-05:00').getTime(),
};

async function seed() {
  console.log('🌱 Cargando datos en tunay-wasi...\n');
  for (const { id, ...data } of productos) {
    await db.collection('productos').doc(id).set(data);
    console.log(`✅ productos/${id}`);
  }
  await db.collection('configurations').doc('ciclo_activo').set(cicloActivo);
  console.log('✅ configurations/ciclo_activo');
  console.log('\n🎉 Listo. Abre la landing y verifica el catálogo.');
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
