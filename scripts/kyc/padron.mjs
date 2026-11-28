// Padrón reducido de RUC (SUNAT): descarga oficial y gratuita, ~400 MB comprimidos.
// La velocidad varía mucho y la conexión puede cortarse: se descarga a un archivo temporal que se
// reanuda, y se borra al terminar. En memoria solo se conservan los RUC pedidos.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const URL_PADRON = 'https://www2.sunat.gob.pe/padron_reducido_ruc.zip'

const terminar = p => new Promise((ok, mal) => { p.on('error', mal); p.on('close', ok) })

async function descargar(url, destino, { intentos, minutos }) {
  const limite = Date.now() + minutos * 60_000
  let codigo
  for (let i = 1; i <= intentos; i++) {
    const quedan = Math.floor((limite - Date.now()) / 1000)
    if (quedan <= 0) break
    // -C -: continúa donde quedó · corta si pasa 60 s por debajo de 10 KB/s
    const curl = spawn('curl', ['-sSf', '-C', '-', '--max-time', String(quedan),
      '--speed-limit', '10000', '--speed-time', '60', '-o', destino, url], { stdio: 'ignore' })
    codigo = await terminar(curl)
    if (codigo === 0) return
    console.error(`Descarga del padrón interrumpida (curl ${codigo}), intento ${i} de ${intentos}`)
    // 33 = el servidor no permitió reanudar: se empieza de nuevo
    if (codigo === 33) await rm(destino, { force: true })
  }
  throw new Error(`No se pudo descargar el padrón (curl ${codigo ?? 'sin intentos'})`)
}

async function buscar(zip, rucs) {
  const pendientes = new Set(rucs)
  const hallados = new Map()
  const unzip = spawn('funzip', [zip], { stdio: ['ignore', 'pipe', 'ignore'] })
  const fin = terminar(unzip)
  fin.catch(() => {})
  unzip.stdout.setEncoding('latin1')
  let cabecera = false
  try {
    for await (const linea of createInterface({ input: unzip.stdout, crlfDelay: Infinity })) {
      if (!cabecera) {
        if (!linea.startsWith('RUC|')) throw new Error('Formato de padrón inesperado')
        cabecera = true
        continue
      }
      const ruc = linea.slice(0, linea.indexOf('|'))
      if (!pendientes.delete(ruc)) continue
      const [, nombre, estado, condicion] = linea.split('|')
      hallados.set(ruc, { nombre, estado, condicion })
      if (pendientes.size === 0) return hallados
    }
    const codigo = await fin
    if (!cabecera || codigo !== 0) throw new Error(`Padrón incompleto (funzip ${codigo})`)
    return hallados
  } finally {
    unzip.kill()
  }
}

/** @returns Map ruc → { nombre, estado, condicion }. Lanza si no pudo obtener el padrón. */
export async function consultarPadron(rucs, url = process.env.SUNAT_PADRON_URL || URL_PADRON, { intentos = 5, minutos = 20 } = {}) {
  const carpeta = await mkdtemp(join(tmpdir(), 'padron-'))
  try {
    const zip = join(carpeta, 'padron.zip')
    await descargar(url, zip, { intentos, minutos })
    return await buscar(zip, rucs)
  } finally {
    await rm(carpeta, { recursive: true, force: true })
  }
}
