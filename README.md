# WasteValu — Turn your trash into rupiah with AI

**SLAY HACKS 2026 entry.** Snap a photo of household waste and WasteValu
classifies it with an on-device AI model, estimates its rupiah value from real
Indonesian bank-sampah (community waste bank) prices, and shows the nearest
waste bank on a map — with a personal dashboard of kilograms diverted and CO₂
avoided. Everything runs in the browser: no server, no API key, no account.

Live demo: `https://arefki.github.io/wastevalu/` (after deploy)

## Features

- **Photo classifier** — TensorFlow.js model (MobileNetV2 transfer learning,
  7 classes: plastic, paper, cardboard, metal, glass, organic, e-waste).
  Top-3 predictions with confidence bars. **93.4% test accuracy** on 836
  held-out photos — stated honestly in the app, with the caveat that the test
  photos are clean studio shots and real phone photos score lower.
- **Value estimator** — weight × real bank-sampah buy prices (Jakarta, Nov
  2026), with metal sub-types (besi / aluminium / tembaga), organic intake vs
  compost-output pricing, and per-unit e-waste prices for large appliances.
- **Collector map** — 22 Jakarta bank sampah on a Leaflet map (18 pinned, 4
  address-only — we never guess a pin), filterable by region and material,
  with a detail panel, DLH DKI help desk, and links to the city directory.
- **My items + impact dashboard** — localStorage log (no account); totals for
  items, kg diverted, estimated rupiah, and CO₂ avoided (EPA WARM v16).
- **Sources & limits** — every number is cited; every known weakness is
  stated, including per-class precision/recall and dataset licenses.

## Data & sources

- Prices: median of recent (2025–2026) published bank-sampah price lists
  (`data/prices.json`, 36 references in the research draft).
- Collectors: 22 Jakarta bank sampah, 12 verified from 2+ sources
  (`data/collectors.json`).
- CO₂ factors: U.S. EPA WARM v16 (`data/co2-factors.json`).
- Training data: TrashNet (MIT) · TrashBox (CC BY 4.0) · RealWaste
  (CC BY-NC-SA 4.0 — non-commercial; the organic class would need re-sourcing
  before any commercial use).
- Model: MobileNetV2 + head, trained offline on 5,575 images; exported to
  TF.js (`public/model/`, 9.8 MB). Test metrics in `data/metrics.json`.

## Tech

Next.js 14 (App Router, static export) + React 18 + TypeScript +
@tensorflow/tfjs 4.22 + Leaflet 1.9. Fonts self-hosted. The only external
requests at runtime are OpenStreetMap map tiles.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export -> out/
node scripts/verify.cjs   # 23 Playwright checks + screenshots
```

See [DEPLOY.md](DEPLOY.md) for GitHub Pages deployment.
