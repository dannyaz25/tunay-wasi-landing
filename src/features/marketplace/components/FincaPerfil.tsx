/**
 * FincaPerfil.tsx — Perfil permanente de la finca del caficultor
 * Educación contextual integrada como tooltips "¿Por qué importa?"
 */
import { useState, useEffect } from 'react';
import { useIsMobile, padY, inputStyle as baseInputStyle, grid2 } from '@/shared/mobileStyles';
import { fetchFinca, upsertFinca } from '@/features/marketplace/procesoService';
import type { FincaDoc } from '@/shared/types/marketplace';

const C = {
  green: '#1f3028', cream: '#f2e0cc', terra: '#c96e4b',
  sage: '#8faf8a', tan: '#c4b297', brown: '#533b22',
};

const VARIEDADES = ['Geisha', 'Caturra', 'Bourbon', 'Typica', 'Catimor', 'Pache', 'Mundo Novo', 'Otra'];
const CERTIFICACIONES = ['organico', 'fair_trade', 'rainforest', 'utz'];

// Textos educativos por campo
const WHY: Record<string, string> = {
  variedades:   'La variedad genética define el potencial aromático máximo del grano. Geisha puede superar 90 pts SCA; Catimor raramente llega a 80.',
  altitud:      'A mayor altitud (>1500 msnm), el grano madura más lento, acumula más azúcares y desarrolla notas florales y frutales que elevan el puntaje SCA.',
  tipoSuelo:    'Suelos volcánicos con buen drenaje y minerales activos (fósforo, potasio) favorecen granos densos con acidez limpia.',
  tipoCultivo:  'El café orgánico puede recibir sobreprecio de 10-20% en mercados especializados. La transición requiere ≥3 años para certificar.',
  tipoSombra:   'Sombra densa ralentiza la maduración (positivo para complejidad), protege de heladas y mejora biodiversidad del suelo.',
  certificaciones: 'Las certificaciones son pasaportes a mercados premium. Fair Trade garantiza precio mínimo; Orgánico puede triplicar el precio por kilo.',
  hectareas:    'Registrar el tamaño de tu finca ayuda a estimar tu potencial de producción y planificar lotes futuros.',
};

function TooltipField({ label, campo, children }: { label: string; campo: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>{label}</label>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: `1px solid ${C.tan}`, borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 11, color: C.tan, lineHeight: '16px', padding: 0 }}
          title="¿Por qué importa?"
        >?</button>
      </div>
      {open && (
        <div style={{ background: '#f9f3ec', border: `1px solid ${C.sage}`, borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: C.brown, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
          🌱 <strong>¿Por qué importa?</strong> {WHY[campo]}
        </div>
      )}
      {children}
    </div>
  );
}

interface Props {
  caficultorId: string;
}

export default function FincaPerfil({ caficultorId }: Props) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);

  const [variedades, setVariedades] = useState<string[]>([]);
  const [altitudMin, setAltitudMin] = useState('');
  const [altitudMax, setAltitudMax] = useState('');
  const [tipoSuelo, setTipoSuelo] = useState<FincaDoc['tipoSuelo']>(undefined);
  const [tipoCultivo, setTipoCultivo] = useState<FincaDoc['tipoCultivo']>(undefined);
  const [tipoSombra, setTipoSombra] = useState<FincaDoc['tipoSombra']>(undefined);
  const [certificaciones, setCertificaciones] = useState<string[]>([]);
  const [hectareas, setHectareas] = useState('');

  useEffect(() => {
    fetchFinca(caficultorId).then(f => {
      if (f) {
        setVariedades(f.variedades ?? []);
        setAltitudMin(f.altitudMin != null ? String(f.altitudMin) : '');
        setAltitudMax(f.altitudMax != null ? String(f.altitudMax) : '');
        setTipoSuelo(f.tipoSuelo);
        setTipoCultivo(f.tipoCultivo);
        setTipoSombra(f.tipoSombra);
        setCertificaciones(f.certificaciones ?? []);
        setHectareas(f.hectareas != null ? String(f.hectareas) : '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [caficultorId]);

  function toggleSet<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
  }

  function validarAlertas(): string[] {
    const tips: string[] = [];
    const altMin = Number(altitudMin);
    const altMax = Number(altitudMax);
    if (altitudMin && altMin < 1200) tips.push('Tu altitud está por debajo de 1200 msnm — a esta altura es difícil alcanzar puntajes SCA de especialidad (≥ 82 pts). Considera introducir variedades adaptadas a zonas medias.');
    if (altitudMax && altMax > 2800) tips.push('Altitudes > 2800 msnm pueden dificultar la maduración uniforme del fruto. Monitorea los grados Brix antes de cosechar.');
    if (tipoSuelo === 'arcilloso') tips.push('Suelos arcillosos retienen agua en exceso — asegura buen drenaje para evitar enfermedades radiculares.');
    return tips;
  }

  async function handleGuardar() {
    setSaving(true);
    await upsertFinca(caficultorId, {
      variedades,
      altitudMin: altitudMin ? Number(altitudMin) : undefined,
      altitudMax: altitudMax ? Number(altitudMax) : undefined,
      tipoSuelo,
      tipoCultivo,
      tipoSombra,
      certificaciones,
      hectareas: hectareas ? Number(hectareas) : undefined,
    });
    const tips = validarAlertas();
    setAlerts(tips);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputS: React.CSSProperties = { ...baseInputStyle, background: '#fff' };
  const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer' };

  if (loading) return <div style={{ padding: padY(isMobile), color: C.brown, fontFamily: 'Montserrat, sans-serif' }}>Cargando perfil...</div>;

  return (
    <div style={{ padding: padY(isMobile) }}>
      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: isMobile ? 20 : 24, color: C.green, margin: '0 0 4px' }}>Perfil de mi finca</h3>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: C.brown, margin: '0 0 20px' }}>
        Esta información se cruza con tu puntaje SCA para generar retroalimentación personalizada.
      </p>

      {/* Variedades */}
      <TooltipField label="Variedades de café" campo="variedades">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {VARIEDADES.map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              <input
                type="checkbox"
                checked={variedades.includes(v)}
                onChange={() => setVariedades(arr => toggleSet(arr, v))}
                style={{ accentColor: C.terra }}
              />
              {v}
            </label>
          ))}
        </div>
      </TooltipField>

      {/* Altitud */}
      <TooltipField label="Altitud del cultivo (msnm)" campo="altitud">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: C.tan, marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>Mínima</div>
            <input type="number" placeholder="ej. 1600" value={altitudMin} onChange={e => setAltitudMin(e.target.value)} style={inputS} min={0} max={5000} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.tan, marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>Máxima</div>
            <input type="number" placeholder="ej. 1900" value={altitudMax} onChange={e => setAltitudMax(e.target.value)} style={inputS} min={0} max={5000} />
          </div>
        </div>
      </TooltipField>

      {/* Grid de selects */}
      <div style={{ ...grid2(isMobile), gap: 16 }}>
        <TooltipField label="Tipo de suelo" campo="tipoSuelo">
          <select value={tipoSuelo ?? ''} onChange={e => setTipoSuelo((e.target.value || undefined) as FincaDoc['tipoSuelo'])} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="volcanico">Volcánico</option>
            <option value="arcilloso">Arcilloso</option>
            <option value="franco">Franco</option>
            <option value="otro">Otro</option>
          </select>
        </TooltipField>

        <TooltipField label="Tipo de cultivo" campo="tipoCultivo">
          <select value={tipoCultivo ?? ''} onChange={e => setTipoCultivo((e.target.value || undefined) as FincaDoc['tipoCultivo'])} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="convencional">Convencional</option>
            <option value="organico">Orgánico</option>
            <option value="transicion">En transición orgánica</option>
          </select>
        </TooltipField>

        <TooltipField label="Nivel de sombra" campo="tipoSombra">
          <select value={tipoSombra ?? ''} onChange={e => setTipoSombra((e.target.value || undefined) as FincaDoc['tipoSombra'])} style={selectS}>
            <option value="">— Seleccionar —</option>
            <option value="ninguna">Sin sombra</option>
            <option value="parcial">Sombra parcial</option>
            <option value="densa">Sombra densa</option>
          </select>
        </TooltipField>

        <TooltipField label="Hectáreas en producción" campo="hectareas">
          <input type="number" placeholder="ej. 3.5" value={hectareas} onChange={e => setHectareas(e.target.value)} style={inputS} min={0} step={0.5} />
        </TooltipField>
      </div>

      {/* Certificaciones */}
      <TooltipField label="Certificaciones" campo="certificaciones">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CERTIFICACIONES.map(c => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13, color: C.green, fontFamily: 'Montserrat, sans-serif' }}>
              <input
                type="checkbox"
                checked={certificaciones.includes(c)}
                onChange={() => setCertificaciones(arr => toggleSet(arr, c))}
                style={{ accentColor: C.terra }}
              />
              {c.replace('_', ' ')}
            </label>
          ))}
        </div>
      </TooltipField>

      {/* Alertas de rango */}
      {alerts.length > 0 && (
        <div style={{ background: '#fff8e1', border: '1px solid #f5c642', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ fontSize: 13, color: '#7a5c00', fontFamily: 'Montserrat, sans-serif', marginBottom: i < alerts.length - 1 ? 8 : 0 }}>
              ⚠ {a}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleGuardar}
        disabled={saving}
        style={{ background: C.terra, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar perfil'}
      </button>
    </div>
  );
}
