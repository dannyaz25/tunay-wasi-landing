import { useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontFamily: 'Bowlby One SC, sans-serif', fontSize: 10, letterSpacing: '0.2em',
        color: '#c96e4b', textTransform: 'uppercase', marginBottom: 12,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#533b22',
      lineHeight: 1.7, margin: '0 0 8px',
    }}>
      {children}
    </p>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <span style={{ color: '#c96e4b', flexShrink: 0, fontFamily: 'Montserrat, sans-serif', fontSize: 12 }}>·</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, color: '#533b22', lineHeight: 1.7 }}>
        {children}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '7px 0', borderBottom: '1px solid #1f302812',
    }}>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#7a6850' }}>{label}</span>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, color: '#1f3028' }}>{value}</span>
    </div>
  );
}

export default function PoliciesModal({ onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(31, 48, 40, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
    >
      <div style={{
        width: 'min(620px, 100%)', background: '#f2e0cc',
        borderRadius: 24, border: '1px solid #c96e4b33',
        boxShadow: '0 60px 120px -40px #000000cc',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid #1f302818',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#e8d5bc',
        }}>
          <div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
              fontSize: 22, color: '#1f3028', margin: 0, lineHeight: 1.1,
            }}>
              Políticas de <span style={{ color: '#c96e4b', fontStyle: 'italic' }}>Compra</span>
            </h2>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, color: '#7a6850', marginTop: 4 }}>
              Tunay Wasi / Alpaso Live Commerce SAC · Mayo 2026
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 500,
              color: '#533b22', background: 'transparent',
              border: '1px solid #533b2255', borderRadius: 999,
              padding: '8px 14px', cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            Cerrar ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 28px 32px' }}>

          <Section title="1. Precios y Stock">
            <Item>Todos los precios están en <strong>soles peruanos (S/)</strong> e incluyen IGV (18%).</Item>
            <Item>El stock es limitado por lote. Una vez agotado un café, no hay reposición del mismo.</Item>
            <Item>La disponibilidad mostrada es en tiempo real. Si puedes agregarlo al carrito, hay stock.</Item>
            <Item>Al confirmar tu pago, el sistema <strong>reserva el stock</strong> para tu pedido. Si otro comprador agotó el producto antes, recibirás aviso y se anulará el cobro.</Item>
          </Section>

          <Section title="2. Proceso de Compra">
            <P><strong>Paso 1 — Datos de envío</strong></P>
            <Item>Ingresa tu nombre, celular, correo y dirección.</Item>
            <Item>La zona de envío se detecta automáticamente según tu departamento y distrito.</Item>
            <Item>Zonas Lima Ext. y Provincias (Olva Courier) requieren tu <strong>DNI</strong> para la entrega.</Item>
            <div style={{ marginTop: 10 }}><P><strong>Paso 2 — Pago</strong></P></div>
            <Item><strong>Yape / Plin:</strong> escanea el QR o ingresa el número, paga el monto exacto y presiona "Confirmé el pago".</Item>
            <Item><strong>Transferencia bancaria:</strong> copia los datos, realiza la transferencia y envía el voucher por WhatsApp usando el botón en pantalla.</Item>
            <Item>El sistema verifica tu pago automáticamente. Si no lo detecta en 2 minutos, puedes subir una captura como comprobante.</Item>
          </Section>

          <Section title="3. Confirmación del Pedido">
            <Item>Tu pedido queda registrado al presionar "Confirmé el pago" o "Ya envié el voucher".</Item>
            <Item>Recibirás un <strong>correo de confirmación</strong> con tu número de pedido.</Item>
            <Item>La verificación manual del pago puede tomar hasta <strong>24 horas hábiles</strong>.</Item>
            <Item>Si no recibes confirmación en ese plazo, escríbenos por WhatsApp antes de volver a pagar.</Item>
          </Section>

          <Section title="4. Envíos">
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1f302818', marginBottom: 14 }}>
              <div style={{ background: '#e8d5bc', padding: '8px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                {['Zona', 'Domicilio', 'Recojo agencia', 'Gratis desde'].map(h => (
                  <span key={h} style={{ fontFamily: 'Bowlby One SC, sans-serif', fontSize: 8, letterSpacing: '0.15em', color: '#7a6850', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {[
                ['Lima Metropolitana', 'S/8.00', '—', 'S/100.00'],
                ['Lima Ext. / Callao', 'S/12.00', 'S/10.00', 'S/120.00'],
                ['Provincias', 'S/15.00', 'S/12.00', 'S/150.00'],
              ].map(([zona, dom, rec, gratis]) => (
                <div key={zona} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, padding: '9px 14px', borderTop: '1px solid #1f302812' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#1f3028', fontWeight: 600 }}>{zona}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#533b22' }}>{dom}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#533b22' }}>{rec}</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11, color: '#8faf8a', fontWeight: 700 }}>{gratis}</span>
                </div>
              ))}
            </div>
            <Item>Pedidos confirmados antes de las <strong>3:00 pm</strong> se preparan el mismo día.</Item>
            <Item>Si eliges recojo en agencia Olva, necesitarás presentar tu DNI al recoger.</Item>
            <Item>Una vez despachado, recibirás el número de guía por WhatsApp o correo.</Item>
            <Item>Si el pedido no puede entregarse por datos incorrectos, el costo del reenvío corre por tu cuenta.</Item>
          </Section>

          <Section title="5. Cancelaciones">
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1f302818' }}>
              <Row label="Antes de confirmar el pago" value="Sin cargo — cierra el checkout" />
              <Row label="Confirmado, antes del despacho" value="Reembolso 100% por WhatsApp" />
              <Row label="Una vez despachado" value="No se aceptan cancelaciones" />
            </div>
          </Section>

          <Section title="6. Devoluciones y Garantía">
            <P><strong>Aceptamos devolución si:</strong></P>
            <Item>El producto llega <strong>físicamente dañado</strong> (bolsa rota, café derramado).</Item>
            <Item>El producto llega <strong>vencido</strong> (fecha de tueste incorrecta).</Item>
            <Item>El pedido contiene un <strong>producto diferente</strong> al que compraste.</Item>
            <P><strong>No aceptamos devolución por:</strong></P>
            <Item>Preferencia de sabor. El café de especialidad tiene perfiles complejos (acidez brillante, notas frutales) distintos al café comercial.</Item>
            <Item>Error en el tipo de molienda elegido por el cliente.</Item>
            <Item>Demoras del courier fuera del control de Tunay Wasi.</Item>
            <P>Para iniciar una devolución, envía foto del producto por WhatsApp al <strong>+51 917 959 370</strong> dentro de las <strong>48 horas</strong> de recibido. Los reembolsos aprobados se procesan por Yape o Plin en 48 horas.</P>
          </Section>

          <Section title="7. Métodos de Pago">
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #1f302818' }}>
              <Row label="Yape — 917 959 370" value="Danny Santa Cruz Rojas" />
              <Row label="Plin — 917 959 370" value="Alpaso Live Commerce SAC" />
              <Row label="Transferencia BCP — 193-7332599054" value="Alpaso Live Commerce SAC" />
            </div>
            <div style={{ marginTop: 10 }}><P>No aceptamos tarjetas de crédito, débito ni efectivo en esta fase.</P></div>
          </Section>

          <Section title="8. Privacidad">
            <P>Al completar el checkout recopilamos: nombre, correo, celular, dirección y DNI (solo si aplica Olva). Usamos estos datos únicamente para procesar tu pedido, enviarte el tracking y notificarte sobre nuevos lotes (si aceptas).</P>
            <P><strong>No vendemos ni compartimos tus datos</strong> con terceros. Se almacenan en Firebase Firestore (Google Cloud, ISO 27001). Conforme a la Ley N° 29733 puedes acceder, rectificar o eliminar tus datos escribiendo a <strong>tunaywasi@gmail.com</strong>.</P>
          </Section>

          <Section title="9. Contacto">
            <Item><strong>WhatsApp:</strong> +51 917 959 370</Item>
            <Item><strong>Email:</strong> tunaywasi@gmail.com</Item>
            <Item><strong>Horario:</strong> Lunes a viernes, 9:00 am – 6:00 pm (Lima)</Item>
          </Section>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'linear-gradient(135deg, #c96e4b 0%, #d68863 100%)',
              color: '#1f3028', border: 'none', borderRadius: 12,
              cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700, fontSize: 12, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Entendido — Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
