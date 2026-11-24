import pricesRaw from '@/data/prices.json';
import collectorsRaw from '@/data/collectors.json';
import co2Raw from '@/data/co2-factors.json';
import metricsRaw from '@/data/metrics.json';
import classNamesRaw from '@/data/class_names.json';
import type { Category, Collector } from './types';

export interface PriceEntry {
  price_idr_per_kg: number;
  basis: string;
  sources: string[];
}

export const PRICES = pricesRaw as unknown as {
  city: string;
  currency: string;
  unit: string;
  last_updated: string;
  method: string;
  categories: Record<Category, PriceEntry>;
  sub_types: {
    metal: { besi: number; aluminium: number; tembaga: number; note: string };
    organic: {
      intake_per_kg: number;
      compost_output_per_kg_min: number;
      compost_output_per_kg_max: number;
      note: string;
    };
    'e-waste_per_unit_idr': Record<string, [number, number]>;
  };
  caveats: string[];
};

export const COLLECTORS = (collectorsRaw as unknown as {
  city: string;
  collectors: Collector[];
  counts: { total: number; confirmed: number; single_source: number; with_coordinates: number; without_coordinates: number };
  help_desk: { phones: string[]; email: string; note: string };
  directories: { dlh_dki_e_bank_sampah: string; zero_waste_indonesia: string };
  other_drop_offs: { name: string; address: string; region: string; note: string; source: string }[];
  notes: string[];
}).collectors;

export const COLLECTOR_META = collectorsRaw as unknown as {
  counts: { total: number; confirmed: number; single_source: number; with_coordinates: number; without_coordinates: number };
  help_desk: { phones: string[]; email: string; note: string };
  directories: { dlh_dki_e_bank_sampah: string; zero_waste_indonesia: string };
  other_drop_offs: { name: string; address: string; region: string; note: string; source: string }[];
  notes: string[];
};

export const CO2 = co2Raw as {
  source: string;
  source_url: string;
  method: string;
  unit: string;
  accessed: string;
  factors: Record<
    Category,
    { kg_co2e_avoided_per_kg: number; warm_material: string } & Record<string, number | string>
  >;
  caveats: string[];
};

export const METRICS = metricsRaw as {
  test_accuracy: number;
  test_n: number;
  per_class: Record<string, { support: number; precision: number; recall: number; f1: number }>;
  class_names: string[];
  note: string;
};

export const CLASS_NAMES = classNamesRaw as string[];

/** Metal sub-type CO2 factors (EPA WARM v16, from co2-factors.json caveats). */
export const METAL_CO2: Record<string, number> = {
  besi: 2.04,
  aluminium: 10.09,
  tembaga: 4.97,
};
