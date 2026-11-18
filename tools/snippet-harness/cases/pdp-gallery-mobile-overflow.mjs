/**
 * PDP mobile gallery: doc scrollWidth must not exceed viewport (N3 residual).
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';

export default async function build() {
  const css = fs.readFileSync(path.join(process.cwd(), 'assets', 'section-main-product.css'), 'utf8');
  const items = Array.from({length: 3}, (_, i) => (
    `<li class="product__media-item slider__slide" style="min-width:85vw"><div style="height:200px;background:#ccc">Slide ${i + 1}</div></li>`
  )).join('');
  return `
    <style data-source="section-main-product.css">${css}</style>
    <div class="product__media-wrapper case" id="zone-pdp-gallery">
      <slider-component class="slider-mobile-gutter">
        <ul class="product__media-list slider grid grid--peek list-unstyled" style="display:flex;flex-wrap:nowrap;overflow-x:auto">
          ${items}
        </ul>
      </slider-component>
    </div>`;
}

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'pdp-gallery-mobile-overflow');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const list = document.querySelector('.product__media-list');
      return {
        docW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        listW: list?.getBoundingClientRect().width,
        flexWrap: list ? getComputedStyle(list).flexWrap : null,
      };
    });
    if (result.docW > result.clientW + 1) {
      throw new Error(
        `horizontal overflow docW=${result.docW} clientW=${result.clientW} (list ${result.listW}px)`,
      );
    }
    if (result.flexWrap !== 'nowrap') {
      throw new Error(`gallery flex-wrap ${result.flexWrap}, expected nowrap`);
    }
  } finally {
    await browser.close();
  }
}