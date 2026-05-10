export type ToneOption = 'green' | 'tan' | 'terra' | 'cream' | 'deep';
export type TagTone = 'sage' | 'terra' | 'deep';
export type ProductLabel = 'PREVENTA' | 'NEW';

export type { CaficultorDoc } from './firestore';

export interface Producto {
  id: string;
  code: string;
  name: string;
  sub: string;
  region: string;
  alt: string;
  farm: string;
  producer: string;
  notes: string[];
  body: string;
  acidity: string;
  score: string;
  tag: string;
  tagTone: TagTone;
  brews: string[];
  weights: [string, number][];
  producerPct: number;
  tone: ToneOption;
  stockKg: number;
  desc: string;
  photo?: string;
  label?: ProductLabel;
}

export interface Caficultor {
  id: string;
  name: string;
  farm: string;
  region: string;
  alt: string;
  variety: string;
  process: string;
  score: string;
  color: ToneOption;
  quote: string;
  summary?: string;      // resumen breve (opcional — mostrado en card)
  photo?: string;
  // extended profile fields (optional — shown in modal)
  photos?: string[];
  bio?: string;
  socialImpact?: string;
  yearsExp?: number;
  farmHa?: number;
  location?: string;
  status?: string;
}


export interface CicloActivo {
  closeAt: string;
  deliverLima: string;
  deliverProv: string;
  cutoffTimestamp: number;
}
