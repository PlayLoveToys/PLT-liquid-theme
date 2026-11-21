/** a-matrix block wrappers (plt-a-matrix-card-cell) @ 1280 + full-width col-span-12 probe. */
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';
import {pathToFileURL} from 'node:url';

export default async ({engine}) => {
  engine.registerFilter('image_url', (source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    return (
      source.src ||
      'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png'
    );
  });
  engine.registerFilter('image_tag', (url) =>
    `<img src="${url}" alt="" loading="lazy" class="plt-collection-carousel-card__img">`,
  );
  engine.registerFilter('strip_html', (html) => String(html).replace(/<[^>]+>/g, ''));
  engine.registerFilter('truncatewords', (text, count) => {
    const words = String(text).split(/\s+/).filter(Boolean);
    return words.slice(0, Number(count)).join(' ') + (words.length > Number(count) ? '...' : '');
  });

  const collectionBlock = {
    shopify_attributes: '',
    settings: {
      collection: {
        title: 'Rose toys',
        description: '<p>Explore the collection.</p>',
        featured_image: {
          alt: 'Rose',
          src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-collection-1_large.png',
        },
        url: '/collections/rose-toys',
      },
      show_description: true,
      truncatewords: 20,
      cta_text: 'Shop Rose Toys',
      cta_url: '/collections/rose-toys',
      priority: false,
    },
  };

  const articleBlock = {
    shopify_attributes: '',
    settings: {
      article: {
        title: 'Intimate toys guide',
        url: '/blogs/wellness/intimate-toys',
        excerpt: '<p>Wellness article excerpt for layout probe.</p>',
        image: {
          src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-lifestyle-1_large.png',
          alt: 'Article',
        },
      },
      show_excerpt: true,
      truncatewords: 20,
      priority: false,
    },
  };

  const cardCollection = await engine.parseAndRender(
    `<div class="plt-a-matrix-card-cell min-w-0 col-span-12 md:col-span-6 xl:col-span-3">{% render 'c-card-collection', block: block %}</div>`,
    {block: collectionBlock},
  );
  const cardArticle = await engine.parseAndRender(
    `<div class="plt-a-matrix-card-cell min-w-0 col-span-12 md:col-span-6 xl:col-span-3">{% render 'c-card-article', block: block %}</div>`,
    {block: articleBlock},
  );

  const fullWidthBanner = `<div class="plt-a-matrix-full-width carousel-wrapper relative col-span-12" id="matrix-full-width-probe">
    <p class="p-4 text-center">Full-width matrix block (not a b-card cell)</p>
  </div>`;

  const cells = [cardCollection, cardArticle, fullWidthBanner, cardCollection].join('');

  return `<section class="a-matrix py-8 case" id="zone-a-matrix-blocks">
    <h3>a-matrix: b-card-* cells + full-width col-span-12 block</h3>
    <div class="page-width" style="max-width:1280px;margin:0 auto;padding:0 1rem">
      <div class="grid grid-cols-12 gap-4">${cells}</div>
    </div>
  </section>`;
};

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'a-matrix-blocks');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const grid = document.querySelector('#zone-a-matrix-blocks .grid.grid-cols-12');
      if (getComputedStyle(grid).display !== 'grid') {
        throw new Error(`a-matrix display is ${getComputedStyle(grid).display}, expected grid`);
      }
      const cardCells = [...grid.querySelectorAll('.plt-a-matrix-card-cell')];
      const banner = document.getElementById('matrix-full-width-probe');
      return {
        cards: cardCells.map((el, i) => ({
          i,
          width: el.getBoundingClientRect().width,
          gridColumn: getComputedStyle(el).gridColumn,
        })),
        banner: banner
          ? {
              width: banner.getBoundingClientRect().width,
              gridColumn: getComputedStyle(banner).gridColumn,
            }
          : null,
        gridWidth: grid.getBoundingClientRect().width,
      };
    });

    const minCardWidth = 220;
    for (const cell of result.cards) {
      if (cell.width < minCardWidth) {
        throw new Error(
          `matrix card cell ${cell.i}: width ${cell.width.toFixed(1)}px < ${minCardWidth}px (grid-column ${cell.gridColumn})`,
        );
      }
    }

    if (!result.banner) {
      throw new Error('missing full-width probe block');
    }
    const minFullWidth = result.gridWidth * 0.9;
    if (result.banner.width < minFullWidth) {
      throw new Error(
        `full-width block: ${result.banner.width.toFixed(1)}px < 90% of grid (${minFullWidth.toFixed(1)}px); grid-column ${result.banner.gridColumn}`,
      );
    }
  } finally {
    await browser.close();
  }
}