/**
 * Footer newsletter field: production-like height and dark background (#14).
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';

export default async function build() {
  const footerCss = fs.readFileSync(path.join(process.cwd(), 'assets', 'section-footer.css'), 'utf8');
  const baseSnippet = fs.readFileSync(path.join(process.cwd(), 'assets', 'base.css'), 'utf8').slice(0, 2500);
  return `
    <style data-source="base-snippet">${baseSnippet}</style>
    <style data-source="section-footer.css">${footerCss}</style>
    <section class="case" id="zone-footer-newsletter">
      <div class="footer-block__newsletter">
        <form class="footer__newsletter newsletter-form">
          <div class="newsletter-form__field-wrapper">
            <div class="field">
              <input id="NewsletterForm--footer" type="email" name="contact[email]" class="field__input d-input" placeholder="Email" />
              <label class="field__label" for="NewsletterForm--footer">Email</label>
            </div>
          </div>
        </form>
      </div>
    </section>`;
}

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'footer-newsletter-input');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    for (const width of [390, 768, 1440]) {
      const page = await browser.newPage({viewport: {width, height: 800}});
      await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});
      const result = await page.evaluate(() => {
        const input = document.querySelector('#zone-footer-newsletter .field__input');
        if (!input) return {ok: false, reason: 'missing footer newsletter input'};
        const r = input.getBoundingClientRect();
        const s = getComputedStyle(input);
        return {
          ok: true,
          w: r.width,
          h: r.height,
          bg: s.backgroundColor,
          border: s.borderWidth,
        };
      });
      if (!result.ok) throw new Error(result.reason);
      if (result.h < 60) {
        throw new Error(`newsletter input height ${result.h.toFixed(1)}px at viewport ${width} (expected ~72px)`);
      }
      if (result.w < 200 && width >= 390) {
        throw new Error(`newsletter input width ${result.w.toFixed(1)}px too narrow at ${width}`);
      }
    }
  } finally {
    await browser.close();
  }
}