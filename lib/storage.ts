import type { HistoryItem } from './types';

const KEY = 'wastevalu-history-v1';

export function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it) =>
        it &&
        typeof it.id === 'string' &&
        typeof it.category === 'string' &&
        typeof it.weightKg === 'number',
    );
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable — the app still works, history just isn't kept.
  }
}

export function totals(items: HistoryItem[]): {
  count: number;
  kg: number;
  valueIdr: number;
  co2Kg: number;
} {
  return items.reduce(
    (acc, it) => ({
      count: acc.count + 1,
      kg: acc.kg + it.weightKg,
      valueIdr: acc.valueIdr + it.valueIdr,
      co2Kg: acc.co2Kg + it.co2Kg,
    }),
    { count: 0, kg: 0, valueIdr: 0, co2Kg: 0 },
  );
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
