/**
 * ChatPedido.tsx — Chat entre emprendedor y caficultor dentro de un pedido
 * Se monta en el detalle del pedido de ambos portales.
 */
import React, { useEffect, useRef, useState } from 'react'
import { fetchMensajesByPedido, sendMensaje } from '../service'
import { demoFetchMensajesByPedido, demoSendMensaje } from '../demoService'
import type { AutorMensajeONE, MensajePedidoONE } from '../types'

const C = {
  bg: '#0f0f0f',
  card: '#141414',
  border: '#2a2a2a',
  cream: '#f2e0cc',
  tan: '#c4b297',
  terra: '#c96e4b',
  sage: '#8faf8a',
  white: '#ffffff',
  muted: '#666666',
  textSub: '#888888',
}

function formatHora(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  } catch { return '' }
}

interface Props {
  pedidoId: string
  usuarioId: string
  usuarioNombre: string
  usuarioRol: AutorMensajeONE
  isDemo: boolean
  codigoTracking?: string   // si existe, lo mostramos como mensaje sistema al inicio
}

const ChatPedido: React.FC<Props> = ({
  pedidoId,
  usuarioId,
  usuarioNombre,
  usuarioRol,
  isDemo,
  codigoTracking,
}) => {
  const [mensajes, setMensajes] = useState<MensajePedidoONE[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      try {
        const msgs = isDemo
          ? await demoFetchMensajesByPedido(pedidoId)
          : await fetchMensajesByPedido(pedidoId)
        if (activo) setMensajes(msgs)
      } catch { /* silencioso */ } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [pedidoId, isDemo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    const t = texto.trim()
    if (!t || enviando) return
    setTexto('')
    setEnviando(true)
    try {
      const input = {
        pedidoId,
        autorId: usuarioId,
        autorNombre: usuarioNombre,
        autorRol: usuarioRol,
        texto: t,
      }
      if (isDemo) await demoSendMensaje(input)
      else await sendMensaje(input)

      // Recargar mensajes tras enviar
      const msgs = isDemo
        ? await demoFetchMensajesByPedido(pedidoId)
        : await fetchMensajesByPedido(pedidoId)
      setMensajes(msgs)
    } catch { /* silencioso */ } finally {
      setEnviando(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  // Agrupar mensajes por fecha para separadores
  const grupos: { fecha: string; msgs: MensajePedidoONE[] }[] = []
  for (const m of mensajes) {
    const fecha = formatFecha(m.createdAt)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.fecha === fecha) {
      ultimo.msgs.push(m)
    } else {
      grupos.push({ fecha, msgs: [m] })
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: C.bg,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      overflow: 'hidden',
      height: 360,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: C.card,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>💬</span>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 700,
          color: C.cream, fontFamily: 'Montserrat, sans-serif',
        }}>
          Chat del pedido
        </p>
        <span style={{
          marginLeft: 'auto', fontSize: 10, color: C.muted,
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Solo visible entre tú y el {usuarioRol === 'negocio' ? 'caficultor' : 'negocio'}
        </span>
      </div>

      {/* Lista de mensajes */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 2,
        scrollbarWidth: 'thin',
      }}>
        {/* Mensaje sistema si hay tracking */}
        {codigoTracking && (
          <div style={{
            alignSelf: 'center',
            padding: '6px 14px', borderRadius: 20,
            background: '#1a2a1a',
            border: `1px solid ${C.sage}44`,
            margin: '4px 0 8px',
          }}>
            <p style={{
              margin: 0, fontSize: 11, color: C.sage,
              fontFamily: 'Montserrat, sans-serif', textAlign: 'center',
            }}>
              📦 Código de seguimiento: <strong>{codigoTracking}</strong>
            </p>
          </div>
        )}

        {cargando && (
          <p style={{ margin: 'auto', fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
            Cargando mensajes...
          </p>
        )}

        {!cargando && mensajes.length === 0 && !codigoTracking && (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <p style={{ fontSize: 22, margin: '0 0 6px' }}>💬</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
              Sin mensajes aún
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted, fontFamily: 'Montserrat, sans-serif' }}>
              Usa el chat para coordinar el despacho o resolver dudas
            </p>
          </div>
        )}

        {grupos.map(grupo => (
          <React.Fragment key={grupo.fecha}>
            {/* Separador de fecha */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '8px 0 4px',
            }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: 10, color: C.muted, fontFamily: 'Montserrat, sans-serif', whiteSpace: 'nowrap' }}>
                {grupo.fecha}
              </span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {grupo.msgs.map((m, i) => {
              const esMio = m.autorId === usuarioId
              const esTracking = m.tipo === 'tracking'
              const mismoAutorPrev = i > 0 && grupo.msgs[i - 1].autorId === m.autorId

              if (esTracking) {
                return (
                  <div key={m.id} style={{
                    alignSelf: 'center',
                    padding: '6px 14px', borderRadius: 20,
                    background: '#1a2a1a',
                    border: `1px solid ${C.sage}44`,
                    margin: '4px 0',
                  }}>
                    <p style={{
                      margin: 0, fontSize: 11, color: C.sage,
                      fontFamily: 'Montserrat, sans-serif',
                    }}>
                      📦 {m.texto}
                    </p>
                  </div>
                )
              }

              return (
                <div key={m.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: esMio ? 'flex-end' : 'flex-start',
                  marginTop: mismoAutorPrev ? 2 : 8,
                }}>
                  {/* Nombre del autor — solo primer mensaje del grupo */}
                  {!mismoAutorPrev && !esMio && (
                    <p style={{
                      margin: '0 0 2px 10px',
                      fontSize: 10, color: C.muted,
                      fontFamily: 'Montserrat, sans-serif',
                    }}>
                      {m.autorNombre}
                    </p>
                  )}

                  <div style={{
                    maxWidth: '78%',
                    padding: '8px 12px',
                    borderRadius: esMio
                      ? '14px 14px 4px 14px'
                      : '14px 14px 14px 4px',
                    background: esMio ? C.terra : '#1e1e1e',
                    border: esMio ? 'none' : `1px solid ${C.border}`,
                  }}>
                    <p style={{
                      margin: 0, fontSize: 13,
                      color: esMio ? C.white : C.cream,
                      fontFamily: 'Montserrat, sans-serif',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {m.texto}
                    </p>
                  </div>

                  <p style={{
                    margin: '2px 6px 0',
                    fontSize: 9, color: C.muted,
                    fontFamily: 'Montserrat, sans-serif',
                  }}>
                    {formatHora(m.createdAt)}
                  </p>
                </div>
              )
            })}
          </React.Fragment>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={onKey}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={1}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            background: '#0a0a0a',
            color: C.cream,
            fontSize: 13,
            fontFamily: 'Montserrat, sans-serif',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
            maxHeight: 80,
            overflowY: 'auto',
          }}
          maxLength={500}
        />
        <button
          onClick={enviar}
          disabled={!texto.trim() || enviando}
          style={{
            padding: '9px 16px',
            borderRadius: 10,
            border: 'none',
            background: texto.trim() ? C.terra : '#1e1e1e',
            color: texto.trim() ? C.white : C.muted,
            fontSize: 13, fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            cursor: texto.trim() && !enviando ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          {enviando ? '...' : '→'}
        </button>
      </div>
    </div>
  )
}

export default ChatPedido
