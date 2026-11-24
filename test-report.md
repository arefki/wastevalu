# WasteValu — Test Report

**Date:** 2026-11-24 ~22:40 WIB · **Build:** `npm run build` (Next.js 14.2.5, static export) — clean, no errors.
**Verification:** `scripts/verify.cjs` — Playwright (Chromium) against the built `out/` served on localhost.
**Result: 23/23 checks passed** (final run, after all fixes below).

## What was verified

| # | Check | Result |
|---|---|---|
| 1 | Hero headline renders | PASS |
| 2 | Nav has 5 section links | PASS |
| 3 | TF.js model loads in browser (9.8 MB, local) | PASS |
| 4 | Sample plastic photo → Plastic (89% confident) | PASS |
| 5 | Sample cardboard photo → Cardboard | PASS |
| 6 | Sample metal photo → Metal | PASS |
| 7 | Top-3 predictions render with confidence bars | PASS |
| 8 | Value estimate shows Rp (0.5 kg plastic → Rp 1.500) | PASS |
| 9 | Log button confirms | PASS |
| 10 | Dashboard shows 1 logged item | PASS |
| 11 | History row appears | PASS |
| 12 | Metal/aluminium estimate = Rp 12.000 (1 kg) | PASS |
| 13 | Price table has 7 categories | PASS |
| 14 | Leaflet map container renders | PASS |
| 15 | Map shows 18 pins | PASS |
| 16 | Collector list has 22 entries | PASS |
| 17 | Collector detail opens (BSI Berkah Mentari) | PASS |
| 18 | Region filter narrows list (Jakarta Barat → 2) | PASS |
| 19 | Desktop screenshots saved (7) | PASS |
| 20 | Mobile (390px): no horizontal overflow | PASS |
| 21 | Mobile: hero visible | PASS |
| 22 | Mobile screenshot saved | PASS |
| 23 | No page JS errors (excluding OSM tiles) | PASS |

**Subpath check (GitHub Pages):** separate build with `NEXT_PUBLIC_BASE_PATH=/wastevalu`,
served at `/wastevalu/` — model loads, sample classifies as Plastic, zero failed
requests (excluding OSM tiles). 3/3 PASS.

**Known test-environment limits:** headless Chromium on this VM cannot reach
external HTTPS, so OSM map tiles do not load in the test (grey background in
screenshots 03) — the map itself, pins, and popups all work. Tiles will load
on the real web. TF.js falls back to the CPU backend in headless Chromium
(no WebGL); on a real device it uses WebGL and is faster.

## Bugs found by testing + visual review (all fixed)

1. **Mobile horizontal overflow (390px):** the 5-column per-class table forced
   the Sources grid 15px past the viewport. Fixed: `min-width: 0` on grid
   children + scrollable table wrapper + dropped the low-value "n" column.
2. **Anchor clipping:** section eyebrows were half-hidden under the sticky
   topbar on anchor jumps. Fixed: `scroll-margin-top: 70px` on sections.
3. **Duplicate caveat bullets** in the price card (JSON caveats + a hardcoded
   repeat). Fixed: render JSON caveats only.
4. **Builder-facing copy leaked:** a price caveat said "the app must show a
   'last updated' date" and the model note said "see DATA-RESEARCH.md".
   Fixed: both reworded/stripped for users.
5. **Dashboard category value wrapped awkwardly** ("0.5 kg · Rp / 1.500").
   Fixed: wider value column with no-wrap.
6. **Filtered map pins off-screen:** after filtering, pins could sit outside
   the viewport. Fixed: `fitBounds` to visible pins on filter change.

## Screenshots (in `screenshots/`)

00-hero, 01-hero-classifier, 02-value, 03-map, 04-dashboard, 05-sources,
06-mobile-hero. All 7 reviewed visually — no remaining layout defects.
Note: 03-map's grey background is the headless-Chromium tile limitation
above, not an app bug; re-shoot after deploy for the submission set.

## Not yet done (parent / later phases)

- GitHub repo creation + push + Pages deploy (parent handles; workflow file
  ready at `.github/workflows/deploy.yml`).
- Post-deploy live check (HTTP 200 + model files + a live classification).
- Demo video (Remotion + WhisperX) + `submission-text.md` + Devpost submit.
- Eligibility sidebar check at Devpost registration (no Indonesia exclusion
  in any readable text so far).
