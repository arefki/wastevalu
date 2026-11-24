'use client';

import { useMemo } from 'react';
import { totals } from '@/lib/storage';
import { CATEGORIES, CATEGORY_LABEL, formatIdr, type HistoryItem } from '@/lib/types';

export default function ImpactDashboard({ history }: { history: HistoryItem[] }) {
  const t = useMemo(() => totals(history), [history]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { kg: number; valueIdr: number }>();
    for (const it of history) {
      const cur = map.get(it.category) ?? { kg: 0, valueIdr: 0 };
      cur.kg += it.weightKg;
      cur.valueIdr += it.valueIdr;
      map.set(it.category, cur);
    }
    return CATEGORIES.filter((c) => map.has(c)).map((c) => ({ category: c, ...map.get(c)! }));
  }, [history]);

  const maxKg = Math.max(0, ...byCategory.map((b) => b.kg));

  // A mature tree absorbs ~21 kg CO2 per year (USDA Forest Service estimate).
  const treeYears = t.co2Kg / 21;

  return (
    <section id="dashboard" className="section">
      <div className="section-head">
        <p className="eyebrow">My impact</p>
        <h2>Your trash, counted</h2>
        <p className="section-sub">
          Everything you log is stored only in this browser. CO₂ figures are estimates from EPA
          WARM v16 factors — see <a href="#sources">Sources &amp; limits</a>.
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{t.count}</div>
          <div className="stat-label">items logged</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{t.kg < 1 ? `${Math.round(t.kg * 1000)} g` : `${t.kg.toFixed(1)} kg`}</div>
          <div className="stat-label">waste diverted</div>
        </div>
        <div className="stat-card stat-money">
          <div className="stat-value">{formatIdr(t.valueIdr)}</div>
          <div className="stat-label">estimated value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{t.co2Kg.toFixed(1)} kg</div>
          <div className="stat-label">CO₂e avoided ≈ {treeYears.toFixed(1)} tree-years</div>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="card">
          <h3>By category</h3>
          <div className="top3">
            {byCategory.map((b) => (
              <div key={b.category} className="top3-row top3-row-wide">
                <span className="top3-label">{CATEGORY_LABEL[b.category]}</span>
                <div className="bar">
                  <div
                    className="bar-fill"
                    style={{ width: `${maxKg > 0 ? Math.max((b.kg / maxKg) * 100, 2) : 0}%` }}
                  />
                </div>
                <span className="top3-pct">
                  {b.kg.toFixed(1)} kg · {formatIdr(b.valueIdr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
