// End-to-end check in real Google Chrome (headed, so the OS Hebrew voice is used).
// Usage: npm run dev  (in another terminal), then npm run check:browser, or
//        node scripts/browser-check.mjs [http://localhost:5173]
// Drives a multi-card study session with audio on every card, a practice
// session, the Reference view, phone width and dark mode. Screenshots go to
// scripts/screenshots/.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const APP = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'http://localhost:5173';
// --no-audio: replace speechSynthesis with a silent fake that fires start/end
// events, for machines whose OS audio output is unavailable. This checks the
// app flow only, not real speech.
const AUDIO = !process.argv.includes('--no-audio');
const FAKE_SPEECH = () => {
  const voice = { name: 'Fake Carmit', lang: 'he-IL', localService: true, voiceURI: 'fake-he', default: false };
  let speaking = false;
  const fake = new EventTarget();
  Object.assign(fake, {
    getVoices: () => [voice],
    speak(u) {
      speaking = true;
      setTimeout(() => u.onstart?.({}), 30);
      setTimeout(() => {
        speaking = false;
        u.onend?.({});
      }, 300);
    },
    cancel() {
      speaking = false;
    },
    resume() {},
    get speaking() {
      return speaking;
    },
    pending: false,
    paused: false,
  });
  Object.defineProperty(window, 'speechSynthesis', { value: fake });
  window.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
};
const SHOTS = fileURLToPath(new URL('./screenshots/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (ok, msg) => {
  results.push({ ok, msg });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
};

const browser = await chromium.launch({ channel: 'chrome', headless: false });
const context = await browser.newContext({ viewport: { width: 1100, height: 900 } });
if (!AUDIO) await context.addInitScript(FAKE_SPEECH);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

const speechLog = () => page.evaluate(() => window.__speaker.log.map((e) => ({ ...e })));
const logLength = async () => (await speechLog()).length;

/** Wait until the speech log shows `text` started and ended after index `from`. */
async function waitForSpeech(text, from, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const log = (await speechLog()).slice(from);
    const mine = log.filter((e) => e.text === text);
    if (mine.some((e) => e.type === 'start') && mine.some((e) => e.type === 'end')) return { ok: true, log: mine };
    await page.waitForTimeout(100);
  }
  return { ok: false, log: (await speechLog()).slice(from) };
}

await page.goto(APP);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__speaker?.hasVoice, null, { timeout: 8000 }).catch(() => {});
const voice = await page.textContent('[data-testid=voice-status]');
check(/he[-_]IL/i.test(voice ?? ''), `Hebrew voice detected: ${voice}`);
const fontOk = await page.evaluate(async () => {
  await document.fonts.ready;
  return [...document.fonts].some((f) => f.family.includes('Noto Serif Hebrew') && f.status === 'loaded');
});
check(fontOk, 'Noto Serif Hebrew font loaded');
await page.screenshot({ path: SHOTS + '01-home.png' });

// ---------- Study session: Qal imperfect, all verbs ----------
await page.getByRole('button', { name: /Qal imperfect/ }).click();
const chips = await page.locator('.chip').allTextContents();
check(chips.length === 5, `verb filter chips: ${chips.join(' | ')}`);
await page.getByRole('button', { name: /^Study/ }).click();

const seen = [];
let missedCard = null;
const ROUNDS = 10;
for (let i = 0; i < ROUNDS; i++) {
  const front = (await page.textContent('.card-hebrew')).trim();
  seen.push(front);
  const lang = await page.getAttribute('.card-hebrew', 'lang');
  const dir = await page.getAttribute('.card-hebrew', 'dir');
  if (i === 0) check(lang === 'he' && dir === 'rtl', 'card front has lang="he" dir="rtl"');

  // Audio: alternate keyboard S and clicking the play button.
  const from = await logLength();
  if (i % 2 === 0) await page.keyboard.press('s');
  else await page.click('button.play');
  const sp = await waitForSpeech(front, from);
  check(sp.ok, `card ${i + 1} ${front}: audio started and ended (${sp.log.map((e) => e.type).join(',')})`);

  await page.keyboard.press(' ');
  const backVisible = await page.isVisible('[data-testid=card-back]');
  const back = backVisible ? (await page.textContent('[data-testid=card-back]')).replace(/\s+/g, ' ') : '';
  check(backVisible, `card ${i + 1}: Space reveals answer — ${back.slice(0, 90)}`);
  if (i === 0) await page.screenshot({ path: SHOTS + '02-card-revealed.png' });

  if (i === 1) {
    // Miss this one; it should come back 3 cards later.
    missedCard = front;
    await page.keyboard.press('1');
  } else {
    await page.keyboard.press(i % 3 === 0 ? '3' : '2');
  }
  if (i === 4) {
    const again = (await page.textContent('.card-hebrew')).trim();
    check(again === missedCard, `missed card ${missedCard} came back after 3 cards (got ${again})`);
  }
}

// Rapid re-trigger: S twice in quick succession (cancel → speak) must still play.
{
  const front = (await page.textContent('.card-hebrew')).trim();
  const from = await logLength();
  await page.keyboard.press('s');
  await page.waitForTimeout(80);
  await page.keyboard.press('s');
  const sp = await waitForSpeech(front, from);
  check(sp.ok, `rapid double S on ${front}: second request still plays`);
}

const merged = await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('hebrew-flashcards:v1'));
  return Object.keys(p.progress).length;
});
check(merged >= 8, `progress saved to localStorage for ${merged} cards`);

// Esc back to deck, then home
await page.keyboard.press('Escape');
check(await page.isVisible('.deck-screen'), 'Esc leaves the session to the deck screen');
await page.keyboard.press('Escape');
check(await page.isVisible('.deck-list'), 'Esc again returns home');

// ---------- Merged homograph card ----------
await page.getByRole('button', { name: /Qal imperfect/ }).click();
await page.locator('.chip', { hasText: 'קָטַל' }).click();
await page.getByRole('button', { name: /^Practice all/ }).click();
let foundMerged = false;
for (let i = 0; i < 10; i++) {
  const front = (await page.textContent('.card-hebrew')).trim();
  await page.keyboard.press(' ');
  if (front === 'תִּקְטֹל'.normalize('NFC')) {
    const back = (await page.textContent('[data-testid=card-back]')).replace(/\s+/g, ' ');
    foundMerged = /she will kill/.test(back) && /you \(m\.s\.\) will kill/.test(back);
    check(foundMerged, `merged card תִּקְטֹל lists both parsings: ${back.slice(0, 120)}`);
    await page.screenshot({ path: SHOTS + '03-merged-card.png' });
  }
  await page.keyboard.press('2');
  if (await page.isVisible('[data-testid=session-done]')) break;
}
check(await page.isVisible('[data-testid=session-done]'), 'practice session over the קָטַל chip finishes (8 merged cards)');

// ---------- Practice mode leaves schedule untouched ----------
const before = await page.evaluate(() => localStorage.getItem('hebrew-flashcards:v1'));
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /Possessive suffixes/ }).click();
await page.locator('.chip', { hasText: 'סוּס' }).click();
await page.getByRole('button', { name: /^Practice all/ }).click();
for (let i = 0; i < 4; i++) {
  const front = (await page.textContent('.card-hebrew')).trim();
  const from = await logLength();
  await page.keyboard.press('s');
  const sp = await waitForSpeech(front, from);
  check(sp.ok, `practice card ${i + 1} ${front}: audio ok`);
  await page.keyboard.press(' ');
  await page.keyboard.press(String((i % 3) + 1));
}
const after = await page.evaluate(() => localStorage.getItem('hebrew-flashcards:v1'));
check(before === after, 'practice mode did not change saved progress');
await page.screenshot({ path: SHOTS + '04-practice-possessive.png' });

// ---------- Object suffix deck renders ----------
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /Object suffixes/ }).click();
await page.getByRole('button', { name: /^Study/ }).click();
await page.keyboard.press(' ');
const objBack = (await page.textContent('[data-testid=card-back]')).replace(/\s+/g, ' ');
check(/suffix/.test(objBack), `object-suffix card back: ${objBack.slice(0, 100)}`);
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');

// ---------- Reference ----------
await page.getByRole('button', { name: 'Reference' }).click();
for (const tab of ['Nouns', 'Verbs', 'Possessive suffixes', 'Object suffixes']) {
  await page.getByRole('tab', { name: tab }).click();
  const words = page.locator('main button.spoken');
  const n = await words.count();
  const pick = [0, Math.floor(n / 2), n - 1];
  for (const k of pick) {
    const w = words.nth(k);
    const text = (await w.textContent()).trim();
    const from = await logLength();
    await w.click();
    const sp = await waitForSpeech(text, from);
    check(sp.ok, `Reference/${tab}: click ${text} plays (${n} clickable words)`);
  }
  await page.screenshot({ path: SHOTS + `05-reference-${tab.split(' ')[0].toLowerCase()}.png`, fullPage: true });
}
await page.getByRole('tab', { name: 'Verbs' }).click();
const firstTable = (await page.locator('.paradigm table').first().textContent()).replace(/\s+/g, ' ');
check(firstTable.includes('קָטְלוּ'.normalize('NFC')) && firstTable.includes('3cp'), 'verb paradigm table shows 3cp spanning rows');

check(errors.length === 0, `no console/page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await context.close();

// ---------- Phone width + dark mode ----------
const phone = await browser.newContext({ viewport: { width: 375, height: 760 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
if (!AUDIO) await phone.addInitScript(FAKE_SPEECH);
const p2 = await phone.newPage();
await p2.goto(APP);
const overflow = async () => p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check((await overflow()) <= 0, 'phone width: no horizontal page scroll on home');
const bg = await p2.evaluate(() => getComputedStyle(document.body).backgroundColor);
check(bg === 'rgb(21, 23, 26)', `dark mode background applied (${bg})`);
await p2.screenshot({ path: SHOTS + '06-phone-dark-home.png' });
await p2.getByRole('button', { name: /Qal perfect/ }).click();
await p2.getByRole('button', { name: /^Study/ }).click();
await p2.getByRole('button', { name: /Show answer/ }).click();
check((await overflow()) <= 0, 'phone width: no horizontal page scroll on a card');
await p2.screenshot({ path: SHOTS + '07-phone-dark-card.png' });
await p2.getByRole('button', { name: 'Reference' }).click();
await p2.getByRole('tab', { name: 'Possessive suffixes' }).click();
check((await overflow()) <= 0, 'phone width: no horizontal page scroll on Reference (tables scroll inside their box)');
await p2.screenshot({ path: SHOTS + '08-phone-dark-reference.png' });
await phone.close();

const light = await browser.newContext({ viewport: { width: 375, height: 760 }, colorScheme: 'light' });
if (!AUDIO) await light.addInitScript(FAKE_SPEECH);
const p3 = await light.newPage();
await p3.goto(APP);
await p3.getByRole('button', { name: /Basic nouns/ }).click();
await p3.getByRole('button', { name: /^Study/ }).click();
await p3.keyboard.press(' ');
await p3.screenshot({ path: SHOTS + '09-phone-light-noun.png' });
await light.close();

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
