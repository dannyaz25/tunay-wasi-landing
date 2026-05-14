// ─────────────────────────────────────────────────────────────────────────────
// Email templates — Tunay Wasi
//
// Design tokens (matches landing):
//   cream    #f2e0cc   card background
//   green    #1f3028   outer bg, headings, deep text
//   terra    #c96e4b   CTAs, accents, borders
//   sage     #8faf8a   secondary, success states
//   tan      #c4b297   muted text
//   brown    #533b22   body text, captions
//
// Fonts: Cormorant Garamond (headings) · Montserrat (body) — Google Fonts CDN
// Layout: table-based for email client compatibility
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = 'https://tunay-wasi.web.app'

// ── Shared primitives ─────────────────────────────────────────────────────────

const FONTS_LINK = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">`

function pill(text: string, bg = '#1f302814', color = '#533b22'): string {
  return `<span style="display:inline-block;background:${bg};color:${color};font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:999px;">${text}</span>`
}

function ctaButton(text: string, url: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;background:#c96e4b;color:#f2e0cc;font-family:'Montserrat',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 36px;border-radius:999px;">${text}</a>
      </td>
    </tr>
  </table>`
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="height:1px;background:linear-gradient(90deg,transparent,#c96e4b55,transparent);font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>`
}

function dataField(label: string, value: string): string {
  return `<tr>
    <td style="padding:0 0 14px;">
      <p style="margin:0 0 3px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">${label}</p>
      <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#1f3028;">${value}</p>
    </td>
  </tr>`
}

function quoteBlock(text: string, borderColor = '#c96e4b'): string {
  return `<div style="margin:4px 0 0;padding:16px 18px;background:#1f30280a;border-radius:8px;border-left:3px solid ${borderColor};">
    <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-style:italic;color:#533b22;line-height:1.65;">${text}</p>
  </div>`
}

// ── Layout shell ──────────────────────────────────────────────────────────────

function layout(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Tunay Wasi</title>
  ${FONTS_LINK}
</head>
<body style="margin:0;padding:0;background-color:#1f3028;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

${preheader ? `<div style="display:none;font-size:1px;color:#1f3028;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f3028;min-width:100%;">
  <tr>
    <td align="center" valign="top" style="padding:40px 16px 36px;">

      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- ── Logo ─────────────────────────────────────────── -->
        <tr>
          <td align="center" style="padding-bottom:24px;">

            <!-- Top ornament line -->
            <table width="80%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:22px;">
              <tr>
                <td style="height:1px;background:linear-gradient(90deg,transparent 0%,#c96e4b 40%,#8faf8a 70%,transparent 100%);font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;letter-spacing:10px;color:#f2e0cc;margin:0 0 8px;text-transform:uppercase;line-height:1;">TUNAY WASI</h1>
            <p style="font-family:'Montserrat',Arial,sans-serif;font-size:9px;color:#8faf8a;letter-spacing:3px;margin:0;text-transform:uppercase;">Café de especialidad &middot; Desde el origen</p>

            <!-- Bottom ornament -->
            <table width="40" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:18px;">
              <tr>
                <td style="height:1px;background:#c96e4b;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ── Card ──────────────────────────────────────────── -->
        <tr>
          <td style="background:#f2e0cc;border-radius:16px;overflow:hidden;">

            <!-- Terra accent bar -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="height:3px;background:linear-gradient(90deg,#c96e4b 0%,#c96e4b 50%,#8faf8a 100%);font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <!-- Content area -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:36px 36px 40px;">
                  ${content}
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ── Footer ────────────────────────────────────────── -->
        <tr>
          <td align="center" style="padding-top:28px;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
              <tr>
                <td style="height:1px;background:rgba(143,175,138,0.2);font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <p style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#8faf8a;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Tunay Wasi &mdash; Café de especialidad</p>
            <p style="margin:0 0 14px;">
              <a href="${APP_URL}" style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#c4b297;text-decoration:none;letter-spacing:1px;">${APP_URL.replace('https://', '')}</a>
            </p>
            <p style="font-family:'Montserrat',Arial,sans-serif;font-size:9px;color:#533b2255;margin:0;letter-spacing:0.5px;">
              Recibiste este correo porque interactuaste con Tunay Wasi
            </p>

          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`
}

function pen(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Contacto — confirmación al cliente
// ─────────────────────────────────────────────────────────────────────────────

export function emailContactoCliente(data: {
  nombre: string
  email: string
  tema: string
  mensaje: string
}): { subject: string; html: string } {
  const temaLabels: Record<string, string> = {
    cafe:       'Comprar café',
    mayorista:  'Mayorista / cafetería',
    caficultor: 'Soy caficultor',
    prensa:     'Prensa',
  }

  return {
    subject: `Tunay Wasi — Recibimos tu mensaje, ${data.nombre}`,
    html: layout(`
      ${pill('Mensaje recibido', '#8faf8a22', '#8faf8a')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        Gracias, ${data.nombre}
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;margin:0 0 0;line-height:1.7;">
        Recibimos tu mensaje y te responderemos en menos de <strong style="color:#1f3028;font-weight:700;">24&nbsp;horas</strong>.
      </p>

      ${divider()}

      <!-- Data fields -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${dataField('Tema', temaLabels[data.tema] ?? data.tema)}
        ${dataField('Correo', data.email)}
        <tr>
          <td style="padding:0 0 6px;">
            <p style="margin:0 0 6px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">Tu mensaje</p>
            ${quoteBlock(data.mensaje)}
          </td>
        </tr>
      </table>

      ${divider()}

      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;margin:0;line-height:1.75;">
        Mientras tanto, puedes explorar nuestro catálogo de cafés de especialidad con puntaje SCA y trazabilidad completa desde la finca.
      </p>

      ${ctaButton('Ver catálogo →', `${APP_URL}/explorar-cafes`)}
    `, `Recibimos tu mensaje, ${data.nombre} — te respondemos en 24h`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Contacto — notificación al admin
// ─────────────────────────────────────────────────────────────────────────────

export function emailContactoAdmin(data: {
  nombre: string
  email: string
  tema: string
  mensaje: string
}): { subject: string; html: string } {
  const temaLabels: Record<string, string> = {
    cafe:       'Comprar café',
    mayorista:  'Mayorista / cafetería',
    caficultor: 'Soy caficultor',
    prensa:     'Prensa',
  }

  return {
    subject: `[TW] Contacto — ${data.nombre} · ${temaLabels[data.tema] ?? data.tema}`,
    html: layout(`
      ${pill('Admin · Formulario de contacto', '#1f302814', '#533b22')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        Nuevo mensaje recibido
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;margin:0 0 0;line-height:1.7;">
        Desde el formulario de contacto del landing.
      </p>

      ${divider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${dataField('Nombre', data.nombre)}
        ${dataField('Email', `<a href="mailto:${data.email}" style="color:#c96e4b;text-decoration:none;font-weight:600;">${data.email}</a>`)}
        ${dataField('Tema', `${pill(temaLabels[data.tema] ?? data.tema, '#c96e4b18', '#c96e4b')}`)}
        <tr>
          <td style="padding:0 0 6px;">
            <p style="margin:0 0 6px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">Mensaje</p>
            ${quoteBlock(data.mensaje, '#8faf8a')}
          </td>
        </tr>
      </table>

      ${ctaButton('Abrir Dashboard →', `${APP_URL}/admin/dashboard`)}
    `, `Nuevo mensaje de ${data.nombre} — ${temaLabels[data.tema] ?? data.tema}`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Confirmación de compra — cliente
// ─────────────────────────────────────────────────────────────────────────────

export function emailConfirmacionCompraCliente(data: {
  clienteNombre: string
  numeroOrden: string
  items: Array<{ cafeName: string; cantidad: number; precioUnitario: number }>
  subtotal: number
  historiaUrl: string
}): { subject: string; html: string } {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1f302812;">
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#1f3028;font-weight:600;">${item.cafeName}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1f302812;text-align:center;">
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;">&times;${item.cantidad}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1f302812;text-align:right;">
        <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:600;color:#1f3028;">S/&nbsp;${(item.precioUnitario * item.cantidad).toFixed(2)}</p>
      </td>
    </tr>`).join('')

  return {
    subject: `Pedido ${data.numeroOrden} registrado — Tunay Wasi`,
    html: layout(`
      ${pill('Pedido registrado', '#8faf8a22', '#8faf8a')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        ¡Gracias, ${data.clienteNombre}!
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;margin:0;line-height:1.7;">
        Tu pedido fue registrado correctamente. Verificaremos tu pago y te confirmaremos por WhatsApp.
      </p>

      ${divider()}

      <!-- Número de orden -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#1f302808;border-radius:10px;padding:14px 18px;border-left:3px solid #c96e4b;">
            <p style="margin:0 0 3px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">Número de pedido</p>
            <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600;color:#c96e4b;letter-spacing:2px;">${data.numeroOrden}</p>
          </td>
        </tr>
      </table>

      <!-- Items table -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <thead>
          <tr>
            <th style="padding:0 0 10px;text-align:left;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;border-bottom:1px solid #1f302820;">Producto</th>
            <th style="padding:0 0 10px;text-align:center;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;border-bottom:1px solid #1f302820;">Cant.</th>
            <th style="padding:0 0 10px;text-align:right;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;border-bottom:1px solid #1f302820;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#533b22;">Total a pagar</td>
            <td style="padding:14px 0 0;text-align:right;">
              <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;color:#c96e4b;">S/&nbsp;${data.subtotal.toFixed(2)}</span>
            </td>
          </tr>
        </tfoot>
      </table>

      ${divider()}

      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;margin:0;line-height:1.75;">
        Envía tu comprobante de pago (Yape, Plin o transferencia) por <strong style="color:#1f3028;">WhatsApp</strong> y confirmamos tu pedido en menos de 24&nbsp;horas.
      </p>

      ${ctaButton('Ver la historia de tu café →', data.historiaUrl)}
    `, `Pedido ${data.numeroOrden} registrado — te confirmamos en 24h`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pedido recibido — aviso inmediato al cliente tras checkout
// ─────────────────────────────────────────────────────────────────────────────

type AdapterName = 'yape' | 'plin' | 'transferencia' | 'niubiz' | 'stripe'

const ADAPTER_LABEL: Record<AdapterName, string> = {
  yape:          'Yape',
  plin:          'Plin',
  transferencia: 'Transferencia bancaria',
  niubiz:        'Tarjeta (Niubiz)',
  stripe:        'Tarjeta (Stripe)',
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Bienvenida caficultor — confirmación de lista de espera
// ─────────────────────────────────────────────────────────────────────────────

export function emailBienvenidaCaficultorWaitlist(data: {
  nombre: string
  email: string
  finca: string
  region: string
  sca: string
}): { subject: string; html: string } {
  return {
    subject: `Tunay Wasi — Estás en la lista, ${data.nombre}`,
    html: layout(`
      ${pill('Lista de espera · Caficultores', '#8faf8a22', '#8faf8a')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        ¡Bienvenido, ${data.nombre}!
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;margin:0;line-height:1.75;">
        Tu finca quedó registrada en nuestra lista de espera. Serás de los primeros en acceder a precios justos según el puntaje SCA real de tu café.
      </p>

      ${divider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${dataField('Finca / Cooperativa', data.finca)}
        ${dataField('Región', data.region)}
        ${dataField('Puntaje SCA estimado', data.sca)}
        ${dataField('Correo registrado', data.email)}
      </table>

      ${divider()}

      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;margin:0 0 14px;">Próximos pasos</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 12px 12px 0;vertical-align:top;width:24px;">
            <div style="width:22px;height:22px;border-radius:50%;background:#c96e4b;color:#f2e0cc;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;text-align:center;line-height:22px;">1</div>
          </td>
          <td style="padding-bottom:12px;">
            <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;line-height:1.6;">Te contactamos para coordinar el <strong style="color:#1f3028;">envío de tu muestra</strong> a Lima</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 12px 12px 0;vertical-align:top;">
            <div style="width:22px;height:22px;border-radius:50%;background:#8faf8a;color:#1f3028;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;text-align:center;line-height:22px;">2</div>
          </td>
          <td style="padding-bottom:12px;">
            <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;line-height:1.6;">Nuestro Q-Grader realiza la <strong style="color:#1f3028;">cata SCA</strong> y te informamos el puntaje real</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 12px 0 0;vertical-align:top;">
            <div style="width:22px;height:22px;border-radius:50%;background:#1f302822;color:#533b22;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;text-align:center;line-height:22px;">3</div>
          </td>
          <td>
            <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;line-height:1.6;"><strong style="color:#1f3028;">Recibes el pago</strong> al entregar tu microlote en Lima, según precio SCA acordado</p>
          </td>
        </tr>
      </table>

      ${ctaButton('Ver cómo funciona →', `${APP_URL}/caficultores#calculadora`)}
    `, `Bienvenido a la lista de espera de Tunay Wasi, ${data.nombre}`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Alerta admin — nuevo caficultor en lista de espera
// ─────────────────────────────────────────────────────────────────────────────

export function emailAlertaAdminCaficultor(data: {
  nombre: string
  email: string
  telefono: string
  finca: string
  region: string
  kg: string
  sca: string
}): { subject: string; html: string } {
  return {
    subject: `[TW] Nuevo caficultor — ${data.nombre || data.email}`,
    html: layout(`
      ${pill('Admin · Lista de espera caficultores', '#1f302814', '#533b22')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        Nuevo registro de caficultor
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;margin:0;line-height:1.7;">
        Desde el landing B2B de caficultores.
      </p>

      ${divider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${dataField('Nombre', data.nombre || '—')}
        ${dataField('Email', `<a href="mailto:${data.email}" style="color:#c96e4b;text-decoration:none;font-weight:600;">${data.email}</a>`)}
        ${dataField('Teléfono / WhatsApp', `<a href="https://wa.me/${data.telefono.replace(/\D/g, '')}" style="color:#c96e4b;text-decoration:none;font-weight:600;">${data.telefono}</a>`)}
        ${dataField('Finca / Cooperativa', data.finca || '—')}
        ${dataField('Región', data.region || '—')}
        ${dataField('Producción anual (kg)', data.kg || '—')}
        ${dataField('Puntaje SCA estimado', `${pill(data.sca, '#c96e4b18', '#c96e4b')}`)}
      </table>

      ${ctaButton('Abrir Dashboard →', `${APP_URL}/admin/caficultores`)}
    `, `Nuevo caficultor registrado — ${data.nombre || data.email}`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pedido recibido — aviso inmediato al cliente tras checkout
// ─────────────────────────────────────────────────────────────────────────────

export function emailPedidoRecibido(data: {
  nombre: string
  orderId: string
  items: Array<{ name: string; weight: string; grind: string; qty: number; unitCents: number }>
  totalCents: number
  adapter: AdapterName
}): { subject: string; html: string } {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1f302812;">
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#1f3028;font-weight:600;">${item.name}</p>
        <p style="margin:3px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#c4b297;letter-spacing:1px;">${item.weight} &middot; ${item.grind}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1f302812;text-align:center;vertical-align:top;">
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;">&times;${item.qty}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1f302812;text-align:right;vertical-align:top;">
        <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:600;color:#1f3028;">${pen(item.unitCents * item.qty)}</p>
      </td>
    </tr>`).join('')

  return {
    subject: `Tunay Wasi — Pedido ${data.orderId} recibido`,
    html: layout(`
      ${pill('Pedido recibido', '#c96e4b18', '#c96e4b')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        ¡Recibimos tu pedido,&nbsp;${data.nombre}!
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;margin:0;line-height:1.75;">
        Estamos verificando tu comprobante de pago. En cuanto lo confirmemos,
        te enviaremos un segundo correo con el estado actualizado.
      </p>

      ${divider()}

      <!-- Orden + método -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <div style="background:#1f302808;border-radius:10px;padding:14px 16px;border-left:3px solid #c96e4b;">
              <p style="margin:0 0 3px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">N° Pedido</p>
              <p style="margin:0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#c96e4b;letter-spacing:1px;">${data.orderId}</p>
            </div>
          </td>
          <td width="50%" style="padding-left:8px;">
            <div style="background:#1f302808;border-radius:10px;padding:14px 16px;border-left:3px solid #8faf8a;">
              <p style="margin:0 0 3px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">Método de pago</p>
              <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:600;color:#533b22;">${ADAPTER_LABEL[data.adapter]}</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Items -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <thead>
          <tr>
            <th style="padding:0 0 10px;text-align:left;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;border-bottom:1px solid #1f302820;">Producto</th>
            <th style="padding:0 0 10px;text-align:center;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;border-bottom:1px solid #1f302820;">Cant.</th>
            <th style="padding:0 0 10px;text-align:right;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;border-bottom:1px solid #1f302820;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#533b22;">Total</td>
            <td style="padding:14px 0 0;text-align:right;">
              <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:700;color:#c96e4b;">${pen(data.totalCents)}</span>
            </td>
          </tr>
        </tfoot>
      </table>

      ${divider()}

      <!-- Próximos pasos -->
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;margin:0 0 12px;">Próximos pasos</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 12px 12px 0;vertical-align:top;width:20px;">
            <div style="width:20px;height:20px;border-radius:50%;background:#c96e4b;color:#f2e0cc;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;text-align:center;line-height:20px;">1</div>
          </td>
          <td style="padding-bottom:12px;">
            <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;line-height:1.6;">Verificamos tu comprobante de pago <strong style="color:#1f3028;">(máx. 24 h)</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 12px 12px 0;vertical-align:top;">
            <div style="width:20px;height:20px;border-radius:50%;background:#8faf8a;color:#1f3028;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;text-align:center;line-height:20px;">2</div>
          </td>
          <td style="padding-bottom:12px;">
            <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;line-height:1.6;">Te enviamos un correo de <strong style="color:#1f3028;">confirmación de pago</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 12px 0 0;vertical-align:top;">
            <div style="width:20px;height:20px;border-radius:50%;background:#1f302822;color:#533b22;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;text-align:center;line-height:20px;">3</div>
          </td>
          <td>
            <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;line-height:1.6;">Tostamos y despachamos tu pedido en la fecha indicada</p>
          </td>
        </tr>
      </table>

      ${ctaButton('¿Dudas? Escríbenos →', `https://wa.me/51917959370?text=Hola%2C+mi+pedido+es+${encodeURIComponent(data.orderId)}`)}
    `, `Pedido ${data.orderId} recibido — verificamos tu pago en 24 h`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. B2B mayorista — confirmación al comprador
// ─────────────────────────────────────────────────────────────────────────────

export function emailBienvenidaMayoristaB2B(data: {
  contacto: string
  empresa: string
  email: string
  volumenKg: number
  frecuencia: string
  mensaje?: string
  loteReservado?: { id: string; variedad: string; origen: string; sca: number; precioKg: number }
}): { subject: string; html: string } {
  const loteBlock = data.loteReservado
    ? `<div style="margin:0 0 4px;padding:14px 16px;background:#c96e4b0f;border-radius:8px;border-left:3px solid #c96e4b;">
        <p style="margin:0 0 4px;font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c96e4b;">Lote de tu interés</p>
        <p style="margin:0 0 2px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:600;color:#1f3028;">${data.loteReservado.id} &mdash; ${data.loteReservado.variedad}</p>
        <p style="margin:0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#533b22;">${data.loteReservado.origen} &middot; SCA ${data.loteReservado.sca} pts &middot; S/ ${data.loteReservado.precioKg.toFixed(2)} / kg FOB Lima</p>
      </div>`
    : ''

  return {
    subject: 'Tunay Wasi — Recibimos tu solicitud B2B',
    html: layout(`
      ${pill('Solicitud B2B recibida', '#c96e4b18', '#c96e4b')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        ¡Recibimos tu solicitud, ${data.contacto}!
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;margin:0 0 4px;line-height:1.7;">
        Hemos recibido la solicitud de <strong>${data.empresa}</strong>. Nos pondremos en contacto contigo en las próximas <strong>24 horas</strong> con una propuesta a medida.
      </p>

      ${divider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${data.loteReservado ? `<tr><td style="padding:0 0 16px;">${loteBlock}</td></tr>` : ''}
        ${dataField('Empresa', data.empresa)}
        ${dataField('Volumen solicitado', `${data.volumenKg} kg`)}
        ${dataField('Frecuencia de compra', data.frecuencia)}
        ${data.mensaje ? dataField('Tu mensaje', data.mensaje) : ''}
      </table>

      ${divider()}

      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;margin:0;line-height:1.7;">
        Mientras tanto puedes explorar los lotes disponibles de la cosecha actual.
      </p>

      ${ctaButton('Ver lotes disponibles →', `${APP_URL}#lotes`)}
    `, `Solicitud de ${data.empresa} recibida — te contactamos en 24 h`),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. B2B mayorista — alerta al admin
// ─────────────────────────────────────────────────────────────────────────────

export function emailAlertaAdminMayoristaB2B(data: {
  empresa: string
  contacto: string
  email: string
  telefono: string
  volumenKg: number
  frecuencia: string
  puntajeMin: number
  variedad?: string
  mensaje?: string
  loteReservado?: { id: string; variedad: string; origen: string; sca: number; precioKg: number }
}): { subject: string; html: string } {
  return {
    subject: `[TW] Nueva solicitud B2B — ${data.empresa}`,
    html: layout(`
      ${pill('Admin · Nueva solicitud mayorista', '#1f302814', '#533b22')}

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#1f3028;margin:16px 0 6px;line-height:1.15;">
        Nueva solicitud B2B
      </h2>
      <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#533b22;margin:0;line-height:1.7;">
        Desde el landing de mayoristas.
      </p>

      ${divider()}

      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${data.loteReservado ? dataField('Lote reservado', `${pill(data.loteReservado.id, '#c96e4b18', '#c96e4b')} ${data.loteReservado.variedad} &middot; ${data.loteReservado.origen} &middot; SCA ${data.loteReservado.sca} &middot; S/ ${data.loteReservado.precioKg.toFixed(2)} / kg`) : ''}
        ${dataField('Empresa', data.empresa)}
        ${dataField('Contacto', data.contacto)}
        ${dataField('Email', `<a href="mailto:${data.email}" style="color:#c96e4b;text-decoration:none;font-weight:600;">${data.email}</a>`)}
        ${dataField('Teléfono / WhatsApp', `<a href="https://wa.me/${data.telefono.replace(/\D/g, '')}" style="color:#c96e4b;text-decoration:none;font-weight:600;">${data.telefono}</a>`)}
        ${dataField('Volumen requerido', `${data.volumenKg} kg`)}
        ${dataField('Frecuencia de compra', data.frecuencia)}
        ${dataField('SCA mínimo', `${pill(String(data.puntajeMin) + '+', '#c96e4b18', '#c96e4b')}`)}
        ${data.variedad ? dataField('Variedad preferida', data.variedad) : ''}
        ${data.mensaje ? dataField('Mensaje', data.mensaje) : ''}
      </table>

      ${ctaButton('Ver Dashboard →', `${APP_URL}/admin/dashboard`)}
    `, `Nueva solicitud B2B de ${data.empresa}`),
  }
}
