/**
 * seed-one.ts — Carga data de prueba de TunayWasi ONE en Firestore
 *
 * Uso contra emulador (por defecto):
 *   VITE_USE_EMULATOR=true npx tsx src/one/seed/seed-one.ts
 *
 * Uso contra QA (alpaso-app):
 *   FIREBASE_PROJECT=alpaso-app npx tsx src/one/seed/seed-one.ts
 *
 * NUNCA contra producción (tunay-wasi).
 */
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Inicializar Firebase ────────────────────────────────────────────────────

const USE_EMULATOR = process.env.VITE_USE_EMULATOR === 'true' || !process.env.FIREBASE_PROJECT

if (USE_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8181'
  console.log('🔵 Usando emulador Firestore en localhost:8181')
} else {
  console.log(`🟡 Usando proyecto: ${process.env.FIREBASE_PROJECT}`)
  if (process.env.FIREBASE_PROJECT === 'tunay-wasi') {
    console.error('❌ NUNCA corras el seed contra tunay-wasi (producción).')
    process.exit(1)
  }
}

if (!getApps().length) {
  if (USE_EMULATOR) {
    initializeApp({ projectId: 'demo-tunaywasi-one' })
  } else {
    // Para QA necesitas tener GOOGLE_APPLICATION_CREDENTIALS configurado
    initializeApp({ projectId: process.env.FIREBASE_PROJECT })
  }
}

const db = getFirestore()

// ─── Leer JSONs ───────────────────────────────────────────────────────────────

function leerJson<T>(filename: string): T[] {
  const ruta = resolve(__dirname, filename)
  return JSON.parse(readFileSync(ruta, 'utf-8')) as T[]
}

const caficultores = leerJson<Record<string, unknown>>('one_caficultores.json')
const productos = leerJson<Record<string, unknown>>('one_productos.json')
const usuarios = leerJson<Record<string, unknown>>('one_usuarios.json')
const pedidos = leerJson<Record<string, unknown>>('one_pedidos.json')
const kits = leerJson<Record<string, unknown>>('one_kits.json')

// ─── Cargar colección ────────────────────────────────────────────────────────

async function seedColeccion(
  coleccion: string,
  docs: Record<string, unknown>[],
  idField: string
) {
  const batch = db.batch()
  let count = 0

  for (const doc of docs) {
    const id = doc[idField] as string
    if (!id) { console.warn(`⚠️  Doc sin ${idField} en ${coleccion} — saltando`); continue }
    const ref = db.collection(coleccion).doc(id)
    batch.set(ref, doc, { merge: false })
    count++
  }

  await batch.commit()
  console.log(`✅  ${coleccion}: ${count} documentos cargados`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Iniciando seed TunayWasi ONE...\n')

  await seedColeccion('one_caficultores', caficultores, 'id')
  await seedColeccion('one_productos', productos, 'id')
  await seedColeccion('one_usuarios', usuarios, 'uid')
  await seedColeccion('one_pedidos', pedidos, 'id')
  await seedColeccion('one_kits', kits, 'id')

  console.log('\n✨ Seed completado.\n')
  console.log('Datos cargados:')
  console.log(`  • ${caficultores.length} caficultores`)
  console.log(`  • ${productos.length} productos`)
  console.log(`  • ${usuarios.length} usuarios (${usuarios.filter(u => u.rol === 'negocio').length} negocios, ${usuarios.filter(u => u.rol === 'caficultor').length} caficultores, ${usuarios.filter(u => u.rol === 'admin').length} admin)`)
  console.log(`  • ${pedidos.length} pedidos`)
  console.log(`  • ${kits.length} kits\n`)
}

main().catch((e) => {
  console.error('❌ Error en seed:', e)
  process.exit(1)
})
