// Criterios de validación automática de caficultores (F-03).
// Funciones puras: sin red ni base de datos. Ningún motivo contiene datos personales.
//
// Se aprueba solo si TODO pasa. Se rechaza si algún criterio no se cumple. Queda pendiente si lo
// único que falta es una revisión humana o el job no pudo comprobar algo.

export const VERSION = 1
export const SIMILITUD_MINIMA = 95

const MODALIDADES = ['SOLO_DNI', 'RUC_PROPIO', 'COOPERATIVA']

export function normalizarTexto(t) {
  return String(t ?? '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
}

/** Celular peruano de 9 dígitos, o null. */
export function normalizarCelular(t) {
  let d = String(t ?? '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('51')) d = d.slice(2)
  return /^9\d{8}$/.test(d) ? d : null
}

export function esRucValido(ruc) {
  if (!/^(10|15|17|20)\d{9}$/.test(ruc ?? '')) return false
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let dv = 11 - (pesos.reduce((s, p, i) => s + p * Number(ruc[i]), 0) % 11)
  if (dv >= 10) dv -= 10
  return dv === Number(ruc[10])
}

/** Al menos dos palabras del nombre del perfil aparecen en el texto de referencia. */
export function nombreCoincide(nombre, referencia) {
  const palabras = [...new Set(normalizarTexto(nombre).split(' ').filter(p => p.length >= 3))]
  const ref = new Set(normalizarTexto(referencia).split(' '))
  return palabras.filter(p => ref.has(p)).length >= 2
}

export function dniEnTexto(dni, lineas) {
  return lineas.some(l => (String(l).match(/(?<!\d)\d{8}(?!\d)/g) ?? []).includes(dni))
}

/** RUC que hay que buscar en el padrón de SUNAT para este perfil (o null). */
export function rucAConsultar(perfil) {
  const c = perfil.caficultor ?? {}
  const ruc = c.tipoRegistroCaficultor === 'RUC_PROPIO' ? c.ruc
    : c.tipoRegistroCaficultor === 'COOPERATIVA' ? c.rucCooperativa : null
  return esRucValido(ruc) ? ruc : null
}

/** Motivos que dependen solo de los datos guardados (no cuestan llamadas externas). */
export function motivosDeDatos(uid, perfil, contexto) {
  const m = []
  const c = perfil.caficultor ?? {}
  const dni = c.dni
  const modalidad = c.tipoRegistroCaficultor

  if (!String(perfil.nombre ?? '').trim() || !c.region || !c.distrito) m.push('DATOS_INCOMPLETOS')

  if (!/^\d{8}$/.test(dni ?? '')) m.push('DNI_INVALIDO')
  else {
    if (contexto.duenoDni !== uid) m.push('DNI_SIN_RESERVA')
    if (contexto.dniRepetido) m.push('DNI_REPETIDO')
  }

  if (!MODALIDADES.includes(modalidad)) m.push('MODALIDAD_AUSENTE')

  if (modalidad === 'RUC_PROPIO') {
    if (!esRucValido(c.ruc)) m.push('RUC_INVALIDO')
    else {
      if (c.ruc.startsWith('10') && c.ruc.slice(2, 10) !== dni) m.push('RUC_NO_CORRESPONDE_AL_DNI')
      if (contexto.duenoRuc !== uid) m.push('RUC_SIN_RESERVA')
    }
  }

  if (modalidad === 'COOPERATIVA') {
    if (!esRucValido(c.rucCooperativa) || !c.rucCooperativa.startsWith('20')) m.push('RUC_INVALIDO')
    if (!/^\d{20}$/.test(String(c.cciCooperativa ?? '').replace(/[\s-]/g, ''))) m.push('CCI_INVALIDO')
    // No hay forma de comprobar que la persona es socia ni que el CCI es de la cooperativa
    m.push('COOPERATIVA_REVISION_MANUAL')
  } else {
    if (!normalizarCelular(c.numeroYape ?? c.yape)) m.push('YAPE_INVALIDO')
    else if (contexto.yapeRepetido) m.push('YAPE_REPETIDO')
  }

  if (!perfil.fotoDniUrl || !perfil.fotoSelfieUrl) m.push('FOTOS_AUSENTES')
  else if (contexto.fotoRepetida) m.push('FOTO_USADA_EN_OTRA_CUENTA')

  return m
}

export function motivosDePadron(perfil, padron) {
  const ruc = rucAConsultar(perfil)
  if (!ruc) return []
  if (!padron) return ['SIN_PADRON_SUNAT']
  const fila = padron.get(ruc)
  if (!fila) return ['RUC_NO_FIGURA_EN_SUNAT']
  const m = []
  if (fila.estado !== 'ACTIVO') m.push('RUC_NO_ACTIVO')
  if (fila.condicion !== 'HABIDO') m.push('RUC_NO_HABIDO')
  if (ruc.startsWith('10') && !nombreCoincide(perfil.nombre, fila.nombre)) m.push('NOMBRE_NO_COINCIDE_CON_SUNAT')
  return m
}

/** @param fotos resultado de analizar las imágenes: { mismaImagen, similitud, rostrosEnSelfie, lineasDni } */
export function motivosDeFotos(perfil, fotos, similitudMinima = SIMILITUD_MINIMA) {
  const m = []
  if (fotos.mismaImagen) m.push('SELFIE_IGUAL_A_FOTO_DNI')
  if (!(fotos.similitud >= similitudMinima)) m.push('ROSTRO_NO_COINCIDE')
  // "Selfie sosteniendo el DNI": la cara de la persona y la del documento
  if (!(fotos.rostrosEnSelfie >= 2)) m.push('SELFIE_SIN_DNI')
  const dni = perfil.caficultor?.dni
  if (!dniEnTexto(dni, fotos.lineasDni)) m.push('DNI_NO_COINCIDE_CON_FOTO')
  if (!nombreCoincide(perfil.nombre, fotos.lineasDni.join(' '))) m.push('NOMBRE_NO_COINCIDE_CON_DNI')
  return m
}

/** Motivos por fallos del propio job: se reintenta la noche siguiente aunque el perfil no cambie. */
// FOTO_ORIGEN_NO_PERMITIDO suele ser una CLOUDINARY_CLOUD_NAME mal escrita: nunca rechaza y se reintenta.
const TRANSITORIOS = new Set(['SIN_VERIFICACION_FACIAL', 'SIN_PADRON_SUNAT', 'ERROR_ANALISIS_FOTOS',
  'FOTO_NO_DISPONIBLE', 'FOTO_ORIGEN_NO_PERMITIDO'])
export const esTransitorio = motivo => TRANSITORIOS.has(motivo)

/** Motivos que no prueban un incumplimiento: nunca provocan rechazo. */
const DECIDE_EL_ADMIN = new Set(['COOPERATIVA_REVISION_MANUAL', 'FOTO_FORMATO_NO_SOPORTADO', 'FOTO_DEMASIADO_GRANDE'])
export const provocaRechazo = motivo => !esTransitorio(motivo) && !DECIDE_EL_ADMIN.has(motivo)

export const decidir = motivos =>
  motivos.length === 0 ? 'APROBADO' : motivos.some(provocaRechazo) ? 'RECHAZADO' : 'PENDIENTE'

/** Pasos de la validación, en el orden en que los ve el admin. */
export const PASOS = {
  DATOS: ['DATOS_INCOMPLETOS', 'MODALIDAD_AUSENTE'],
  DNI: ['DNI_INVALIDO', 'DNI_SIN_RESERVA', 'DNI_REPETIDO'],
  RUC: ['RUC_INVALIDO', 'RUC_NO_CORRESPONDE_AL_DNI', 'RUC_SIN_RESERVA', 'SIN_PADRON_SUNAT',
    'RUC_NO_FIGURA_EN_SUNAT', 'RUC_NO_ACTIVO', 'RUC_NO_HABIDO', 'NOMBRE_NO_COINCIDE_CON_SUNAT'],
  COBRO: ['CCI_INVALIDO', 'YAPE_INVALIDO', 'YAPE_REPETIDO', 'COOPERATIVA_REVISION_MANUAL'],
  FOTOS: ['FOTOS_AUSENTES', 'FOTO_USADA_EN_OTRA_CUENTA', 'FOTO_ORIGEN_NO_PERMITIDO', 'FOTO_NO_DISPONIBLE',
    'FOTO_DEMASIADO_GRANDE', 'FOTO_FORMATO_NO_SOPORTADO', 'SELFIE_IGUAL_A_FOTO_DNI'],
  IDENTIDAD: ['ROSTRO_NO_COINCIDE', 'ROSTRO_NO_DETECTADO', 'SELFIE_SIN_DNI', 'DNI_NO_COINCIDE_CON_FOTO',
    'NOMBRE_NO_COINCIDE_CON_DNI', 'SIN_VERIFICACION_FACIAL', 'ERROR_ANALISIS_FOTOS'],
}

export function armarPasos(perfil, motivos, { identidadEvaluada }) {
  const modalidad = perfil.caficultor?.tipoRegistroCaficultor
  return Object.entries(PASOS).map(([id, codigos]) => {
    const propios = motivos.filter(m => codigos.includes(m))
    let estado = 'CUMPLE'
    if (propios.length) estado = propios.some(provocaRechazo) ? 'NO_CUMPLE' : 'PENDIENTE'
    else if (id === 'RUC' && modalidad === 'SOLO_DNI') estado = 'NO_APLICA'
    else if ((id === 'RUC' && !modalidad) || (id === 'IDENTIDAD' && !identidadEvaluada)) estado = 'NO_EVALUADO'
    return { id, estado, motivos: propios }
  })
}

/** Cambia cuando el caficultor modifica algo de lo que se valida. */
export function datosValidados(perfil) {
  const c = perfil.caficultor ?? {}
  return JSON.stringify([perfil.nombre, c.region, c.distrito, c.dni, c.tipoRegistroCaficultor, c.ruc,
    c.rucCooperativa, c.cciCooperativa, c.numeroYape ?? c.yape, perfil.fotoDniUrl, perfil.fotoSelfieUrl])
}
