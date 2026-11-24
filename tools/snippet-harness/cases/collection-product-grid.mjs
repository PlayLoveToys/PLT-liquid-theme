/**
 * Harness: collection PDP grid shell (main-collection.liquid pattern) with DS card-product cells.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';
import {itemsPerRowEstimate} from '../lib/grid-layout.mjs';

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const media = (alt = 'Product photo') => ({
  alt,
  src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png',
  width: 600,
  height: 600,
});

const baseProduct = {
  id: 1001,
  title: 'Cheesecake vibrator',
  type: 'Vibrators',
  url: '/products/cheesecake',
  vendor: 'Play Love Toys',
  available: true,
  price: 2499,
  price_min: 2499,
  price_max: 2499,
  compare_at_price: null,
  price_varies: false,
  compare_at_price_varies: false,
  quantity_price_breaks_configured: false,
  featured_media: media(),
  selected_or_first_available_variant: {
    price: 2499,
    compare_at_price: null,
    available: true,
    unit_price: null,
    unit_price_measurement: null,
  },
  metafields: {reviews: {rating: {value: null}, rating_count: 0}},
};

const collectionFlags = {
  show_vendor: true,
  show_type: true,
  collection_grid_free_badge: true,
  show_savings_percentage: true,
  media_aspect_ratio: 'square',
  pad_color: 'ffffff',
};

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (source, ...args) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return source.src || source.url || '';
  });
  engine.registerFilter('image_tag', (url, ...rest) => {
    const opts = Object.fromEntries(rest.filter(Array.isArray));
    const alt = opts.alt ?? '';
    const loading = opts.loading ?? 'lazy';
    const style = opts.style ?? '';
    return `<img src="${url}" alt="${alt}" loading="${loading}"${style ? ` style="${style}"` : ''}>`;
  });
  const data = {
    settings: {currency_code_enabled: false, card_style: 'card'},
    section: {id: 'harness-collection-grid'},
    products: Array.from({length: 8}, (_, i) => ({
      ...baseProduct,
      id: 1001 + i,
      title: `Catalog item ${i + 1}`,
      type: i % 2 === 0 ? 'Vibrators' : 'Accessories',
      price: 1999 + i * 100,
      price_min: 1999 + i * 100,
      selected_or_first_available_variant: {
        ...baseProduct.selected_or_first_available_variant,
        price: 1999 + i * 100,
      },
    })),
  };

  const cards = [];
  for (const product of data.products) {
    cards.push(
      await engine.parseAndRender(
        `{% render 'card-product',
          card_product: product,
          show_vendor: true,
          show_type: true,
          collection_grid_free_badge: true,
          show_savings_percentage: true,
          media_aspect_ratio: 'square',
          pad_color: 'ffffff'
        %}`,
        {product, settings: data.settings, section: data.section, ...collectionFlags},
      ),
    );
  }

  /* Stack #38 badge styles (harness preview only; production CSS comes from merged #37/#39) */
  const stackPreviewCss = `
    .plt-product-card__media-link { position: relative; display: block; }
    .plt-product-card__collection-free-badge {
      position: absolute; top: 0.5rem; left: 0.5rem; z-index: 1; pointer-events: none;
      border: 0; background-color: hsl(346deg 89% 61%); color: #fff;
      font-size: 0.75rem; line-height: 1.25; padding: 0.2rem 0.45rem; gap: 0.25rem;
    }
  `;

  const templateCollectionCss = fs.readFileSync(
    path.join(process.cwd(), 'assets', 'template-collection.css'),
    'utf8',
  );

  return `
    <style data-harness-preview>${stackPreviewCss}</style>
    <style data-source="template-collection.css">${templateCollectionCss}</style>
    <section class="case">
      <h3>Collection product grid (2/4 + 5 widescreen; free ship, type, % OFF)</h3>
      <div class="collection" style="max-width:72rem;margin:0 auto">
        <ul
          class="grid product-grid contains-card contains-card--product grid--2-col-tablet-down grid--4-col-desktop grid--5-col-widescreen"
          role="list"
        >
          ${cards.map((html) => `<li class="grid__item">${html}</li>`).join('\n')}
        </ul>
      </div>
    </section>`;
};

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'collection-product-grid');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    for (const [label, viewport] of [
      ['desktop', {width: 1440, height: 900}],
      ['mobile', {width: 390, height: 844}],
    ]) {
      const page = await browser.newPage({viewport});
      await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
      const result = await page.evaluate(() => {
        const ul = document.querySelector('.collection ul.grid');
        const display = getComputedStyle(ul).display;
        const ulWidth = ul.getBoundingClientRect().width;
        const items = [...ul.querySelectorAll('.grid__item')].map((el) => {
          const r = el.getBoundingClientRect();
          return {top: r.top, left: r.left, width: r.width, height: r.height};
        });
        const flexWrap = getComputedStyle(ul).flexWrap;
        return {display, flexWrap, items, ulWidth};
      });

      if (result.display !== 'flex') {
        throw new Error(`[${label}] collection grid display=${result.display}, expected flex`);
      }

      const perRow = itemsPerRowEstimate(result.items);
      if (label === 'desktop' && perRow < 4) {
        throw new Error(`[${label}] expected ≥4 items on first row, got ${perRow}`);
      }
      // Mobile: regresión principal era display:grid (1 ítem por fila a ancho completo).
      if (label === 'mobile') {
        const maxItemWidth = Math.max(...result.items.map((it) => it.width));
        if (maxItemWidth > result.ulWidth * 0.92) {
          throw new Error(
            `[${label}] single column collapse: max item ${maxItemWidth.toFixed(0)}px ≈ full row`,
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
}