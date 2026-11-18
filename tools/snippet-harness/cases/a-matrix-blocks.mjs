/** a-matrix block wrappers (col-span) @ 1280 — reproduces home matrix card columns. */
import path from 'node:path';
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
    `<div class="min-w-0">{% render 'c-card-collection', block: block %}</div>`,
    {block: collectionBlock},
  );
  const cardArticle = await engine.parseAndRender(
    `<div class="min-w-0">{% render 'c-card-article', block: block %}</div>`,
    {block: articleBlock},
  );

  const cells = [cardCollection, cardArticle, cardCollection, cardArticle].join('');

  return `<section class="a-matrix py-8 case" id="zone-a-matrix-blocks">
    <h3>a-matrix: b-card-collection + b-card-article (real wrappers)</h3>
    <div class="page-width" style="max-width:1280px;margin:0 auto;padding:0 1rem">
      <div class="grid grid-cols-12 gap-4">${cells}</div>
    </div>
  </section>`;
};

export async function verify({root}) {
  const htmlPath = path.join(root, 'tools', 'snippet-harness', '.out', 'a-matrix-blocks.layered.html');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const grid = document.querySelector('#zone-a-matrix-blocks .grid.grid-cols-12');
      const cells = [...grid.children];
      return cells.map((el, i) => ({
        i,
        width: el.getBoundingClientRect().width,
        gridColumn: getComputedStyle(el).gridColumn,
      }));
    });
    const minWidth = 220;
    for (const cell of result) {
      if (cell.width < minWidth) {
        throw new Error(
          `matrix cell ${cell.i}: width ${cell.width.toFixed(1)}px < ${minWidth}px (grid-column ${cell.gridColumn})`,
        );
      }
    }
  } finally {
    await browser.close();
  }
}