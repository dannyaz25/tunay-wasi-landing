// Uso: CUENTAS_TIPO=caficultor|cliente-DNI|cliente-RUC CUENTAS_CANTIDAD=5 QA_TEST_PASSWORD=… npm run cuentas
import { appendFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { crearCuentas } from './cuentas.mjs'
import { esAmbienteDePruebas } from './reglas.mjs'

const env = process.env
const salir = mensaje => { console.error(mensaje); process.exit(1) }
const emulador = !!env.FIRESTORE_EMULATOR_HOST
if (emulador && !env.FIREBASE_AUTH_EMULATOR_HOST) salir('Con el emulador hace falta también el de autenticación')
let credencial
let proyecto = env.GCLOUD_PROJECT || 'demo-kyc'
if (!emulador) {
  // El error de JSON.parse cita parte del texto: no debe llegar al registro (el repo es público)
  try { const c = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); proyecto = c.project_id; credencial = cert(c) }
  catch { salir('FIREBASE_SERVICE_ACCOUNT no es una cuenta de servicio válida') }
}
if (!esAmbienteDePruebas(proyecto)) salir('Las cuentas de prueba solo se crean en QA y emuladores')
if (!env.QA_TEST_PASSWORD) salir('Falta el secreto QA_TEST_PASSWORD (la contraseña de las cuentas de prueba)')

const app = initializeApp(emulador ? { projectId: proyecto } : { credential: credencial })
try {
  const creadas = await crearCuentas({
    db: getFirestore(app, env.FIRESTORE_DATABASE || '(default)'), auth: getAuth(app),
    tipo: env.CUENTAS_TIPO, cantidad: Number(env.CUENTAS_CANTIDAD || 5), clave: env.QA_TEST_PASSWORD,
  })
  const tabla = ['| Correo | Caso | Resultado esperado del job |', '|---|---|---|',
    ...creadas.map(c => `| ${c.email} | ${c.caso} | ${c.esperado} |`)].join('\n')
  console.log(`Creadas ${creadas.length} cuentas (contraseña: la del secreto QA_TEST_PASSWORD)\n\n${tabla}`)
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `## Cuentas de prueba creadas\n\n${tabla}\n`)
} catch (e) {
  salir(`No se pudo completar: ${e.message}`)
}
