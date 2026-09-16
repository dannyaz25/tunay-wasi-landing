/**
 * FeedbackSCA.tsx — Retroalimentación post-catación basada en reglas simples
 * Solo se muestra cuando el lote tiene puntajeOficial y existe ProcesoLoteDoc
 */
import { useState, useEffect } from 'react';
import { fetchProcesoLote } from '@/features/marketplace/procesoService';
import type { LoteDoc, ProcesoLoteDoc } from '@/shared/types/marketplace';
import { UMBRAL_SCA } from '@/shared/config';

const C = {
  green: '#1f3028', cream: '#f2e0cc', terra: '#c96e4b',
  sage: '#8faf8a', tan: '#c4b297', brown: '#533b22',
};

// ── Motor de feedback basado en reglas ─────────────────────────────────────────
export function generarFeedback(proceso: ProcesoLoteDoc, puntaje: number): string[] {
  const tips: string[] = [];

  if (puntaje >= UMBRAL_SCA) {
    tips.push(`✅ ¡Café de especialidad! ${puntaje} pts SCA superan el umbral de ${UMBRAL_SCA} pts.`);
  } else {
    tips.push(`📌 ${puntaje} pts SCA — ${UMBRAL_SCA - puntaje} puntos por debajo del umbral de especialidad (${UMBRAL_SCA}).`);
  }

  // Cosecha
  if (proceso.cosechaTipo === 'striping')
    tips.push('🍒 Cosecha striping: cosechar selectivamente solo frutos rojos puede subir 3-5 pts SCA en la próxima temporada.');
  if (proceso.cosechaBrix != null && proceso.cosechaBrix < 20)
    tips.push(`📊 Brix ${proceso.cosechaBrix}° — esperar madurez (22-24°) antes de cosechar puede añadir 2-4 pts SCA.`);

  // Despulpado
  if (proceso.horasHastaDespulpe != null && proceso.horasHastaDespulpe > 8)
    tips.push(`⏱ ${proceso.horasHastaDespulpe}h entre cosecha y despulpe — reducir a < 6h evita fermentaciones indeseadas que generan defectos.`);

  // Fermentación
  if (proceso.fermentacionHoras != null && proceso.fermentacionHoras < 24)
    tips.push(`🫙 Fermentación de ${proceso.fermentacionHoras}h es corta — extender a 36-48h (vía húmeda) desarrolla más complejidad aromática.`);
  if (proceso.fermentacionTempAgua != null && proceso.fermentacionTempAgua > 25)
    tips.push(`🌡 Temperatura del agua de fermentación alta (${proceso.fermentacionTempAgua}°C) — idealmente < 22°C para mejor control del proceso.`);

  // Secado
  if (proceso.secadoHumedadFinal != null) {
    if (proceso.secadoHumedadFinal < 10)
      tips.push(`💧 Humedad final ${proceso.secadoHumedadFinal}% — excesivamente seco, puede provocar quiebres y sabores a madera. Objetivo: 10.5-11.5%.`);
    else if (proceso.secadoHumedadFinal > 12)
      tips.push(`💧 Humedad final ${proceso.secadoHumedadFinal}% — demasiado húmedo, riesgo de moho en almacén. Objetivo: 10.5-11.5%.`);
  }
  if (proceso.secadoMetodo === 'patio' && puntaje < UMBRAL_SCA)
    tips.push('☀️ Cambiar a cama africana elevada permite secado más uniforme y puede mejorar la limpieza en taza.');

  // Almacenamiento
  if (proceso.almacenamientoCondicion === 'deficiente')
    tips.push('🏚️ Almacenamiento deficiente degrada rápidamente el grano. Buscar un lugar seco, ventilado y oscuro es la inversión más barata en calidad.');

  // Si no hay tips de mejora, agregar uno genérico
  if (tips.length === 1 && puntaje >= UMBRAL_SCA)
    tips.push('🎯 ¡Mantén los mismos parámetros de proceso! La consistencia entre lotes es clave para fidelizar compradores.');

  return tips;
}

interface Props {
  lote: LoteDoc;
}

export default function FeedbackSCA({ lote }: Props) {
  const [proceso, setProceso] = useState<ProcesoLoteDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lote.puntajeOficial) { setLoading(false); return; }
    fetchProcesoLote(lote.id).then(p => { setProceso(p); setLoading(false); });
  }, [lote.id, lote.puntajeOficial]);

  if (!lote.puntajeOficial) return null;
  if (loading) return null;

  const puntaje = lote.puntajeOficial;
  const esEspecialidad = puntaje >= UMBRAL_SCA;

  if (!proceso) {
    // Puntaje existe pero no hay diario de proceso registrado
    return (
      <div style={{ background: '#f9f3ec', border: `1px solid ${C.tan}`, borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.brown }}>
          <strong>Puntaje SCA: {puntaje} pts</strong>
          {esEspecialidad
            ? <span style={{ color: C.sage, marginLeft: 8 }}>✅ Especialidad</span>
            : <span style={{ color: C.terra, marginLeft: 8 }}>📌 Commodity</span>}
        </div>
        <div style={{ fontSize: 12, color: C.tan, marginTop: 6, fontFamily: 'Montserrat, sans-serif' }}>
          Registra el diario de proceso de este lote para recibir retroalimentación personalizada sobre cómo mejorar tu puntaje.
        </div>
      </div>
    );
  }

  const tips = generarFeedback(proceso, puntaje);
  const mejorasTips = tips.filter(t => !t.startsWith('✅') && !t.startsWith('📌') && !t.startsWith('🎯'));

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', marginTop: 8, border: `1px solid ${esEspecialidad ? C.sage : C.terra}` }}>
      {/* Encabezado */}
      <div style={{ background: esEspecialidad ? C.sage : C.terra, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 28, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {puntaje} <span style={{ fontSize: 14 }}>pts SCA</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'Montserrat, sans-serif' }}>
            {esEspecialidad ? `Café de especialidad ✅ (umbral: ${UMBRAL_SCA})` : `${UMBRAL_SCA - puntaje} pts por debajo del umbral`}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ background: '#fff', padding: '14px 16px' }}>
        {mejorasTips.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.brown, fontFamily: 'Montserrat, sans-serif', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Para la próxima cosecha
            </div>
            {mejorasTips.map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: C.green, fontFamily: 'Montserrat, sans-serif', marginBottom: 10, lineHeight: 1.5, borderLeft: `3px solid ${C.sage}`, paddingLeft: 10 }}>
                {t}
              </div>
            ))}
          </>
        )}
        {mejorasTips.length === 0 && esEspecialidad && (
          <div style={{ fontSize: 13, color: C.green, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
            🎯 ¡Mantén los mismos parámetros de proceso! La consistencia entre lotes es clave para fidelizar compradores.
          </div>
        )}
      </div>
    </div>
  );
}
