'use client';

import { useCallback, useEffect, useState } from 'react';
import Classifier from '@/components/Classifier';
import ValueEstimator from '@/components/ValueEstimator';
import CollectorMap from '@/components/CollectorMap';
import HistoryPanel from '@/components/HistoryPanel';
import ImpactDashboard from '@/components/ImpactDashboard';
import HonestNotes from '@/components/HonestNotes';
import { loadHistory, saveHistory, totals } from '@/lib/storage';
import { METRICS } from '@/lib/data';
import { formatIdr, type HistoryItem } from '@/lib/types';

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const addItem = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const next = [...prev, item];
      saveHistory(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((it) => it.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const t = totals(history);
  const accuracyPct = (METRICS.test_accuracy * 100).toFixed(1);

  return (
    <main>
      <header className="topbar">
        <div className="topbar-inner">
          <a href="#top" className="brand">
            <span className="brand-mark" aria-hidden="true">♻</span> WasteValu
          </a>
          <nav className="topnav" aria-label="Sections">
            <a href="#classify">Classify</a>
            <a href="#value">Prices</a>
            <a href="#map">Map</a>
            <a href="#dashboard">My impact</a>
            <a href="#sources">Sources</a>
          </nav>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="hero-inner">
          <p className="eyebrow">SLAY HACKS 2026 · Jakarta pilot</p>
          <h1>
            Your trash is worth <span className="money">rupiah</span>.
            <br />
            Most people throw it away.
          </h1>
          <p className="hero-sub">
            Snap a photo and WasteValu&apos;s on-device AI tells you what it is, what a bank sampah
            will pay for it, and where to take it — no account, no upload, no server.
          </p>
          <div className="btn-row">
            <a href="#classify" className="btn btn-primary btn-lg">
              Classify a photo →
            </a>
            <a href="#map" className="btn btn-secondary btn-lg">
              Find a bank sampah
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{accuracyPct}%</strong>
              <span>test accuracy · {METRICS.test_n} photos</span>
            </div>
            <div>
              <strong>7</strong>
              <span>waste categories</span>
            </div>
            <div>
              <strong>22</strong>
              <span>Jakarta bank sampah</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>on-device · private</span>
            </div>
          </div>
          {loaded && history.length > 0 && (
            <p className="hero-logged">
              You&apos;ve logged {t.count} item{t.count === 1 ? '' : 's'} worth an estimated{' '}
              <strong>{formatIdr(t.valueIdr)}</strong> —{' '}
              <a href="#dashboard">see your impact →</a>
            </p>
          )}
        </div>
      </section>

      <div className="how-strip">
        <div className="how-step">
          <span className="how-num">1</span>
          <strong>Snap</strong> a photo of one item
        </div>
        <div className="how-step">
          <span className="how-num">2</span>
          <strong>AI classifies</strong> it in your browser
        </div>
        <div className="how-step">
          <span className="how-num">3</span>
          <strong>See its value</strong> in rupiah + CO₂ saved
        </div>
        <div className="how-step">
          <span className="how-num">4</span>
          <strong>Drop it off</strong> at the nearest bank sampah
        </div>
      </div>

      <Classifier onLog={addItem} />
      <ValueEstimator onLog={addItem} />
      <CollectorMap />
      <ImpactDashboard history={history} />
      <section className="section section-tight">
        <HistoryPanel history={history} onRemove={removeItem} onClear={clearHistory} />
      </section>
      <HonestNotes />

      <footer className="footer">
        <div className="footer-inner">
          <p>
            <strong>WasteValu</strong> — built for SLAY HACKS 2026. All AI runs in your browser;
            all data is cited; all limits are stated. Prices: Jakarta bank sampah, Nov 2026. CO₂:
            EPA WARM v16.
          </p>
          <p className="muted small">
            Datasets: TrashNet (MIT) · TrashBox (CC BY 4.0) · RealWaste (CC BY-NC-SA 4.0). Map ©
            OpenStreetMap contributors.
          </p>
        </div>
      </footer>
    </main>
  );
}
