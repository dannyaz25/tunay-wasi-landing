import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/firebase';
import { sendMail } from '@/services/mailService';
import {
  emailBienvenidaMayoristaB2B,
  emailAlertaAdminMayoristaB2B,
} from '@/services/emailTemplates';

const COLLECTION = 'solicitudes_b2b';
const ADMIN_EMAIL = 'tunaywasi@gmail.com';

export interface SolicitudSupply {
  empresa: string;
  contacto: string;
  email: string;
  telefono: string;
  volumenKg: number;
  frecuencia: string;
  puntajeMin: number;
  variedad?: string;
  mensaje?: string;
  loteId?: string;
  loteVariedad?: string;
  loteOrigen?: string;
  loteSca?: number;
  lotePrecioKg?: number;
}

export async function saveSolicitudSupply(data: SolicitudSupply): Promise<void> {
  const normalizedEmail = data.email.toLowerCase().trim();

  await addDoc(collection(db, COLLECTION), {
    ...data,
    email: normalizedEmail,
    status: 'nuevo',
    source: 'mayoristas-landing',
    createdAt: serverTimestamp(),
  });

  const loteReservado = data.loteId
    ? { id: data.loteId, variedad: data.loteVariedad ?? '', origen: data.loteOrigen ?? '', sca: data.loteSca ?? 0, precioKg: data.lotePrecioKg ?? 0 }
    : undefined;

  const welcome = emailBienvenidaMayoristaB2B({
    contacto: data.contacto,
    empresa: data.empresa,
    email: normalizedEmail,
    volumenKg: data.volumenKg,
    frecuencia: data.frecuencia,
    mensaje: data.mensaje,
    loteReservado,
  });
  sendMail({ to: normalizedEmail, ...welcome }).catch(console.warn);

  const alert = emailAlertaAdminMayoristaB2B({
    ...data,
    email: normalizedEmail,
    loteReservado,
  });
  sendMail({ to: ADMIN_EMAIL, ...alert }).catch(console.warn);
}
