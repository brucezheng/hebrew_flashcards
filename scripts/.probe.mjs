import { chromium } from 'playwright';
const words = ['קָטַל','יִקְטֹל','תִּקְטְלִי','שָׁמַר','יִשְׁמֹר','כָּתַב','יִכְתֹּב','זָכַר'];
for (let run = 0; run < 3; run++) {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:5179');
  await page.waitForFunction(() => window.__speaker?.hasVoice, null, { timeout: 8000 });
  await page.click('body');
  const out = [];
  for (const w of words) {
    const from = await page.evaluate(() => window.__speaker.log.length);
    await page.evaluate((w) => window.__speaker.speak(w), w);
    const t0 = Date.now(); let res = 'timeout';
    while (Date.now() - t0 < 7000) {
      const log = await page.evaluate((f) => window.__speaker.log.slice(f).map(e => e.type + (e.detail ? ':' + e.detail : '')), from);
      if (log.includes('end')) { res = log.join(','); break; }
      await page.waitForTimeout(100);
      if (Date.now() - t0 >= 6900) res = 'TIMEOUT ' + log.join(',');
    }
    out.push(`${w}: ${res} (${Date.now()-t0}ms)`);
  }
  console.log(`run ${run}\n  ` + out.join('\n  '));
  await browser.close();
}
