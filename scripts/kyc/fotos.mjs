// Descarga de las fotos KYC y análisis con AWS Rekognition.
// Limitación: no detecta imágenes generadas por IA ni documentos falsificados.
import { createHash } from 'node:crypto'
import { RekognitionClient, CompareFacesCommand, DetectTextCommand } from '@aws-sdk/client-rekognition'

const MAX_BYTES = 5 * 1024 * 1024   // límite de Rekognition para imágenes en bytes

export class FotoInvalida extends Error {
  constructor(motivo) { super(motivo); this.motivo = motivo }
}

/** La URL la escribe el usuario: solo se aceptan imágenes del Cloudinary propio. */
export function urlPermitida(url, cloudName) {
  try {
    const u = new URL(url)
    return !!cloudName && u.protocol === 'https:' && u.hostname === 'res.cloudinary.com' && !u.port &&
      !u.username && u.pathname.startsWith(`/${cloudName}/image/upload/`)
  } catch { return false }
}

async function descargar(url, cloudName) {
  if (!urlPermitida(url, cloudName)) throw new FotoInvalida('FOTO_ORIGEN_NO_PERMITIDO')
  const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new FotoInvalida('FOTO_NO_DISPONIBLE')
  const trozos = []
  let total = 0
  for await (const t of res.body) {
    total += t.length
    if (total > MAX_BYTES) throw new FotoInvalida('FOTO_DEMASIADO_GRANDE')
    trozos.push(t)
  }
  const b = Buffer.concat(trozos)
  const jpeg = b[0] === 0xff && b[1] === 0xd8
  const png = b.subarray(0, 4).toString('hex') === '89504e47'
  if (!jpeg && !png) throw new FotoInvalida('FOTO_FORMATO_NO_SOPORTADO')
  return b
}

const area = c => (c.BoundingBox?.Width ?? 0) * (c.BoundingBox?.Height ?? 0)

/**
 * La similitud que cuenta es la de la cara MÁS GRANDE de la selfie (la persona). Así no basta
 * con que coincida la cara del DNI que sostiene.
 */
export function evaluarCaras(respuesta) {
  const caras = [
    ...(respuesta.FaceMatches ?? []).map(f => ({ area: area(f.Face), similitud: f.Similarity })),
    ...(respuesta.UnmatchedFaces ?? []).map(f => ({ area: area(f), similitud: 0 })),
  ].sort((a, b) => b.area - a.area)
  return { similitud: caras[0]?.similitud ?? 0, rostrosEnSelfie: caras.length }
}

export function crearAnalizadorDeFotos({ region, cloudName }) {
  const cliente = new RekognitionClient({ region })
  return async function analizar(perfil) {
    const dni = await descargar(perfil.fotoDniUrl, cloudName)
    const selfie = await descargar(perfil.fotoSelfieUrl, cloudName)
    const hash = b => createHash('sha256').update(b).digest('hex')
    const comparacion = await cliente.send(new CompareFacesCommand({
      SourceImage: { Bytes: dni }, TargetImage: { Bytes: selfie }, SimilarityThreshold: 0,
    }))
    const texto = await cliente.send(new DetectTextCommand({ Image: { Bytes: dni } }))
    return {
      mismaImagen: hash(dni) === hash(selfie),
      ...evaluarCaras(comparacion),
      lineasDni: (texto.TextDetections ?? []).filter(t => t.Type === 'LINE').map(t => t.DetectedText),
    }
  }
}
