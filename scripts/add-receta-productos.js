#!/usr/bin/env node
/**
 * add-receta-productos.js — Agrega campo receta, roastDate y qGraderName
 * a los productos PREVENTA en Firestore (merge, no sobreescribe otros campos).
 *
 * Corre: node scripts/add-receta-productos.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault(), projectId: 'alpaso-app' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const updates = [
  {
    id: 'caturra-honey-aydee-2026',
    data: {
      roastDate: '~9 jun.',
      qGraderName: 'M. Quispe',
      receta: {
        'V60': {
          ratio: '1:15 (15 g / 225 ml)',
          temp: '92 °C',
          tiempo: '3:00–3:30 min',
          molienda: 'Medio-fina (similar a sal gruesa)',
          nota: 'Pre-infusión de 30 s. Las notas de caramelo se intensifican dejando enfriar levemente.',
        },
        'Chemex': {
          ratio: '1:16 (15 g / 240 ml)',
          temp: '91 °C',
          tiempo: '3:30–4:00 min',
          molienda: 'Medio-gruesa (similar a azúcar morena gruesa)',
          nota: 'Vierte en espiral hacia afuera. El filtro Chemex retiene más aceites, resaltando el dulzor.',
        },
        'Aeropress': {
          ratio: '1:13 (15 g / 195 ml)',
          temp: '90 °C',
          tiempo: '1:30–2:00 min',
          molienda: 'Fina-media (similar a sal de mesa)',
          nota: 'Método inverso recomendado. Presiona suave y constante en los últimos 30 s.',
        },
      },
    },
  },
  {
    id: 'geisha-honey-aydee-2026',
    data: {
      roastDate: '~9 jun.',
      qGraderName: 'M. Quispe',
      receta: {
        'V60': {
          ratio: '1:16 (15 g / 240 ml)',
          temp: '93 °C',
          tiempo: '2:45–3:15 min',
          molienda: 'Fina-media (entre sal gruesa y azúcar)',
          nota: 'Las notas florales se expresan mejor entre 70–75 °C. Deja reposar 1 min antes de servir.',
        },
        'Chemex': {
          ratio: '1:17 (15 g / 255 ml)',
          temp: '92 °C',
          tiempo: '3:30–4:00 min',
          molienda: 'Medio-gruesa (similar a azúcar morena gruesa)',
          nota: 'El Geisha en Chemex desarrolla su complejidad floral en la segunda mitad de la extracción.',
        },
        'Aeropress': {
          ratio: '1:12 (15 g / 180 ml)',
          temp: '88 °C',
          tiempo: '1:15–1:45 min',
          molienda: 'Fina (similar a sal de mesa fina)',
          nota: 'Temperatura más baja preserva los aromas florales delicados del Geisha.',
        },
      },
    },
  },
];

async function run() {
  console.log('🔄  Agregando receta a productos PREVENTA...\n');
  for (const { id, data } of updates) {
    await db.collection('productos').doc(id).set(data, { merge: true });
    console.log(`✅  productos/${id}`);
  }
  console.log('\n🎉  Listo. Recarga la landing.');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
