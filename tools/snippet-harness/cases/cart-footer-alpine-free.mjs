// Smoke for main-cart-footer markup without Alpine (renders section file body via inline capture).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const money = (cents) => `$${(Number(cents) / 100).toFixed(2)}`;
const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default async ({engine}) => {
  engine.registerFilter('money', money);
  engine.registerFilter('money_with_currency', (cents) => `${money(cents)} USD`);

  const baseCart = {
    note: '',
    item_count: 2,
    total_price: 4998,
    items: [{}, {}],
    duties_included: false,
    taxes_included: true,
    cart_level_discount_applications: [],
    currency: {symbol: '$', iso_code: 'USD'},
  };

  const emptyCart = {
    ...baseCart,
    item_count: 0,
    total_price: 0,
    items: [],
  };

  const settings = {show_cart_note: false};
  const shop = {shipping_policy: {body: 'Policy', url: '/policies/shipping-policy'}};

  const renderFooter = async (cart) => {
    const template = fs.readFileSync(
      path.join(theme, 'sections', 'main-cart-footer.liquid'),
      'utf8',
    );
    const liquidOnly = template.replace(/\{% schema %\}[\s\S]*/, '');
    return engine.parseAndRender(liquidOnly, {
      cart,
      settings,
      shop,
      additional_checkout_buttons: false,
    });
  };

  const withItems = await renderFooter(baseCart);
  const empty = await renderFooter(emptyCart);

  return `
    <section class="case"><h3>Footer visible (2 items)</h3>${withItems}</section>
    <section class="case"><h3>Footer hidden when cart empty</h3>${empty}</section>`;
};