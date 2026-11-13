/**
 * DocsONE.tsx — Documentación detallada paso a paso de TunayWasi ONE
 * Ruta: #/docs  |  #/docs/:slug
 * Layout: sidebar izq + contenido centro + tabla de contenidos derecha (CulqiDocs-style)
 */
import React, { useState, useEffect, useRef } from 'react'

const C = {
  bg:         '#0a0a0a',
  bgCard:     '#141414',
  bgSection:  '#111111',
  cream:      '#f2e0cc',
  creamDim:   '#c4b297',
  terra:      '#c96e4b',
  terraLight: '#d4825f',
  sage:       '#8faf8a',
  green:      '#1f3028',
  border:     '#222222',
  muted:      '#555555',
  mutedLight: '#777777',
  white:      '#ffffff',
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Paso {
  titulo: string
  texto: string
  nota?: string
  notaTipo?: 'info' | 'advertencia'
}

interface Articulo {
  slug: string
  titulo: string
  subtitulo: string
  pasos: Paso[]
}

interface Seccion {
  id: string
  titulo: string
  color: string
  articulos: Articulo[]
}

// ─── Contenido ────────────────────────────────────────────────────────────────

const SECCIONES: Seccion[] = [
  {
    id: 'negocio',
    titulo: 'Para Negocios',
    color: C.terra,
    articulos: [
      {
        slug: 'neg-cuenta',
        titulo: 'Crear tu cuenta',
        subtitulo: 'Regístrate como negocio o cafetería en la app TunayWasi',
        pasos: [
          {
            titulo: 'Descarga la app',
            texto: 'La app está en versión beta. Descárgala desde el enlace de Firebase App Distribution que encontrarás en esta página — aún no está publicada en Google Play Store.',
            nota: 'La app requiere Android 8.0 o superior. Aún no está disponible para iPhone ni en Google Play Store.',
            notaTipo: 'info',
          },
          {
            titulo: 'Toca "Crear cuenta"',
            texto: 'En la pantalla inicial verás dos opciones: "Iniciar sesión" y "Crear cuenta". Toca "Crear cuenta" para registrarte por primera vez.',
          },
          {
            titulo: 'Elige tu rol: Negocio / Cafetería',
            texto: 'La app te preguntará tu rol. Selecciona "Negocio" si eres dueño de una cafetería, coffee shop o negocio que sirve café. Este rol te da acceso al catálogo de compras y a gestionar tus pedidos.',
          },
          {
            titulo: 'Ingresa tus datos',
            texto: 'Completa tu nombre completo, correo electrónico y una contraseña segura (mínimo 8 caracteres). También puedes registrarte directamente con tu cuenta de Google.',
          },
          {
            titulo: 'Completa el perfil de tu negocio',
            texto: 'Ingresa el nombre de tu local o cafetería, el distrito donde operas y tu número de teléfono (para que el caficultor pueda coordinarte el despacho). Este paso es obligatorio para hacer pedidos.',
          },
          {
            titulo: 'Listo — explora el catálogo',
            texto: 'Tu cuenta queda activa de inmediato. La app abre directamente en la pestaña Catálogo donde puedes ver todos los lotes disponibles de caficultores peruanos.',
            nota: 'No necesitas validación ni aprobación — acceso instantáneo.',
            notaTipo: 'info',
          },
        ],
      },
      {
        slug: 'neg-catalogo',
        titulo: 'Explorar el catálogo',
        subtitulo: 'Encuentra el café de origen perfecto para tu negocio',
        pasos: [
          {
            titulo: 'Pestaña Catálogo',
            texto: 'La app tiene 4 pestañas en la barra inferior: Catálogo, Mis Pedidos, Historial y Perfil. El catálogo muestra todos los lotes disponibles. Cada tarjeta muestra el nombre del café, región, precio por kilogramo y la calificación del caficultor.',
          },
          {
            titulo: 'Usa los filtros',
            texto: 'Toca el ícono de filtros para filtrar por proceso (lavado, natural, honey, anaeróbico) o por región productora. Puedes combinar filtros para afinar tu búsqueda.',
          },
          {
            titulo: 'Abre la ficha completa del lote',
            texto: 'Toca cualquier producto para ver su ficha técnica completa: variedad botánica, altitud de cosecha, fecha de cosecha, proceso de beneficio, notas de sabor y galería de fotos reales de la finca.',
          },
          {
            titulo: 'Revisa el perfil del caficultor',
            texto: 'Dentro de la ficha del lote hay un enlace al perfil del caficultor. Allí verás su historia, todas sus fincas registradas, su historial de pedidos completados y las calificaciones de otros negocios.',
          },
          {
            titulo: 'Elige presentación y agrégalo al carrito',
            texto: 'Cada lote puede estar disponible en varias presentaciones: café verde (sin tostar), tostado en grano o tostado y molido. Si eliges molido, selecciona la molienda: gruesa (prensa/chemex), media (V60/aeropress) o fina (espresso). Toca "Agregar al carrito".',
            nota: 'Puedes agregar productos de distintos caficultores en el mismo carrito, pero el pago se realiza por separado a cada productor.',
            notaTipo: 'advertencia',
          },
        ],
      },
      {
        slug: 'neg-pedido',
        titulo: 'Hacer tu primer pedido',
        subtitulo: 'Del carrito al café en tu local — paso a paso',
        pasos: [
          {
            titulo: 'Revisa tu carrito',
            texto: 'Toca el ícono del carrito en la parte superior. Verás todos los productos que agregaste con su precio unitario, presentación y cantidad. Puedes ajustar cantidades o eliminar productos antes de continuar.',
          },
          {
            titulo: 'Confirma tu dirección de entrega',
            texto: 'Ingresa la dirección completa de tu local: calle, número, referencia y distrito. El caficultor usará esta dirección para coordinar el despacho por agencia de envío.',
          },
          {
            titulo: 'Elige la agencia de recojo',
            texto: 'Selecciona tu departamento, provincia y distrito. La app muestra las agencias disponibles (Olva, Shalom, Cruz del Sur, etc.) para esa zona. Elige la que tengas más cerca de tu local.',
          },
          {
            titulo: 'Paga con Yape',
            texto: 'El único método disponible actualmente es Yape. La app te muestra el número de Yape de TunayWasi y el monto exacto a pagar. Tienes 120 segundos para completar la transferencia desde tu app Yape.',
            nota: 'El dinero queda retenido en TunayWasi (escrow). El caficultor recibe el pago solo cuando tú confirmas la entrega o pasan 7 días desde el despacho.',
            notaTipo: 'info',
          },
          {
            titulo: 'Sube tu comprobante',
            texto: 'Después de hacer la transferencia en Yape, toma captura de pantalla del comprobante y súbela en la app. El estado del pedido cambia a "Comprobante enviado" y el caficultor recibe una notificación.',
            nota: 'El caficultor tiene hasta 24 horas para confirmar el pago. Si no recibes confirmación, usa el chat del pedido para hacer seguimiento.',
            notaTipo: 'info',
          },
          {
            titulo: 'Haz seguimiento en "Mis pedidos"',
            texto: 'Ve a la pestaña "Mis pedidos" para ver el estado en tiempo real: Pendiente → Comprobante enviado → Pago confirmado → En preparación → En tránsito → Entregado.',
          },
        ],
      },
      {
        slug: 'neg-gestionar',
        titulo: 'Gestionar tus pedidos',
        subtitulo: 'Seguimiento, chat con el caficultor y calificaciones',
        pasos: [
          {
            titulo: 'Pestañas "Mis pedidos" e "Historial"',
            texto: 'La pestaña "Mis pedidos" muestra los pedidos activos (en curso). La pestaña "Historial" muestra los pedidos completados o cancelados. Ambas están en la barra inferior de la app.',
          },
          {
            titulo: 'Entiende los estados del pedido',
            texto: 'Los estados son: Pendiente (esperando comprobante), Comprobante enviado (esperando verificación del caficultor), Pago confirmado (listo para preparar), En preparación, En tránsito (despachado con tracking), Entregado (confirmado por ti), Cancelado.',
          },
          {
            titulo: 'Chat directo con el caficultor',
            texto: 'Dentro de cada pedido hay un chat. Úsalo para coordinar: preguntar por el estado del despacho, recibir el código de tracking de la agencia, resolver dudas sobre el producto o el pago.',
          },
          {
            titulo: 'Recibe el tracking del envío',
            texto: 'Una vez que el caficultor despacha, sube el código de la agencia al chat del pedido. Cópialo y búscalo directamente en el sitio web de la agencia (Olva, Shalom, etc.) para seguir el envío.',
          },
          {
            titulo: 'Confirma la entrega y califica',
            texto: 'Cuando recibas el café, abre el pedido y toca "Confirmar recepción". La app te pedirá que califiques al caficultor de 1 a 5 estrellas y dejes un comentario. Tu calificación es visible en el perfil público del productor.',
            nota: 'Las calificaciones son anónimas para otros negocios pero el caficultor sí puede ver quién lo calificó.',
            notaTipo: 'info',
          },
        ],
      },
    ],
  },
  {
    id: 'caficultor',
    titulo: 'Para Caficultores',
    color: C.sage,
    articulos: [
      {
        slug: 'caf-cuenta',
        titulo: 'Crear tu cuenta de productor',
        subtitulo: 'Regístrate como caficultor y muestra tu café al mundo',
        pasos: [
          {
            titulo: 'Descarga la app',
            texto: 'Descarga TunayWasi desde el enlace de Firebase App Distribution (beta). Es la misma app para negocios y caficultores — el rol determina las funciones que ves.',
          },
          {
            titulo: 'Toca "Crear cuenta" → elige "Caficultor / Productor"',
            texto: 'En la selección de rol elige "Caficultor". Este rol te da acceso al panel de gestión de productos, pedidos entrantes y tu perfil público de productor.',
          },
          {
            titulo: 'Ingresa tus datos personales',
            texto: 'Tu nombre completo, correo electrónico y una contraseña. También puedes usar tu cuenta Google.',
          },
          {
            titulo: 'Completa el perfil de tu finca',
            texto: 'Información obligatoria: nombre de tu finca, región (departamento y provincia), altitud aproximada de cultivo en metros sobre el nivel del mar y tu número de teléfono para coordinaciones.',
          },
          {
            titulo: 'Registra tu número Yape',
            texto: 'Ingresa el número de teléfono asociado a tu cuenta Yape. TunayWasi usará este número para transferirte los pagos una vez que los negocios confirmen la entrega de sus pedidos.',
            nota: 'Sin número Yape no puedes recibir pagos. Asegúrate de que el número sea correcto antes de publicar tu primer lote.',
            notaTipo: 'advertencia',
          },
          {
            titulo: 'Sube una foto de tu finca (recomendado)',
            texto: 'Los caficultores con foto de perfil reciben hasta 3x más interés de los negocios. Sube una foto real de tu finca, tus plantas o el proceso de beneficio.',
            nota: 'La foto debe ser tomada por ti o con tu permiso. No uses imágenes de internet.',
            notaTipo: 'advertencia',
          },
          {
            titulo: 'Tu perfil queda activo',
            texto: 'Tu perfil de productor es visible públicamente de inmediato. Los negocios podrán encontrarte una vez que publiques tu primer lote.',
          },
        ],
      },
      {
        slug: 'caf-publicar',
        titulo: 'Publicar un lote',
        subtitulo: 'Cómo agregar tu café al catálogo de TunayWasi',
        pasos: [
          {
            titulo: 'Ve a "Mis Productos" → botón "+"',
            texto: 'En la pestaña "Mis Productos" (primera pestaña de la barra inferior), toca el botón "+" para abrir el formulario de nuevo producto.',
          },
          {
            titulo: 'Datos básicos del café',
            texto: 'Ingresa el nombre del café (ej: "Geisha Natural Amazonas 2025"), una descripción corta y la historia detrás de este lote. La descripción aparece en la ficha pública del producto.',
          },
          {
            titulo: 'Tipo de café',
            texto: 'Selecciona el tipo de presentación del café usando los chips: Verde (sin tostar, para negocios que tuestan), Tostado en grano (listo para moler) o Tostado y molido. Si es tostado y molido, elige también la molienda: Gruesa, Media, Fina o Espresso.',
          },
          {
            titulo: 'Datos técnicos del lote',
            texto: 'Completa la información técnica que buscan los negocios: variedad botánica, proceso de beneficio (lavado / natural / honey / anaeróbico), altitud de cosecha en msnm, fecha de cosecha (mes y año) y notas de sabor (ej: chocolate oscuro, mandarina, caña de azúcar).',
          },
          {
            titulo: 'Precio y stock',
            texto: 'Ingresa tu precio base por kilogramo en soles y la cantidad en kilogramos disponible. Cuando el stock llegue a cero, el producto se oculta automáticamente del catálogo.',
            nota: 'El precio que ves es tu ganancia neta. El negocio ve el precio final (tu precio + cargos TunayWasi). No hay descuento adicional sobre tu precio base.',
            notaTipo: 'info',
          },
          {
            titulo: 'Sube al menos 4 fotos del lote',
            texto: 'La app requiere un mínimo de 4 fotos para publicar: plantas, proceso de beneficio, secado, producto final, zona de cultivo. Las fotos de alta calidad aumentan significativamente las conversiones.',
            nota: 'No puedes publicar el lote con menos de 4 fotos. Asegúrate de tener imágenes reales y bien iluminadas.',
            notaTipo: 'advertencia',
          },
          {
            titulo: 'Toca "Publicar"',
            texto: 'El lote aparece en el catálogo público de inmediato. Puedes editarlo o pausarlo en cualquier momento desde "Mis Productos".',
          },
        ],
      },
      {
        slug: 'caf-despacho',
        titulo: 'Confirmar pedidos y despacho',
        subtitulo: 'Del pedido recibido al café en manos del negocio',
        pasos: [
          {
            titulo: 'Recibes una notificación',
            texto: 'Cuando un negocio hace un pedido de tu producto, recibirás una notificación push. También puedes ver todos los pedidos entrantes en la pestaña "Pedidos Activos" de tu app.',
          },
          {
            titulo: 'Revisa el pedido',
            texto: 'Abre el pedido para ver: qué producto y presentación se pidió, la cantidad, el precio total, la dirección de entrega del negocio y la agencia de recojo seleccionada.',
          },
          {
            titulo: 'Verifica el comprobante de pago',
            texto: 'El negocio pagó por Yape y subió el comprobante a la app. El estado aparece como "Comprobante enviado". Verifica que el monto coincida con el total del pedido.',
            nota: 'No despachar el pedido hasta confirmar el pago en la app. Si hay inconsistencias, usa el chat del pedido para comunicarte con el negocio.',
            notaTipo: 'advertencia',
          },
          {
            titulo: 'Confirma el pago en la app',
            texto: 'Una vez verificado el comprobante, toca "Confirmar pago" en el pedido. El estado cambia a "Pago confirmado" y el negocio recibe una notificación.',
          },
          {
            titulo: 'Prepara y despacha el café',
            texto: 'Prepara el pedido: pesa, ensaca, etiqueta. Lleva el paquete a la agencia de envío que eligió el negocio (Olva, Shalom, Cruz del Sur, etc.) y guarda el comprobante con el código de tracking.',
          },
          {
            titulo: 'Escribe el código de tracking en el chat',
            texto: 'Dentro del pedido hay un chat directo con el negocio. Escribe el nombre de la agencia y el código de tracking. El negocio recibirá una notificación con el código para rastrear su envío.',
          },
          {
            titulo: 'Marca el pedido como despachado',
            texto: 'Toca "Marcar como en tránsito". El estado del pedido cambia a "En tránsito" y el negocio recibe una notificación. El pedido pasa a tu pestaña "Historial" una vez entregado.',
          },
          {
            titulo: 'Pedido completado y pago liberado',
            texto: 'Cuando el negocio confirma la entrega, TunayWasi libera el pago a tu Yape. Recibirás también la calificación que te dejó. Las buenas calificaciones mejoran tu posición en el catálogo.',
          },
        ],
      },
      {
        slug: 'caf-stock',
        titulo: 'Gestionar tu stock',
        subtitulo: 'Mantén tu catálogo actualizado y evita pedidos de café no disponible',
        pasos: [
          {
            titulo: 'Pestaña "Mis Productos"',
            texto: 'La primera pestaña de la barra inferior muestra todos tus lotes publicados con su estado (activo / pausado / sin stock) y el stock restante en kilogramos.',
          },
          {
            titulo: 'Stock en tiempo real',
            texto: 'Cada vez que un pedido es confirmado, el sistema descuenta automáticamente la cantidad del stock. No necesitas actualizarlo manualmente después de cada venta.',
          },
          {
            titulo: 'Cuando el stock llega a cero',
            texto: 'Al llegar a 0 kg el producto se oculta automáticamente del catálogo público. Los negocios no pueden agregarlo al carrito hasta que actualices el stock.',
          },
          {
            titulo: 'Pausar un lote manualmente',
            texto: 'Si necesitas tiempo (viaje, cosecha nueva en proceso, etc.) puedes pausar un lote completo sin borrarlo. Toca el lote → botón "Pausar". El lote desaparece del catálogo pero conserva toda su información. Puedes reactivarlo en cualquier momento.',
          },
          {
            titulo: 'Actualizar el stock',
            texto: 'Si procesas café nuevo o descubres que el stock registrado no coincide con el real: toca el lote → "Editar" → cambia el campo de stock → guarda. El cambio es inmediato.',
          },
          {
            titulo: 'Editar precio, fotos o datos técnicos',
            texto: 'Puedes editar el precio base, la descripción, las fotos y los datos técnicos en cualquier momento. Los cambios aplican a nuevos pedidos — los pedidos ya en curso conservan el precio acordado.',
            nota: 'No puedes cambiar la variedad ni el proceso de un lote ya publicado. Si es un café diferente, crea un nuevo lote.',
            notaTipo: 'advertencia',
          },
        ],
      },
    ],
  },
]

// ─── Componentes ─────────────────────────────────────────────────────────────

const NavBar: React.FC = () => (
  <nav style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    background: `${C.bg}f0`, backdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 56,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <button onClick={() => { window.location.hash = '#/' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 20, fontWeight: 700, color: C.cream,
      }}>
        TunayWasi
      </button>
      <span style={{ color: C.border, fontSize: 20 }}>·</span>
      <span style={{
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 13, fontWeight: 600, color: C.terra,
        letterSpacing: '0.05em',
      }}>
        Documentación
      </span>
    </div>
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <button onClick={() => { window.location.hash = '#/' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.mutedLight,
      }}>
        Catálogo
      </button>
      <button onClick={() => { window.location.hash = '#/soporte' }} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: C.sage,
        fontWeight: 600,
      }}>
        Soporte
      </button>
    </div>
  </nav>
)

const ArticuloView: React.FC<{ articulo: Articulo; color: string }> = ({ articulo, color }) => {
  const [pasoActivo, setPasoActivo] = useState<number | null>(null)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  function scrollAPaso(i: number) {
    refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 40, alignItems: 'start' }}>
      {/* Contenido principal */}
      <div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(28px, 3.5vw, 42px)',
          fontWeight: 700, color: C.cream,
          margin: '0 0 8px', lineHeight: 1.15,
        }}>
          {articulo.titulo}
        </h1>
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 15, color: C.creamDim,
          margin: '0 0 40px', lineHeight: 1.6,
        }}>
          {articulo.subtitulo}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {articulo.pasos.map((paso, i) => (
            <div
              key={i}
              ref={el => { refs.current[i] = el }}
              id={`paso-${i}`}
              style={{
                display: 'grid', gridTemplateColumns: '52px 1fr',
                gap: 20, paddingBottom: i < articulo.pasos.length - 1 ? 32 : 0,
                position: 'relative', cursor: 'pointer',
              }}
              onClick={() => setPasoActivo(pasoActivo === i ? null : i)}
            >
              {/* Línea conectora */}
              {i < articulo.pasos.length - 1 && (
                <div style={{
                  position: 'absolute', left: 24, top: 48, bottom: 0,
                  width: 1, background: `linear-gradient(to bottom, ${color}44, transparent)`,
                }} />
              )}
              {/* Círculo numerado */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: C.bgCard,
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 17, fontWeight: 700, color, flexShrink: 0,
                transition: 'background 0.2s',
                ...(pasoActivo === i ? { background: `${color}18` } : {}),
              }}>
                {i + 1}
              </div>
              {/* Texto */}
              <div style={{ paddingTop: 10 }}>
                <h3 style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 14, fontWeight: 700,
                  color: C.cream, margin: '0 0 6px',
                }}>
                  {paso.titulo}
                </h3>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 13, color: C.creamDim,
                  lineHeight: 1.75, margin: 0,
                }}>
                  {paso.texto}
                </p>
                {paso.nota && (
                  <div style={{
                    marginTop: 10, padding: '10px 14px',
                    borderRadius: 8,
                    background: paso.notaTipo === 'advertencia' ? '#3d1a0622' : '#0d2a1a',
                    border: `1px solid ${paso.notaTipo === 'advertencia' ? C.terra + '44' : C.sage + '44'}`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>
                      {paso.notaTipo === 'advertencia' ? '⚠️' : 'ℹ️'}
                    </span>
                    <p style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: 12, color: paso.notaTipo === 'advertencia' ? C.terraLight : C.sage,
                      lineHeight: 1.6, margin: 0,
                    }}>
                      {paso.nota}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de contenidos */}
      <div className="docs-toc" style={{
        position: 'sticky', top: 72,
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 12, padding: '16px 18px',
      }}>
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 10, fontWeight: 700,
          color: C.muted, letterSpacing: '0.12em',
          textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Contenido
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {articulo.pasos.map((paso, i) => (
            <button
              key={i}
              onClick={() => scrollAPaso(i)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: '4px 0',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 12, color: C.mutedLight,
                lineHeight: 1.4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = color }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = C.mutedLight }}
            >
              {i + 1}. {paso.titulo}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Contenido Web ────────────────────────────────────────────────────────────

const SECCIONES_WEB: Seccion[] = [
  {
    id: 'web-negocio',
    titulo: 'Para Negocios',
    color: C.terra,
    articulos: [
      {
        slug: 'web-neg-cuenta',
        titulo: 'Acceder al portal',
        subtitulo: 'Cómo ingresar al portal web de TunayWasi como negocio',
        pasos: [
          {
            titulo: 'Abre el portal en tu navegador',
            texto: 'El portal web está disponible en tunaywasi.com. Funciona en cualquier navegador moderno (Chrome, Safari, Firefox) — no requiere instalación. Está optimizado para escritorio.',
          },
          {
            titulo: 'Toca "Ingresar como Negocio"',
            texto: 'En la página principal verás dos accesos: uno para Negocios y otro para Caficultores. Selecciona el de Negocios para acceder al catálogo y portal de compras.',
          },
          {
            titulo: 'Inicia sesión o crea una cuenta',
            texto: 'Puedes iniciar sesión con tu correo y contraseña, o registrarte directamente desde el portal. Si ya tienes cuenta en la app Android, usa las mismas credenciales.',
          },
          {
            titulo: 'Completa tu perfil si es primera vez',
            texto: 'Si es tu primera vez, ingresa el nombre de tu local, el distrito donde operas y tu número de teléfono. Este paso es obligatorio para hacer pedidos.',
          },
        ],
      },
      {
        slug: 'web-neg-catalogo',
        titulo: 'Explorar el catálogo',
        subtitulo: 'Busca y compara lotes de café de origen en el portal web',
        pasos: [
          {
            titulo: 'Catálogo público',
            texto: 'El catálogo es visible sin iniciar sesión. Muestra todos los lotes activos de caficultores peruanos con su foto, región, precio por kilogramo y calificación.',
          },
          {
            titulo: 'Ficha técnica del lote',
            texto: 'Haz clic en cualquier producto para abrir el panel lateral con la ficha completa: variedad, proceso, altitud, notas de sabor y galería de fotos. Puedes navegar entre fotos con las flechas o los puntos indicadores.',
          },
          {
            titulo: 'Elige presentación y cantidad',
            texto: 'Dentro de la ficha selecciona la presentación (verde, tostado en grano, tostado y molido) y la cantidad en kilogramos. Si eliges molido, selecciona la molienda: gruesa, media, fina o espresso.',
          },
          {
            titulo: 'Agrega al carrito',
            texto: 'Toca "Agregar al carrito". Puedes agregar productos de distintos caficultores. El carrito se mantiene mientras navegas por el catálogo.',
            nota: 'El pago se procesa por separado para cada caficultor en el mismo checkout.',
            notaTipo: 'info',
          },
        ],
      },
      {
        slug: 'web-neg-pedido',
        titulo: 'Hacer un pedido',
        subtitulo: 'Del carrito al café en tu local desde el navegador',
        pasos: [
          {
            titulo: 'Ve al checkout',
            texto: 'Haz clic en el ícono del carrito para abrir el checkout. Revisa los productos, cantidades y precios. Puedes ajustar cantidades o eliminar items antes de continuar.',
          },
          {
            titulo: 'Ingresa la dirección de entrega',
            texto: 'Escribe la dirección completa de tu local: calle, número, referencia y distrito. El caficultor usa esta dirección para coordinar el despacho.',
          },
          {
            titulo: 'Método de pago: Yape',
            texto: 'El pago se realiza por Yape al número de TunayWasi que aparece en pantalla. Abre tu app Yape, transfiere el monto exacto y toma captura del comprobante.',
            nota: 'El dinero queda retenido en TunayWasi (escrow). El caficultor solo recibe el pago cuando tú confirmas la entrega.',
            notaTipo: 'info',
          },
          {
            titulo: 'Sube el comprobante',
            texto: 'Sube la captura del comprobante de Yape desde tu computadora o teléfono. El pedido queda en estado "Comprobante enviado" hasta que el caficultor lo verifique.',
          },
          {
            titulo: 'Confirma el pedido',
            texto: 'Haz clic en "Confirmar pedido". Recibirás el número de pedido y podrás hacer seguimiento desde la sección "Mis Pedidos" de tu portal.',
          },
        ],
      },
      {
        slug: 'web-neg-gestionar',
        titulo: 'Gestionar tus pedidos',
        subtitulo: 'Seguimiento, chat y confirmación de entrega desde el portal web',
        pasos: [
          {
            titulo: 'Panel "Mis Pedidos"',
            texto: 'Desde el menú lateral de tu portal accede a "Mis Pedidos". Verás todos tus pedidos con su estado actual, fecha, monto y el nombre del caficultor.',
          },
          {
            titulo: 'Abre el detalle de un pedido',
            texto: 'Haz clic en cualquier pedido para ver el detalle completo: productos, dirección de entrega, estado del pago y estado logístico.',
          },
          {
            titulo: 'Chat con el caficultor',
            texto: 'Dentro del detalle de cada pedido hay un chat directo con el caficultor. Úsalo para recibir el código de tracking, coordinar el despacho o resolver cualquier duda.',
          },
          {
            titulo: 'Confirma la entrega',
            texto: 'Cuando recibas el café, abre el pedido y haz clic en "Confirmar recepción". Esto libera el pago al caficultor y te pedirá que dejes una calificación.',
          },
          {
            titulo: 'Califica al caficultor',
            texto: 'Dale de 1 a 5 estrellas y escribe un comentario sobre la calidad del producto y el servicio. Tu calificación aparece en el perfil público del productor.',
            nota: 'Las calificaciones son anónimas para otros negocios, pero el caficultor sí puede ver quién lo calificó.',
            notaTipo: 'info',
          },
        ],
      },
    ],
  },
  {
    id: 'web-caficultor',
    titulo: 'Para Caficultores',
    color: C.sage,
    articulos: [
      {
        slug: 'web-caf-cuenta',
        titulo: 'Acceder al portal',
        subtitulo: 'Cómo ingresar al portal web de TunayWasi como caficultor',
        pasos: [
          {
            titulo: 'Abre el portal en tu navegador',
            texto: 'Accede a tunaywasi.com desde cualquier navegador moderno. El portal web es el complemento de la app Android — puedes gestionarlo todo desde el escritorio.',
          },
          {
            titulo: 'Selecciona "Caficultor"',
            texto: 'En la página principal elige el acceso de Caficultor. Si ya tienes cuenta en la app Android, usa las mismas credenciales para ingresar.',
          },
          {
            titulo: 'Tu perfil público',
            texto: 'Tu perfil de productor queda activo de inmediato. Los negocios pueden buscar tu perfil en el directorio y ver tus lotes publicados.',
          },
        ],
      },
      {
        slug: 'web-caf-productos',
        titulo: 'Gestionar productos',
        subtitulo: 'Publica y edita tus lotes de café desde el portal web',
        pasos: [
          {
            titulo: 'Panel "Mis Productos"',
            texto: 'Desde el menú lateral accede a "Mis Productos". Verás todos tus lotes con su estado (activo/pausado), stock disponible y precio.',
          },
          {
            titulo: 'Agregar un nuevo lote',
            texto: 'Haz clic en "+ Nuevo producto". Completa: nombre, descripción, variedad, proceso, altitud, notas de sabor, precio por kilogramo y stock disponible.',
          },
          {
            titulo: 'Tipo de café y molienda',
            texto: 'Selecciona la presentación: Verde, Tostado en grano o Tostado y molido. Si es molido, elige el tipo de molienda: Gruesa, Media, Fina o Espresso.',
          },
          {
            titulo: 'Agrega fotos del lote',
            texto: 'Puedes subir hasta 5 URLs de fotos del producto. Las fotos aparecen en la galería del catálogo público — usa fotos reales de alta calidad para mejorar las conversiones.',
            nota: 'Agrega fotos del proceso (secado, despulpado), la finca y el producto final para generar más confianza.',
            notaTipo: 'info',
          },
          {
            titulo: 'Publicar o pausar',
            texto: 'El lote queda visible en el catálogo público de inmediato. Puedes pausarlo en cualquier momento para ocultarlo temporalmente sin perder la información.',
          },
        ],
      },
      {
        slug: 'web-caf-pedidos',
        titulo: 'Gestionar pedidos',
        subtitulo: 'Verifica pagos, despacha y comunícate con tus negocios desde la web',
        pasos: [
          {
            titulo: 'Panel "Mis Pedidos"',
            texto: 'Desde el menú lateral accede a "Mis Pedidos". Verás los pedidos entrantes ordenados por fecha con su estado actual.',
          },
          {
            titulo: 'Verifica el comprobante de pago',
            texto: 'Cuando un negocio sube el comprobante de Yape, el pedido aparece en estado "Comprobante enviado". Abre el pedido y revisa la imagen del comprobante — verifica que el monto coincida.',
          },
          {
            titulo: 'Confirma el pago',
            texto: 'Si el comprobante es válido, haz clic en "Confirmar pago". El estado cambia a "Pago confirmado" y el negocio recibe una notificación.',
            nota: 'No despachar sin confirmar el pago primero. El dinero está retenido en TunayWasi hasta la entrega.',
            notaTipo: 'advertencia',
          },
          {
            titulo: 'Chat para coordinar el despacho',
            texto: 'Usa el chat dentro del pedido para comunicarte con el negocio. Cuando despachas, escribe el nombre de la agencia y el código de tracking directamente en el chat.',
          },
          {
            titulo: 'Marca el pedido como despachado',
            texto: 'Haz clic en "Marcar como en tránsito". El negocio recibe una notificación y puede rastrear el envío con el código que le enviaste por el chat.',
          },
        ],
      },
    ],
  },
]

// ─── Componente principal ─────────────────────────────────────────────────────

const DocsONE: React.FC<{ hash?: string }> = ({ hash = '#/docs' }) => {
  const [plataforma, setPlataforma] = useState<'android' | 'web'>('android')
  const [seccionAbierta, setSeccionAbierta] = useState<string>('negocio')
  const [articuloActivo, setArticuloActivo] = useState<string>('neg-cuenta')

  const secciones = plataforma === 'android' ? SECCIONES : SECCIONES_WEB

  // Parsear slug desde el hash: #/docs/neg-catalogo
  useEffect(() => {
    const slug = hash.replace('#/docs/', '').replace('#/docs', '')
    if (slug) {
      for (const sec of [...SECCIONES, ...SECCIONES_WEB]) {
        const art = sec.articulos.find(a => a.slug === slug)
        if (art) {
          setPlataforma(slug.startsWith('web-') ? 'web' : 'android')
          setSeccionAbierta(sec.id)
          setArticuloActivo(slug)
          return
        }
      }
    }
  }, [hash])

  // Cuando cambia plataforma, resetear al primer artículo
  function cambiarPlataforma(p: 'android' | 'web') {
    setPlataforma(p)
    if (p === 'android') {
      setSeccionAbierta('negocio')
      setArticuloActivo('neg-cuenta')
    } else {
      setSeccionAbierta('web-negocio')
      setArticuloActivo('web-neg-cuenta')
    }
  }

  const seccionActiva = secciones.find(s => s.articulos.some(a => a.slug === articuloActivo))
  const articuloActualObj = seccionActiva?.articulos.find(a => a.slug === articuloActivo)

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <NavBar />

      {/* ── Toggle de plataforma ── */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 100,
        background: `${C.bg}f8`, backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1140, margin: '0 auto',
          padding: '0 0 0 240px',
          display: 'flex', alignItems: 'center', gap: 0,
        }}>
          {(['android', 'web'] as const).map(p => {
            const activo = plataforma === p
            return (
              <button
                key={p}
                onClick={() => cambiarPlataforma(p)}
                style={{
                  padding: '12px 24px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activo ? `2px solid ${C.terra}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 7,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{p === 'android' ? '📱' : '🌐'}</span>
                <span style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 13, fontWeight: activo ? 700 : 400,
                  color: activo ? C.cream : C.muted,
                  letterSpacing: '0.04em',
                }}>
                  {p === 'android' ? 'Android' : 'Web'}
                </span>
              </button>
            )
          })}
          {plataforma === 'android' && (
            <span style={{
              marginLeft: 12, fontSize: 11,
              fontFamily: 'Montserrat, sans-serif',
              color: C.muted,
            }}>
              App nativa · Android 8.0+
            </span>
          )}
          {plataforma === 'web' && (
            <span style={{
              marginLeft: 12, fontSize: 11,
              fontFamily: 'Montserrat, sans-serif',
              color: C.muted,
            }}>
              Portal en navegador · tunaywasi.com
            </span>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        maxWidth: 1140,
        margin: '0 auto',
        minHeight: 'calc(100vh - 100px)',
      }}>
        {/* ── Sidebar ── */}
        <aside style={{
          borderRight: `1px solid ${C.border}`,
          padding: '32px 0',
          position: 'sticky', top: 100,
          height: 'calc(100vh - 100px)',
          overflowY: 'auto',
        }}>
          {secciones.map(sec => (
            <div key={sec.id} style={{ marginBottom: 8 }}>
              {/* Header de sección */}
              <button
                onClick={() => setSeccionAbierta(seccionAbierta === sec.id ? '' : sec.id)}
                style={{
                  width: '100%', padding: '10px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 11, fontWeight: 700,
                  color: sec.color, letterSpacing: '0.1em',
                  textTransform: 'uppercase', textAlign: 'left',
                }}>
                  {sec.titulo}
                </span>
                <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>
                  {seccionAbierta === sec.id ? '▾' : '▸'}
                </span>
              </button>

              {/* Artículos */}
              {seccionAbierta === sec.id && (
                <div>
                  {sec.articulos.map(art => {
                    const activo = art.slug === articuloActivo
                    return (
                      <button
                        key={art.slug}
                        onClick={() => {
                          setArticuloActivo(art.slug)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 20px 9px 28px',
                          background: activo ? `${sec.color}12` : 'none',
                          border: 'none',
                          borderLeft: activo ? `3px solid ${sec.color}` : '3px solid transparent',
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!activo) (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1a' }}
                        onMouseLeave={e => { if (!activo) (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                      >
                        <span style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: 13,
                          color: activo ? sec.color : C.creamDim,
                          fontWeight: activo ? 600 : 400,
                        }}>
                          {art.titulo}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Link a soporte */}
          <div style={{ marginTop: 24, padding: '0 20px' }}>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              <button
                onClick={() => { window.location.hash = '#/soporte' }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: 12, color: C.mutedLight,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>💬</span> ¿Necesitas ayuda? → Soporte
              </button>
            </div>
          </div>
        </aside>

        {/* ── Contenido ── */}
        <main style={{ padding: '40px 48px 80px' }}>
          {articuloActualObj && seccionActiva ? (
            <ArticuloView
              articulo={articuloActualObj}
              color={seccionActiva.color}
            />
          ) : (
            <div style={{ color: C.creamDim, fontFamily: 'Montserrat, sans-serif' }}>
              Selecciona un artículo del menú izquierdo.
            </div>
          )}
        </main>
      </div>

      {/* Responsive: sidebar oculto en mobile */}
      <style>{`
        @media (max-width: 780px) {
          .docs-toc { display: none !important; }
        }
        @media (max-width: 640px) {
          aside { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default DocsONE
