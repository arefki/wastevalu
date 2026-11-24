// WasteValu verification: serves out/ on localhost and runs 20 checks in
// headless Chromium (Playwright). External HTTPS is blocked in this VM's
// headless Chromium, so OSM map tiles are expected NOT to load — the map
// itself (container + markers) is what we verify.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'out');
const SHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const PORT = 8137;
const BASE = `http://127.0.0.1:${PORT}`;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

(async () => {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    cwd: OUT_DIR,
    stdio: 'ignore',
  });
  await new Promise((r) => setTimeout(r, 1500));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
    // 1. Hero renders
    const h1 = await page.locator('h1').first().textContent();
    check('hero headline renders', /Your trash is worth/.test(h1 || ''), h1?.trim().slice(0, 60));
    // 2. Nav links present
    check('nav has 5 section links', (await page.locator('.topnav a').count()) === 5);
    // 3. Model loads (status flips to ready)
    try {
      await page.waitForSelector('.model-status:has-text("AI model ready")', { timeout: 90000 });
      check('TF.js model loads in browser', true);
    } catch {
      const status = await page.locator('.model-status').textContent();
      check('TF.js model loads in browser', false, status || 'no status text');
    }
    // 4. Sample classification: plastic bottle -> Plastic
    await page.click('button.chip:has-text("Plastic bottle")');
    try {
      await page.waitForSelector('.result-title', { timeout: 60000 });
      const title = await page.locator('.result-title').textContent();
      check('sample plastic photo classifies as Plastic', /Plastic/.test(title || ''), title?.trim());
    } catch {
      check('sample plastic photo classifies as Plastic', false, 'no result title appeared');
    }
    // 4b. Cardboard sample -> Cardboard
    await page.click('button.chip:has-text("Cardboard box")');
    try {
      await page.waitForFunction(
        () => document.querySelector('.result-title')?.textContent?.includes('Cardboard'),
        { timeout: 60000 },
      );
      check('sample cardboard photo classifies as Cardboard', true);
    } catch {
      const title = await page.locator('.result-title').textContent().catch(() => '');
      check('sample cardboard photo classifies as Cardboard', false, title || 'no result');
    }
    // 4c. Metal sample -> Metal
    await page.click('button.chip:has-text("Aluminium can")');
    try {
      await page.waitForFunction(
        () => document.querySelector('.result-title')?.textContent?.includes('Metal'),
        { timeout: 60000 },
      );
      check('sample metal photo classifies as Metal', true);
    } catch {
      const title = await page.locator('.result-title').textContent().catch(() => '');
      check('sample metal photo classifies as Metal', false, title || 'no result');
    }
    // Back to plastic for the log flow
    await page.click('button.chip:has-text("Plastic bottle")');
    await page.waitForFunction(
      () => document.querySelector('.result-title')?.textContent?.includes('Plastic'),
      { timeout: 60000 },
    );
    // 5. Top-3 bars render
    check('top-3 predictions render', (await page.locator('.top3-row').count()) === 3);
    // 6. Value box shows rupiah
    const valueText = await page.locator('.value-box .value-main').first().textContent();
    check('value estimate shows Rp', /Rp\s[\d.]+/.test(valueText || ''), valueText?.trim());
    // 7. Log item -> dashboard count
    await page.click('button:has-text("Log this item")');
    await page.waitForTimeout(500);
    const logged = await page.locator('button:has-text("Logged to My items")').count();
    check('log button confirms', logged === 1);
    // 8. Dashboard totals update
    const statItems = await page.locator('#dashboard .stat-card').first().locator('.stat-value').textContent();
    check('dashboard shows 1 logged item', statItems?.trim() === '1', statItems?.trim());
    // 9. History row appears
    check('history row appears', (await page.locator('.history-row').count()) === 1);
    // 10. Estimator: metal -> aluminium changes price
    await page.click('#value .chip:has-text("Metal")');
    await page.click('#value button:has-text("Aluminium")');
    const metalValue = await page.locator('#value .value-box .value-main').textContent();
    check('metal/aluminium estimate = Rp 12.000 (1 kg)', /12\.000/.test(metalValue || ''), metalValue?.trim());
    // 11. Price table has 7 rows
    check('price table has 7 categories', (await page.locator('.price-table tbody tr').count()) === 7);
    // 12. Map container renders
    const mapBox = await page.locator('#collector-map').boundingBox();
    check('Leaflet map container renders', !!mapBox && mapBox.height > 300, mapBox ? `${mapBox.width}x${mapBox.height}` : 'no box');
    // 13. Map markers (circle markers render as SVG paths)
    await page.waitForTimeout(2000);
    const markerCount = await page.locator('#collector-map .leaflet-interactive').count();
    check('map shows 18 pins', markerCount === 18, `${markerCount} markers`);
    // 14. Collector list has 22 rows
    check('collector list has 22 entries', (await page.locator('.collector-row').count()) === 22);
    // 15. Click a collector -> detail panel
    await page.click('.collector-row:has-text("BSI Berkah Mentari")');
    await page.waitForTimeout(500);
    const detail = await page.locator('.detail-card h3').textContent();
    check('collector detail opens', detail === 'BSI Berkah Mentari', detail || '');
    // 16. Region filter works
    await page.selectOption('.map-filters select', { index: 0 }); // reset region (All)
    await page.locator('.map-filters select').first().selectOption('Jakarta Barat');
    await page.waitForTimeout(500);
    const filteredCount = await page.locator('.collector-row').count();
    check('region filter narrows list', filteredCount === 2, `${filteredCount} rows (expect 2: BSI Satu Hati, Emak PRJ-16)`);

    // Screenshots (desktop)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '00-hero.png') });
    await page.goto(BASE + '/#classify', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-hero-classifier.png') });
    await page.goto(BASE + '/#value', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS_DIR, '02-value.png') });
    await page.goto(BASE + '/#map', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS_DIR, '03-map.png') });
    await page.goto(BASE + '/#dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS_DIR, '04-dashboard.png') });
    await page.goto(BASE + '/#sources', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS_DIR, '05-sources.png') });
    check('desktop screenshots saved', fs.readdirSync(SHOTS_DIR).filter((f) => f.endsWith('.png')).length >= 6);

    // 17-19. Mobile viewport
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check('mobile: no horizontal overflow', !overflow);
    const heroVisible = await mobile.locator('h1').isVisible();
    check('mobile: hero visible', heroVisible);
    await mobile.screenshot({ path: path.join(SHOTS_DIR, '06-mobile-hero.png') });
    check('mobile screenshot saved', fs.existsSync(path.join(SHOTS_DIR, '06-mobile-hero.png')));
    await mobile.close();

    // 20. No page errors (excluding OSM tile failures, which are expected offline)
    const realErrors = errors.filter((e) => !/tile\.openstreetmap|Failed to load resource/i.test(e));
    check('no page JS errors (excluding OSM tiles)', realErrors.length === 0, realErrors.slice(0, 2).join(' | '));
  } finally {
    await browser.close();
    server.kill();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => {
  console.error('SCRIPT ERROR', e);
  process.exit(2);
});
