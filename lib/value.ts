import { CO2, METAL_CO2, PRICES } from './data';
import type { Category } from './types';

export interface Estimate {
  /** Rupiah value at the bank-sampah buy price (mid-point for ranges). */
  valueIdr: number;
  /** For e-waste per-unit and organic compost: low/high of the range. */
  valueMinIdr: number | null;
  valueMaxIdr: number | null;
  /** Unit price actually applied, per kg (null for per-unit pricing). */
  unitPriceIdrPerKg: number | null;
  unitLabel: string;
  co2Kg: number;
  /** Extra honest note for this estimate, if any. */
  note: string | null;
}

export const METAL_SUBTYPES = [
  { id: 'besi', label: 'Iron / steel (besi)', price: PRICES.sub_types.metal.besi },
  { id: 'aluminium', label: 'Aluminium', price: PRICES.sub_types.metal.aluminium },
  { id: 'tembaga', label: 'Copper (tembaga)', price: PRICES.sub_types.metal.tembaga },
] as const;

export const EWASTE_UNITS = [
  { id: 'fridge', label: 'Fridge / kulkas' },
  { id: 'washing_machine', label: 'Washing machine' },
  { id: 'tv', label: 'TV' },
  { id: 'ac', label: 'Air conditioner' },
] as const;

export type MetalSubType = (typeof METAL_SUBTYPES)[number]['id'];
export type EwasteUnit = (typeof EWASTE_UNITS)[number]['id'];

/**
 * subType: for metal → 'besi' | 'aluminium' | 'tembaga';
 * for organic → 'intake' | 'compost';
 * for e-waste → 'per_kg' | 'fridge' | 'washing_machine' | 'tv' | 'ac';
 * otherwise null.
 */
export function estimateValue(
  category: Category,
  weightKg: number,
  subType: string | null,
): Estimate {
  const co2PerKg = CO2.factors[category].kg_co2e_avoided_per_kg;

  if (category === 'metal' && subType && subType in METAL_CO2) {
    const price = PRICES.sub_types.metal[subType as MetalSubType];
    return {
      valueIdr: price * weightKg,
      valueMinIdr: null,
      valueMaxIdr: null,
      unitPriceIdrPerKg: price,
      unitLabel: `${subType} · Rp ${price.toLocaleString('id-ID')}/kg`,
      co2Kg: METAL_CO2[subType] * weightKg,
      note: subType === 'tembaga' ? 'Copper prices are volatile — treat as an approximate median.' : null,
    };
  }

  if (category === 'organic' && subType === 'compost') {
    const { compost_output_per_kg_min: lo, compost_output_per_kg_max: hi } = PRICES.sub_types.organic;
    return {
      valueIdr: ((lo + hi) / 2) * weightKg,
      valueMinIdr: lo * weightKg,
      valueMaxIdr: hi * weightKg,
      unitPriceIdrPerKg: (lo + hi) / 2,
      unitLabel: `compost output · Rp ${lo.toLocaleString('id-ID')}–${hi.toLocaleString('id-ID')}/kg`,
      co2Kg: co2PerKg * weightKg,
      note: 'Compost output value — the finished compost sells for this, not the raw waste.',
    };
  }

  if (category === 'e-waste' && subType && subType !== 'per_kg') {
    const range = PRICES.sub_types['e-waste_per_unit_idr'][subType];
    if (range) {
      const [lo, hi] = range;
      return {
        valueIdr: (lo + hi) / 2,
        valueMinIdr: lo,
        valueMaxIdr: hi,
        unitPriceIdrPerKg: null,
        unitLabel: 'per unit (not per kg)',
        co2Kg: co2PerKg * weightKg,
        note: 'Large appliances are priced per unit, not per kg. Weight is used only for the CO₂ estimate.',
      };
    }
  }

  const price = PRICES.categories[category].price_idr_per_kg;
  return {
    valueIdr: price * weightKg,
    valueMinIdr: null,
    valueMaxIdr: null,
    unitPriceIdrPerKg: price,
    unitLabel: `Rp ${price.toLocaleString('id-ID')}/kg`,
    co2Kg: co2PerKg * weightKg,
    note:
      category === 'organic'
        ? 'Intake price — raw organic waste is nearly worthless at intake; the value is in compost output.'
        : null,
  };
}
