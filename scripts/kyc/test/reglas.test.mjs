import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  esRucValido, normalizarCelular, nombreCoincide, dniEnTexto,
  motivosDeDatos, motivosDePadron, motivosDeFotos, decidir, armarPasos,
} from '../reglas.mjs'
import { urlPermitida, evaluarCaras } from '../fotos.mjs'

// RUC 10 ficticio con dígito verificador correcto para el DNI 12345678
const RUC10 = [...'0123456789'].map(d => `1012345678${d}`).find(esRucValido)
const perfil = (caficultor = {}, extra = {}) => ({
  nombre: 'Ana Quispe Rojas', fotoDniUrl: 'a', fotoSelfieUrl: 'b',
  caficultor: { region: 'Cajamarca', distrito: 'Jaén', dni: '12345678', tipoRegistroCaficultor: 'SOLO_DNI', numeroYape: '+51 987 654 321', ...caficultor },
  ...extra,
})
const ctx = { duenoDni: 'u1', duenoRuc: 'u1' }
const fotos = (extra = {}) => ({
  mismaImagen: false, similitud: 99, rostrosEnSelfie: 2,
  lineasDni: ['REPÚBLICA DEL PERÚ', 'CUI 12345678-9', 'QUISPE', 'ROJAS', 'ANA'], ...extra,
})

test('un perfil completo no tiene motivos', () => {
  assert.deepEqual(motivosDeDatos('u1', perfil(), ctx), [])
  assert.deepEqual(motivosDeFotos(perfil(), fotos()), [])
})

test('formatos', () => {
  assert.equal(esRucValido('20131312955'), true)
  assert.equal(esRucValido('20131312954'), false)
  assert.equal(normalizarCelular('+51 987 654 321'), '987654321')
  assert.equal(normalizarCelular('12345'), null)
  assert.equal(nombreCoincide('José Ñahui', 'ÑAHUI JOSE'), true)
  assert.equal(nombreCoincide('Ana Quispe', 'ANA TORRES'), false)
  assert.equal(dniEnTexto('12345678', ['CUI 12345678-9']), true)
  assert.equal(dniEnTexto('12345678', ['9123456780']), false)
})

test('datos: DNI ajeno, repetidos y fotos ausentes', () => {
  const m = motivosDeDatos('u1', perfil({}, { fotoSelfieUrl: '' }), { duenoDni: 'otro', dniRepetido: true, yapeRepetido: true })
  assert.deepEqual(m, ['DNI_SIN_RESERVA', 'DNI_REPETIDO', 'YAPE_REPETIDO', 'FOTOS_AUSENTES'])
})

test('cooperativa siempre pasa a revisión manual', () => {
  const p = perfil({ tipoRegistroCaficultor: 'COOPERATIVA', rucCooperativa: '20131312955', cciCooperativa: '0'.repeat(20) })
  assert.deepEqual(motivosDeDatos('u1', p, ctx), ['COOPERATIVA_REVISION_MANUAL'])
})

test('RUC propio contra el padrón', () => {
  const p = perfil({ tipoRegistroCaficultor: 'RUC_PROPIO', ruc: RUC10 })
  assert.deepEqual(motivosDeDatos('u1', p, ctx), [])
  const fila = (estado, condicion, nombre = 'QUISPE ROJAS ANA') => new Map([[RUC10, { nombre, estado, condicion }]])
  assert.deepEqual(motivosDePadron(p, fila('ACTIVO', 'HABIDO')), [])
  assert.deepEqual(motivosDePadron(p, fila('BAJA DE OFICIO', 'NO HABIDO', 'OTRA PERSONA')),
    ['RUC_NO_ACTIVO', 'RUC_NO_HABIDO', 'NOMBRE_NO_COINCIDE_CON_SUNAT'])
  assert.deepEqual(motivosDePadron(p, new Map()), ['RUC_NO_FIGURA_EN_SUNAT'])
  assert.deepEqual(motivosDePadron(p, null), ['SIN_PADRON_SUNAT'])
})

test('fotos: cada fallo impide aprobar', () => {
  assert.deepEqual(motivosDeFotos(perfil(), fotos({ mismaImagen: true })), ['SELFIE_IGUAL_A_FOTO_DNI'])
  assert.deepEqual(motivosDeFotos(perfil(), fotos({ similitud: 80 })), ['ROSTRO_NO_COINCIDE'])
  assert.deepEqual(motivosDeFotos(perfil(), fotos({ rostrosEnSelfie: 1 })), ['SELFIE_SIN_DNI'])
  assert.deepEqual(motivosDeFotos(perfil(), fotos({ lineasDni: ['texto ilegible'] })),
    ['DNI_NO_COINCIDE_CON_FOTO', 'NOMBRE_NO_COINCIDE_CON_DNI'])
})

test('cuenta la cara más grande de la selfie, no la del documento', () => {
  const caja = (w) => ({ BoundingBox: { Width: w, Height: w } })
  const r = evaluarCaras({ FaceMatches: [{ Similarity: 99, Face: caja(0.1) }], UnmatchedFaces: [caja(0.5)] })
  assert.deepEqual(r, { similitud: 0, rostrosEnSelfie: 2 })
})

test('solo se descargan fotos del Cloudinary propio', () => {
  assert.equal(urlPermitida('https://res.cloudinary.com/mia/image/upload/v1/one_kyc/x.jpg', 'mia'), true)
  for (const u of ['http://res.cloudinary.com/mia/image/upload/x.jpg', 'https://res.cloudinary.com/otra/image/upload/x.jpg',
    'https://res.cloudinary.com/mia/image/fetch/https://x', 'https://res.cloudinary.com.evil.test/mia/image/upload/x',
    'https://res.cloudinary.com/mia/image/upload/../../../otra/image/upload/x', 'https://169.254.169.254/', 'no-url'])
    assert.equal(urlPermitida(u, 'mia'), false, u)
})

test('decisión: rechaza incumplimientos; fallos técnicos y cooperativa quedan pendientes', () => {
  assert.equal(decidir([]), 'APROBADO')
  assert.equal(decidir(['ROSTRO_NO_COINCIDE']), 'RECHAZADO')
  assert.equal(decidir(['SIN_VERIFICACION_FACIAL']), 'PENDIENTE')
  assert.equal(decidir(['COOPERATIVA_REVISION_MANUAL']), 'PENDIENTE')
  assert.equal(decidir(['SIN_PADRON_SUNAT', 'DNI_REPETIDO']), 'RECHAZADO')
  assert.equal(decidir(['FOTO_ORIGEN_NO_PERMITIDO']), 'PENDIENTE')
})

test('pasos: cada uno indica si cumple', () => {
  const estados = armarPasos(perfil(), ['DNI_REPETIDO'], { identidadEvaluada: false }).map(p => `${p.id}:${p.estado}`)
  assert.deepEqual(estados, ['DATOS:CUMPLE', 'DNI:NO_CUMPLE', 'RUC:NO_APLICA', 'COBRO:CUMPLE', 'FOTOS:CUMPLE', 'IDENTIDAD:NO_EVALUADO'])
})
