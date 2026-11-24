export type Category =
  | 'plastic'
  | 'paper'
  | 'cardboard'
  | 'metal'
  | 'glass'
  | 'organic'
  | 'e-waste';

export const CATEGORIES: Category[] = [
  'plastic',
  'paper',
  'cardboard',
  'metal',
  'glass',
  'organic',
  'e-waste',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  plastic: 'Plastic',
  paper: 'Paper',
  cardboard: 'Cardboard',
  metal: 'Metal',
  glass: 'Glass',
  organic: 'Organic',
  'e-waste': 'E-waste',
};

export const CATEGORY_ID: Record<Category, string> = {
  plastic: 'plastik',
  paper: 'kertas',
  cardboard: 'kardus',
  metal: 'logam',
  glass: 'kaca',
  organic: 'organik',
  'e-waste': 'elektronik',
};

export interface Prediction {
  category: Category;
  probability: number;
}

export interface HistoryItem {
  id: string;
  date: string; // ISO timestamp
  category: Category;
  subType: string | null;
  weightKg: number;
  valueIdr: number;
  co2Kg: number;
}

export interface Collector {
  id: number;
  name: string;
  type: string;
  region: string;
  address: string;
  lat: number | null;
  lon: number | null;
  accepted: string[];
  confidence: 'CONFIRMED' | 'SINGLE-SOURCE';
  verified: boolean;
  coordinates_verified: boolean;
  phone: string | null;
  phone_verified?: boolean;
  phone_note: string | null;
  notes: string | null;
  sources: string;
  maps_url?: string;
}

export function formatIdr(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function formatKg(n: number): string {
  if (n < 1) return `${Math.round(n * 1000)} g`;
  return `${n.toFixed(n < 10 ? 1 : 0)} kg`;
}
