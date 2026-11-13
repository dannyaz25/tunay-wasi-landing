#!/usr/bin/env node
/**
 * update-ayde-firestore.js — Actualiza datos de Ayde Rojas en Firestore
 *
 * Actualiza:
 *   1. productos/geisha-honey-aydee-2026  — foto, precio corregido, campos correctos
 *   2. caficultores/aydee-rojas-saldivar  — upsert completo con fotos Cloudinary
 *
 * Corre: node scripts/update-ayde-firestore.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'tunay-wasi' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true, databaseId: 'default' });

// ── 1. Producto ───────────────────────────────────────────────────────────────
const productoUpdate = {
  code: '01',
  name: 'Aydee Rojas - Geisha Honey',
  sub: 'Honey · Cajamarca',
  region: 'Perú · Cajamarca · Jaén',
  alt: '1500 m',
  farm: 'Finca Vista Hermosa',
  producer: 'Aydee Rojas Saldivar',
  notes: ['Frutal', 'Miel', 'Floral'],
  body: 'Medio',
  acidity: 'Brillante',
  score: '82.5+',
  tag: 'Geisha Honey',
  tagTone: 'terra',
  brews: ['V60', 'Chemex', 'Aeropress'],
  weights: [
    { label: '250g', cents: 2705 },
    { label: '1kg',  cents: 9700 },
  ],
  producerPct: 38.6,
  tone: 'green',
  stockKg: 24,
  stockReservedKg: 0,
  desc: 'Microlote Geisha proceso Honey de Aydee Rojas, en secado. Cosecha 2026. Cantidad limitada: 24 kg.',
  label: 'PREVENTA',
  // Foto principal del producto (perfil de finca, Cloudinary)
  photo: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1778767831/aydeFinca_rm5arr.jpg',
};

// ── 2. Caficultor ─────────────────────────────────────────────────────────────
const caficultorUpsert = {
  nombreProductor: 'Aydee Rojas Saldivar',
  nombreFinca: 'Finca Vista Hermosa',
  provincia: 'Jaén',
  departamento: 'Cajamarca',
  distrito: 'San José del Alto',
  altitud: '1500',
  variedades: ['Caturra', 'Geisha'],
  proceso: 'Natural',
  puntajeSCA: '82.5+',
  resumen: 'Productora de microlotes de especialidad en las alturas de Jaén. Aydee trabaja con proceso Honey y Natural, obteniendo perfiles frutales y florales únicos en su finca familiar.',
  historia: 'Aydee Rojas Saldivar es una caficultora de la provincia de Jaén, Cajamarca. Su finca Vista Hermosa, situada a 1500 msnm, produce microlotes de alta calidad gracias a la dedicación familiar y un terroir privilegiado.',
  impactoSocial: 'El 38.6% del precio neto de cada bolsa vendida va directo a Aydee, por encima del promedio de comercio justo, permitiéndole reinvertir en su finca y su familia.',
  experienciaAnos: '10',
  hectareas: '3',
  status: 'activo',
  // Fotos Cloudinary (de rama feature/data-prod-1)
  fotoPerfilUrl: 'https://res.cloudinary.com/dtc9meqbc/image/upload/v1778767831/aydeFinca_rm5arr.jpg',
  fotosUrls: [
    'https://res.cloudinary.com/dtc9meqbc/image/upload/v1778767976/AydeFinca_lgry4p.jpg',
    'https://res.cloudinary.com/dtc9meqbc/image/upload/v1778768053/Screenshot_2026-05-14_at_9.13.55_AM_ppsgqu.png',
    'https://res.cloudinary.com/dtc9meqbc/image/upload/v1778767939/finca6_ytusbx.jpg',
  ],
};

async function update() {
  console.log('🔄 Actualizando datos de Ayde Rojas en Firestore (tunay-wasi)...\n');

  // 1. Producto
  await db.collection('productos').doc('geisha-honey-aydee-2026').set(productoUpdate);
  console.log('✅ productos/geisha-honey-aydee-2026');
  console.log('   photo:', productoUpdate.photo);
  console.log('   weights:', JSON.stringify(productoUpdate.weights));
  console.log('   producerPct:', productoUpdate.producerPct);
  console.log('   farm:', productoUpdate.farm);

  // 2. Caficultor
  await db.collection('caficultores').doc('aydee-rojas-saldivar').set(caficultorUpsert);
  console.log('\n✅ caficultores/aydee-rojas-saldivar');
  console.log('   fotoPerfilUrl:', caficultorUpsert.fotoPerfilUrl);
  console.log('   departamento:', caficultorUpsert.departamento);
  console.log('   proceso:', caficultorUpsert.proceso);

  console.log('\n🎉 Listo. Recarga la landing y verifica que aparezca la foto de Ayde.');
}

update().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
