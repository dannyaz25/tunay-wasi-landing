/**
 * procesoService.ts — Finca y diario de proceso en colecciones mkt_fincas / mkt_procesos
 * Colecciones:
 *   mkt_fincas/{caficultorId}   — perfil permanente de la finca (1 doc por caficultor)
 *   mkt_procesos/{loteId}       — diario de proceso vinculado al lote
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/shared/firebase';
import type { FincaDoc, ProcesoLoteDoc } from '@/shared/types/marketplace';

// ─── Finca ───────────────────────────────────────────────────────────────────

export async function fetchFinca(caficultorId: string): Promise<FincaDoc | null> {
  const snap = await getDoc(doc(db, 'mkt_fincas', caficultorId));
  return snap.exists() ? (snap.data() as FincaDoc) : null;
}

export async function upsertFinca(
  caficultorId: string,
  data: Omit<FincaDoc, 'id' | 'caficultorId' | 'createdAt'>,
): Promise<void> {
  const ref = doc(db, 'mkt_fincas', caficultorId);
  const existing = await getDoc(ref);
  const payload = {
    id: caficultorId,
    caficultorId,
    createdAt: existing.exists() ? (existing.data() as FincaDoc).createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  await setDoc(ref, Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined)));
}

// ─── Proceso por lote ─────────────────────────────────────────────────────────

export async function fetchProcesoLote(loteId: string): Promise<ProcesoLoteDoc | null> {
  const snap = await getDoc(doc(db, 'mkt_procesos', loteId));
  return snap.exists() ? (snap.data() as ProcesoLoteDoc) : null;
}

export async function upsertProcesoLote(
  loteId: string,
  caficultorId: string,
  data: Omit<ProcesoLoteDoc, 'id' | 'loteId' | 'caficultorId' | 'createdAt'>,
): Promise<void> {
  const ref = doc(db, 'mkt_procesos', loteId);
  const existing = await getDoc(ref);
  const payload = {
    id: loteId,
    loteId,
    caficultorId,
    createdAt: existing.exists() ? (existing.data() as ProcesoLoteDoc).createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  };
  await setDoc(ref, Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined)));
}
