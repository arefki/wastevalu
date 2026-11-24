'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyImage, loadModel } from '@/lib/classify';
import { estimateValue } from '@/lib/value';
import { newId } from '@/lib/storage';
import { METRICS } from '@/lib/data';
import { CATEGORY_LABEL, formatIdr, formatKg, type HistoryItem, type Prediction } from '@/lib/types';

type ModelState = 'idle' | 'loading' | 'ready' | 'error';

const SAMPLE_IMAGES: { label: string; file: string }[] = [
  { label: 'Plastic bottle', file: 'sample-plastic.jpg' },
  { label: 'Cardboard box', file: 'sample-cardboard.jpg' },
  { label: 'Aluminium can', file: 'sample-metal.jpg' },
];

export default function Classifier({ onLog }: { onLog: (item: HistoryItem) => void }) {
  const [modelState, setModelState] = useState<ModelState>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [predictions, setPredictions] = useState<Prediction[] | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState(0.5);
  const [logged, setLogged] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load the model in the background as soon as the page mounts.
  useEffect(() => {
    let cancelled = false;
    setModelState('loading');
    loadModel()
      .then(() => {
        if (!cancelled) setModelState('ready');
      })
      .catch(() => {
        if (!cancelled) setModelState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reset = useCallback(() => {
    setPredictions(null);
    setError(null);
    setLogged(false);
  }, []);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        setError('That file is not an image. Please choose a photo (JPG, PNG, WebP).');
        return;
      }
      reset();
      setImageName(file.name);
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    },
    [reset],
  );

  const handleSample = useCallback(
    (file: string, label: string) => {
      reset();
      setImageName(`${label} (sample photo)`);
      setImageUrl(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/samples/${file}`);
    },
    [reset],
  );

  const runClassify = useCallback(async () => {
    const img = imgRef.current;
    if (!img) return;
    setClassifying(true);
    setError(null);
    try {
      const result = await classifyImage(img);
      setPredictions(result);
    } catch (e) {
      console.error(e);
      setError('The model failed to run on this photo. Try a different image, or reload the page.');
    } finally {
      setClassifying(false);
    }
  }, []);

  const top = predictions?.[0] ?? null;
  const estimate = top ? estimateValue(top.category, weightKg, null) : null;

  const handleLog = useCallback(() => {
    if (!top || !estimate) return;
    onLog({
      id: newId(),
      date: new Date().toISOString(),
      category: top.category,
      subType: null,
      weightKg,
      valueIdr: estimate.valueIdr,
      co2Kg: estimate.co2Kg,
    });
    setLogged(true);
  }, [top, estimate, weightKg, onLog]);

  const accuracyPct = (METRICS.test_accuracy * 100).toFixed(1);

  return (
    <section id="classify" className="section">
      <div className="section-head">
        <p className="eyebrow">Step 1 · Snap a photo</p>
        <h2>What is it worth?</h2>
        <p className="section-sub">
          The AI runs entirely in your browser — your photo never leaves this device. No account,
          no upload, no server.
        </p>
      </div>

      <div className="classifier-grid">
        <div className="card photo-card">
          <div className="photo-area">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={imageUrl}
                alt={imageName || 'Waste item to classify'}
                className="photo-preview"
                crossOrigin="anonymous"
                onLoad={() => {
                  if (modelState === 'ready' && !predictions && !classifying) void runClassify();
                }}
              />
            ) : (
              <div className="photo-empty">
                <div className="photo-empty-icon" aria-hidden="true">📷</div>
                <p>
                  <strong>Take or upload a photo</strong> of one waste item — a bottle, a box, a
                  can, a cable.
                </p>
                <p className="muted small">Clear, well-lit photos work best. One item per photo.</p>
              </div>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => cameraInputRef.current?.click()}>
              Take a photo
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Upload a photo
            </button>
          </div>

          <div className="sample-row">
            <span className="muted small">No photo handy? Try a sample:</span>
            {SAMPLE_IMAGES.map((s) => (
              <button
                key={s.file}
                className="chip"
                onClick={() => handleSample(s.file, s.label)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="model-status" role="status">
            {modelState === 'loading' && '⏳ Loading the AI model… (9.8 MB, once — then it works offline)'}
            {modelState === 'ready' && `✅ AI model ready · ${accuracyPct}% test accuracy on ${METRICS.test_n} held-out photos`}
            {modelState === 'error' && '⚠️ The AI model could not load. Check your connection and reload the page.'}
            {modelState === 'idle' && 'AI model not loaded yet.'}
          </p>
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="card result-card">
          {!predictions && !classifying && (
            <div className="result-empty">
              <h3>Your result appears here</h3>
              <p className="muted">
                The model predicts one of 7 categories — plastic, paper, cardboard, metal, glass,
                organic, e-waste — with a confidence score for each.
              </p>
              <p className="muted small">
                Honest note: the model was tested on clean studio photos. Real phone photos of
                messy, dirty or mixed waste will score lower — see{' '}
                <a href="#sources">Sources &amp; limits</a>.
              </p>
            </div>
          )}
          {classifying && (
            <div className="result-empty">
              <h3>Classifying…</h3>
              <p className="muted">Running the model on your photo, on this device.</p>
              <div className="spinner" aria-hidden="true" />
            </div>
          )}
          {predictions && top && (
            <div>
              <p className="eyebrow">Top prediction</p>
              <h3 className="result-title">
                {CATEGORY_LABEL[top.category]}{' '}
                <span className="confidence">{(top.probability * 100).toFixed(0)}% confident</span>
              </h3>
              <div className="top3">
                {predictions.slice(0, 3).map((p) => (
                  <div key={p.category} className="top3-row">
                    <span className="top3-label">{CATEGORY_LABEL[p.category]}</span>
                    <div className="bar">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.max(p.probability * 100, 2)}%` }}
                      />
                    </div>
                    <span className="top3-pct">{(p.probability * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <div className="weight-block">
                <label htmlFor="cls-weight">
                  Estimated weight: <strong>{formatKg(weightKg)}</strong>
                </label>
                <input
                  id="cls-weight"
                  type="range"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={weightKg}
                  onChange={(e) => {
                    setWeightKg(Number(e.target.value));
                    setLogged(false);
                  }}
                />
                <div className="range-labels">
                  <span>100 g</span>
                  <span>10 kg</span>
                </div>
              </div>

              {estimate && (
                <div className="value-box">
                  <div className="value-main">{formatIdr(estimate.valueIdr)}</div>
                  <div className="muted small">
                    estimated payout · {estimate.unitLabel} · avoids ≈ {estimate.co2Kg.toFixed(2)}{' '}
                    kg CO₂e
                  </div>
                  {estimate.note && <div className="muted small">⚠️ {estimate.note}</div>}
                </div>
              )}

              <button
                className="btn btn-primary btn-block"
                onClick={handleLog}
                disabled={logged}
              >
                {logged ? '✓ Logged to My items' : 'Log this item'}
              </button>
              {logged && (
                <p className="muted small center">
                  Saved on this device only — see <a href="#dashboard">My impact</a>.
                </p>
              )}
              <button
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setImageUrl(null);
                  setImageName('');
                  reset();
                }}
              >
                Classify another item
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
