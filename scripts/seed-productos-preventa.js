#!/usr/bin/env node
/**
 * seed-productos-preventa.js — Sube los productos PREVENTA completos a Firestore.
 * Usa set() con merge:false (sobreescribe) para garantizar que el doc queda limpio.
 *
 * Target: alpaso-app (QA) — NUNCA correr contra tunay-wasi (prod) sin revisión previa.
 * Corre: node scripts/seed-productos-preventa.js
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

initializeApp({ credential: applicationDefault(), projectId: 'alpaso-app' });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const raw = readFileSync(resolve(__dirname, 'data/tunaywasi/productos.json'), 'utf-8');
const productos = JSON.parse(raw);

// Solo subir los que tienen label PREVENTA
const preventa = productos.filter(p => p.label === 'PREVENTA');

async function run() {
  console.log(`🔄  Subiendo ${preventa.length} productos PREVENTA a alpaso-app...\n`);
  for (const p of preventa) {
    const { id, ...data } = p;
    // Normalizar weights a formato Firestore (array de objetos {label, cents})
    const normalized = {
      ...data,
      weights: Array.isArray(data.weights)
        ? data.weights.map(w => Array.isArray(w) ? { label: w[0], cents: w[1] } : w)
        : data.weights,
      weightsPromo: Array.isArray(data.weightsPromo)
        ? data.weightsPromo.map(w => Array.isArray(w) ? { label: w[0], cents: w[1] } : w)
        : data.weightsPromo,
    };
    await db.collection('productos').doc(id).set(normalized);
    console.log(`✅  productos/${id}  (${p.name})`);
  }
  console.log('\n🎉  Listo. Recarga la landing para ver los cambios.');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
