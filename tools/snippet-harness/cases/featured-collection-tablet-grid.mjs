/**
 * featured-collection at desktop with slider--tablet only (no slider--desktop):
 * desktop grid wraps; tablet/mobile sliders stay nowrap.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';
import {itemsPerRowEstimate} from '../lib/grid-layout.mjs';

const SECTION_ID = 'harness-featured-tablet-only';

export default async ({engine}) => {
  const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return (
      source.src ||
      'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png'
    );
  });
  engine.registerFilter('image_tag', (url, ...rest) => {
    const opts = Object.fromEntries(rest.filter(Array.isArray));
    const alt = opts.alt ?? '';
    return `<img src="${url}" alt="${alt}" loading="lazy">`;
  });
  engine.registerFilter('escape', (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;'),
  );
  engine.registerFilter('t', (key) => key);

  const products = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    id: 3000 + n,
    title: `Catalog ${n}`,
    url: `/products/product-${n}`,
    vendor: 'Brand',
    available: true,
    price: 1999 + n,
    compare_at_price: null,
    featured_media: {
      alt: `Product ${n}`,
      src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png',
    },
    metafields: {reviews: {rating: {value: null}, rating_count: 0}},
    selected_or_first_available_variant: {price: 1999 + n, compare_at_price: null, available: true},
  }));

  let items = '';
  for (let i = 0; i < products.length; i += 1) {
    const card = await engine.parseAndRender(
      `{% render 'card-product',
        card_product: product,
        section_id: section_id,
        skip_styles: true,
        show_vendor: true,
        media_aspect_ratio: 'square',
        lazy_load: false
      %}`,
      {product: products[i], section_id: SECTION_ID},
    );
    items += `<li class="grid__item slider__slide">${card}</li>`;
  }

  const sliderCss = ['component-slider.css', 'component-card.css', 'template-collection.css']
    .map((file) => {
      const css = fs.readFileSync(path.join(process.cwd(), 'assets', file), 'utf8');
      return `<style data-source="${file}">${css}</style>`;
    })
    .join('\n');

  return `${sliderCss}
<section class="case" id="zone-featured-tablet-only">
  <h3>featured-collection slider--tablet only (4-col desktop grid)</h3>
  <div class="page-width" style="max-width:1440px;margin:0 auto;padding:0 1.5rem">
    <ul
      class="grid product-grid contains-card contains-card--product grid--4-col-desktop grid--1-col-tablet-down slider slider--tablet grid--peek"
      role="list"
    >
      ${items}
    </ul>
  </div>
</section>`;
};

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'featured-collection-tablet-grid');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});

  try {
    for (const [label, viewport, expectWrap] of [
      ['desktop-1440', {width: 1440, height: 900}, true],
      ['tablet-768', {width: 768, height: 900}, false],
      ['mobile-390', {width: 390, height: 844}, false],
    ]) {
      const page = await browser.newPage({viewport});
      await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
      const result = await page.evaluate(() => {
        const ul = document.querySelector('#zone-featured-tablet-only ul.grid');
        const flexWrap = getComputedStyle(ul).flexWrap;
        const items = [...ul.querySelectorAll('.grid__item')].map((el) => {
          const r = el.getBoundingClientRect();
          return {top: r.top, left: r.left, width: r.width};
        });
        return {
          flexWrap,
          items,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });

      if (expectWrap) {
        if (result.flexWrap === 'nowrap') {
          throw new Error(`[${label}] flexWrap=nowrap, expected wrap at desktop`);
        }
        const perRow = itemsPerRowEstimate(result.items);
        if (perRow < 4) {
          throw new Error(`[${label}] expected 4 per row, got ${perRow}`);
        }
        if (result.scrollWidth > result.clientWidth + 2) {
          throw new Error(
            `[${label}] horizontal overflow scrollWidth=${result.scrollWidth} clientWidth=${result.clientWidth}`,
          );
        }
      } else {
        if (result.flexWrap !== 'nowrap') {
          throw new Error(`[${label}] flexWrap=${result.flexWrap}, expected nowrap`);
        }
        const uniqueTops = [...new Set(result.items.map((it) => Math.round(it.top)))];
        if (uniqueTops.length > 1) {
          throw new Error(`[${label}] slider wrapped to ${uniqueTops.length} rows`);
        }
      }
    }
  } finally {
    await browser.close();
  }
}