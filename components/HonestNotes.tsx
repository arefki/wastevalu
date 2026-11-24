'use client';

import { CO2, METRICS, PRICES } from '@/lib/data';
import { CATEGORY_LABEL } from '@/lib/types';

const DATASETS = [
  {
    name: 'TrashNet (Stanford CS229, Thung & Yang 2016)',
    detail: '2,390 images · plastic, paper, cardboard, metal, glass · MIT license',
    url: 'https://github.com/garythung/trashnet',
  },
  {
    name: 'TrashBox (Kumsetty et al. 2022)',
    detail: '2,405 images · e-waste · CC BY 4.0 · DOI 10.23919/FRUCT54823.2022.9770922',
    url: 'https://github.com/nikhilvenkatkumsetty/TrashBox',
  },
  {
    name: 'RealWaste (Single, Iranmanesh & Raad 2023)',
    detail: '847 images · organic · CC BY-NC-SA 4.0 · DOI 10.3390/info14120633',
    url: 'https://github.com/sam-single/realwaste',
  },
];

export default function HonestNotes() {
  const accuracyPct = (METRICS.test_accuracy * 100).toFixed(1);

  return (
    <section id="sources" className="section">
      <div className="section-head">
        <p className="eyebrow">Sources &amp; limits</p>
        <h2>Honest numbers, or nothing</h2>
        <p className="section-sub">
          Every number in this app comes from a named source, and every known weakness is stated
          here. If a figure is an estimate, it says so.
        </p>
      </div>

      <div className="notes-grid">
        <div className="card">
          <h3>The AI model</h3>
          <p>
            MobileNetV2 transfer learning, trained on 5,575 images across 7 classes, exported to
            TensorFlow.js and run 100% in your browser. Test accuracy{' '}
            <strong>{accuracyPct}%</strong> on a held-out test set of {METRICS.test_n} photos
            (stratified 15% split, seed 42).
          </p>
          <div className="table-scroll">
          <table className="mini-table">
            <thead>
              <tr>
                <th>Class</th>
                <th className="num">Precision</th>
                <th className="num">Recall</th>
                <th className="num">F1</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.class_names.map((c) => {
                const pc = METRICS.per_class[c];
                return (
                  <tr key={c}>
                    <td>{CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL] ?? c}</td>
                    <td className="num">{pc.precision.toFixed(2)}</td>
                    <td className="num">{pc.recall.toFixed(2)}</td>
                    <td className="num">{pc.f1.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <p className="alert small">
            <strong>Known limit:</strong>{' '}
            {METRICS.note.replace(' — see DATA-RESEARCH.md', '')} Glass and metal are the
            weakest classes (F1 0.84 / 0.83) — shiny, transparent and mixed-material items
            confuse the model most. When confidence is low, trust your own eyes over the model.
          </p>
        </div>

        <div className="card">
          <h3>Training data &amp; licenses</h3>
          <ul className="source-list">
            {DATASETS.map((d) => (
              <li key={d.name}>
                <a href={d.url} target="_blank" rel="noreferrer">
                  {d.name}
                </a>
                <div className="muted small">{d.detail}</div>
              </li>
            ))}
          </ul>
          <p className="muted small">
            RealWaste is CC BY-NC-SA 4.0 (non-commercial, share-alike) — fine for this hackathon,
            but the organic class would need re-sourcing before any commercial use.
          </p>
          <h3>Prices</h3>
          <p className="muted small">{PRICES.method}</p>
          <p className="muted small">
            Last updated: <strong>{PRICES.last_updated}</strong> · {PRICES.city}. Key sources: Bank
            Sampah Jalatrang Berseka (Nov 2026), Bank Sampah Balai Kota Kendari (Nov 2026), Bank
            Sampah Kenanga Jakarta Utara (Berita Jakarta, Oct 2026). Full per-source tables and all
            36 references are in the project repository.
          </p>
        </div>

        <div className="card">
          <h3>CO₂ factors</h3>
          <p className="muted small">
            {CO2.source} —{' '}
            <a href={CO2.source_url} target="_blank" rel="noreferrer">
              EPA WARM v16 (Dec 2023)
            </a>
            . {CO2.method}
          </p>
          <ul className="caveat-list">
            {CO2.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <h3>What this app does NOT do</h3>
          <ul className="caveat-list">
            <li>No real transactions — values are estimates; the bank sampah sets the final price.</li>
            <li>No collector accounts or pickups booked — matching is informational only.</li>
            <li>No data leaves your device — no account, no analytics, no server.</li>
            <li>
              10 of the 22 banks are single-source entries and 4 have no verified coordinates —
              call ahead before visiting.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
