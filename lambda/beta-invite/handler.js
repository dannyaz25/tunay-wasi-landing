'use strict'

const { GoogleAuth } = require('google-auth-library')
const nodemailer = require('nodemailer')
const fetch = require('node-fetch')

const PLAY_STORE_URL = 'https://appdistribution.firebase.google.com/testerapps/1:399522765847:android:98ef173a366e5ba6ddd052/releases/72urpb3ctnosg'

// ─── CORS headers ────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = process.env.ALLOWED_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': allowed === '*' ? '*' : origin || allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// ─── Google auth token para App Distribution API ─────────────────────────────

async function getGoogleAccessToken() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT
  if (!serviceAccountJson) throw new Error('GOOGLE_SERVICE_ACCOUNT env var no configurada')

  const credentials = JSON.parse(serviceAccountJson)
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  return tokenResponse.token
}

// ─── Obtener el release ID más reciente ──────────────────────────────────────

async function getLatestReleaseId(projectNumber, appId, token) {
  const url = `https://firebaseappdistribution.googleapis.com/v1/projects/${projectNumber}/apps/${appId}/releases?pageSize=1&orderBy=createTime%20desc`
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Releases list error:', res.status, err)
    return null
  }
  const data = await res.json()
  const release = data.releases?.[0]
  if (!release) return null
  // name = "projects/N/apps/APP_ID/releases/RELEASE_ID"
  return release.name.split('/').pop()
}

// ─── Agregar tester a Firebase App Distribution ───────────────────────────────

async function agregarTesterAppDistribution(email) {
  const appId = process.env.FIREBASE_APP_ID
  if (!appId) throw new Error('FIREBASE_APP_ID env var no configurada')

  const token = await getGoogleAccessToken()
  const projectNumber = appId.split(':')[1]

  // 1. Agregar tester al proyecto
  const url = `https://firebaseappdistribution.googleapis.com/v1/projects/${projectNumber}/testers:batchAdd`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ emails: [email] }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('App Distribution batchAdd error:', res.status, err)
    return { ok: false, error: err }
  }

  // 2. Obtener el release más reciente y asignar el tester
  const releaseId = await getLatestReleaseId(projectNumber, appId, token)
  if (!releaseId) {
    console.warn('No se pudo obtener el release ID — tester agregado al proyecto pero no al release')
    return { ok: true, releaseAssigned: false }
  }

  const releaseUrl = `https://firebaseappdistribution.googleapis.com/v1/projects/${projectNumber}/apps/${appId}/releases/${releaseId}/testers:batchAdd`
  const resRelease = await fetch(releaseUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ emails: [email] }),
  })

  if (!resRelease.ok) {
    const err = await resRelease.text()
    console.error('Release batchAdd error:', resRelease.status, err)
    // Tester ya está en el proyecto, solo falló el release — no es crítico
    return { ok: true, releaseAssigned: false, releaseError: err }
  }

  return { ok: true, releaseAssigned: true, releaseId }
}

// ─── Email de bienvenida ──────────────────────────────────────────────────────

async function enviarEmailBienvenida(nombre, email, rol) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) {
    console.warn('Gmail no configurado — saltando email')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })

  const rolLabel = rol === 'caficultor' ? 'caficultor' : 'emprendedor de cafetería'
  const acento = rol === 'caficultor' ? '#8faf8a' : '#c96e4b'

  await transporter.sendMail({
    from: '"TunayWasi" <tunaywasi@gmail.com>',
    to: email,
    subject: '☕ Tu acceso a la beta de TunayWasi ya está listo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #f2e0cc; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1f3028, #0a0a0a); padding: 32px 28px 24px;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #f2e0cc; margin: 0 0 8px;">
            TunayWasi
          </h1>
          <p style="color: ${acento}; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">
            Beta · Café de especialidad peruano
          </p>
        </div>

        <div style="padding: 28px;">
          <p style="font-size: 16px; color: #f2e0cc; margin: 0 0 12px;">
            Hola <strong>${nombre}</strong>,
          </p>
          <p style="font-size: 14px; color: #c4b297; line-height: 1.7; margin: 0 0 24px;">
            Estás registrado como <strong style="color: #f2e0cc;">${rolLabel}</strong> en la beta de TunayWasi.
            Te agregamos como tester — ya puedes descargar la app desde el siguiente enlace:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${PLAY_STORE_URL}"
               style="display: inline-block; background: ${acento}; color: #ffffff;
                      padding: 14px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: bold; font-size: 15px;">
              Descargar app (Android)
            </a>
          </div>

          <div style="background: #141414; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
            <p style="font-size: 12px; color: #c4b297; margin: 0 0 8px; font-weight: bold;">
              Requisitos:
            </p>
            <ul style="font-size: 13px; color: #c4b297; margin: 0; padding-left: 18px; line-height: 1.8;">
              <li>Android 8.0 o superior</li>
              <li>El link solo funciona si aceptas la invitación de Firebase App Distribution</li>
              <li>Puede pedirte iniciar sesión con tu cuenta Google la primera vez</li>
            </ul>
          </div>

          <p style="font-size: 13px; color: #777; line-height: 1.7; margin: 0 0 8px;">
            ¿Tienes problemas para descargar? Escríbenos por WhatsApp:
            <a href="https://wa.me/51917959370" style="color: ${acento};">+51 917 959 370</a>
          </p>
        </div>

        <div style="border-top: 1px solid #222; padding: 16px 28px;">
          <p style="font-size: 11px; color: #555; margin: 0;">
            TunayWasi · Café peruano de especialidad · Beta privada
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Guardar en Firestore via REST API ────────────────────────────────────────
// Usamos la REST API de Firestore para no tener que incluir el SDK completo

async function guardarEnFirestore(nombre, email, rol, invitado) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) {
    console.warn('FIREBASE_PROJECT_ID no configurado — saltando Firestore')
    return
  }

  const token = await getGoogleAccessToken()
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/beta_waitlist`

  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        nombre:    { stringValue: nombre },
        email:     { stringValue: email.toLowerCase() },
        rol:       { stringValue: rol },
        invitado:  { booleanValue: invitado },
        origen:    { stringValue: 'lambda' },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  })
}

// ─── Handler principal ────────────────────────────────────────────────────────

module.exports.betaInvite = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || ''
  const headers = corsHeaders(origin)

  // Preflight CORS
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'Body inválido' }),
    }
  }

  const { nombre, email, rol } = body

  if (!nombre || !email || !rol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'nombre, email y rol son requeridos' }),
    }
  }

  if (!['emprendedor', 'caficultor'].includes(rol)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: 'rol debe ser emprendedor o caficultor' }),
    }
  }

  console.log('betaInvite:', { email, rol })

  // 1. Agregar tester a App Distribution
  let invitado = false
  try {
    const result = await agregarTesterAppDistribution(email)
    invitado = result.ok
    console.log('App Distribution:', result)
  } catch (err) {
    console.error('Error App Distribution:', err)
  }

  // 2. Enviar email de bienvenida
  try {
    await enviarEmailBienvenida(nombre, email, rol)
    console.log('Email enviado a:', email)
  } catch (err) {
    console.error('Error email:', err)
  }

  // 3. Guardar en Firestore
  try {
    await guardarEnFirestore(nombre, email, rol, invitado)
    console.log('Firestore guardado:', email)
  } catch (err) {
    console.error('Error Firestore:', err)
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, invitado }),
  }
}
