/**
 * DiarioProceso.tsx — Registro de proceso por lote con educación contextual
 * Acordeón por etapa; guardado al salir de cada campo (debounce 800ms)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile, padY, inputStyle as baseInputStyle } from '@/shared/mobileStyles';
import { fetchProcesoLote, upsertProcesoLote } from '@/features/marketplace/procesoService';
import type { LoteDoc, ProcesoLoteDoc } from '@/shared/types/marketplace';

const C = {
  green: '#1f3028', cream: '#f2e0cc', terra: '#c96e4b',
  sage: '#8faf8a', tan: '#c4b297', brown: '#533b22',
};

// ── Rangos óptimos ─────────────────────────────────────────────────────────────
type RangoField = { min?: number; max?: number; hint: string };
const RANGOS: Record<string, RangoField> = {
  cosechaBrix:          { min: 22, max: 26, hint: 'Ideal 22-24 °Brix. Menos = grano inmaduro, menos dulzor.' },
  horasHastaDespulpe:   { max: 6, hint: 'Ideal < 6h. Más tiempo = fermentación no controlada.' },
  fermentacionHoras:    { min: 36, max: 72, hint: 'Ideal 36-72h (vía húmeda). Muy corto = plano; muy largo = defecto.' },
  fermentacionTempAgua: { min: 16, max: 22, hint: 'Ideal 16-22 °C. Agua fría ralentiza y limpia mejor.' },
  secadoHumedadFinal:   { min: 10.5, max: 11.5, hint: 'Ideal 10.5-11.5%. Seco en exceso = quiebre; húmedo = moho.' },
};

function fueraDeRango(campo: string, val?: number): string | null {
  if (val == null) return null;
  const r = RANGOS[campo];
  if (!r) return null;
  if (r.min != null && val < r.min) return `⚠ ${r.hint}`;
  if (r.max != null && val > r.max) return `⚠ ${r.hint}`;
  return null;
}

// ── Tooltip educativo ──────────────────────────────────────────────────────────
const WHY: Record<string, string> = {
  cosechaTipo:          'La cosecha selectiva (solo frutos rojos) es el primer paso hacia el café de especialidad. Diferencia puntajes de 75 a 85+ pts SCA.',
  cosechaBrix:          'Los grados Brix miden el azúcar del fruto. A mayor dulzor en campo, más complejidad en taza. Mide con refractómetro antes de cosechar.',
  horasHastaDespulpe:   'Cada hora que el fruto espera sin despulpar es riesgo de fermentación indeseable. Los mejores lotes llegan a la máquina en < 4 horas.',
  fermentacionTipo:     'La fermentación define el perfil: húmeda → limpieza y acidez; seca → cuerpo; anaeróbica → tropicalidad y complejidad.',
  fermentacionHoras:    'El tiempo de fermentación es el "dial de sabor" del beneficio. Un reloj y una tabla de pH son las herramientas más baratas para subir 3 pts SCA.',
  fermentacionTempAgua: 'El agua fría de altura es una ventaja natural de los Andes: ralentiza la fermentación y produce perfiles más limpios y complejos.',
  lavadoNumVeces:       'Más lavados = grano más limpio = mayor claridad en taza. Los mejores lotes peruanos se lavan 2-3 veces con agua corriente.',
  secadoMetodo:         'La cama africana (elevada) permite flujo de aire 360°, reduce riesgo de moho y produce secado más homogéneo que el patio.',
  secadoDias:           'El secado lento (18-25 días en cama africana) desarrolla más complejidad que el secado rápido (8-12 días). La paciencia se paga en taza.',
  secadoHumedadFinal:   'La humedad final determina la vida útil del grano verde. Mide con higrómetro antes de ensacar.',
  almacenamientoDiasReposo: 'El reposo en pergamino (30-60 días) estabiliza la humedad y permite que los sabores se asienten. Común en productores que buscan consistencia.',
};

function TooltipInline({ campo, children }: { campo: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        {children}
        {WHY[campo] && (
          <button type="button" onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: `1px solid ${C.tan}`, borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', fontSize: 10, color: C.tan, lineHeight: '14px', padding: 0, flexShrink: 0 }}
          >?</button>
        )}
      </div>
      {open && WHY[campo] && (
        <div style={{ background: '#f9f3ec', border: `1px solid ${C.sage}`, borderRadius: 6, padding: '6px 10px', marginBottom: 6, fontSize: 12, color: C.brown, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
          🌱 {WHY[campo]}
        </div>
      )}
    </div>
  );
}

// ── Etapa acordeón ─────────────────────────────────────────────────────────────
function Etapa({ titulo, icono, open, onToggle, children }: { titulo: string; icono: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C.tan}`, borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
      <button type="button" onClick={onToggle}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: open ? C.green : '#fdf6ee', border: 'none', cursor: 'pointer' }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: open ? '#fff' : C.green }}>{icono} {titulo}</span>
        <span style={{ fontSize: 12, color: open ? C.cream : C.tan }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: '14px 16px', background: '#fff' }}>{children}</div>}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  lote: LoteDoc;
  caficultorId: string;
}

export default function DiarioProceso({ lote, caficultorId }: Props) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [seccionOpen, setSeccionOpen] = useState<Record<string, boolean>>({ cosecha: true });

  // Campos del diario
  const [cosechaFechaInicio, setCosechaFechaInicio] = useState('');
  const [cosechaFechaFin, setCosechaFechaFin] = useState('');
  const [cosechaTipo, setCosechaTipo] = useState<ProcesoLoteDoc['cosechaTipo']>(undefined);
  const [cosechaBrix, setCosechaBrix] = useState('');
  const [horasHastaDespulpe, setHorasHastaDespulpe] = useState('');
  const [fermentacionTipo, setFermentacionTipo] = useState<ProcesoLoteDoc['fermentacionTipo']>(undefined);
  const [fermentacionHoras, setFermentacionHoras] = useState('');
  const [fermentacionTempAgua, setFermentacionTempAgua] = useState('');
  const [lavadoNumVeces, setLavadoNumVeces] = useState('');
  const [lavadoAguaLimpia, setLavadoAguaLimpia] = useState<boolean | undefined>(undefined);
  const [secadoMetodo, setSecadoMetodo] = useState<ProcesoLoteDoc['secadoMetodo']>(undefined);
  const [secadoDias, setSecadoDias] = useState('');
  const [secadoHumedadFinal, setSecadoHumedadFinal] = useState('');
  const [almacenamientoDiasReposo, setAlmacenamientoDiasReposo] = useState('');
  const [almacenamientoCondicion, setAlmacenamientoCondicion] = useState<ProcesoLoteDoc['almacenamientoCondicion']>(undefined);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProcesoLote(lote.id).then(p => {
      if (p) {
        setCosechaFechaInicio(p.cosechaFechaInicio ?? '');
        setCosechaFechaFin(p.cosechaFechaFin ?? '');
        setCosechaTipo(p.cosechaTipo);
        setCosechaBrix(p.cosechaBrix != null ? String(p.cosechaBrix) : '');
        setHorasHastaDespulpe(p.horasHastaDespulpe != null ? String(p.horasHastaDespulpe) : '');
        setFermentacionTipo(p.fermentacionTipo);
        setFermentacionHoras(p.fermentacionHoras != null ? String(p.fermentacionHoras) : '');
        setFermentacionTempAgua(p.fermentacionTempAgua != null ? String(p.fermentacionTempAgua) : '');
        setLavadoNumVeces(p.lavadoNumVeces != null ? String(p.lavadoNumVeces) : '');
        setLavadoAguaLimpia(p.lavadoAguaLimpia);
        setSecadoMetodo(p.secadoMetodo);
        setSecadoDias(p.secadoDias != null ? String(p.secadoDias) : '');
        setSecadoHumedadFinal(p.secadoHumedadFinal != null ? String(p.secadoHumedadFinal) : '');
        setAlmacenamientoDiasReposo(p.almacenamientoDiasReposo != null ? String(p.almacenamientoDiasReposo) : '');
        setAlmacenamientoCondicion(p.almacenamientoCondicion);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lote.id]);

  const buildData = useCallback((): Omit<ProcesoLoteDoc, 'id' | 'loteId' | 'caficultorId' | 'createdAt'> => ({
    cosechaFechaInicio: cosechaFechaInicio || undefined,
    cosechaFechaFin: cosechaFechaFin || undefined,
    cosechaTipo,
    cosechaBrix: cosechaBrix ? Number(cosechaBrix) : undefined,
    horasHastaDespulpe: horasHastaDespulpe ? Number(horasHastaDespulpe) : undefined,
    fermentacionTipo,
    fermentacionHoras: fermentacionHoras ? Number(fermentacionHoras) : undefined,
    fermentacionTempAgua: fermentacionTempAgua ? Number(fermentacionTempAgua) : undefined,
    lavadoNumVeces: lavadoNumVeces ? Number(lavadoNumVeces) : undefined,
    lavadoAguaLimpia,
    secadoMetodo,
    secadoDias: secadoDias ? Number(secadoDias) : undefined,
    secadoHumedadFinal: secadoHumedadFinal ? Number(secadoHumedadFinal) : undefined,
    almacenamientoDiasReposo: almacenamientoDiasReposo ? Number(almacenamientoDiasReposo) : undefined,
    almacenamientoCondicion,
  }), [cosechaFechaInicio, cosechaFechaFin, cosechaTipo, cosechaBrix, horasHastaDespulpe, fermentacionTipo, fermentacionHoras, fermentacionTempAgua, lavadoNumVeces, lavadoAguaLimpia, secadoMetodo, secadoDias, secadoHumedadFinal, almacenamientoDiasReposo, almacenamientoCondicion]);

  const saveNow = useCallback(async () => {
    setSaving(true);
    try {
      await upsertProcesoLote(lote.id, caficultorId, buildData());
      setSavedAt(new Date());
    } catch (e) {
      console.error('Error guardando proceso:', e);
    } finally {
      setSaving(false);
    }
  }, [lote.id, caficultorId, buildData]);

  // Guardado automático con debounce al cambiar cualquier campo
  function onFieldBlur() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNow, 800);
  }

  const inputS: React.CSSProperties = { ...baseInputStyle, background: '#fff' };
  const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer' };
  const labelS: React.CSSProperties = { fontSize: 12, color: C.brown, fontFamily: 'Montserrat, sans-serif', display: 'block', marginBottom: 3, fontWeight: 600 };

  function numField(label: string, campo: string, val: string, set: (v: string) => void, opts?: { placeholder?: string; min?: number; max?: number; step?: number; unit?: string }) {
    const alerta = fueraDeRango(campo, val ? Number(val) : undefined);
    return (
      <div style={{ marginBottom: 14 }}>
        <TooltipInline campo={campo}>
          <label style={labelS}>{label}{opts?.unit ? ` (${opts.unit})` : ''}</label>
        </TooltipInline>
        <input type="number" value={val} onChange={e => set(e.target.value)} onBlur={onFieldBlur}
          style={inputS} placeholder={opts?.placeholder} min={opts?.min} max={opts?.max} step={opts?.step ?? 1} />
        {alerta && <div style={{ fontSize: 11, color: '#8a5c00', background: '#fff8e1', borderRadius: 4, padding: '4px 8px', marginTop: 4 }}>{alerta}</div>}
      </div>
    );
  }

  if (loading) return <div style={{ padding: 16, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>Cargando proceso...</div>;

  const toggle = (k: string) => setSeccionOpen(s => ({ ...s, [k]: !s[k] }));

  return (
    <div style={{ padding: padY(isMobile) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: isMobile ? 18 : 22, color: C.green, margin: 0 }}>
            Diario de proceso
          </h3>
          <div style={{ fontSize: 12, color: C.tan, fontFamily: 'Montserrat, sans-serif', marginTop: 2 }}>
            Lote: {lote.nombreLote || lote.id}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {saving && <div style={{ fontSize: 11, color: C.sage }}>Guardando...</div>}
          {savedAt && !saving && <div style={{ fontSize: 11, color: C.sage }}>✓ Guardado {savedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</div>}
        </div>
      </div>

      {/* ── Cosecha ── */}
      <Etapa titulo="Cosecha" icono="🍒" open={!!seccionOpen.cosecha} onToggle={() => toggle('cosecha')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelS}>Fecha inicio</label>
            <input type="date" value={cosechaFechaInicio} onChange={e => setCosechaFechaInicio(e.target.value)} onBlur={onFieldBlur} style={inputS} />
          </div>
          <div>
            <label style={labelS}>Fecha fin</label>
            <input type="date" value={cosechaFechaFin} onChange={e => setCosechaFechaFin(e.target.value)} onBlur={onFieldBlur} style={inputS} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <TooltipInline campo="cosechaTipo">
            <label style={labelS}>Método de cosecha</label>
          </TooltipInline>
          <select value={cosechaTipo ?? ''} onChange={e => { setCosechaTipo((e.target.value || undefined) as ProcesoLoteDoc['cosechaTipo']); onFieldBlur(); }} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="selectiva">Selectiva (solo frutos rojos)</option>
            <option value="pasadas">Por pasadas</option>
            <option value="striping">Striping (todo a la vez)</option>
          </select>
        </div>
        {numField('Grados Brix al cosechar', 'cosechaBrix', cosechaBrix, setCosechaBrix, { placeholder: 'ej. 23', min: 0, max: 30, step: 0.5 })}
      </Etapa>

      {/* ── Despulpado ── */}
      <Etapa titulo="Despulpado" icono="⚙️" open={!!seccionOpen.despulpe} onToggle={() => toggle('despulpe')}>
        {numField('Horas entre cosecha y despulpe', 'horasHastaDespulpe', horasHastaDespulpe, setHorasHastaDespulpe, { placeholder: 'ej. 4', min: 0, max: 48 })}
      </Etapa>

      {/* ── Fermentación ── */}
      <Etapa titulo="Fermentación" icono="🫙" open={!!seccionOpen.ferm} onToggle={() => toggle('ferm')}>
        <div style={{ marginBottom: 14 }}>
          <TooltipInline campo="fermentacionTipo">
            <label style={labelS}>Tipo de fermentación</label>
          </TooltipInline>
          <select value={fermentacionTipo ?? ''} onChange={e => { setFermentacionTipo((e.target.value || undefined) as ProcesoLoteDoc['fermentacionTipo']); onFieldBlur(); }} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="seca">Seca (natural)</option>
            <option value="humeda">Húmeda (lavado)</option>
            <option value="anaerobica">Anaeróbica</option>
          </select>
        </div>
        {numField('Horas de fermentación', 'fermentacionHoras', fermentacionHoras, setFermentacionHoras, { placeholder: 'ej. 48', min: 0, max: 200 })}
        {numField('Temperatura del agua', 'fermentacionTempAgua', fermentacionTempAgua, setFermentacionTempAgua, { placeholder: 'ej. 18', min: 5, max: 35, unit: '°C' })}
      </Etapa>

      {/* ── Lavado ── */}
      <Etapa titulo="Lavado" icono="💧" open={!!seccionOpen.lavado} onToggle={() => toggle('lavado')}>
        {numField('Número de lavados', 'lavadoNumVeces', lavadoNumVeces, setLavadoNumVeces, { placeholder: 'ej. 2', min: 0, max: 10 })}
        <div style={{ marginBottom: 14 }}>
          <label style={labelS}>¿Agua limpia sin olor?</label>
          <div style={{ display: 'flex', gap: 16 }}>
            {[true, false].map(v => (
              <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.green, fontFamily: 'Montserrat, sans-serif', cursor: 'pointer' }}>
                <input type="radio" checked={lavadoAguaLimpia === v} onChange={() => { setLavadoAguaLimpia(v); onFieldBlur(); }} style={{ accentColor: C.terra }} />
                {v ? 'Sí' : 'No'}
              </label>
            ))}
          </div>
        </div>
      </Etapa>

      {/* ── Secado ── */}
      <Etapa titulo="Secado" icono="☀️" open={!!seccionOpen.secado} onToggle={() => toggle('secado')}>
        <div style={{ marginBottom: 14 }}>
          <TooltipInline campo="secadoMetodo">
            <label style={labelS}>Método de secado</label>
          </TooltipInline>
          <select value={secadoMetodo ?? ''} onChange={e => { setSecadoMetodo((e.target.value || undefined) as ProcesoLoteDoc['secadoMetodo']); onFieldBlur(); }} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="cama_africana">Cama africana (elevada)</option>
            <option value="patio">Patio de cemento / lona</option>
            <option value="secadora_mecanica">Secadora mecánica</option>
            <option value="combinado">Combinado</option>
          </select>
        </div>
        {numField('Días de secado', 'secadoDias', secadoDias, setSecadoDias, { placeholder: 'ej. 20', min: 0, max: 60 })}
        {numField('Humedad final del grano', 'secadoHumedadFinal', secadoHumedadFinal, setSecadoHumedadFinal, { placeholder: 'ej. 11', min: 5, max: 20, step: 0.5, unit: '%' })}
      </Etapa>

      {/* ── Almacenamiento ── */}
      <Etapa titulo="Almacenamiento" icono="🏚️" open={!!seccionOpen.almacen} onToggle={() => toggle('almacen')}>
        {numField('Días de reposo en pergamino', 'almacenamientoDiasReposo', almacenamientoDiasReposo, setAlmacenamientoDiasReposo, { placeholder: 'ej. 30', min: 0 })}
        <div style={{ marginBottom: 14 }}>
          <label style={labelS}>Condición de almacenamiento</label>
          <select value={almacenamientoCondicion ?? ''} onChange={e => { setAlmacenamientoCondicion((e.target.value || undefined) as ProcesoLoteDoc['almacenamientoCondicion']); onFieldBlur(); }} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="optima">Óptima (seco, ventilado, oscuro)</option>
            <option value="regular">Regular</option>
            <option value="deficiente">Deficiente</option>
          </select>
        </div>
      </Etapa>

      <button
        onClick={saveNow}
        disabled={saving}
        style={{ background: C.terra, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginTop: 8 }}
      >
        {saving ? 'Guardando...' : 'Guardar proceso'}
      </button>
    </div>
  );
}
