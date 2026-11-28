// Orquestación: revisa a los caficultores, y solo con `aplicar` cambia su estado. Cada revisión se
// añade a `one_kyc_revisiones` (historial que solo ven los admins). La salida no incluye datos personales.
import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import {
  VERSION, normalizarCelular, rucAConsultar, motivosDeDatos, motivosDePadron, motivosDeFotos,
  esTransitorio, provocaRechazo, decidir, armarPasos, datosValidados,
} from './reglas.mjs'

const USUARIOS = 'one_usuarios'
const REVISIONES = 'one_kyc_revisiones'
const ESTADO = { APROBADO: 'ACTIVO', RECHAZADO: 'RECHAZADO', PENDIENTE: 'PENDING_REVIEW' }

const huella = perfil => createHash('sha256').update(datosValidados(perfil)).digest('hex')

function contar(lista) {
  const m = new Map()
  for (const v of lista) if (v) m.set(v, (m.get(v) ?? 0) + 1)
  return v => m.get(v) ?? 0
}

/** Última revisión de cada caficultor. */
async function ultimasRevisiones(db) {
  const ultimas = new Map()
  for (const d of (await db.collection(REVISIONES).orderBy('fecha').get()).docs) ultimas.set(d.data().uid, d.data())
  return ultimas
}

/** En revisión: si hay algo nuevo. Rechazado por el job: solo si corrigió sus datos. */
function porRevisar(perfil, previa) {
  const igual = previa && previa.huella === huella(perfil) && previa.version === VERSION
  if (perfil.estadoKyc === 'PENDING_REVIEW') return !igual || previa.reintentar === true || previa.origen !== 'JOB'
  return previa?.origen === 'JOB' && previa.huella !== huella(perfil)
}

export async function ejecutar({ db, analizarFotos, consultarPadron, aplicar = false, maximo = 50, similitudMinima }) {
  const sellers = (await db.collection(USUARIOS).where('rol', '==', 'seller').get()).docs
  const datos = sellers.map(d => d.data())
  const vecesDni = contar(datos.map(p => p.caficultor?.dni))
  const vecesYape = contar(datos.map(p => normalizarCelular(p.caficultor?.numeroYape ?? p.caficultor?.yape)))
  const vecesFoto = contar(datos.flatMap(p => [p.fotoDniUrl, p.fotoSelfieUrl]))
  const revisiones = await ultimasRevisiones(db)

  const resumen = {
    modo: aplicar ? 'APLICAR' : 'SIMULACIÓN',
    caficultores: sellers.length,
    porRevisar: 0, evaluados: 0, sinCambios: 0, aplazados: 0,
    aprobados: 0, rechazados: 0, pendientes: 0, errores: 0,
    // Cuentas que este job no puede evaluar o que conviene mirar
    sinEstadoDeRevision: datos.filter(p => !p.estadoKyc).length,
    activosSinRegistro: sellers.filter(d => d.data().estadoKyc === 'ACTIVO' && revisiones.get(d.id)?.resultado !== 'APROBADO').length,
    motivos: {},
  }

  const candidatos = []
  for (const d of sellers) {
    const perfil = d.data()
    if (!['PENDING_REVIEW', 'RECHAZADO'].includes(perfil.estadoKyc)) continue
    if (!porRevisar(perfil, revisiones.get(d.id))) {
      if (perfil.estadoKyc === 'PENDING_REVIEW') resumen.sinCambios++
      continue
    }
    resumen.porRevisar++
    if (candidatos.length < maximo) candidatos.push(d)
    else resumen.aplazados++
  }

  const rucs = [...new Set(candidatos.map(d => rucAConsultar(d.data())).filter(Boolean))]
  let padron = null
  if (rucs.length) {
    try { padron = await consultarPadron(rucs) } catch (e) {
      console.error(`Padrón SUNAT no disponible: ${e.message}`)
      resumen.errores++   // la ejecución debe verse fallida, aunque el resto se haya evaluado
    }
  }

  for (const d of candidatos) {
    const uid = d.id
    const perfil = d.data()
    try {
      const c = perfil.caficultor ?? {}
      const dueno = async clave => (await db.collection('one_documentos').doc(clave).get()).data()?.uid
      const contexto = {
        duenoDni: /^\d{8}$/.test(c.dni ?? '') ? await dueno(`DNI_SELLER_${c.dni}`) : undefined,
        duenoRuc: /^\d{11}$/.test(c.ruc ?? '') ? await dueno(`RUC_${c.ruc}`) : undefined,
        dniRepetido: vecesDni(c.dni) > 1,
        yapeRepetido: vecesYape(normalizarCelular(c.numeroYape ?? c.yape)) > 1,
        fotoRepetida: vecesFoto(perfil.fotoDniUrl) > 1 || vecesFoto(perfil.fotoSelfieUrl) > 1,
      }
      const motivos = [...motivosDeDatos(uid, perfil, contexto), ...motivosDePadron(perfil, padron)]
      let similitud = null
      let identidadEvaluada = false
      // Las fotos (de pago) no se analizan si la cuenta ya incumple otro criterio
      if (!motivos.some(provocaRechazo)) {
        if (!analizarFotos) motivos.push('SIN_VERIFICACION_FACIAL')
        else {
          try {
            const fotos = await analizarFotos(perfil)
            identidadEvaluada = true
            similitud = fotos.similitud
            motivos.push(...motivosDeFotos(perfil, fotos, similitudMinima))
          } catch (e) {
            // InvalidParameterException: Rekognition no encontró una cara en la imagen
            if (e.motivo) {
              motivos.push(e.motivo)
              if (e.motivo === 'FOTO_ORIGEN_NO_PERMITIDO') {
                console.error('Foto fuera de la cuenta de Cloudinary configurada: revisa CLOUDINARY_CLOUD_NAME')
                resumen.errores++
              }
            }
            else if (e.name === 'InvalidParameterException') motivos.push('ROSTRO_NO_DETECTADO')
            else { console.error(`Análisis de fotos falló: ${e.name}`); motivos.push('ERROR_ANALISIS_FOTOS'); resumen.errores++ }
          }
        }
      }

      const resultado = decidir(motivos)
      const contador = { APROBADO: 'aprobados', RECHAZADO: 'rechazados', PENDIENTE: 'pendientes' }[resultado]
      for (const m of motivos) resumen.motivos[m] = (resumen.motivos[m] ?? 0) + 1
      if (!aplicar) { resumen.evaluados++; resumen[contador]++; continue }

      const pasos = armarPasos(perfil, motivos, { identidadEvaluada })
      const refRevision = db.collection(REVISIONES).doc()
      const lote = db.batch()
      // La precondición evita decidir sobre un perfil que cambió mientras se revisaba
      lote.update(d.ref, {
        estadoKyc: ESTADO[resultado], 'caficultor.activo': resultado === 'APROBADO',
        kycRevisionId: refRevision.id, updatedAt: FieldValue.serverTimestamp(),
      }, { lastUpdateTime: d.updateTime })
      lote.create(refRevision, {
        uid, nombre: perfil.nombre ?? '', origen: 'JOB', resultado, pasos,
        criteriosPendientes: pasos.filter(p => !['CUMPLE', 'NO_APLICA'].includes(p.estado)).map(p => p.id),
        similitud, version: VERSION, huella: huella(perfil),
        reintentar: resultado === 'PENDIENTE' && motivos.some(esTransitorio),
        fecha: FieldValue.serverTimestamp(),
      })
      await lote.commit()
      resumen.evaluados++
      resumen[contador]++
    } catch (e) {
      resumen.errores++
      console.error(`Error al revisar un perfil: ${e.name} ${e.code ?? ''}`)
    }
  }
  return resumen
}
