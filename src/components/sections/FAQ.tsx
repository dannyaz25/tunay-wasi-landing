import { useState } from 'react';

interface FaqItem {
  q: string;
  a: string | React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    q: '¿Mi café califica?',
    a: 'Tu café califica si tiene un puntaje SCA de 82 puntos o más, es cosechado a mano, y proviene de parcelas en altura (idealmente sobre 1,200 msnm). Si no tienes un puntaje certificado aún, contáctanos — coordinamos la evaluación sin costo.',
  },
  {
    q: '¿Qué criterios evalúa el puntaje SCA?',
    a: 'El protocolo SCA evalúa 10 atributos sensoriales: fragancia/aroma, sabor, sabor residual, acidez, cuerpo, uniformidad, balance, taza limpia, dulzor e impresión general. Cada atributo se puntúa sobre 10, sumando un máximo de 100 puntos.',
  },
  {
    q: '¿Qué puntaje necesita mi café?',
    a: 'El mínimo es 82.0 puntos SCA para ingresar al catálogo como "Selecto". A mayor puntaje, mayor precio por kg: desde S/ ~36/kg (82–83 pts) hasta S/ ~74/kg (90+ pts) en nuestra plataforma.',
  },
  {
    q: '¿Cómo es el proceso de cata?',
    a: (
      <span>
        Al recepcionar tu lote en Lima, nuestro tostador Q-Grader evalúa 5 tazas siguiendo el protocolo SCA.
        La evaluación se realiza dentro de las <strong>24 horas</strong> posteriores al tueste, con un reposo mínimo de 8 horas.
        El perfil de tueste es ligero o medio claro para resaltar los atributos naturales del grano.
        El <strong>costo de la cata es cubierto por Tunay Wasi</strong>.
      </span>
    ),
  },
  {
    q: '¿Cuánto me pagan y cuándo?',
    a: 'Pagamos el ~42.1% del precio neto de venta (sin IGV) directamente a la finca. El pago se realiza dentro de los 7 días hábiles posteriores a la confirmación de venta del lote. Te notificamos por WhatsApp o email con el detalle del monto y la distribución completa.',
  },
  {
    q: '¿Se aplican descuentos al pago?',
    a: 'No hay comisiones ocultas ni descuentos sorpresa. Los únicos conceptos descontados son: flete Lima (coordinado contigo) y costo de empaque (bolsas kraft 250g con tu nombre). La cata Q-Grader está cubierta por Tunay Wasi. Todo el desglose es visible en tu ficha de caficultor.',
  },
  {
    q: '¿Cuánto café debo producir?',
    a: 'El lote mínimo es de 12 kg de café verde oro por microlote. No hay máximo. Si tienes varios microlotes de distintas variedades o procesos, puedes registrarlos por separado — cada uno con su propia ficha de catación y precio.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(3); // La de cata abierta por defecto

  return (
    <section id="faq" style={{ padding: '100px 36px', background: '#f2e0cc' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>04 — Preguntas frecuentes</span>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 52px)', lineHeight: 1.0, color: '#1f3028', margin: '16px 0 0', letterSpacing: '-0.01em' }}>
            Lo que los caficultores<br />
            <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>nos preguntan.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderRadius: 14, border: `1px solid ${isOpen ? '#c96e4b66' : '#1f302822'}`, overflow: 'hidden', transition: 'border-color .25s ease' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 22px', background: isOpen ? '#c96e4b0d' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .25s ease' }}
                >
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 600, color: isOpen ? '#c96e4b' : '#1f3028', lineHeight: 1.2, transition: 'color .25s ease' }}>
                    {faq.q}
                  </span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: isOpen ? '#c96e4b' : '#533b22', flexShrink: 0, transition: 'transform .25s ease, color .25s ease', display: 'inline-block', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 20px', borderTop: '1px solid #c96e4b22' }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.75, color: '#533b22', margin: '16px 0 0' }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 40, padding: '24px 28px', borderRadius: 16, background: '#1f302808', border: '1px solid #1f302822', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600, color: '#1f3028' }}>¿Tienes otra pregunta?</div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#533b22', marginTop: 4 }}>Escríbenos por WhatsApp — respondemos en menos de 24 horas.</div>
          </div>
          <a href="https://wa.me/51917959370?text=Hola%2C+soy+caficultor+y+tengo+una+consulta+sobre+Tunay+Wasi" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: '#25D366', color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            💬 WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
