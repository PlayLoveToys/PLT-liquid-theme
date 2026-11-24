/**
 * Product card title typography (#13): no uppercase, ~19px desktop scale.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';

export default async function build() {
  const pltCustom = fs.readFileSync(
    path.join(process.cwd(), 'assets', 'a-plt-custom-style.css'),
    'utf8',
  );
  const headlineSm =
    '.theme-headline-sm{font-family:var(--plt-font-display);font-size:var(--plt-text-heading);line-height:1.1;font-weight:700;letter-spacing:-.025em;text-transform:uppercase}';
  return `
    <style data-source="theme-headline-sm">${headlineSm}</style>
    <style data-source="a-plt-custom-style.css">${pltCustom}</style>
    <article class="plt-product-card d-card case" id="zone-product-card-title">
      <h3 class="d-card-title theme-headline-sm plt-media-card__title">
        <a href="#">Womanizer Premium 2</a>
      </h3>
    </article>`;
}

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'product-card-title-typography');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const link = document.querySelector('#zone-product-card-title a');
      if (!link) return {ok: false, reason: 'missing card title link'};
      const s = getComputedStyle(link);
      const fs = parseFloat(s.fontSize);
      return {ok: true, fs, tt: s.textTransform, td: s.textDecorationLine};
    });
    if (!result.ok) throw new Error(result.reason);
    if (result.tt === 'uppercase') {
      throw new Error(`card title still uppercase (${result.tt})`);
    }
    if (result.fs > 22 || result.fs < 16) {
      throw new Error(`card title font-size ${result.fs}px outside ~19px desktop band`);
    }
  } finally {
    await browser.close();
  }
}