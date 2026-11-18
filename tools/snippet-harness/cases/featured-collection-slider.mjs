/**
 * featured-collection desktop slider markup (grid product-grid + slider--desktop) @ 1280px.
 * Fails when Tailwind .grid overrides Dawn flex (single ~310px column stack).
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const SECTION_ID = 'harness-featured-collection';

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

  const products = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: 2000 + n,
    title: `Product ${n}`,
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
    items += `<li
      id="Slide-${SECTION_ID}-${i + 1}"
      class="grid__item slider__slide"
    >${card}</li>`;
  }

  const sliderCss = ['component-slider.css', 'component-card.css', 'template-collection.css']
    .map((file) => {
      const css = fs.readFileSync(path.join(process.cwd(), 'assets', file), 'utf8');
      return `<style data-source="${file}">${css}</style>`;
    })
    .join('\n');

  return `${sliderCss}
<section class="case featured-collection-harness" id="zone-featured-collection-slider">
  <h3>featured-collection slider (3-col desktop)</h3>
  <div class="page-width" style="max-width:1280px;margin:0 auto;padding:0 1rem">
    <slider-component class="slider-mobile-gutter slider-component-full-width slider-component-desktop">
      <ul
        id="Slider-${SECTION_ID}"
        class="grid product-grid contains-card contains-card--product grid--3-col-desktop grid--1-col-tablet-down slider slider--desktop slider--tablet grid--peek"
        role="list"
      >
        ${items}
      </ul>
    </slider-component>
  </div>
</section>`;
};

export async function verify({root}) {
  const htmlPath = path.join(
    root,
    'tools',
    'snippet-harness',
    '.out',
    'featured-collection-slider.layered.html',
  );
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const ul = document.querySelector('#zone-featured-collection-slider ul.grid');
      const slides = [...ul.querySelectorAll('.slider__slide')].slice(0, 3);
      const display = getComputedStyle(ul).display;
      const positions = slides.map((el, i) => ({
        i,
        width: el.getBoundingClientRect().width,
        left: el.getBoundingClientRect().left,
        titleLink: el.querySelector('.plt-product-card .d-card-title a'),
      }));
      const linkStyle = positions[0]?.titleLink
        ? {
            color: getComputedStyle(positions[0].titleLink).color,
            textDecoration: getComputedStyle(positions[0].titleLink).textDecorationLine,
          }
        : null;
      return {display, positions, linkStyle};
    });

    if (result.display !== 'flex') {
      throw new Error(`product grid display is ${result.display}, expected flex (Dawn grid compat)`);
    }

    const minWidth = 170;
    const maxWidth = 420;
    for (const slide of result.positions) {
      if (slide.width < minWidth || slide.width > maxWidth) {
        throw new Error(
          `slide ${slide.i}: width ${slide.width.toFixed(1)}px outside [${minWidth}, ${maxWidth}]`,
        );
      }
    }

    const uniqueLeft = [...new Set(result.positions.map((s) => Math.round(s.left)))];
    if (uniqueLeft.length < 2) {
      throw new Error(
        `slides stack at one horizontal position (${uniqueLeft.join(', ')}); expected distinct columns`,
      );
    }

    if (result.linkStyle?.textDecoration === 'underline' && result.linkStyle?.color === 'rgb(0, 0, 238)') {
      throw new Error('product title link still has default unstyled anchor (blue underline)');
    }
  } finally {
    await browser.close();
  }
}