// firestore.rules contra el emulador: nadie se aprueba solo y toda decisión del admin queda registrada.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, getDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore'

const emulador = process.env.FIRESTORE_EMULATOR_HOST
const opciones = { skip: !emulador && 'sin emulador' }
let env

before(async () => {
  if (!emulador) return
  env = await initializeTestEnvironment({
    projectId: 'demo-kyc-rules',
    firestore: { rules: readFileSync(new URL('../../../firestore.rules', import.meta.url), 'utf8') },
  })
})
after(async () => { await env?.cleanup() })

const como = (uid, token = {}) => env.authenticatedContext(uid, token).firestore()
const admin = () => como('jefe', { email: 'tunaywasi@gmail.com', email_verified: true })
const perfil = (uid, extra = {}) => ({ uid, rol: 'seller', nombre: 'Ana', estadoKyc: 'PENDING_REVIEW', caficultor: { activo: false, dni: '11111111' }, ...extra })
async function sembrar(uid, datos = perfil(uid)) {
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'one_usuarios', uid), datos))
}

test('el dueño crea su perfil en revisión y completa sus datos', opciones, async () => {
  const db = como('a')
  await assertSucceeds(setDoc(doc(db, 'one_usuarios', 'a'), perfil('a')))
  await assertSucceeds(updateDoc(doc(db, 'one_usuarios', 'a'), { 'caficultor.numeroYape': '987654321', onboarding: { estado: 'completo' } }))
  await assertSucceeds(setDoc(doc(db, 'one_usuarios', 'a'), { caficultor: { activo: false, region: 'Cusco' } }, { merge: true }))
  // Altas sin KYC (login, Android, personas)
  await assertSucceeds(setDoc(doc(como('b'), 'one_usuarios', 'b'), { uid: 'b', rol: 'buyer_b2c', nombre: 'B' }))
  await assertSucceeds(setDoc(doc(como('c'), 'one_usuarios', 'c'), { uid: 'c', rol: 'seller', nombre: 'C' }))
  await assertSucceeds(updateDoc(doc(como('c'), 'one_usuarios', 'c'), { estadoKyc: 'PENDING_REVIEW' }))
})

test('nadie se aprueba, se activa ni se hace admin por su cuenta', opciones, async () => {
  await assertFails(setDoc(doc(como('d'), 'one_usuarios', 'd'), perfil('d', { estadoKyc: 'ACTIVO' })))
  await assertFails(setDoc(doc(como('e'), 'one_usuarios', 'e'), perfil('e', { caficultor: { activo: true } })))
  await assertFails(setDoc(doc(como('f'), 'one_usuarios', 'f'), { uid: 'f', rol: 'admin' }))
  await assertSucceeds(setDoc(doc(admin(), 'one_usuarios', 'jefe'), { uid: 'jefe', rol: 'admin' }))
  await sembrar('g')
  const db = como('g')
  await assertFails(updateDoc(doc(db, 'one_usuarios', 'g'), { estadoKyc: 'ACTIVO' }))
  await assertFails(updateDoc(doc(db, 'one_usuarios', 'g'), { 'caficultor.activo': true }))
  await assertFails(updateDoc(doc(db, 'one_usuarios', 'g'), { kycRevisionId: 'x' }))
  await assertFails(setDoc(doc(db, 'one_kyc_revisiones', 'x'), { uid: 'g', resultado: 'APROBADO' }))
  await sembrar('h', perfil('h', { estadoKyc: 'RECHAZADO' }))
  await assertFails(updateDoc(doc(como('h'), 'one_usuarios', 'h'), { estadoKyc: 'PENDING_REVIEW' }))
})

function decision(db, uid, id, { revision = {}, usuario = {} } = {}) {
  const lote = writeBatch(db)
  lote.set(doc(db, 'one_kyc_revisiones', id), {
    uid, origen: 'ADMIN', resultado: 'APROBADO', criteriosPendientes: ['DNI'], mensaje: 'Verifiqué el DNI en persona',
    adminUid: 'jefe', adminEmail: 'tunaywasi@gmail.com', fecha: serverTimestamp(), ...revision,
  })
  lote.update(doc(db, 'one_usuarios', uid), { estadoKyc: 'ACTIVO', 'caficultor.activo': true, kycRevisionId: id, updatedAt: serverTimestamp(), ...usuario })
  return lote.commit()
}

test('el admin decide solo si queda el registro de auditoría', opciones, async () => {
  await sembrar('i')
  const db = admin()
  await assertFails(updateDoc(doc(db, 'one_usuarios', 'i'), { estadoKyc: 'ACTIVO' }))           // sin registro
  await assertFails(decision(db, 'i', 'r1', { revision: { mensaje: 'ok' } }))                   // faltan criterios y mensaje
  await assertFails(decision(db, 'i', 'r2', { revision: { adminEmail: 'otro@tunaywasi.pe' } })) // firma ajena
  await assertFails(decision(db, 'i', 'r3', { revision: { resultado: 'RECHAZADO' } }))          // no concuerda
  await assertFails(decision(db, 'i', 'r4', { usuario: { nombre: 'Cambiado' } }))               // toca otros datos
  await assertFails(decision(db, 'i', 'r5', { usuario: { 'caficultor.dni': '99999999' } }))
  await assertFails(decision(como('j', { email: 'x@gmail.com', email_verified: true }), 'i', 'r6'))
  await assertSucceeds(decision(db, 'i', 'r7'))
  await assertSucceeds(getDoc(doc(db, 'one_kyc_revisiones', 'r7')))
  await assertFails(getDoc(doc(como('i'), 'one_kyc_revisiones', 'r7')))                         // solo admins
  await assertFails(updateDoc(doc(db, 'one_kyc_revisiones', 'r7'), { mensaje: 'editado después' }))
  await assertFails(deleteDoc(doc(db, 'one_kyc_revisiones', 'r7')))
  // Reutilizar un registro anterior para otra decisión
  await assertFails(updateDoc(doc(db, 'one_usuarios', 'i'), { estadoKyc: 'RECHAZADO', kycRevisionId: 'r7' }))
  // Sin criterios pendientes no exige mensaje
  await sembrar('k')
  await assertSucceeds(decision(db, 'k', 'r8', { revision: { criteriosPendientes: [], mensaje: '' } }))
})
