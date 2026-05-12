const APP_URL = 'https://tunay-wasi.web.app'

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tunay Wasi</title>
</head>
<body style="margin:0;padding:0;background:#1F3028;font-family:Georgia,serif;color:#F5F0E8;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:28px;letter-spacing:4px;color:#CBBAA0;margin:0;">TUNAY WASI</h1>
      <p style="font-size:12px;color:#CBBAA0;letter-spacing:2px;margin:4px 0 0;">Transparencia desde el origen</p>
    </div>
    <div style="background:rgba(31,48,40,0.8);border-radius:16px;padding:32px;border:1px solid rgba(203,186,160,0.2);">
      ${content}
    </div>
    <div style="text-align:center;margin-top:24px;color:#7A6655;font-size:12px;">
      <p>Tunay Wasi — Café de especialidad directo del origen</p>
      <p><a href="${APP_URL}" style="color:#CBBAA0;">tunay-wasi.web.app</a></p>
    </div>
  </div>
</body>
</html>`
}

export function emailContactoCliente(data: {
  nombre: string
  email: string
  tema: string
  mensaje: string
}): { subject: string; html: string } {
  const temaLabels: Record<string, string> = {
    cafe: 'Comprar café',
    mayorista: 'Mayorista / cafetería',
    caficultor: 'Soy caficultor',
    prensa: 'Prensa',
  }
  return {
    subject: `Tunay Wasi — Recibimos tu mensaje, ${data.nombre}`,
    html: layout(`
      <h2 style="color:#CBBAA0;margin-top:0;">Gracias, ${data.nombre}</h2>
      <p>Recibimos tu mensaje y te responderemos en menos de <strong>24 horas</strong>.</p>
      <div style="background:rgba(203,186,160,0.1);border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Tema:</strong> ${temaLabels[data.tema] ?? data.tema}</p>
        <p style="margin:0 0 8px;"><strong>Correo:</strong> ${data.email}</p>
        <p style="margin:0;"><strong>Mensaje:</strong></p>
        <p style="margin:8px 0 0;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;font-style:italic;">${data.mensaje}</p>
      </div>
      <p style="font-size:14px;">Mientras tanto, puedes explorar nuestro catálogo de cafés de especialidad:</p>
      <div style="text-align:center;margin-top:24px;">
        <a href="${APP_URL}/explorar-cafes"
           style="background:#CBBAA0;color:#1F3028;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ver catálogo →
        </a>
      </div>
    `),
  }
}

export function emailContactoAdmin(data: {
  nombre: string
  email: string
  tema: string
  mensaje: string
}): { subject: string; html: string } {
  const temaLabels: Record<string, string> = {
    cafe: 'Comprar café',
    mayorista: 'Mayorista / cafetería',
    caficultor: 'Soy caficultor',
    prensa: 'Prensa',
  }
  return {
    subject: `[Tunay Wasi] Nuevo mensaje de contacto — ${data.nombre}`,
    html: layout(`
      <h2 style="color:#CBBAA0;margin-top:0;">📬 Nuevo mensaje de contacto</h2>
      <p>Se recibió un nuevo mensaje desde el formulario de contacto del landing.</p>
      <div style="background:rgba(203,186,160,0.1);border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Nombre:</strong> ${data.nombre}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color:#CBBAA0;">${data.email}</a></p>
        <p style="margin:0 0 8px;"><strong>Tema:</strong> ${temaLabels[data.tema] ?? data.tema}</p>
        <p style="margin:0;"><strong>Mensaje:</strong></p>
        <p style="margin:8px 0 0;padding:12px;background:rgba(0,0,0,0.2);border-radius:8px;">${data.mensaje}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${APP_URL}/admin/dashboard"
           style="background:#CBBAA0;color:#1F3028;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ver Dashboard →
        </a>
      </div>
    `),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Confirmación de compra — cliente
// ─────────────────────────────────────────────────────────────────────────────
export function emailConfirmacionCompraCliente(data: {
  clienteNombre: string
  numeroOrden: string
  items: Array<{ cafeName: string; cantidad: number; precioUnitario: number }>
  subtotal: number
  historiaUrl: string
}): { subject: string; html: string } {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:8px 12px;color:#F5F0E8;">${item.cafeName}</td>
      <td style="padding:8px 12px;text-align:center;color:#CBBAA0;">${item.cantidad}</td>
      <td style="padding:8px 12px;text-align:right;color:#CBBAA0;">S/ ${(item.precioUnitario * item.cantidad).toFixed(2)}</td>
    </tr>`).join('')

  return {
    subject: `Pedido ${data.numeroOrden} confirmado — Tunay Wasi`,
    html: layout(`
      <h2 style="color:#CBBAA0;margin-top:0;">¡Pedido confirmado!</h2>
      <p>Hola <strong>${data.clienteNombre}</strong>, tu pedido fue registrado correctamente.</p>

      <div style="background:rgba(203,186,160,0.1);border-radius:8px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;">Número de orden: <strong style="color:#CBBAA0;">${data.numeroOrden}</strong></p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="border-bottom:1px solid rgba(203,186,160,0.3);">
            <th style="padding:8px 12px;text-align:left;color:#CBBAA0;font-size:13px;">Producto</th>
            <th style="padding:8px 12px;text-align:center;color:#CBBAA0;font-size:13px;">Cant.</th>
            <th style="padding:8px 12px;text-align:right;color:#CBBAA0;font-size:13px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr style="border-top:1px solid rgba(203,186,160,0.3);">
            <td colspan="2" style="padding:10px 12px;font-weight:700;color:#F5F0E8;">Total</td>
            <td style="padding:10px 12px;text-align:right;font-weight:700;color:#CBBAA0;">S/ ${data.subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p><strong>¿Cómo pagar?</strong></p>
      <p>Envía el pago por <strong>Yape</strong> al número que te enviamos por WhatsApp. Una vez confirmado el pago, coordinamos el envío.</p>

      <div style="text-align:center;margin-top:24px;">
        <a href="${data.historiaUrl}"
           style="background:#CBBAA0;color:#1F3028;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Ver la historia de tu café →
        </a>
      </div>
    `),
  }
}