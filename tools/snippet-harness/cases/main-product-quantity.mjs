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
  let hostAttrs = ` class="quantity" data-cart-quantity="${cartQty}" data-min="${min}"`;
  if (max != null) hostAttrs += ` data-max="${max}"`;
  hostAttrs += ` data-form="${productFormId}"`;
  html = html.replace('<plt-quantity-selector', `<plt-quantity-selector${hostAttrs}`);
  html = html.replace(
    'data-plt-fallback',
    `data-plt-fallback form="${productFormId}"`,
  );
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
      const host = document.querySelector('#zone-pdp-quantity plt-quantity-selector.quantity');
      if (!host) return {ok: false, reason: 'missing plt-quantity-selector.quantity'};
      const {width, height} = host.getBoundingClientRect();
      const display = getComputedStyle(host).display;
      return {ok: true, width, height, display};
    });
    if (!result.ok) throw new Error(result.reason);
    if (result.display !== 'flex') {
      throw new Error(`quantity host display ${result.display}, expected flex`);
    }
    const minW = 60;
    const minH = 44;
    if (result.width < minW || result.height < minH) {
      throw new Error(
        `quantity host ${result.width.toFixed(1)}×${result.height.toFixed(1)}px below ${minW}×${minH}px`,
      );
    }
  } finally {
    await browser.close();
  }
}
