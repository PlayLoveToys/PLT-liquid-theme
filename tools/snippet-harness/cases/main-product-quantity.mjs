/**
 * JS-Q3: main-product quantity block markup (plt-quantity-selector + product-info data-*).
 * Scenarios: quantity rules (min/step/max) and cart_qty > 0 on the WC host.
 */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';

const buildHostQuantity = async ({ engine }, opts) => {
  const {
    sectionId = 'main',
    cartQty = 0,
    min = 1,
    max = null,
    step = 1,
    productFormId = 'product-form-main',
    productTitle = 'Harness Product',
  } = opts;
  const decrease = await engine.parseAndRender(
    "{{ 'products.product.quantity.decrease' | t: product: product.title }}",
    { product: { title: productTitle } },
  );
  const increase = await engine.parseAndRender(
    "{{ 'products.product.quantity.increase' | t: product: product.title }}",
    { product: { title: productTitle } },
  );
  const inputLabel = await engine.parseAndRender(
    "{{ 'products.product.quantity.input_label' | t: product: product.title }}",
    { product: { title: productTitle } },
  );
  let html = await engine.parseAndRender(
    `{% render 'plt-quantity-selector',
      value: min,
      min: min,
      max: max,
      step: step,
      name: 'quantity',
      decrease_label: decrease_label,
      increase_label: increase_label,
      quantity_label: quantity_label,
      script_url: 'none'
    %}`,
  {
    min,
    max,
    step,
    decrease_label: decrease,
    increase_label: increase,
    quantity_label: inputLabel,
  },
  );
  let hostAttrs = ` data-cart-quantity="${cartQty}" data-min="${min}"`;
  if (max != null) hostAttrs += ` data-max="${max}"`;
  hostAttrs += ` data-form="${productFormId}"`;
  html = html.replace('<plt-quantity-selector', `<plt-quantity-selector${hostAttrs}`);
  html = html.replace(
    'data-plt-fallback',
    `data-plt-fallback form="${productFormId}"`,
  );
  html = html.replace('class="d-input"', 'class="quantity__input d-input"');
  html = html.replace('name="quantity"', 'name="quantity-fallback"');
  html = `<quantity-input class="quantity">${html}</quantity-input>`;
  const cartHidden = cartQty === 0 ? ' hidden' : '';
  return `
    <div id="Quantity-Form-${sectionId}" class="product-form__input product-form__quantity">
      <label class="quantity__label form__label">
        <span class="quantity__rules-cart${cartHidden}">(in cart: ${cartQty})</span>
      </label>
      <div class="price-per-item__container">${html}</div>
      <div class="quantity__rules caption" id="Quantity-Rules-${sectionId}">
        ${step > 1 ? `<span class="divider">multiples of ${step}</span>` : ''}
        ${min > 1 ? `<span class="divider">min ${min}</span>` : ''}
        ${max != null ? `<span class="divider">max ${max}</span>` : ''}
      </div>
    </div>`;
};

export default async function build({ engine }) {
  const sectionCss = fs.readFileSync(
    path.join(process.cwd(), 'assets', 'section-main-product.css'),
    'utf8',
  );
  const rulesCase = await buildHostQuantity(
    { engine },
    { cartQty: 0, min: 6, max: 30, step: 6, sectionId: 'rules' },
  );
  const cartCase = await buildHostQuantity(
    { engine },
    { cartQty: 3, min: 1, max: 10, step: 1, sectionId: 'cart' },
  );
  return `
    <style data-source="section-main-product.css">${sectionCss}</style>
    <section class="case" id="zone-pdp-quantity"><h3>Quantity rules (min 6, step 6, max 30)</h3>${rulesCase}</section>
    <section class="case"><h3>Cart qty &gt; 0 (data-cart-quantity=3)</h3>${cartCase}</section>
  `;
}

export async function verify({root}) {
  const htmlPath = harnessOutPath(root, 'main-product-quantity');
  const {chromium} = await import('playwright');
  const browser = await chromium.launch({headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {waitUntil: 'load'});
    const result = await page.evaluate(() => {
      const wrap = document.querySelector('#zone-pdp-quantity quantity-input.quantity');
      if (!wrap) return {ok: false, reason: 'missing quantity-input.quantity'};
      const wcQty = document.querySelector(
        '#zone-pdp-quantity plt-quantity-selector input.d-join-item[type="number"]',
      );
      const fallback = document.querySelector(
        '#zone-pdp-quantity input.quantity__input[name="quantity-fallback"]',
      );
      const probeQty = document.querySelector(
        '#zone-pdp-quantity quantity-input input, #zone-pdp-quantity input[name="quantity"]',
      );
      const input = wcQty || probeQty || fallback;
      if (!input) return {ok: false, reason: 'missing quantity input (WC or fallback)'};
      if (getComputedStyle(input).display === 'none' || input.hidden) {
        return {ok: false, reason: 'quantity input not visible'};
      }
      const host = wrap.getBoundingClientRect();
      const qty = input.getBoundingClientRect();
      return {
        ok: true,
        wrapW: host.width,
        wrapH: host.height,
        qtyW: qty.width,
        qtyH: qty.height,
        qtyDisplay: getComputedStyle(input).display,
        which: wcQty ? 'wc' : 'fallback',
      };
    });
    if (!result.ok) throw new Error(result.reason);
    const minW = 40;
    const minH = 28;
    if (result.qtyW < minW || result.qtyH < minH) {
      throw new Error(
        `quantity ${result.which} ${result.qtyW.toFixed(1)}×${result.qtyH.toFixed(1)}px below ${minW}×${minH}px`,
      );
    }
    if (result.wrapW < 60 || result.wrapH < 44) {
      throw new Error(
        `quantity-input ${result.wrapW.toFixed(1)}×${result.wrapH.toFixed(1)}px below 60×44px`,
      );
    }
  } finally {
    await browser.close();
  }
}
