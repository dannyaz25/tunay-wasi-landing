// Uso: node main.mjs            → simulación (no escribe nada)
//      KYC_APLICAR=true node main.mjs
import { appendFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { ejecutar } from './job.mjs'
import { consultarPadron } from './padron.mjs'
import { crearAnalizadorDeFotos } from './fotos.mjs'

const env = process.env
const emulador = !!env.FIRESTORE_EMULATOR_HOST
if (!emulador && !env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Falta FIREBASE_SERVICE_ACCOUNT')
  process.exit(1)
}
function cuentaDeServicio() {
  // El error de JSON.parse cita parte del texto: no debe llegar al registro (el repo es público)
  try { return cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)) } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT no es una cuenta de servicio válida')
    process.exit(1)
  }
}
const app = initializeApp(emulador
  ? { projectId: env.GCLOUD_PROJECT || 'demo-kyc' }
  : { credential: cuentaDeServicio() })

const hayRostro = !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.CLOUDINARY_CLOUD_NAME)
const aplicar = env.KYC_APLICAR === 'true'
// Rekognition se paga por imagen y la simulación no guarda nada: allí solo se usa si se pide
const analizar = hayRostro && (aplicar || env.KYC_FOTOS_EN_SIMULACION === 'true')
if (!hayRostro) console.warn('Sin credenciales de AWS o sin CLOUDINARY_CLOUD_NAME: no se aprobará a nadie.')
else if (!analizar) console.warn('Simulación sin análisis de fotos (sin costo): quienes lleguen a ese paso salen como pendientes.')

const resumen = await ejecutar({
  db: getFirestore(app, env.FIRESTORE_DATABASE || '(default)'),
  analizarFotos: analizar
    ? crearAnalizadorDeFotos({ region: env.AWS_REGION || 'us-east-1', cloudName: env.CLOUDINARY_CLOUD_NAME })
    : null,
  consultarPadron,
  aplicar,
  maximo: Number(env.KYC_MAXIMO) || 50,
  similitudMinima: Number(env.KYC_SIMILITUD_MINIMA) || undefined,
})

console.log(JSON.stringify(resumen, null, 2))
if (env.GITHUB_STEP_SUMMARY) {
  const filas = Object.entries(resumen).filter(([k]) => k !== 'motivos').map(([k, v]) => `| ${k} | ${v} |`)
  const motivos = Object.entries(resumen.motivos).map(([k, v]) => `| ${k} | ${v} |`)
  appendFileSync(env.GITHUB_STEP_SUMMARY, ['## Validación de caficultores', '', '| Dato | Valor |', '|---|---|', ...filas,
    '', '| Criterio no cumplido o pendiente | Cuentas |', '|---|---|', ...motivos, ''].join('\n'))
}
process.exitCode = resumen.errores ? 1 : 0
