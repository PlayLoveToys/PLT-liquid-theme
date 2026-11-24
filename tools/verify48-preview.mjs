#!/usr/bin/env node
/**
 * Part 1: verify preview serves plt-dawn-grid-compat + measure home/PDP/article/collection-list.
 * Saves screenshots to /opt/cursor/artifacts/verify48-*.png
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const PREVIEW = 'https://zxhi698kb11l12vu-60381986891.shopifypreview.com';
const ARTIFACTS = '/opt/cursor/artifacts';
const PDP = '/products/womanizer-premium-2-air-pulse-clitoral-vibrator';
const ARTICLE = '/blogs/sexual-wellness/intimate-toys-and-sex-toys';

let chromium;
try {
  ({chromium} = await import('playwright'));
} catch {
  console.error('Run: npx playwright install chromium');
  process.exit(1);
}

fs.mkdirSync(ARTIFACTS, {recursive: true});

const browser = await chromium.launch({headless: true});
const results = {preview: PREVIEW, hasCompatCss: false, measures: {}};

try {
  const desktop = await browser.newPage({viewport: {width: 1280, height: 900}});
  const mobile = await browser.newPage({
    viewport: {width: 390, height: 844},
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
  });

  await desktop.goto(PREVIEW, {waitUntil: 'networkidle', timeout: 120000});
  const html = await desktop.content();
  results.hasCompatCss =
    /plt-dawn-grid-compat\.css/.test(html) &&
    (await desktop.locator('link[href*="plt-dawn-grid-compat"]').count()) > 0;

  await desktop.screenshot({
    path: path.join(ARTIFACTS, 'verify48-home-desktop-1280.png'),
    fullPage: true,
  });
  await mobile.goto(PREVIEW, {waitUntil: 'networkidle', timeout: 120000});
  await mobile.screenshot({
    path: path.join(ARTIFACTS, 'verify48-home-mobile-390.png'),
    fullPage: true,
  });

  const homeDesk = await desktop.evaluate(() => {
    const matrix = document.querySelector('.a-matrix .d-card');
    const grid = document.querySelector('ul.grid.product-grid.slider');
    const cards = [...document.querySelectorAll('.a-matrix article.d-card')].slice(0, 3);
    const slides = grid ? [...grid.querySelectorAll('.grid__item')].slice(0, 4) : [];
    const link = document.querySelector('.plt-product-card .d-card-title a, .d-card-title a');
    return {
      matrixCardW: matrix?.getBoundingClientRect().width ?? null,
      matrixCards: cards.map((c) => c.getBoundingClientRect().width),
      productGridDisplay: grid ? getComputedStyle(grid).display : null,
      productGridPerRow:
        slides.length >= 2
          ? new Set(slides.map((s) => Math.round(s.getBoundingClientRect().top))).size
          : null,
      slideWidths: slides.map((s) => s.getBoundingClientRect().width),
      titleLink: link
        ? {
            color: getComputedStyle(link).color,
            textDecoration: getComputedStyle(link).textDecorationLine,
          }
        : null,
    };
  });
  results.measures.homeDesktop1280 = homeDesk;

  // Zoom crops
  const amatrix = desktop.locator('.a-matrix').first();
  if ((await amatrix.count()) > 0) {
    await amatrix.screenshot({path: path.join(ARTIFACTS, 'verify48-home-amatrix-desktop.png')});
  }
  const feat = desktop.locator('ul.grid.product-grid.slider').first();
  if ((await feat.count()) > 0) {
    await feat.screenshot({path: path.join(ARTIFACTS, 'verify48-home-featured-desktop.png')});
  }

  await desktop.goto(PREVIEW + PDP, {waitUntil: 'networkidle', timeout: 120000});
  await desktop.screenshot({
    path: path.join(ARTIFACTS, 'verify48-pdp-desktop-1280.png'),
    fullPage: false,
  });
  const pdpDesk = await desktop.evaluate(() => {
    const product = document.querySelector('.product.grid');
    const media = document.querySelector('.product__media-wrapper');
    const info = document.querySelector('.product__info-wrapper');
    const qty =
      document.querySelector('plt-quantity-selector') ||
      document.querySelector('quantity-input') ||
      document.querySelector('.product-form__quantity .quantity');
    return {
      gridDisplay: product ? getComputedStyle(product).display : null,
      gridCls: product?.className?.slice(0, 80),
      mediaW: media?.getBoundingClientRect().width,
      infoW: info?.getBoundingClientRect().width,
      sideBySide: media && info ? Math.abs(media.getBoundingClientRect().top - info.getBoundingClientRect().top) < 80 : false,
      qtyW: qty?.getBoundingClientRect().width,
      qtyH: qty?.getBoundingClientRect().height,
      qtyTag: qty?.tagName,
    };
  });
  results.measures.pdpDesktop1280 = pdpDesk;

  await mobile.goto(PREVIEW + PDP, {waitUntil: 'networkidle', timeout: 120000});
  const pdpMob = await mobile.evaluate(() => {
    const list = document.querySelector('.product__media-list.slider.slider--mobile');
    const atc = document.querySelector('[name="add"], button[name="add"]');
    return {
      docW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      galleryFlexWrap: list ? getComputedStyle(list).flexWrap : null,
      galleryDisplay: list ? getComputedStyle(list).display : null,
      items: list?.children?.length,
      atcTop: atc?.getBoundingClientRect().top,
      pageH: document.documentElement.scrollHeight,
    };
  });
  results.measures.pdpMobile390 = pdpMob;

  await mobile.goto(PREVIEW + ARTICLE, {waitUntil: 'networkidle', timeout: 120000});
  const articleMob = await mobile.evaluate(() => {
    const img =
      document.querySelector('main figure.w-full img') ||
      document.querySelector('article figure img') ||
      document.querySelector('main img');
    return {
      docW: document.documentElement.scrollWidth,
      imgW: img?.getBoundingClientRect().width,
      imgRenderedW: img ? img.width : null,
    };
  });
  results.measures.articleMobile390 = articleMob;

  await mobile.goto(PREVIEW, {waitUntil: 'networkidle', timeout: 120000});
  const collMob = await mobile.evaluate(() => {
    const items = [...document.querySelectorAll('.plt-carousel__track .b-carousel-item')].slice(0, 3);
    return {
      itemWidths: items.map((el) => el.getBoundingClientRect().width),
      descWhiteSpace: items[0]
        ? getComputedStyle(items[0].querySelector('p') || items[0]).whiteSpace
        : null,
    };
  });
  results.measures.collectionListMobile390 = collMob;
  const cl = mobile.locator('.plt-carousel__track .b-carousel-item').first();
  if ((await cl.count()) > 0) {
    await cl.locator('xpath=ancestor::section[1]').first().screenshot({
      path: path.join(ARTIFACTS, 'verify48-home-collection-list-mobile.png'),
    });
  }

  fs.writeFileSync(path.join(ARTIFACTS, 'verify48-measures.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}