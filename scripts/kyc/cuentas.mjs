// Cuentas FICTICIAS para probar los flujos en QA. Nunca en producción.
// El correo usa el dominio reservado example.com: no pertenece a nadie.
import { randomInt } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { esAmbienteDePruebas, esRucValido } from './reglas.mjs'

export const TIPOS = ['caficultor', 'cliente-DNI', 'cliente-RUC']
export const MAXIMO = 20
// RUC público de la propia SUNAT: figura ACTIVO y HABIDO. Hace de "RUC de cooperativa" de prueba.
const RUC_COOPERATIVA = '20131312955'

// Los caficultores se reparten en estos casos, en orden, para ver los tres resultados del job
const CASOS_CAFICULTOR = [
  { caso: 'Datos correctos', esperado: 'APROBADO' },
  { caso: 'Datos correctos', esperado: 'APROBADO' },
  { caso: 'DNI sin reservar', esperado: 'RECHAZADO', sinReserva: true },
  { caso: 'Yape inválido', esperado: 'RECHAZADO', yape: '12345' },
  { caso: 'Cooperativa', esperado: 'PENDIENTE', cooperativa: true },
]

const digitos = n => String(randomInt(10 ** n)).padStart(n, '0')
const dniFicticio = () => `99${digitos(6)}`
const celularFicticio = () => `999${digitos(6)}`
function rucFicticio() {
  const base = `2099${digitos(6)}`
  return [...'0123456789'].map(d => base + d).find(esRucValido)
}

/** Reserva un documento que nadie tenga; devuelve el número elegido. */
async function reservar(db, prefijo, generar, uid, rol, tipo) {
  for (let intento = 0; intento < 10; intento++) {
    const numero = generar()
    try {
      await db.collection('one_documentos').doc(`${prefijo}${numero}`).create({ uid, rol, tipo, createdAt: FieldValue.serverTimestamp() })
      return numero
    } catch (e) {
      if (e.code !== 6) throw e   // 6 = ya existe
    }
  }
  throw new Error('No se encontró un documento libre')
}

async function armarPerfil(db, tipo, uid, indice) {
  const onboarding = flujo => ({ estado: 'completo', flujo, metodo: 'email', completadoAt: new Date().toISOString() })
  if (tipo === 'cliente-DNI') {
    const dni = await reservar(db, 'DNI_B2C_', dniFicticio, uid, 'buyer_b2c', 'DNI')
    return { caso: 'Persona con DNI', esperado: '—', perfil: {
      rol: 'buyer_b2c', telefono: celularFicticio(), consumidor: { dni, dirEntrega: 'Av. Prueba 123, Lima' }, onboarding: onboarding('b2c'),
    } }
  }
  if (tipo === 'cliente-RUC') {
    const ruc = await reservar(db, 'RUC_', rucFicticio, uid, 'buyer_b2b', 'RUC')
    return { caso: 'Negocio con RUC', esperado: 'Pendiente de aprobación', perfil: {
      rol: 'buyer_b2b', telefono: celularFicticio(),
      negocio: { nombreLocal: `Cafetería de Prueba ${indice}`, distritoLocal: 'Lima', etapa: 'planificando', pedidoIds: [] },
      empresa: { ruc, razonSocial: `EMPRESA DE PRUEBA ${indice} S.A.C.`, dirFiscal: 'Av. Prueba 123, Lima', dirEnvio: 'Av. Prueba 123, Lima',
        estadoAprobacion: 'PENDING_APPROVAL', solicitudAt: new Date().toISOString() },
      onboarding: onboarding('b2b'),
    } }
  }
  const c = CASOS_CAFICULTOR[(indice - 1) % CASOS_CAFICULTOR.length]
  const dni = c.sinReserva ? dniFicticio() : await reservar(db, 'DNI_SELLER_', dniFicticio, uid, 'seller', 'DNI')
  const cobro = c.cooperativa
    ? { tipoRegistroCaficultor: 'COOPERATIVA', rucCooperativa: RUC_COOPERATIVA, cciCooperativa: digitos(10) + digitos(10) }
    : { tipoRegistroCaficultor: 'SOLO_DNI', numeroYape: c.yape ?? celularFicticio() }
  // Direcciones de relleno: existen y no se repiten, pero no hay foto detrás
  const foto = n => `https://res.cloudinary.com/demo/image/upload/qa-prueba/${uid}-${n}.jpg`
  return { caso: c.caso, esperado: c.esperado, perfil: {
    rol: 'seller', telefono: celularFicticio(), estadoKyc: 'PENDING_REVIEW', fotoDniUrl: foto('dni'), fotoSelfieUrl: foto('selfie'),
    caficultor: { region: 'Cajamarca', distrito: 'Jaén', altitudMsnm: 1600, historia: '', foto: '', activo: false, proceso: 'Washed (lavado)', dni, ...cobro },
    onboarding: onboarding('caficultor'),
  } }
}

export async function crearCuentas({ db, auth, tipo, cantidad = 5, clave, marca = Date.now().toString(36) }) {
  if (!esAmbienteDePruebas(db.projectId)) throw new Error(`No se crean cuentas de prueba en el proyecto "${db.projectId}"`)
  if (!TIPOS.includes(tipo)) throw new Error(`Tipo no válido. Usa: ${TIPOS.join(', ')}`)
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAXIMO) throw new Error(`La cantidad debe estar entre 1 y ${MAXIMO}`)
  if (String(clave ?? '').length < 8 || !/\d/.test(clave)) throw new Error('La contraseña de prueba debe tener al menos 8 caracteres y 1 número')

  const creadas = []
  for (let i = 1; i <= cantidad; i++) {
    const email = `qa.${tipo.toLowerCase()}.${marca}.${i}@example.com`
    const nombre = `Prueba QA ${tipo} ${marca} ${i}`
    const { uid } = await auth.createUser({ email, password: clave, displayName: nombre, emailVerified: true })
    try {
      const { caso, esperado, perfil } = await armarPerfil(db, tipo, uid, i)
      await db.collection('one_usuarios').doc(uid).create({ uid, nombre, email, ...perfil, cuentaDePrueba: true, createdAt: FieldValue.serverTimestamp() })
      creadas.push({ email, uid, caso, esperado })
    } catch (e) {
      await auth.deleteUser(uid).catch(() => {})
      throw e
    }
  }
  return creadas
}
