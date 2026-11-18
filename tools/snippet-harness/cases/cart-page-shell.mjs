/** Cart page shell (main-cart-items) for Visual QA regression. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const money = (cents) => `$${(Number(cents) / 100).toFixed(2)}`;
const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);
  engine.registerFilter('image_url', (img) => (img?.src ? img.src : ''));
  engine.registerFilter('t', (key) => key);
  engine.registerFilter('json', (v) => JSON.stringify(v));
  engine.registerFilter('escape', (v) => String(v ?? ''));

  const template = fs.readFileSync(path.join(theme, 'sections', 'main-cart-items.liquid'), 'utf8');
  const liquidOnly = template.replace(/\{% schema %\}[\s\S]*/, '');

  const cart = {
    item_count: 2,
    total_price: 4998,
    items: [
      {
        key: '41001:1',
        product: {title: 'Harness product', has_only_default_variant: true},
        variant: {title: 'Default'},
        url: '/products/harness',
        image: {
          alt: 'Product',
          width: 100,
          height: 100,
          src: 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png',
        },
        quantity: 1,
        final_line_price: 2499,
        original_line_price: 2499,
      },
      {
        key: '41002:1',
        product: {title: 'Second item', has_only_default_variant: true},
        variant: {title: 'Default'},
        url: '/products/second',
        image: null,
        quantity: 1,
        final_line_price: 2499,
        original_line_price: 2499,
      },
    ],
  };

  const html = await engine.parseAndRender(liquidOnly, {
    cart,
    routes: {cart_url: '/cart', all_products_collection_url: '/collections/all'},
  });

  return `<section class="case" id="zone-cart-page"><h3>Cart page shell</h3>${html}</section>`;
};