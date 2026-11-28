// Requiere el emulador de Firestore (FIRESTORE_EMULATOR_HOST). Datos ficticios; fotos y SUNAT simulados.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { ejecutar } from '../job.mjs'

const emulador = process.env.FIRESTORE_EMULATOR_HOST

test('simulación, aprobación, rechazo, pendientes e historial', { skip: !emulador && 'sin emulador' }, async () => {
  const db = getFirestore(initializeApp({ projectId: 'demo-kyc-job' }))
  const seller = (dni, yape, extra = {}) => ({
    rol: 'seller', nombre: 'Ana Quispe Rojas', estadoKyc: 'PENDING_REVIEW',
    fotoDniUrl: `dni-${dni}`, fotoSelfieUrl: `selfie-${dni}`,
    caficultor: { region: 'Cajamarca', distrito: 'Jaén', activo: false, dni, tipoRegistroCaficultor: 'SOLO_DNI', numeroYape: yape },
    ...extra,
  })
  const reservar = (dni, uid) => db.doc(`one_documentos/DNI_SELLER_${dni}`).set({ uid })
  await db.doc('one_usuarios/bueno').set(seller('11111111', '987000001'))
  await db.doc('one_usuarios/malo').set(seller('22222222', '987000002'))   // sin reserva de DNI
  await db.doc('one_usuarios/autoaprobado').set(seller('33333333', '987000003', { estadoKyc: 'ACTIVO' }))
  await db.doc('one_usuarios/porlogin').set({ rol: 'seller', nombre: 'Sin Fotos', caficultor: {} })
  await reservar('11111111', 'bueno')

  const analizarFotos = async p => ({ mismaImagen: false, similitud: 99, rostrosEnSelfie: 2, lineasDni: [p.caficultor.dni, 'ANA QUISPE ROJAS'] })
  const correr = extra => ejecutar({ db, analizarFotos, consultarPadron: async () => new Map(), aplicar: true, ...extra })
  const leer = async ruta => (await db.doc(ruta).get()).data()
  const historial = async uid => (await db.collection('one_kyc_revisiones').orderBy('fecha').get()).docs.map(d => d.data()).filter(r => r.uid === uid)

  const sim = await correr({ aplicar: false })
  assert.deepEqual([sim.aprobados, sim.rechazados, sim.sinEstadoDeRevision, sim.activosSinRegistro], [1, 1, 1, 1])
  assert.equal((await leer('one_usuarios/bueno')).estadoKyc, 'PENDING_REVIEW')
  assert.equal((await db.collection('one_kyc_revisiones').get()).size, 0)

  const sinFacial = await correr({ analizarFotos: null })
  assert.deepEqual([sinFacial.aprobados, sinFacial.rechazados, sinFacial.pendientes], [0, 1, 1])

  const real = await correr()   // reintenta lo pendiente; no repite lo rechazado sin cambios
  assert.deepEqual([real.evaluados, real.aprobados], [1, 1])
  const bueno = await leer('one_usuarios/bueno')
  assert.equal(bueno.estadoKyc, 'ACTIVO')
  assert.equal(bueno.caficultor.activo, true)
  assert.equal(bueno.caficultor.dni, '11111111')
  assert.deepEqual((await historial('bueno')).map(r => r.resultado), ['PENDIENTE', 'APROBADO'])
  assert.deepEqual((await historial('bueno'))[1].criteriosPendientes, [])
  const malo = (await historial('malo'))[0]
  assert.equal(malo.resultado, 'RECHAZADO')
  assert.deepEqual(malo.pasos.find(p => p.id === 'DNI'), { id: 'DNI', estado: 'NO_CUMPLE', motivos: ['DNI_SIN_RESERVA'] })
  assert.equal((await leer('one_usuarios/malo')).estadoKyc, 'RECHAZADO')

  // El rechazado corrige el problema y cambia un dato: se revisa de nuevo y se aprueba
  await reservar('22222222', 'malo')
  await db.doc('one_usuarios/malo').update({ 'caficultor.distrito': 'San Ignacio' })
  assert.equal((await correr()).aprobados, 1)

  // Un rechazo del admin no lo deshace el job
  await db.doc('one_usuarios/malo').update({ estadoKyc: 'RECHAZADO', 'caficultor.distrito': 'Otro' })
  await db.collection('one_kyc_revisiones').add({ uid: 'malo', origen: 'ADMIN', resultado: 'RECHAZADO', fecha: FieldValue.serverTimestamp() })
  assert.equal((await correr()).evaluados, 0)

  // Sin padrón de SUNAT: queda pendiente (no rechazado) y la ejecución se marca con error
  await db.doc('one_usuarios/conruc').set(seller('55555555', '987000005'))
  await db.doc('one_usuarios/conruc').update({ 'caficultor.tipoRegistroCaficultor': 'RUC_PROPIO', 'caficultor.ruc': '20131312955' })
  await reservar('55555555', 'conruc')
  await db.doc('one_documentos/RUC_20131312955').set({ uid: 'conruc' })
  const caida = await correr({ consultarPadron: async () => { throw new Error('caído') } })
  assert.deepEqual([caida.pendientes, caida.rechazados, caida.errores], [1, 0, 1])
  assert.equal((await leer('one_usuarios/conruc')).estadoKyc, 'PENDING_REVIEW')
  await db.doc('one_usuarios/conruc').delete()

  // Cuenta de Cloudinary mal configurada: pendiente (no rechazado), con error, y se reintenta al corregirla
  await db.doc('one_usuarios/foto').set(seller('66666666', '987000006'))
  await reservar('66666666', 'foto')
  const malConfigurado = await correr({
    analizarFotos: async () => { throw Object.assign(new Error('x'), { motivo: 'FOTO_ORIGEN_NO_PERMITIDO' }) },
  })
  assert.deepEqual([malConfigurado.pendientes, malConfigurado.rechazados, malConfigurado.errores], [1, 0, 1])
  assert.equal((await leer('one_usuarios/foto')).estadoKyc, 'PENDING_REVIEW')
  assert.equal((await correr()).aprobados, 1)

  // Si el perfil cambia mientras se analiza, no se decide
  await db.doc('one_usuarios/cambia').set(seller('44444444', '987000004'))
  await reservar('44444444', 'cambia')
  const carrera = await correr({
    analizarFotos: async p => { await db.doc('one_usuarios/cambia').update({ 'caficultor.numeroYape': '987999999' }); return analizarFotos(p) },
  })
  assert.deepEqual([carrera.aprobados, carrera.errores], [0, 1])
  assert.equal((await historial('cambia')).length, 0)
  assert.equal((await correr()).aprobados, 1)
})
