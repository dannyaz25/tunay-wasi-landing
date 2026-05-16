import { useState } from 'react';
import type { ReactNode } from 'react';

const ans: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 15,
  lineHeight: 1.8,
  color: 'rgba(245,240,232,0.8)',
  margin: 0,
};

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: '¿Cómo funciona?',
    a: (
      <div style={{ ...ans, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span>1️⃣ <strong style={{ color: '#f2e0cc' }}>Registras tu finca</strong> — llenas el formulario con tus datos y los de tu café.</span>
        <span>2️⃣ <strong style={{ color: '#f2e0cc' }}>Nos envías una muestra</strong> — entre 300 y 500 gramos de tu grano verde al nodo de cata más cercano a ti.</span>
        <span>3️⃣ <strong style={{ color: '#f2e0cc' }}>Lo catamos</strong> — un experto Q-Grader evalúa tu café y te decimos el puntaje.</span>
        <span>4️⃣ <strong style={{ color: '#f2e0cc' }}>Lo publicamos</strong> — si estás de acuerdo, abrimos la preventa con tu nombre, tu finca y tu historia.</span>
        <span>5️⃣ <strong style={{ color: '#f2e0cc' }}>Se vende</strong> — los clientes compran tu café desde cualquier parte del país.</span>
        <span>6️⃣ <strong style={{ color: '#f2e0cc' }}>Te pagamos</strong> — cuando el lote se agota en preventa, recibes tu pago directo. <span style={{ color: '#8faf8a' }}>Los primeros 15 caficultores tienen la cata gratis.</span></span>
      </div>
    ),
  },
  {
    q: '¿Cuándo me pagan?',
    a: <p style={ans}>Te pagamos cuando tu lote se vende en preventa — no al recepcionar, no al mes siguiente. El pago sale directo de lo que recaudamos con la venta de tu café.</p>,
  },
  {
    q: '¿Cuánto me pagan?',
    a: (
      <div style={{ ...ans, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ margin: '0 0 8px' }}>Depende del puntaje SCA de tu café:</p>
        <span><strong style={{ color: '#f2e0cc' }}>82–83 pts</strong> — S/ 34.65 por kg verde</span>
        <span><strong style={{ color: '#f2e0cc' }}>84–85 pts</strong> — S/ 38.44 por kg verde</span>
        <span><strong style={{ color: '#f2e0cc' }}>86–87 pts</strong> — S/ 55.48 por kg verde <span style={{ color: '#8faf8a' }}>✅ flete incluido</span></span>
        <span><strong style={{ color: '#f2e0cc' }}>88–89 pts</strong> — S/ 66.84 por kg verde <span style={{ color: '#8faf8a' }}>✅ flete incluido</span></span>
        <span><strong style={{ color: '#f2e0cc' }}>90+ pts</strong> — S/ 85.78 por kg verde <span style={{ color: '#8faf8a' }}>✅ flete incluido</span></span>
        <p style={{ margin: '8px 0 0', opacity: 0.85 }}>El precio puede ajustarse según el <strong style={{ color: '#f2e0cc' }}>análisis físico del grano</strong> al recepcionar: humedad y defectos. Te explicamos el resultado antes de cualquier descuento.</p>
        <p style={{ margin: '4px 0 0', opacity: 0.7 }}>Los primeros 15 caficultores tienen la cata gratis.</p>
      </div>
    ),
  },
  {
    q: '¿Qué pasa si mi café no califica?',
    a: <p style={ans}>Si tu café saca menos de 82 puntos SCA, te avisamos sin cargo y te devolvemos el grano.</p>,
  },
  {
    q: '¿Cuánto café necesito tener?',
    a: <p style={ans}>El mínimo es <strong style={{ color: '#f2e0cc' }}>12 kg de café verde</strong>. Empezamos con microlotes pequeños — así tu riesgo es mínimo y nosotros podemos probarlo con los clientes.</p>,
  },
  {
    q: '¿Qué es el puntaje SCA?',
    a: <p style={ans}>Es como una nota para tu café. Un catador experto (Q-Grader) lo prueba y le pone puntaje del 0 al 100. Tu café necesita al menos 82 puntos para ser café de especialidad. Mientras más alto el puntaje, más te pagamos.</p>,
  },
];

interface FaqRowProps {
  q: string;
  a: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqRow({ q, a, isOpen, onToggle }: FaqRowProps) {
  return (
    <div style={{ borderBottom: '1px solid rgba(196,178,151,0.15)', marginBottom: 4 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 0', background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left', color: 'rgb(196,178,151)', fontSize: 16, fontWeight: 600,
          fontFamily: 'Georgia, serif',
        }}
      >
        <span>{q}</span>
        <span style={{
          fontSize: 20, color: 'rgba(196,178,151,0.6)', marginLeft: 16, flexShrink: 0,
          display: 'inline-block',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform .35s cubic-bezier(.2,.7,.2,1)',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: isOpen ? 500 : 0, overflow: 'hidden',
        transition: 'max-height .45s cubic-bezier(.2,.7,.2,1)',
      }}>
        <div style={{ paddingBottom: 18 }}>
          {a}
        </div>
      </div>
    </div>
  );
}

export default function CafiFAQ() {
  const [open, setOpen] = useState<number>(-1);

  return (
    <section id="faq" style={{
      padding: '100px 36px',
      background: 'linear-gradient(180deg, #182520 0%, #1f3028 100%)',
      color: '#f2e0cc',
    }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em',
            color: '#c96e4b', textTransform: 'uppercase',
          }}>04 — FAQ</span>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            fontSize: 'clamp(38px, 5vw, 68px)', lineHeight: 1.02,
            margin: '20px 0 0', color: '#f2e0cc', letterSpacing: '-0.01em',
          }}>
            Preguntas <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#8faf8a' }}>frecuentes</span>.
          </h2>
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {FAQS.map((f, i) => (
            <FaqRow
              key={f.q}
              q={f.q}
              a={f.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
