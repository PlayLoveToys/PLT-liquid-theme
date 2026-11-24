/**
 * main-article hero figure: img must not exceed viewport without global img reset (#10).
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';

export default async function build() {
  const blogCss = fs.readFileSync(path.join(process.cwd(), 'assets', 'section-blog-post.css'), 'utf8');
  const img =
    'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-lifestyle-1_large.png';
  return `${blogCss ? `<style data-source="section-blog-post.css">${blogCss}</style>` : ''}
<article class="page-width mx-auto max-w-5xl overflow-x-clip case" id="zone-article-hero" style="width:100%;max-width:100%;box-sizing:border-box;padding:0 1.5rem">
  <div class="mb-6 max-w-full">
  <figure class="w-full max-w-full">
    <img src="${img}" width="1200" height="800" alt="Hero" class="w-full h-auto max-w-full" />
  </figure>
  </div>
</article>`;
}

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'article-hero-image');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const img = document.querySelector('#zone-article-hero figure img');
      const fig = document.querySelector('#zone-article-hero figure');
      if (!img || !fig) return {ok: false, reason: 'missing hero img'};
      const imgW = img.getBoundingClientRect().width;
      const figW = fig.getBoundingClientRect().width;
      const clientW = document.documentElement.clientWidth;
      return {
        ok: true,
        imgW,
        figW,
        clientW,
        scrollW: document.documentElement.scrollWidth,
        maxWidth: getComputedStyle(img).maxWidth,
      };
    });
    if (!result.ok) throw new Error(result.reason);
    if (result.imgW > result.figW + 2) {
      throw new Error(
        `hero img ${result.imgW.toFixed(1)}px wider than figure ${result.figW}px (natural 1200px layout)`,
      );
    }
    if (result.imgW > result.clientW + 2) {
      throw new Error(`hero img ${result.imgW.toFixed(1)}px overflows viewport ${result.clientW}px`);
    }
    const hero = await page.evaluate(() => {
      const el = document.querySelector('#zone-article-hero figure');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {right: r.right, clientW: document.documentElement.clientWidth};
    });
    if (hero && hero.right > hero.clientW + 1) {
      throw new Error(`hero figure right ${hero.right} > viewport ${hero.clientW}`);
    }
  } finally {
    await browser.close();
  }
}