/**
 * Collection sanity shell: facets-vertical + drawer facets bar (not Dawn sidebar flex).
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';
import {itemsPerRowEstimate} from '../lib/grid-layout.mjs';

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return source.src || '';
  });
  engine.registerFilter('image_tag', (url, ...rest) => {
    const opts = Object.fromEntries(rest.filter(Array.isArray));
    const alt = opts.alt ?? '';
    return `<img src="${url}" alt="${alt}" loading="lazy">`;
  });
  engine.registerFilter('t', (key) => key);

  const sortOptions = [
    {name: 'Featured', value: 'manual'},
    {name: 'Best selling', value: 'best-selling'},
  ];

  const sort = await engine.parseAndRender(
    `{% render 'plt-sort-select', options: sortOptions, current: 'manual', filters: empty_filters, action: '/collections/all', label: 'Sort', script_url: 'none' %}`,
    {sortOptions, empty_filters: []},
  );

  const cards = Array.from(
    {length: 8},
    (_, i) =>
      `<li class="grid__item" style="min-height:120px;border:1px solid rgba(0,0,0,.12);background:#f8f4ef">Card ${i + 1}</li>`,
  );

  const facetCss = ['component-facets.css', 'component-card.css', 'template-collection.css']
    .map((file) => {
      const css = fs.readFileSync(path.join(process.cwd(), 'assets', file), 'utf8');
      return `<style data-source="${file}">${css}</style>`;
    })
    .join('\n');

  const facetsBar = `
    <aside aria-label="Filters" class="facets-wrapper w-full" id="main-collection-filters">
      <div class="sticky top-4 flex flex-wrap items-center justify-between gap-3 border-b px-4 pb-3" style="min-height:45px">
        <button type="button" class="d-btn">Filter and sort</button>
        <p class="theme-meta m-0">8 products</p>
      </div>
    </aside>
  `;

  const harnessVars = `
    <style data-harness-vars>
      :root {
        --grid-desktop-horizontal-spacing: 16px;
        --grid-desktop-vertical-spacing: 20px;
        --grid-mobile-horizontal-spacing: 8px;
        --grid-mobile-vertical-spacing: 12px;
      }
    </style>
  `;

  return `${facetCss}${harnessVars}
<section class="case" id="zone-collection-facets">
  <h3>Collection facets-vertical (sanity)</h3>
  <div
    id="product-grid-container"
    class="facets-vertical page-width w-full max-w-screen-2xl mx-auto"
    style="max-width:1440px;margin:0 auto;padding:0 1.5rem"
  >
    <div class="facets facets-vertical-sort c-small-screen-hide screen-hide" id="FacetSortForm">
      ${sort}
    </div>
    ${facetsBar}
    <div class="product-grid-container w-full" id="ProductGridContainer">
      <div class="collection">
        <ul
          class="grid product-grid contains-card contains-card--product grid--2-col-tablet-down grid--4-col-desktop"
          role="list"
        >
          ${cards.join('\n')}
        </ul>
      </div>
    </div>
  </div>
</section>`;
};

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'collection-facets-layout');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});

  try {
    for (const [label, viewport] of [
      ['desktop-1440', {width: 1440, height: 900}],
      ['tablet-768', {width: 768, height: 900}],
    ]) {
      const page = await browser.newPage({viewport});
      await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
      const result = await page.evaluate(() => {
        const container = document.getElementById('product-grid-container');
        const sortForm = document.getElementById('FacetSortForm');
        const aside = document.getElementById('main-collection-filters');
        const grid = document.querySelector('#ProductGridContainer ul.grid');
        const items = [...document.querySelectorAll('#ProductGridContainer .grid__item')].map((el) => {
          const r = el.getBoundingClientRect();
          return {top: r.top, left: r.left, width: r.width};
        });
        const productGrid = document.getElementById('ProductGridContainer');
        return {
          containerDisplay: getComputedStyle(container).display,
          sortHeight: sortForm.getBoundingClientRect().height,
          sortDisplay: getComputedStyle(sortForm).display,
          asideHeight: aside.getBoundingClientRect().height,
          items,
          gridWidth: grid?.getBoundingClientRect().width ?? 0,
          productGridWidth: productGrid?.getBoundingClientRect().width ?? 0,
          containerWidth: container.getBoundingClientRect().width,
        };
      });

      if (result.containerDisplay !== 'block') {
        throw new Error(`[${label}] facets-vertical display=${result.containerDisplay}, expected block`);
      }
      if (result.sortHeight > 1) {
        throw new Error(`[${label}] FacetSortForm height=${result.sortHeight}px, expected hidden (≈0)`);
      }
      if (result.productGridWidth < result.containerWidth * 0.85) {
        throw new Error(
          `[${label}] product grid width ${result.productGridWidth.toFixed(0)}px squeezed (container ${result.containerWidth.toFixed(0)}px)`,
        );
      }
      const perRow = itemsPerRowEstimate(result.items);
      const cardWidth = result.items[0]?.width ?? 0;
      const minPerRow = label === 'desktop-1440' ? 3 : 1;
      if (perRow < minPerRow) {
        throw new Error(`[${label}] expected ≥${minPerRow} cards per row, got ${perRow}`);
      }
      if (cardWidth < 200) {
        throw new Error(`[${label}] product card width=${cardWidth.toFixed(1)}px, expected ≥200px`);
      }
      if (result.asideHeight > 120) {
        throw new Error(`[${label}] facets aside height=${result.asideHeight}px, expected compact bar`);
      }
    }
  } finally {
    await browser.close();
  }
}