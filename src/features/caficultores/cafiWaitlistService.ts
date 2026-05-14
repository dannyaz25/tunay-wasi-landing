import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/shared/firebase';
import { sendMail } from '@/services/mailService';
import {
  emailBienvenidaCaficultorWaitlist,
  emailAlertaAdminCaficultor,
} from '@/services/emailTemplates';

const COLLECTION = 'waitlist-caficultores';
const ADMIN_EMAIL = 'tunaywasi@gmail.com';

export class DuplicateEmailError extends Error {
  constructor() {
    super('Email ya registrado');
    this.name = 'DuplicateEmailError';
  }
}

export interface CafiWaitlistData {
  email: string;
  telefono: string;
  nombre: string;
  finca: string;
  region: string;
  kg: string;
  sca: string;
}

export async function saveCafiWaitlist(data: CafiWaitlistData): Promise<void> {
  const normalizedEmail = data.email.toLowerCase().trim();

  const snap = await getDocs(
    query(collection(db, COLLECTION), where('email', '==', normalizedEmail))
  );
  if (!snap.empty) throw new DuplicateEmailError();

  await addDoc(collection(db, COLLECTION), {
    ...data,
    email: normalizedEmail,
    status: 'pendiente',
    source: 'caficultor-landing',
    createdAt: serverTimestamp(),
  });

  const welcome = emailBienvenidaCaficultorWaitlist({
    nombre: data.nombre || normalizedEmail,
    email: normalizedEmail,
    finca: data.finca || '—',
    region: data.region || '—',
    sca: data.sca,
  });
  sendMail({ to: normalizedEmail, ...welcome }).catch(console.error);

  const alert = emailAlertaAdminCaficultor({ ...data, email: normalizedEmail });
  sendMail({ to: ADMIN_EMAIL, ...alert }).catch(console.error);
}
