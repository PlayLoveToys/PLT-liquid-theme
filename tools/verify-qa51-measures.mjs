#!/usr/bin/env node
/**
 * Measure PDP quantity, card title, footer newsletter, mobile docW on preview
 * (preview theme is dev-ai @ 11fb612; injects this branch CSS for post-fix simulation).
 */
import fs from 'node:fs';
import path from 'node:path';

const PREVIEW =
  'https://zxhi698kb11l12vu-60381986891.shopifypreview.com/products/womanizer-premium-2-air-pulse-clitoral-vibrator';
const ARTICLE =
  'https://zxhi698kb11l12vu-60381986891.shopifypreview.com/blogs/sexual-wellness/intimate-toys-and-sex-toys';
const ARTIFACTS = '/opt/cursor/artifacts';

const injectCss = [
  'assets/section-main-product.css',
  'assets/section-blog-post.css',
  'assets/section-footer.css',
  'assets/a-plt-custom-style.css',
].map((f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')).join('\n');

const {chromium} = await import('playwright');
fs.mkdirSync(ARTIFACTS, {recursive: true});
const browser = await chromium.launch({headless: true});
const out = {previewAtRun: PREVIEW, inject: true, measures: {}};

try {
  for (const [key, url, width] of [
    ['pdpDesktop', PREVIEW, 1440],
    ['pdpMobile', PREVIEW, 390],
    ['articleMobile', ARTICLE, 390],
  ]) {
    const page = await browser.newPage({
      viewport: {width, height: 900},
      ...(width < 500
        ? {
            userAgent:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            isMobile: true,
          }
        : {}),
    });
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 120000});
    await page.waitForTimeout(3000);
    await page.addStyleTag({content: injectCss});
    await page.waitForTimeout(300);
    out.measures[key] = await page.evaluate(() => {
      const R = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height)];
      };
      const q = document.querySelector('quantity-input input, input[name="quantity"]');
      const title =
        document.querySelector('.plt-product-card .plt-media-card__title a, .d-card-title a') ||
        document.querySelector('.card__heading a');
      const news = document.querySelector('.footer-block__newsletter .field__input');
      return {
        docW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        qty: R(q),
        cardTitle: title
          ? {
              fs: getComputedStyle(title).fontSize,
              tt: getComputedStyle(title).textTransform,
            }
          : null,
        newsletter: news
          ? {
              rect: R(news),
              bg: getComputedStyle(news).backgroundColor,
            }
          : null,
      };
    });
    await page.screenshot({path: path.join(ARTIFACTS, `qa51-${key}.png`), fullPage: false});
    await page.close();
  }
} finally {
  await browser.close();
}

const reportPath = path.join(ARTIFACTS, 'qa51-measures.json');
fs.writeFileSync(reportPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log('wrote', reportPath);