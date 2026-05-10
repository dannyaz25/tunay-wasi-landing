const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send'

export async function sendMail(opts: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('[mailService] EmailJS no configurado. Agrega VITE_EMAILJS_* al .env.local')
    return
  }

  const res = await fetch(EMAILJS_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      service_id:    SERVICE_ID,
      template_id:   TEMPLATE_ID,
      user_id:       PUBLIC_KEY,
      template_params: {
        to_email:     opts.to,
        subject:      opts.subject,
        html_content: opts.html,
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[mailService] Error EmailJS:', text)
  } else {
    console.log('[mailService] Email enviado a', opts.to)
  }
}