'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { COLLECTORS, COLLECTOR_META } from '@/lib/data';
import { CATEGORIES, CATEGORY_LABEL, type Collector } from '@/lib/types';

const JAKARTA_CENTER: [number, number] = [-6.2088, 106.8456];

const REGIONS = [
  'All regions',
  'Jakarta Utara',
  'Jakarta Pusat',
  'Jakarta Barat',
  'Jakarta Timur',
  'Jakarta Selatan',
] as const;

export default function CollectorMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<Map<number, unknown>>(new Map());
  const [region, setRegion] = useState<string>('All regions');
  const [material, setMaterial] = useState<string>('all');
  const [selected, setSelected] = useState<Collector | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const filtered = useMemo(() => {
    return COLLECTORS.filter((c) => {
      if (region !== 'All regions' && c.region !== region) return false;
      if (material !== 'all' && !c.accepted.includes(material)) return false;
      return true;
    });
  }, [region, material]);

  const withPins = useMemo(
    () => filtered.filter((c) => c.lat !== null && c.lon !== null),
    [filtered],
  );
  const withoutPins = useMemo(
    () => filtered.filter((c) => c.lat === null || c.lon === null),
    [filtered],
  );

  // Initialise the Leaflet map once (client-side only).
  useEffect(() => {
    let cancelled = false;
    let map: import('leaflet').Map | null = null;
    import('leaflet')
      .then((L) => {
        if (cancelled || !mapRef.current || mapInstanceRef.current) return;
        map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(JAKARTA_CENTER, 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        mapInstanceRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        // Leaflet failed to load — the list below still works.
      });
    return () => {
      cancelled = true;
      map?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync markers with the filtered list.
  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled) return;
      const map = mapInstanceRef.current as import('leaflet').Map | null;
      if (!map) return;
      // Clear old markers.
      markersRef.current.forEach((m) => (m as import('leaflet').CircleMarker).remove());
      markersRef.current.clear();
      for (const c of withPins) {
        const marker = L.circleMarker([c.lat as number, c.lon as number], {
          radius: c.verified ? 8 : 6,
          color: c.verified ? '#14532d' : '#b45309',
          weight: 2,
          fillColor: c.verified ? '#22c55e' : '#f59e0b',
          fillOpacity: 0.85,
        }).addTo(map);
        marker.bindPopup(
          `<strong>${escapeHtml(c.name)}</strong><br>${escapeHtml(c.address)}<br><small>${c.verified ? '✓ Verified (2+ sources)' : '⚠ Single source — verify before visiting'}</small>`,
        );
        marker.on('click', () => setSelected(c));
        markersRef.current.set(c.id, marker);
      }
      // Keep the visible pins in view when the filter changes.
      if (withPins.length > 0) {
        const bounds = L.latLngBounds(
          withPins.map((c) => [c.lat as number, c.lon as number] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mapReady, withPins]);

  const focusCollector = (c: Collector) => {
    setSelected(c);
    if (c.lat !== null && c.lon !== null && mapInstanceRef.current) {
      const map = mapInstanceRef.current as import('leaflet').Map;
      map.setView([c.lat, c.lon], 14, { animate: true });
      const marker = markersRef.current.get(c.id) as
        | import('leaflet').CircleMarker
        | undefined;
      marker?.openPopup();
    }
    document.getElementById('collector-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section id="map" className="section">
      <div className="section-head">
        <p className="eyebrow">Step 3 · Drop it off</p>
        <h2>22 bank sampah across Jakarta</h2>
        <p className="section-sub">
          Bank sampah are community waste banks — bring sorted recyclables, get paid per kg.
          Green pins are verified from two or more sources; amber pins come from a single source,
          so call ahead before visiting.
        </p>
      </div>

      <div className="map-filters">
        <label>
          Region:{' '}
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          Accepts:{' '}
          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="all">Any material</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <span className="muted small">
          Showing {filtered.length} of {COLLECTORS.length} · {withPins.length} on the map ·{' '}
          {withoutPins.length} address-only (no verified coordinates)
        </span>
      </div>

      <div className="map-grid">
        <div className="card map-card">
          <div id="collector-map" ref={mapRef} className="leaflet-container" />
          <p className="muted small map-note">
            Map tiles © OpenStreetMap contributors. Pins are street-level where verified; some are
            approximate to the RW/kelurahan — check the address before you go.
          </p>
        </div>

        <div className="card detail-card">
          {selected ? (
            <div>
              <div className="detail-head">
                <h3>{selected.name}</h3>
                <span className={`badge ${selected.verified ? 'badge-ok' : 'badge-warn'}`}>
                  {selected.verified ? '✓ Verified' : '⚠ Single source'}
                </span>
              </div>
              <p className="muted small">
                {selected.type} · {selected.region}
              </p>
              <p>{selected.address}</p>
              <p>
                <strong>Accepts:</strong>{' '}
                {selected.accepted.map((a) => CATEGORY_LABEL[a as keyof typeof CATEGORY_LABEL] ?? a).join(', ')}
              </p>
              {selected.notes && <p className="muted small">{selected.notes}</p>}
              {selected.phone ? (
                <p>
                  <strong>Phone:</strong> {selected.phone}{' '}
                  {!selected.phone_verified && (
                    <span className="muted small">(unverified — from a 2023 brochure)</span>
                  )}
                </p>
              ) : (
                <p className="muted small">
                  No direct phone published — use the DLH help desk below.
                </p>
              )}
              {selected.maps_url && (
                <p>
                  <a href={selected.maps_url} target="_blank" rel="noreferrer">
                    Open in Google Maps →
                  </a>
                </p>
              )}
              {(selected.lat === null || selected.lon === null) && (
                <p className="alert small">
                  No map pin — this bank&apos;s exact coordinates are not published. The address
                  above is the best available location.
                </p>
              )}
              <p className="muted small">Sources: {selected.sources}</p>
              <button className="btn btn-ghost btn-small" onClick={() => setSelected(null)}>
                Close details
              </button>
            </div>
          ) : (
            <div>
              <h3>Pick a bank sampah</h3>
              <p className="muted">
                Click a pin on the map or a name in the list to see its address, accepted materials
                and contact details.
              </p>
              <div className="helpdesk">
                <h4>DLH DKI help desk</h4>
                <p>
                  The city environment agency answers bank-sampah questions and runs a free
                  bulky-waste pickup (citywide).
                </p>
                <p>
                  <strong>WhatsApp:</strong> {COLLECTOR_META.help_desk.phones.join(' / ')}
                  <br />
                  <strong>Email:</strong> {COLLECTOR_META.help_desk.email}
                </p>
                <p className="muted small">{COLLECTOR_META.help_desk.note}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card list-card">
        <h3>All {filtered.length} banks</h3>
        <ul className="collector-list">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                className={`collector-row ${selected?.id === c.id ? 'collector-row-active' : ''}`}
                onClick={() => focusCollector(c)}
              >
                <span className={`pin-dot ${c.verified ? 'pin-ok' : 'pin-warn'}`} aria-hidden="true" />
                <span className="collector-name">{c.name}</span>
                <span className="muted small">{c.region}</span>
                <span className="muted small">
                  {c.lat === null ? 'address only' : `${c.accepted.length} materials`}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {withoutPins.length > 0 && (
          <p className="muted small">
            {withoutPins.map((c) => c.name).join(', ')} — listed without a map pin because their
            exact coordinates are not published. We never guess a pin.
          </p>
        )}
        <p className="muted small">
          Looking for a bank near you that isn&apos;t listed? The city directory has ~2,300 of
          them:{' '}
          <a href="https://banksampah.jakarta.go.id/" target="_blank" rel="noreferrer">
            DLH DKI e-Bank Sampah map
          </a>{' '}
          and{' '}
          <a href="https://zerowaste.id/tipe-minim-sampah/bank-sampah/" target="_blank" rel="noreferrer">
            Zero Waste Indonesia&apos;s map
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
