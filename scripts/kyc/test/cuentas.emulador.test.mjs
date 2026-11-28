// Requiere emuladores de Firestore y Auth. Comprueba que el job de KYC da el resultado anunciado.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { crearCuentas } from '../cuentas.mjs'
import { ejecutar } from '../job.mjs'

const listo = process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST

test('crea los tres tipos de cuenta y el KYC responde como se anuncia', { skip: !listo && 'sin emuladores' }, async () => {
  const app = initializeApp({ projectId: 'demo-kyc-cuentas' }, 'cuentas')
  const db = getFirestore(app)
  const auth = getAuth(app)
  const clave = 'ClaveDePrueba1'
  const caficultores = await crearCuentas({ db, auth, tipo: 'caficultor', clave })
  assert.equal(caficultores.length, 5)
  for (const tipo of ['cliente-DNI', 'cliente-RUC']) assert.equal((await crearCuentas({ db, auth, tipo, clave })).length, 5)
  assert.equal((await auth.listUsers()).users.length, 15)
  // Una segunda tanda no choca con la primera
  await crearCuentas({ db, auth, tipo: 'cliente-DNI', cantidad: 2, clave, marca: 'otra' })

  const b2c = (await db.collection('one_usuarios').where('rol', '==', 'buyer_b2c').get()).docs[0].data()
  assert.equal((await db.doc(`one_documentos/DNI_B2C_${b2c.consumidor.dni}`).get()).data().uid, b2c.uid)
  const b2b = (await db.collection('one_usuarios').where('rol', '==', 'buyer_b2b').get()).docs[0].data()
  assert.equal(b2b.empresa.estadoAprobacion, 'PENDING_APPROVAL')

  const padron = async () => new Map([['20131312955', { nombre: 'X', estado: 'ACTIVO', condicion: 'HABIDO' }]])
  const r = await ejecutar({ db, consultarPadron: padron, analizarFotos: null, aplicar: true, omitirRostro: true })
  assert.deepEqual([r.aprobados, r.rechazados, r.pendientes, r.errores], [2, 2, 1, 0])
  for (const c of caficultores) {
    const estado = (await db.doc(`one_usuarios/${c.uid}`).get()).data().estadoKyc
    assert.equal(estado, { APROBADO: 'ACTIVO', RECHAZADO: 'RECHAZADO', PENDIENTE: 'PENDING_REVIEW' }[c.esperado], c.caso)
  }

  await assert.rejects(crearCuentas({ db: { projectId: 'tunay-wasi' }, auth, tipo: 'caficultor', clave }), /No se crean/)
  await assert.rejects(crearCuentas({ db, auth, tipo: 'admin', clave }), /Tipo no válido/)
  await assert.rejects(crearCuentas({ db, auth, tipo: 'caficultor', cantidad: 500, clave }), /entre 1 y 20/)
})
