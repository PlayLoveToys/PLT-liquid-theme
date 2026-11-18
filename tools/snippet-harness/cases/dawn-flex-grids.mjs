/**
 * Dawn flex grids: search, related-products, footer, multicolumn, PDP 2-col, mobile gallery nowrap.
 * LEGACY_LAYER=import (default in run-harness-cases via render).
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';
import {countDistinctTops, itemsPerRowEstimate} from '../lib/grid-layout.mjs';

function dawnList(itemsMarkup, className) {
  return `<ul class="${className}" role="list">${itemsMarkup}</ul>`;
}

function gridItems(count, label = 'Block') {
  return Array.from({length: count}, (_, i) => `<li class="grid__item" style="min-height:48px;border:1px solid #ccc;padding:8px">${label} ${i + 1}</li>`).join('');
}

export default async () => {
  const sliderCss = ['component-slider.css', 'section-footer.css', 'section-multicolumn.css']
    .map((file) => {
      const css = fs.readFileSync(path.join(process.cwd(), 'assets', file), 'utf8');
      return `<style data-source="${file}">${css}</style>`;
    })
    .join('\n');

  const search = dawnList(
    gridItems(8, 'Result'),
    'grid product-grid grid--2-col-tablet-down grid--4-col-desktop',
  );
  const related = dawnList(
    gridItems(4, 'Related'),
    'grid product-grid grid--2-col-tablet-down grid--4-col-desktop',
  );
  const footer = `<div class="footer__blocks-wrapper grid grid--1-col grid--2-col grid--4-col-tablet grid--3-col-tablet">${Array.from(
    {length: 3},
    (_, i) =>
      `<div class="footer-block grid__item"><h2 class="footer-block__heading">Column ${i + 1}</h2><p>Links</p></div>`,
  ).join('')}</div>`;
  const multicolumn = dawnList(
    gridItems(3, 'Value'),
    'multicolumn-list grid grid--1-col-tablet-down grid--3-col-desktop',
  );

  const gallerySlides = Array.from(
    {length: 4},
    (_, i) =>
      `<li class="product__media-item grid__item slider__slide" style="min-height:120px;background:#eee">Media ${i + 1}</li>`,
  ).join('');
  const gallery = `<slider-component class="slider-mobile-gutter"><ul class="product__media-list grid grid--peek slider slider--mobile" role="list">${gallerySlides}</ul></slider-component>`;

  const pdp = `<div class="product grid grid--1-col grid--2-col-tablet" style="max-width:1100px;margin:0 auto">
    <div class="grid__item product__media-wrapper" style="min-height:200px;background:#f5f5f5">Media column</div>
    <div class="grid__item product__info-wrapper" style="min-height:200px">Buy box</div>
  </div>`;

  return `${sliderCss}
<section class="case" id="zone-dawn-flex-grids">
  <h3>Dawn flex grids parity</h3>
  <section data-zone="search" id="sub-search">${search}</section>
  <section data-zone="related" id="sub-related">${related}</section>
  <section data-zone="footer" id="sub-footer">${footer}</section>
  <section data-zone="multicolumn" id="sub-multicolumn">${multicolumn}</section>
  <section data-zone="pdp" id="sub-pdp">${pdp}</section>
  <section data-zone="gallery" id="sub-gallery">${gallery}</section>
</section>`;
};

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'dawn-flex-grids');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});

  const probeRow = async (page, selector, minPerRow, display = 'flex') => {
    const result = await page.evaluate(
      ({sel, expectedDisplay}) => {
        const el = document.querySelector(sel);
        if (!el) return {missing: sel};
        const display = getComputedStyle(el).display;
        const flexWrap = getComputedStyle(el).flexWrap;
        const items = [...el.querySelectorAll('.grid__item')].map((node) => {
          const r = node.getBoundingClientRect();
          return {top: r.top, left: r.left, width: r.width};
        });
        return {display, flexWrap, items};
      },
      {sel: selector, expectedDisplay: display},
    );
    if (result.missing) throw new Error(result.missing);
    if (result.display !== display) {
      throw new Error(`${selector}: display=${result.display}, expected ${display}`);
    }
    const perRow = itemsPerRowEstimate(result.items);
    if (perRow < minPerRow) {
      throw new Error(`${selector}: ${perRow} items in first row, expected ≥${minPerRow}`);
    }
    return result;
  };

  try {
    const page1440 = await browser.newPage({viewport: {width: 1440, height: 900}});
    await page1440.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    await probeRow(page1440, '#sub-search ul.grid', 4);
    await probeRow(page1440, '#sub-related ul.grid', 4);
    await probeRow(page1440, '#sub-footer .footer__blocks-wrapper', 3);
    await probeRow(page1440, '#sub-multicolumn ul.grid', 3);

    const pdpCols = await page1440.evaluate(() => {
      const row = document.querySelector('#sub-pdp .product.grid');
      const display = getComputedStyle(row).display;
      const cols = [...row.querySelectorAll(':scope > .grid__item')].map((el) => el.getBoundingClientRect());
      const sameRow =
        cols.length >= 2 && Math.abs(cols[0].top - cols[1].top) < 8 && cols[0].left < cols[1].left;
      return {display, sameRow, widths: cols.map((c) => c.width)};
    });
    if (pdpCols.display !== 'flex' || !pdpCols.sameRow) {
      throw new Error(`PDP 2-col: display=${pdpCols.display}, sameRow=${pdpCols.sameRow}`);
    }

    const page390 = await browser.newPage({viewport: {width: 390, height: 844}});
    await page390.goto(pathToFileURL(htmlPath).href, {waitUntil: 'load'});
    const gallery = await page390.evaluate(() => {
      const ul = document.querySelector('#sub-gallery ul.grid');
      return {
        display: getComputedStyle(ul).display,
        flexWrap: getComputedStyle(ul).flexWrap,
        perRow: [...ul.querySelectorAll('.slider__slide')].map((el) => el.getBoundingClientRect().top),
      };
    });
    if (gallery.display !== 'flex') {
      throw new Error(`mobile gallery display=${gallery.display}, expected flex`);
    }
    if (gallery.flexWrap !== 'nowrap') {
      throw new Error(`mobile gallery flexWrap=${gallery.flexWrap}, expected nowrap`);
    }
    if (countDistinctTops(gallery.perRow.map((top) => ({top}))) > 1) {
      throw new Error('mobile gallery slides wrapped to multiple rows');
    }

  } finally {
    await browser.close();
  }
}