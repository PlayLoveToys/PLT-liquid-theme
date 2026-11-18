#!/usr/bin/env node
/** Re-measure defects 6/7/10/11 on preview after local fixes (article, carousel, qty class). */
import fs from 'node:fs';
import {chromium} from 'playwright';

const PREVIEW = 'https://zxhi698kb11l12vu-60381986891.shopifypreview.com';
const PDP = '/products/womanizer-premium-2-air-pulse-clitoral-vibrator';
const ARTICLE = '/blogs/sexual-wellness/intimate-toys-and-sex-toys';

const browser = await chromium.launch({headless: true});
const out = {};
try {
  const desk = await browser.newPage({viewport: {width: 1280, height: 900}});
  await desk.goto(PREVIEW + PDP, {waitUntil: 'networkidle', timeout: 120000});
  out.pdpDesktop = await desk.evaluate(() => {
    const p = document.querySelector('.product.grid');
    const m = document.querySelector('.product__media-wrapper');
    const i = document.querySelector('.product__info-wrapper');
    const q = document.querySelector('.product-form__quantity plt-quantity-selector');
    return {
      gridDisplay: p ? getComputedStyle(p).display : null,
      sideBySide: m && i ? Math.abs(m.getBoundingClientRect().top - i.getBoundingClientRect().top) < 80 : null,
      mediaW: m?.getBoundingClientRect().width,
      infoW: i?.getBoundingClientRect().width,
      qty: q ? q.getBoundingClientRect() : null,
      qtyClass: q?.className,
    };
  });

  const mob = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  await mob.goto(PREVIEW + PDP, {waitUntil: 'networkidle', timeout: 120000});
  out.pdpMobile = await mob.evaluate(() => {
    const list = document.querySelector('.product__media-list.slider.slider--mobile');
    const share = document.querySelector('.share-button__fallback');
    return {
      docW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      galleryFlexWrap: list ? getComputedStyle(list).flexWrap : null,
      atcTop: document.querySelector('button[name="add"]')?.getBoundingClientRect().top,
      shareRight: share?.getBoundingClientRect().right,
    };
  });

  await mob.goto(PREVIEW + ARTICLE, {waitUntil: 'networkidle', timeout: 120000});
  out.articleMobile = await mob.evaluate(() => {
    const img = document.querySelector('article figure img, main figure.w-full img');
    return {
      docW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      imgW: img?.getBoundingClientRect().width,
      imgClass: img?.className,
    };
  });

  await mob.goto(PREVIEW, {waitUntil: 'networkidle', timeout: 120000});
  out.collectionListMobile = await mob.evaluate(() => {
    const items = [...document.querySelectorAll('.plt-carousel__track .b-carousel-item')].slice(0, 3);
    return {
      widths: items.map((el) => el.getBoundingClientRect().width),
    };
  });
} finally {
  await browser.close();
}

const path = '/opt/cursor/artifacts/verify-scope-postfix.json';
fs.mkdirSync('/opt/cursor/artifacts', {recursive: true});
fs.writeFileSync(path, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));