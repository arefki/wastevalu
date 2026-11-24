# Deploy — WasteValu

The app is a **static export** (`output: 'export'` in `next.config.mjs`).
`npm run build` produces a plain `out/` folder that any static host can serve.
No server, no environment variables, no API keys.

## Option A — GitHub Pages (free, recommended)

The repo owner creates the repository and pushes this folder. Then:

1. In the repo: **Settings → Pages → Build and deployment → GitHub Actions**.
2. Add `.github/workflows/deploy.yml` (included in this folder).
3. Push. The site goes live at `https://<username>.github.io/<repo>/`.

**Important:** for a project page (`<username>.github.io/<repo>/`), the build
must know the sub-path. The workflow sets it automatically from the repo
name (`NEXT_PUBLIC_BASE_PATH=/<repo>`). For a user/org page
(`<username>.github.io`) or a custom domain, leave `NEXT_PUBLIC_BASE_PATH`
empty.

**Post-deploy check (do not skip):** after the first deploy, verify the live
URL returns HTTP 200, the TF.js model loads (`/model/model.json` + 3 shards),
and a sample photo classifies. The local verify script (`scripts/verify.cjs`)
covers the same checks against a local build.

## Option B — any static host (Netlify, Cloudflare Pages, Vercel)

Serve the `out/` folder. If the host serves from a sub-path, set
`NEXT_PUBLIC_BASE_PATH=/<sub-path>` at build time; otherwise leave it empty.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export -> out/
node scripts/verify.cjs   # 23 Playwright checks + screenshots (needs playwright + chromium)
```
