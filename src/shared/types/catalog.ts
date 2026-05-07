export type ToneOption = 'green' | 'tan' | 'terra' | 'cream' | 'deep';
export type TagTone = 'sage' | 'terra' | 'deep';

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
  tone: ToneOption;
  stockKg: number;
  desc: string;
  photo?: string;
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
  photo?: string;
}

export interface CicloActivo {
  closeAt: string;
  deliverLima: string;
  deliverProv: string;
  cutoffTimestamp: number;
}
