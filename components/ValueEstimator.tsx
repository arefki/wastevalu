'use client';

import { useMemo, useState } from 'react';
import { CO2, PRICES } from '@/lib/data';
import { EWASTE_UNITS, METAL_SUBTYPES, estimateValue } from '@/lib/value';
import { newId } from '@/lib/storage';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  formatIdr,
  formatKg,
  type Category,
  type HistoryItem,
} from '@/lib/types';

export default function ValueEstimator({ onLog }: { onLog: (item: HistoryItem) => void }) {
  const [category, setCategory] = useState<Category>('plastic');
  const [weightKg, setWeightKg] = useState(1);
  const [metalSub, setMetalSub] = useState<string>('besi');
  const [organicMode, setOrganicMode] = useState<string>('intake');
  const [ewasteMode, setEwasteMode] = useState<string>('per_kg');
  const [logged, setLogged] = useState(false);

  const subType = useMemo(() => {
    if (category === 'metal') return metalSub;
    if (category === 'organic') return organicMode;
    if (category === 'e-waste') return ewasteMode;
    return null;
  }, [category, metalSub, organicMode, ewasteMode]);

  const estimate = useMemo(
    () => estimateValue(category, weightKg, subType),
    [category, weightKg, subType],
  );

  const handleLog = () => {
    onLog({
      id: newId(),
      date: new Date().toISOString(),
      category,
      subType,
      weightKg,
      valueIdr: estimate.valueIdr,
      co2Kg: estimate.co2Kg,
    });
    setLogged(true);
  };

  const pickCategory = (c: Category) => {
    setCategory(c);
    setLogged(false);
  };

  return (
    <section id="value" className="section">
      <div className="section-head">
        <p className="eyebrow">Step 2 · Know the price</p>
        <h2>What banks actually pay</h2>
        <p className="section-sub">
          Buy prices paid to households by Indonesian bank sampah (community waste banks),
          Jakarta, November 2026. These are medians of published price lists — your local bank may
          pay a little more or less.
        </p>
      </div>

      <div className="estimator-grid">
        <div className="card">
          <div className="cat-picker" role="group" aria-label="Waste category">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`chip chip-lg ${category === c ? 'chip-active' : ''}`}
                onClick={() => pickCategory(c)}
                aria-pressed={category === c}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>

          {category === 'metal' && (
            <div className="subtype-block">
              <p className="field-label">Metal type matters — copper pays 30× iron:</p>
              <div className="btn-row">
                {METAL_SUBTYPES.map((m) => (
                  <button
                    key={m.id}
                    className={`btn btn-small ${metalSub === m.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setMetalSub(m.id);
                      setLogged(false);
                    }}
                  >
                    {m.label} · {formatIdr(m.price)}/kg
                  </button>
                ))}
              </div>
            </div>
          )}

          {category === 'organic' && (
            <div className="subtype-block">
              <p className="field-label">Organic has two very different prices:</p>
              <div className="btn-row">
                <button
                  className={`btn btn-small ${organicMode === 'intake' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setOrganicMode('intake');
                    setLogged(false);
                  }}
                >
                  Raw waste intake · {formatIdr(100)}/kg
                </button>
                <button
                  className={`btn btn-small ${organicMode === 'compost' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setOrganicMode('compost');
                    setLogged(false);
                  }}
                >
                  Finished compost · {formatIdr(700)}–{formatIdr(2000)}/kg
                </button>
              </div>
            </div>
          )}

          {category === 'e-waste' && (
            <div className="subtype-block">
              <p className="field-label">Small e-waste is priced per kg; big appliances per unit:</p>
              <div className="btn-row wrap">
                <button
                  className={`btn btn-small ${ewasteMode === 'per_kg' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setEwasteMode('per_kg');
                    setLogged(false);
                  }}
                >
                  Small e-waste · {formatIdr(10000)}/kg
                </button>
                {EWASTE_UNITS.map((u) => (
                  <button
                    key={u.id}
                    className={`btn btn-small ${ewasteMode === u.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setEwasteMode(u.id);
                      setLogged(false);
                    }}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="weight-block">
            <label htmlFor="est-weight">
              Weight: <strong>{formatKg(weightKg)}</strong>
              {category === 'e-waste' && ewasteMode !== 'per_kg' && (
                <span className="muted small"> (used only for the CO₂ estimate)</span>
              )}
            </label>
            <input
              id="est-weight"
              type="range"
              min={0.1}
              max={50}
              step={0.1}
              value={weightKg}
              onChange={(e) => {
                setWeightKg(Number(e.target.value));
                setLogged(false);
              }}
            />
            <div className="range-labels">
              <span>100 g</span>
              <span>50 kg</span>
            </div>
          </div>

          <div className="value-box">
            <div className="value-main">
              {estimate.valueMinIdr !== null && estimate.valueMaxIdr !== null
                ? `${formatIdr(estimate.valueMinIdr)} – ${formatIdr(estimate.valueMaxIdr)}`
                : formatIdr(estimate.valueIdr)}
            </div>
            <div className="muted small">
              estimated payout · {estimate.unitLabel} · avoids ≈ {estimate.co2Kg.toFixed(2)} kg CO₂e
            </div>
            {estimate.note && <div className="muted small">⚠️ {estimate.note}</div>}
          </div>

          <button className="btn btn-primary btn-block" onClick={handleLog} disabled={logged}>
            {logged ? '✓ Logged to My items' : 'Log this estimate'}
          </button>
        </div>

        <div className="card price-table-card">
          <h3>Price list · Jakarta, Nov 2026</h3>
          <table className="price-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Rp / kg</th>
                <th>CO₂ avoided / kg</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c} className={category === c ? 'row-active' : ''}>
                  <td>
                    <button className="link-btn" onClick={() => pickCategory(c)}>
                      {CATEGORY_LABEL[c]}
                    </button>
                  </td>
                  <td className="num">
                    {PRICES.categories[c].price_idr_per_kg.toLocaleString('id-ID')}
                  </td>
                  <td>
                    {c === 'metal' ? '2.04–10.09 kg' : `${co2Of(c)} kg`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="caveat-list">
            {PRICES.caveats.map((caveat) => (
              <li key={caveat}>{displayCaveat(caveat)}</li>
            ))}
          </ul>
          <p className="muted small">
            Method: {PRICES.method} Full per-source tables and all 36 references are in the project
            repository (prices-locations-draft.md).
          </p>
        </div>
      </div>
    </section>
  );
}

function co2Of(c: Category): string {
  return CO2.factors[c].kg_co2e_avoided_per_kg.toFixed(2);
}

/** The price data's caveats include one builder-facing note; reword it for users. */
function displayCaveat(caveat: string): string {
  if (caveat.includes('the app must show')) {
    return 'Prices fluctuate with commodity markets — this list was last updated Nov 2026; check with the bank before a big drop-off.';
  }
  return caveat;
}
