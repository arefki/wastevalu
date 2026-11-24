'use client';

import { CATEGORY_LABEL, formatIdr, formatKg, type HistoryItem } from '@/lib/types';

export default function HistoryPanel({
  history,
  onRemove,
  onClear,
}: {
  history: HistoryItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="card">
        <h3>My items</h3>
        <p className="muted">
          Nothing logged yet. Classify a photo or run an estimate, then tap “Log this item” — your
          history lives in this browser only, no account needed.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="history-head">
        <h3>My items · {history.length}</h3>
        <button
          className="btn btn-ghost btn-small"
          onClick={() => {
            if (window.confirm('Clear all logged items? This cannot be undone.')) onClear();
          }}
        >
          Clear all
        </button>
      </div>
      <ul className="history-list">
        {[...history].reverse().map((it) => (
          <li key={it.id} className="history-row">
            <div>
              <strong>{CATEGORY_LABEL[it.category]}</strong>
              {it.subType && <span className="muted small"> · {it.subType}</span>}
              <div className="muted small">
                {new Date(it.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {formatKg(it.weightKg)}
              </div>
            </div>
            <div className="history-values">
              <div>
                <strong>{formatIdr(it.valueIdr)}</strong>
              </div>
              <div className="muted small">{it.co2Kg.toFixed(2)} kg CO₂e avoided</div>
            </div>
            <button
              className="btn btn-ghost btn-small"
              aria-label={`Remove ${CATEGORY_LABEL[it.category]} entry`}
              onClick={() => onRemove(it.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
