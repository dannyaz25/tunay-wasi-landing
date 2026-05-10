import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  console.log('[mailService] Enviando email a', opts.to)
  console.log('[mailService] Config:', {
    SERVICE_ID: SERVICE_ID,
    TEMPLATE_ID: TEMPLATE_ID,
    PUBLIC_KEY: PUBLIC_KEY
  })
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[mailService] EmailJS no configurado. Agrega VITE_EMAILJS_* al .env.local')
    return
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: opts.to,
        subject: opts.subject,
        html_content: opts.html,
      },
      PUBLIC_KEY
    )
    console.log('[mailService] Email enviado a', opts.to)
  } catch (err) {
    console.error('[mailService] Error EmailJS:', err)
    throw err
  }
}
