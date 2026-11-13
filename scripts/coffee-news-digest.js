#!/usr/bin/env node
/**
 * coffee-news-digest.js — Digest diario del mercado mundial de café
 *
 * Usa el mismo EmailJS que el proyecto (service_ejw2mwn).
 * 100% gratuito: RSS públicos + EmailJS free tier (200 emails/mes).
 *
 * ── Setup (una sola vez) ────────────────────────────────────────────────────
 *
 * 1. En emailjs.com → Email Templates → Create new template con nombre "digest"
 *    Pega este HTML como cuerpo del template:
 *
 *      Subject:  {{subject}}
 *      To email: {{to_email}}
 *      Body:     (HTML editor) → pega: {{{html_content}}}
 *                ↑ triple llave para que no escape el HTML
 *
 *    Guarda el Template ID (ej: template_digest01) y ponlo en TO_TEMPLATE_ID abajo.
 *
 * 2. npm install node-fetch@2 fast-xml-parser --save-dev
 *    (nodemailer ya no se necesita)
 *
 * 3. Correr:
 *      node scripts/coffee-news-digest.js
 *
 * 4. Cron diario lunes–viernes 7am Lima (UTC-5 = 12:00 UTC):
 *      0 12 * * 1-5 cd /ruta/proyecto && node scripts/coffee-news-digest.js >> /tmp/digest.log 2>&1
 *
 * ───────────────────────────────────────────────────────────────────────────
 */

import fetch from 'node-fetch'
import { XMLParser } from 'fast-xml-parser'

// ── EmailJS — credenciales del proyecto (ya configuradas) ────────────────────
const EMAILJS_SERVICE_ID  = 'service_ejw2mwn'
const EMAILJS_PUBLIC_KEY  = '3PFRUEBwFfT36_kUs'
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || 'o_jl1AQEyiJe9UQH-Dz_v'

// ⚠️  Cambia este ID por el template que crees en emailjs.com para el digest
// Template mínimo: Subject={{subject}}, To={{to_email}}, Body={{{html_content}}}
const DIGEST_TEMPLATE_ID  = 'template_digest01'

// ── Destinatarios ─────────────────────────────────────────────────────────────
const RECIPIENTS = [
  'tunaywasi@gmail.com',
  'danielsan1289@gmail.com',
  'cbdavid14@gmail.com',
]

// ── Secciones temáticas con RSS públicos gratuitos ───────────────────────────
const SECTIONS = [
  {
    label: '📈 Precios ICO / Bolsa de Nueva York',
    feeds: [
      {
        url: 'https://feeds.reuters.com/reuters/businessNews',
        limit: 4,
        filter: (t, d = '') =>
          /coffee|café|arabica|robusta|futures|ICO|commodity/i.test(t + d),
      },
      {
        url: 'https://coffeeintelligence.substack.com/feed',
        limit: 2,
      },
    ],
  },
  {
    label: '🇵🇪 Exportaciones e importaciones de café desde Perú',
    feeds: [
      {
        url: 'https://ticotimes.net/category/latin-america/feed',
        limit: 3,
        filter: (t, d = '') => /peru|café|coffee|export|import/i.test(t + d),
      },
      {
        url: 'https://perfectdailygrind.com/feed/',
        limit: 2,
        filter: (t, d = '') => /peru|export|supply chain/i.test(t + d),
      },
    ],
  },
  {
    label: '🏆 Café de Especialidad — SCA y tendencias globales',
    feeds: [
      { url: 'https://sca.coffee/feed/', limit: 3 },
      {
        url: 'https://perfectdailygrind.com/feed/',
        limit: 3,
        filter: (t, d = '') =>
          /specialty|especialidad|cupping|Q-grader|competition|origin/i.test(t + d),
      },
    ],
  },
  {
    label: '🌎 Brasil y Colombia — competencia regional',
    feeds: [
      {
        url: 'https://perfectdailygrind.com/feed/',
        limit: 3,
        filter: (t, d = '') => /brazil|brasil|colombia|cerrado|huila/i.test(t + d),
      },
      {
        url: 'https://sprudge.com/feed',
        limit: 2,
        filter: (t, d = '') => /brazil|brasil|colombia/i.test(t + d),
      },
    ],
  },
  {
    label: '☕ Mercado local — Lima y Perú',
    feeds: [
      {
        url: 'https://sprudge.com/feed',
        limit: 2,
        filter: (t, d = '') => /peru|lima|south america/i.test(t + d),
      },
      {
        url: 'https://dailycoffeenews.com/feed/',
        limit: 2,
        filter: (t, d = '') => /peru|latin|south america/i.test(t + d),
      },
    ],
  },
  {
    label: '🇺🇸🇨🇦 Oportunidades en EE.UU. y Canadá',
    feeds: [
      {
        url: 'https://www.ncausa.org/rss/news',
        limit: 3,
      },
      {
        url: 'https://perfectdailygrind.com/feed/',
        limit: 2,
        filter: (t, d = '') =>
          /usa|united states|canada|import|buyer|market|retail/i.test(t + d),
      },
      {
        url: 'https://dailycoffeenews.com/feed/',
        limit: 2,
        filter: (t, d = '') => /usa|united states|canada|north america/i.test(t + d),
      },
    ],
  },
  {
    label: '🌿 Sostenibilidad, clima y certificaciones',
    feeds: [
      {
        url: 'https://perfectdailygrind.com/feed/',
        limit: 2,
        filter: (t, d = '') =>
          /sustainab|climate|carbon|organic|fair trade|certif/i.test(t + d),
      },
      {
        url: 'https://sca.coffee/feed/',
        limit: 2,
        filter: (t, d = '') =>
          /sustainab|climate|carbon|environment|fair/i.test(t + d),
      },
    ],
  },
  {
    label: '☕ Tendencias del consumidor y nuevos formatos',
    feeds: [
      {
        url: 'https://sprudge.com/feed',
        limit: 3,
        filter: (t, d = '') =>
          /trend|cold brew|nitro|capsule|subscription|retail|consumer/i.test(t + d),
      },
      {
        url: 'https://dailycoffeenews.com/feed/',
        limit: 2,
        filter: (t, d = '') => /trend|consumer|market|brand|retail/i.test(t + d),
      },
    ],
  },
]

// ── RSS helpers ───────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({ ignoreAttributes: false })

async function fetchFeed(url, limit = 5, filter = null) {
  try {
    const res = await fetch(url, {
      timeout: 12000,
      headers: { 'User-Agent': 'TunayWasi-Coffee-Digest/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const data = xmlParser.parse(xml)

    const channel = data?.rss?.channel ?? data?.feed
    const raw = channel?.item ?? channel?.entry ?? []
    const items = Array.isArray(raw) ? raw : [raw]

    const filtered = filter
      ? items.filter((i) =>
          filter(String(i.title ?? ''), String(i.description ?? i.summary ?? ''))
        )
      : items

    return filtered.slice(0, limit).map((item) => {
      const link =
        typeof item.link === 'string'
          ? item.link
          : item.link?.['@_href'] ?? item.guid?.['#text'] ?? item.guid ?? '#'

      return {
        title: String(item.title ?? 'Sin título').replace(/<[^>]*>/g, '').trim(),
        link:  String(link).trim(),
        pubDate: formatDate(item.pubDate ?? item.published ?? item.updated ?? ''),
        description: stripHtml(item.description ?? item.summary ?? item.content ?? ''),
      }
    })
  } catch (err) {
    process.stderr.write(`[digest] Feed error (${url}): ${err.message}\n`)
    return []
  }
}

function stripHtml(html) {
  return String(html)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

function formatDate(raw) {
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleDateString('es-PE', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return String(raw).slice(0, 20)
  }
}

// ── Design system (replica exacta de src/services/emailTemplates.ts) ─────────

const APP_URL    = 'https://tunay-wasi.web.app'
const FONTS_LINK = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">`

function pill(text, bg = '#1f302814', color = '#533b22') {
  return `<span style="display:inline-block;background:${bg};color:${color};font-family:'Montserrat',Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:999px;">${text}</span>`
}

function divider() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#c96e4b55,transparent);font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`
}

function layout(content, preheader = '') {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Tunay Wasi — Digest Café</title>
  ${FONTS_LINK}
</head>
<body style="margin:0;padding:0;background-color:#1f3028;">
${preheader ? `<div style="display:none;font-size:1px;color:#1f3028;line-height:1px;max-height:0;overflow:hidden;">${preheader}&zwnj;&nbsp;</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1f3028;">
  <tr><td align="center" style="padding:40px 16px 36px;">
    <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:24px;">
        <table width="80%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:22px;">
          <tr><td style="height:1px;background:linear-gradient(90deg,transparent 0%,#c96e4b 40%,#8faf8a 70%,transparent 100%);font-size:0;">&nbsp;</td></tr>
        </table>
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;letter-spacing:10px;color:#f2e0cc;margin:0 0 8px;text-transform:uppercase;">TUNAY WASI</h1>
        <p style="font-family:'Montserrat',Arial,sans-serif;font-size:9px;color:#8faf8a;letter-spacing:3px;margin:0;text-transform:uppercase;">Café de especialidad &middot; Desde el origen</p>
        <table width="40" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:18px;">
          <tr><td style="height:1px;background:#c96e4b;font-size:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#f2e0cc;border-radius:16px;overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:3px;background:linear-gradient(90deg,#c96e4b,#c96e4b 50%,#8faf8a);font-size:0;">&nbsp;</td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:36px 36px 40px;">${content}</td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding-top:28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
          <tr><td style="height:1px;background:rgba(143,175,138,0.2);font-size:0;">&nbsp;</td></tr>
        </table>
        <p style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#8faf8a;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Tunay Wasi &mdash; Café de especialidad</p>
        <p style="margin:0 0 14px;"><a href="${APP_URL}" style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#c4b297;text-decoration:none;">${APP_URL.replace('https://', '')}</a></p>
        <p style="font-family:'Montserrat',Arial,sans-serif;font-size:9px;color:#533b2255;margin:0;">Digest automático · Fuentes RSS públicas gratuitas</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Build HTML ────────────────────────────────────────────────────────────────

function buildHtml(sections, fechaStr) {
  const sectionHtml = sections
    .filter((s) => s.items.length > 0)
    .map((s) => {
      const rows = s.items.map((item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1f302812;">
            <a href="${item.link}" style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:600;color:#1f3028;text-decoration:none;display:block;line-height:1.4;">${item.title}</a>
            ${item.pubDate ? `<p style="margin:3px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:9px;color:#8faf8a;letter-spacing:1px;">${item.pubDate}</p>` : ''}
            ${item.description ? `<p style="margin:5px 0 0;font-family:'Montserrat',Arial,sans-serif;font-size:11px;color:#533b22;line-height:1.55;">${item.description}…</p>` : ''}
          </td>
        </tr>`).join('')

      return `
        <p style="margin:0 0 10px;font-family:'Montserrat',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b297;">${s.label}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:4px;"><tbody>${rows}</tbody></table>
        ${divider()}`
    }).join('')

  const content = `
    ${pill('Digest Diario · Mercado del Café', '#1f302814', '#533b22')}
    <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:600;color:#1f3028;margin:16px 0 4px;line-height:1.15;">Mercado Mundial del Café</h2>
    <p style="font-family:'Montserrat',Arial,sans-serif;font-size:12px;color:#c4b297;letter-spacing:1px;margin:0 0 4px;">${fechaStr}</p>
    <p style="font-family:'Montserrat',Arial,sans-serif;font-size:13px;color:#533b22;margin:0;line-height:1.7;">
      Novedades del mercado global para contextualizar la posición de
      <strong style="color:#1f3028;">Tunay Wasi</strong> como café de especialidad peruano frente a las tendencias mundiales.
    </p>
    ${divider()}
    ${sectionHtml}
    <p style="font-family:'Montserrat',Arial,sans-serif;font-size:10px;color:#c4b297;margin:0;text-align:center;">
      Fuentes: ICO · Reuters · Perfect Daily Grind · SCA · Sprudge · Daily Coffee News · NCA
    </p>`

  return layout(content, `Digest café ${fechaStr}`)
}

// ── Envío con EmailJS REST API ────────────────────────────────────────────────

async function sendViaEmailJS(to, subject, htmlContent) {
  const body = {
    service_id:  EMAILJS_SERVICE_ID,
    template_id: DIGEST_TEMPLATE_ID,
    user_id:     EMAILJS_PUBLIC_KEY,
    accessToken: EMAILJS_PRIVATE_KEY,
    template_params: {
      to_email:     to,
      subject,
      html_content: htmlContent,
    },
  }

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EmailJS error ${res.status}: ${text}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const fechaStr = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  process.stdout.write(`[digest] Obteniendo feeds — ${fechaStr}\n`)

  const sections = await Promise.all(
    SECTIONS.map(async (section) => {
      const allItems = (
        await Promise.all(
          section.feeds.map((f) => fetchFeed(f.url, f.limit ?? 5, f.filter ?? null))
        )
      ).flat()

      // Deduplicar por título
      const seen = new Set()
      const unique = allItems.filter((item) => {
        const key = item.title.toLowerCase().slice(0, 60)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      return { label: section.label, items: unique }
    })
  )

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0)
  process.stdout.write(`[digest] ${totalItems} noticias en ${sections.filter(s => s.items.length > 0).length} secciones\n`)

  if (totalItems === 0) {
    process.stderr.write('[digest] Sin noticias. Abortando.\n')
    process.exit(0)
  }

  const html    = buildHtml(sections, fechaStr)
  const subject = `☕ Digest Café Mundial — ${fechaStr}`

  // Enviar a cada destinatario (EmailJS free tier: 200/mes)
  for (const to of RECIPIENTS) {
    try {
      await sendViaEmailJS(to, subject, html)
      process.stdout.write(`[digest] ✓ Enviado → ${to}\n`)
    } catch (err) {
      process.stderr.write(`[digest] ✗ Error enviando a ${to}: ${err.message}\n`)
    }
  }
}

main().catch((err) => {
  process.stderr.write(`[digest] ERROR FATAL: ${err.message}\n`)
  process.exit(1)
})
