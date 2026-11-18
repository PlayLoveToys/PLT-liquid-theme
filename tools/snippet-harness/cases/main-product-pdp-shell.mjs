/**
 * PDP shell: `.product.grid.grid--2-col-tablet`, galería móvil (14 slides), ATC y share.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';
import {countDistinctTops} from '../lib/grid-layout.mjs';

const SECTION_ID = 'harness-pdp-shell';

export default async ({engine}) => {
  engine.registerFilter('t', (key) => key);
  engine.registerFilter('escape', (s) => String(s).replace(/"/g, '&quot;'));

  const assetCss = ['section-main-product.css', 'component-slider.css', 'component-deferred-media.css']
    .map((file) => {
      const css = fs.readFileSync(path.join(process.cwd(), 'assets', file), 'utf8');
      return `<style data-source="${file}">${css}</style>`;
    })
    .join('\n');

  const slides = Array.from({length: 14}, (_, i) => `<li
    class="product__media-item grid__item slider__slide${i === 0 ? ' is-active' : ''}"
    style="min-height:160px;background:linear-gradient(135deg,#eee,#ddd)"
  ><span>Media ${i + 1}</span></li>`).join('');

  const gallery = `<slider-component class="slider-mobile-gutter">
    <ul id="Slider-Gallery-${SECTION_ID}" class="product__media-list contains-media grid grid--peek list-unstyled slider slider--mobile" role="list">${slides}</ul>
  </slider-component>`;

  const share = await engine.parseAndRender(
    `{% render 'share-button', section: section, share_link: share_link %}`,
    {
      section: {id: SECTION_ID, settings: {}},
      share_link: 'https://example.com/products/demo',
    },
  );

  const atc = `<form id="product-form-${SECTION_ID}">
    <button type="submit" name="add" class="product-form__submit button button--full-width button--primary">
      Add to cart
    </button>
  </form>`;

  return `${assetCss}
<section class="case" id="zone-main-product-pdp">
  <h3>PDP shell (14 media + ATC + share)</h3>
  <div class="page-width" style="max-width:var(--page-width,120rem);margin:0 auto;padding:0 1.5rem">
    <div class="product product--medium product--left product--stacked product--mobile-show grid grid--1-col grid--2-col-tablet">
      <div class="grid__item product__media-wrapper">${gallery}</div>
      <div class="grid__item product__info-wrapper">
        <h1 class="h2">Harness PDP product</h1>
        ${share}
        <div class="product-form" style="margin-top:1.5rem">${atc}</div>
      </div>
    </div>
  </div>
</section>`;
};

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'main-product-pdp-shell');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});

  try {
    const page1440 = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page1440.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    const desktop = await page1440.evaluate(() => {
      const row = document.querySelector('#zone-main-product-pdp .product.grid');
      const media = document.querySelector('.product__media-wrapper');
      const info = document.querySelector('.product__info-wrapper');
      return {
        display: getComputedStyle(row).display,
        mediaTop: media?.getBoundingClientRect().top,
        infoTop: info?.getBoundingClientRect().top,
        mediaW: media?.getBoundingClientRect().width,
        infoW: info?.getBoundingClientRect().width,
      };
    });
    if (desktop.display !== 'flex') {
      throw new Error(`PDP desktop display=${desktop.display}, expected flex`);
    }
    if (Math.abs((desktop.mediaTop ?? 0) - (desktop.infoTop ?? 0)) > 40) {
      throw new Error('PDP desktop: media and info not side-by-side (grid--2-col-tablet)');
    }
    if ((desktop.mediaW ?? 0) < 300 || (desktop.infoW ?? 0) < 300) {
      throw new Error(
        `PDP desktop column widths too narrow: media=${desktop.mediaW?.toFixed(0)} info=${desktop.infoW?.toFixed(0)}`,
      );
    }

    const page390 = await browser.newPage({viewport: {width: 390, height: 844}});
    await page390.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    const mobile = await page390.evaluate(() => {
      const list = document.querySelector('.product__media-list.slider.slider--mobile');
      const slides = list ? [...list.querySelectorAll('.slider__slide')] : [];
      const lastSlide = slides[slides.length - 1];
      const atc = document.querySelector('button[name="add"]');
      const shareFallback = document.querySelector('.share-button__fallback');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        galleryDisplay: list ? getComputedStyle(list).display : null,
        flexWrap: list ? getComputedStyle(list).flexWrap : null,
        slideTops: slides.map((el) => el.getBoundingClientRect().top),
        lastSlideBottom: lastSlide?.getBoundingClientRect().bottom ?? 0,
        atcY: atc?.getBoundingClientRect().top ?? 0,
        shareFallbackW: shareFallback?.getBoundingClientRect().width ?? 0,
        detailsOpen: document.querySelector('share-button details')?.open ?? false,
      };
    });

    if (mobile.galleryDisplay !== 'flex') {
      throw new Error(`mobile gallery display=${mobile.galleryDisplay}, expected flex`);
    }
    if (mobile.flexWrap !== 'nowrap') {
      throw new Error(`mobile gallery flexWrap=${mobile.flexWrap}, expected nowrap`);
    }
    if (countDistinctTops(mobile.slideTops.map((top) => ({top}))) > 1) {
      throw new Error('mobile gallery: slides wrapped to multiple rows');
    }
    const maxAtcY = mobile.lastSlideBottom + 400;
    if (mobile.atcY > maxAtcY) {
      throw new Error(
        `ATC y=${mobile.atcY.toFixed(0)} too far below gallery end ${mobile.lastSlideBottom.toFixed(0)} (stacked gallery regression)`,
      );
    }
    if (mobile.scrollWidth > mobile.clientWidth + 2) {
      throw new Error(
        `horizontal overflow: scrollWidth=${mobile.scrollWidth} clientWidth=${mobile.clientWidth} (share fallback ~${mobile.shareFallbackW.toFixed(0)}px if open)`,
      );
    }
  } finally {
    await browser.close();
  }
}