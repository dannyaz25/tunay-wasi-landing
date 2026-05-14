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
    q: '¿Mi café califica?',
    a: <p style={ans}>Necesitas café de especialidad con puntaje SCA de 82 puntos o más. Si estás entre los primeros 15, tendrás acceso prioritario a nuestro tostador Q-Grader para validar y vender tu café.</p>,
  },
  {
    q: '¿Qué criterios evalúa el puntaje SCA?',
    a: <p style={ans}>El sistema SCA evalúa 10 atributos: fragancia y aroma, sabor, postgusto, acidez, cuerpo, equilibrio, dulzor, taza limpia, uniformidad y puntuación general — en una escala del 0 al 100.</p>,
  },
  {
    q: '¿Qué puntaje necesita mi café?',
    a: (
      <div style={{ ...ans, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span><strong style={{ color: '#f2e0cc' }}>90–100 pts</strong> — exquisito</span>
        <span><strong style={{ color: '#f2e0cc' }}>85–89 pts</strong> — excelente</span>
        <span><strong style={{ color: '#f2e0cc' }}>82–84 pts</strong> — muy bueno ✓ <em>mínimo requerido</em></span>
        <span style={{ opacity: 0.55 }}><strong>Menos de 82</strong> — no es especialidad</span>
      </div>
    ),
  },
  {
    q: '¿Cómo es el proceso de cata?',
    a: <p style={ans}>Nuestro tostador Q-Grader evalúa 5 tazas siguiendo el protocolo SCA, dentro de las 24 horas posteriores al tueste y con mínimo 8 horas de reposo. Perfil de tueste ligero o medio claro.</p>,
  },
  {
    q: '¿Cuánto me pagan y cuándo?',
    a: (
      <div style={{ ...ans, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0 }}>Te pagamos <strong style={{ color: '#f2e0cc' }}>al recepcionar tu microlote en Lima</strong>, no al momento de la venta final.</p>
        <ul style={{ margin: '4px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <li><strong style={{ color: '#f2e0cc' }}>82.0 – 83.4 pts</strong> (Selecto) — S/ 28.00 / kg verde <span style={{ opacity: 0.6 }}>(flete a tu cargo)</span></li>
          <li><strong style={{ color: '#f2e0cc' }}>83.5 – 85.4 pts</strong> (Especialidad Estándar) — S/ 32.00 / kg verde <span style={{ opacity: 0.6 }}>(flete a tu cargo)</span></li>
          <li><strong style={{ color: '#f2e0cc' }}>85.5 – 87.4 pts</strong> (Especialidad Alta) — S/ 46.00 / kg verde <span style={{ color: '#8faf8a' }}>✅ reembolsamos flete</span></li>
          <li><strong style={{ color: '#f2e0cc' }}>87.5 – 89.4 pts</strong> (Joya de Finca) — S/ 56.00 / kg verde <span style={{ color: '#8faf8a' }}>✅ reembolsamos flete</span></li>
          <li><strong style={{ color: '#f2e0cc' }}>89.5+ pts</strong> (Exclusivo / Geisha) — S/ 72.00+ / kg verde <span style={{ color: '#8faf8a' }}>✅ reembolsamos flete</span></li>
        </ul>
        <p style={{ margin: '4px 0 0' }}>Sin costos de registro. Si tu café no califica (&lt;82 pts), te lo comunicamos sin cargo.</p>
      </div>
    ),
  },
  {
    q: '¿Se aplican descuentos al pago?',
    a: <p style={ans}>Solo descontamos defectos mayores (granos negros, agrios, fermentados). El flete a Lima es por tu cuenta o lo deducimos del pago según acuerdo. No hay comisiones ocultas — todo está en el contrato.</p>,
  },
  {
    q: '¿Cuánto café debo producir?',
    a: <p style={ans}>El lote mínimo es de <strong style={{ color: '#f2e0cc' }}>12 kg de café verde</strong>. Comenzamos con microlotes pequeños con enfoque en calidad.</p>,
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
