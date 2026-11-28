// Servidor local que imita a SUNAT, incluidos los cortes a mitad de la descarga.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { consultarPadron } from '../padron.mjs'

const carpeta = mkdtempSync(join(tmpdir(), 'padron-prueba-'))
let zip, servidor, url, cortes, pedidos

before(async () => {
  const relleno = Array.from({ length: 3000 }, (_, i) => `1000000${String(i).padStart(4, '0')}|${randomBytes(30).toString('hex')}|ACTIVO|HABIDO|`)
  writeFileSync(join(carpeta, 'p.txt'), Buffer.from(
    ['RUC|NOMBRE|ESTADO|CONDICION|', ...relleno, '20131312955|ENTIDAD DE PRUEBA Ñ|ACTIVO|HABIDO|', ''].join('\n'), 'latin1'))
  execFileSync('zip', ['-q', '-j', join(carpeta, 'p.zip'), join(carpeta, 'p.txt')])
  zip = readFileSync(join(carpeta, 'p.zip'))
  servidor = createServer((req, res) => {
    const desde = Number(/bytes=(\d+)-/.exec(req.headers.range ?? '')?.[1] ?? 0)
    pedidos.push(desde)
    const resto = zip.subarray(desde)
    res.writeHead(desde ? 206 : 200, {
      'content-length': resto.length, 'accept-ranges': 'bytes',
      ...(desde ? { 'content-range': `bytes ${desde}-${zip.length - 1}/${zip.length}` } : {}),
    })
    if (cortes-- > 0) res.write(resto.subarray(0, Math.floor(resto.length / 3)), () => setTimeout(() => res.destroy(), 100))
    else res.end(resto)
  })
  await new Promise(ok => servidor.listen(0, '127.0.0.1', ok))
  url = `http://127.0.0.1:${servidor.address().port}/p.zip`
})
after(() => { servidor.close(); rmSync(carpeta, { recursive: true, force: true }) })

test('reanuda la descarga cortada y encuentra el RUC', async () => {
  cortes = 2; pedidos = []
  const r = await consultarPadron(['20131312955', '20000000000'], url)
  assert.deepEqual([...r], [['20131312955', { nombre: 'ENTIDAD DE PRUEBA Ñ', estado: 'ACTIVO', condicion: 'HABIDO' }]])
  assert.equal(pedidos.length, 3)
  assert.ok(pedidos[1] > 0 && pedidos[2] > pedidos[1], `no reanudó: ${pedidos}`)
})

test('si nunca termina, avisa en vez de dar el padrón por leído', async () => {
  cortes = 99; pedidos = []
  await assert.rejects(consultarPadron(['20131312955'], url, { intentos: 2 }), /No se pudo descargar/)
  assert.equal(pedidos.length, 2)
})
