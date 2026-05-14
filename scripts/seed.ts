/**
 * seed.ts — Carga inicial de datos en Firestore para tunay-wasi-landing.
 *
 * Uso:
 *   npm run seed              # merge: no sobreescribe campos existentes
 *   npm run seed -- --force   # overwrite: reemplaza el doc completo
 *
 * Prerequisito: .env.local con las variables VITE_FIREBASE_*
 *
 * NOTA: usa el SDK cliente (no Admin). Si las Firestore Security Rules
 * bloquean escrituras sin auth, temporalmente ponlas en modo test:
 *   rules_version = '2';
 *   service cloud.firestore { match /databases/{db}/documents {
 *     match /{doc=**} { allow read, write: if true; }
 *   }}
 * y reviértelas después del seed.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnvLocal() {
  const envPath = resolve(__dirname, '../.env.local');
  try {
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.error('❌  .env.local not found. Copy .env.example or create it.');
    process.exit(1);
  }
}

loadEnvLocal();

// ── Firebase init ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY!,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.VITE_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const FORCE = process.argv.includes('--force');

// ── Load seed data ───────────────────────────────────────────────────────────
function loadJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, relPath), 'utf-8')) as T;
}

type DocWithId = { id: string; [k: string]: unknown };

const caficultores    = loadJson<DocWithId[]>('data/caficultores.json');
const productos       = loadJson<DocWithId[]>('data/productos.json');
const config          = loadJson<Record<string, unknown>>('data/config.json');
const { lotes: microlotes } = loadJson<{ lotes: DocWithId[] }>('data/microlotesLanding.json');

// ── Helpers ──────────────────────────────────────────────────────────────────
function ok(msg: string)  { console.log(`  ✓ ${msg}`); }
function err(msg: string) { console.error(`  ✗ ${msg}`); }

async function seedCollection(colName: string, docs: DocWithId[]) {
  console.log(`\n▸ ${colName}  (${docs.length} doc${docs.length !== 1 ? 's' : ''})`);
  for (const d of docs) {
    const { id, ...rest } = d;
    try {
      await setDoc(doc(db, colName, id), { id, ...rest }, { merge: !FORCE });
      ok(`${colName}/${id}`);
    } catch (e) {
      err(`${colName}/${id} — ${(e as Error).message}`);
    }
  }
}

async function seedConfig(configData: Record<string, unknown>) {
  const entries = Object.entries(configData);
  console.log(`\n▸ configurations  (${entries.length} docs)`);
  for (const [docId, data] of entries) {
    try {
      await setDoc(doc(db, 'configurations', docId), data as object, { merge: !FORCE });
      ok(`configurations/${docId}`);
    } catch (e) {
      err(`configurations/${docId} — ${(e as Error).message}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('🌱  Tunay Wasi — Seed');
  console.log(`    project : ${firebaseConfig.projectId}`);
  console.log(`    mode    : ${FORCE ? 'FORCE (full overwrite)' : 'merge  (preserves existing fields)'}`);
  console.log('');

  await seedCollection('caficultores', caficultores);
  await seedCollection('productos',    productos);
  await seedConfig(config);
  await seedCollection('microlotesLanding', microlotes);

  console.log('\n✅  Seed complete.\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('\n❌  Seed failed:', e);
  process.exit(1);
});
