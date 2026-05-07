import { useState, useRef, useEffect } from 'react';
import ImageSlot from '@/components/decor/ImageSlot';

export default function Historia() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const reveal = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity .9s ease ${delay}s, transform .9s cubic-bezier(.2,.7,.2,1) ${delay}s`,
  });

  const CARDS = [
    {
      icon: '🤝',
      title: 'El problema que vi',
      body: 'Los caficultores como mi familia producen café premiado internacionalmente, pero viven al límite. Los consumidores pagan precios altos, pero ese dinero nunca llega a quien cultiva el grano.',
      highlight: '💔 El sistema está roto. Y la tecnología puede arreglarlo.',
      highlightBg: '#c96e4b22',
      highlightBorder: '#c96e4b55',
    },
    {
      icon: '💡',
      title: 'La solución:\nTunay Wasi',
      body: 'Conectamos directamente a quien produce café de especialidad con quien lo disfruta. Sin intermediarios. El caficultor recibe el mayor porcentaje según la calidad de su café.',
      badges: [['SCA+', 'Más puntaje = más pago al caficultor'], ['100%', 'Distribución visible en cada producto']],
      border: '#c96e4b44',
    },
    {
      icon: '🛡️',
      title: 'Tu compra está segura',
      items: [
        ['Pago por Yape', 'Rápido, sin tarjeta, sin complicaciones'],
        ['Número de orden', 'Cada compra registrada con código único'],
        ['Contacto directo', 'Coordinamos tu envío por WhatsApp'],
        ['Café fresco garantizado', 'Tostado por pedido, nunca stock viejo'],
      ],
    },
  ];

  return (
    <section id="historia" ref={ref} style={{ position: 'relative', padding: '100px 36px', background: '#1f3028', color: '#f2e0cc', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, #c96e4b44 0%, #c96e4b00 65%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #8faf8a33 0%, #8faf8a00 65%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 48, marginBottom: 72, flexWrap: 'wrap', ...reveal(0) }}>
          <div>
            <span style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 11, letterSpacing: '0.32em', color: '#c96e4b', textTransform: 'uppercase' }}>05 — Fundador</span>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 'clamp(38px, 5vw, 72px)', lineHeight: 1.02, color: '#f2e0cc', margin: '24px 0 0', letterSpacing: '-0.01em', maxWidth: 680 }}>
              Por qué nació<br />
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: '#c96e4b' }}>Tunay Wasi.</span>
            </h2>
          </div>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7, color: '#c4b297', maxWidth: 380, margin: 0 }}>
            Una historia de café, familia y tecnología. De las montañas de Jaén al código que le devuelve lo justo a los caficultores.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: 48, marginBottom: 48, ...reveal(0.1) }} className="tw-2col">
          <div style={{ background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 100%)', border: '1px solid #c96e4b33', borderRadius: 24, overflow: 'hidden', minHeight: 420 }}>
            <ImageSlot label="retrato · Danny Santa Cruz · fundador" tone="green" ratio="3 / 4" />
          </div>
          <div style={{ background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 60%)', border: '1px solid #f2e0cc14', borderRadius: 24, padding: 44, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 32px 64px -32px #000000bb' }}>
            <div style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.28em', color: '#8faf8a', textTransform: 'uppercase' }}>De la finca al código</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 'clamp(26px, 3.5vw, 44px)', color: '#f2e0cc', margin: 0, lineHeight: 1.05 }}>
              Soy <em style={{ color: '#c96e4b' }}>Danny Santa Cruz</em>,<br />y crecí entre cafetales.
            </h3>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7, color: '#c4b297', margin: 0 }}>
              En la <strong style={{ color: '#f2e0cc' }}>Finca Vista Hermosa</strong> de mi familia, en Jaén, Perú. Desde pequeño vi cosechar café de especialidad de altísima calidad.
            </p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, lineHeight: 1.7, color: '#c4b297', margin: 0 }}>
              Pero también vi la dura realidad: <strong style={{ color: '#f2e0cc' }}>intermediarios que se quedaban con más del 70 % del valor</strong> mientras los caficultores apenas cubrían costos.
            </p>
            <div style={{ borderLeft: '3px solid #c96e4b', paddingLeft: 24 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontStyle: 'italic', color: '#f2e0cc', margin: 0, lineHeight: 1.35 }}>
                "¿Por qué no podemos hacer lo mismo con el café?"
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginBottom: 56 }} className="tw-historia-grid">
          {CARDS.map((c, i) => (
            <div key={i} style={{ background: 'linear-gradient(135deg, #2a3d33 0%, #1f3028 100%)', border: `1px solid ${(c as { border?: string }).border ?? '#f2e0cc14'}`, borderRadius: 24, padding: 36, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: (c as { border?: string }).border ? '0 24px 48px -24px #c96e4b33' : undefined, ...reveal(0.18 + i * 0.08) }}>
              <div style={{ fontSize: 36 }}>{c.icon}</div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 28, color: '#f2e0cc', margin: 0, lineHeight: 1.1 }}>{c.title}</h3>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, lineHeight: 1.65, color: '#c4b297', margin: 0, flex: 1 }}>{c.body}</p>
              {(c as { highlight?: string; highlightBg?: string; highlightBorder?: string }).highlight && (
                <div style={{ padding: '14px 18px', borderRadius: 12, background: (c as { highlightBg?: string }).highlightBg, border: `1px solid ${(c as { highlightBorder?: string }).highlightBorder}`, fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#f2e0cc', lineHeight: 1.5 }}>
                  {(c as { highlight?: string }).highlight}
                </div>
              )}
              {(c as { badges?: string[][] }).badges?.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 10, background: '#8faf8a22', border: '1px solid #8faf8a44' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: '#8faf8a', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#c4b297' }}>{v}</span>
                </div>
              ))}
              {(c as { items?: string[][] }).items?.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ color: '#8faf8a', flexShrink: 0, marginTop: 2 }}>✅</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#c4b297', lineHeight: 1.55 }}>
                    <strong style={{ color: '#f2e0cc' }}>{k}</strong> — {v}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: '44px 52px', background: 'linear-gradient(135deg, #c96e4b12 0%, #1f302800 100%)', border: '1px solid #c96e4b33', borderRadius: 28, display: 'flex', gap: 56, alignItems: 'center', flexWrap: 'wrap', ...reveal(0.42) }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(20px, 2.5vw, 28px)', fontStyle: 'italic', color: '#f2e0cc', margin: 0, lineHeight: 1.4, flex: 1, minWidth: 280 }}>
            "No es solo un negocio para mí. Es honrar el trabajo de mi familia y de miles de caficultores peruanos que merecen un trato justo."
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 26, color: '#c96e4b' }}>— Danny Santa Cruz</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: '#c4b29799', textTransform: 'uppercase' }}>Fundador · Ing. de Software · Hijo de caficultores</span>
          </div>
        </div>

        <div style={{ marginTop: 64, textAlign: 'center', ...reveal(0.5) }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px, 3vw, 38px)', color: '#8faf8a', margin: 0, lineHeight: 1.3 }}>
            🌟 <strong style={{ color: '#f2e0cc', fontStyle: 'normal' }}>Cada café que compras cambia vidas.</strong><br />
            <em>Empezando por la de un caficultor.</em>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) { .tw-historia-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 640px) { .tw-historia-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
