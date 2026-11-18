// Contract tests for header cart bubble: plt:cart-updated + pubsub fallback (no Alpine.store).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export default async ({engine}) => {
  const bubbleAsset = fs.readFileSync(path.join(theme, 'assets', 'header-cart-bubble.js'), 'utf8');

  const routes = {cart_url: '/cart'};
  const cartEmpty = {item_count: 0};
  const cartThree = {item_count: 3};

  const tpl = `
    <a href="{{ routes.cart_url }}" class="header__icon header__icon--cart link focus-inset" id="cart-icon-bubble">
      <span class="visually-hidden">Cart</span>
      <div class="cart-count-bubble" data-header-cart-count {% if cart.item_count == 0 %}hidden{% endif %}>
        {% if cart.item_count < 100 %}
          <span aria-hidden="true" data-header-cart-count-value>{{ cart.item_count }}</span>
        {% endif %}
        <span class="visually-hidden" data-header-cart-count-a11y>{{ cart.item_count }} items</span>
      </div>
    </a>`;

  const emptyMarkup = await engine.parseAndRender(tpl, {cart: cartEmpty, routes});
  const seededMarkup = await engine.parseAndRender(tpl, {cart: cartThree, routes});

  const miniPubsub = `
    const PUB_SUB_EVENTS = { cartUpdate: 'cart-update' };
  const handlers = new Map();
  function subscribe(eventName, callback) {
    if (!handlers.has(eventName)) handlers.set(eventName, []);
    handlers.get(eventName).push(callback);
  }
  function publish(eventName, payload) {
    (handlers.get(eventName) || []).forEach((cb) => cb(payload));
  }`;

  return `
<style>
  .case-grid { display: flex; gap: 32px; flex-wrap: wrap; align-items: center; }
  .cart-count-bubble { background: #111; color: #fff; border-radius: 50%; min-width: 1.5rem; text-align: center; }
</style>

<section class="case"><h3>SSR: vacío (hidden) vs 3 ítems</h3>
  <div class="case-grid">${emptyMarkup}<span>→</span>${seededMarkup}</div>
</section>

<section class="case"><h3>JS: plt:cart-updated → 7</h3>
  <div id="live-bubble-host">${emptyMarkup}</div>
  <p class="theme-meta" id="live-bubble-meta">Pendiente…</p>
</section>

<section class="case"><h3>JS: pubsub cartUpdate → 2</h3>
  <div id="pubsub-bubble-host">${emptyMarkup}</div>
  <p class="theme-meta" id="pubsub-bubble-meta">Pendiente…</p>
</section>

<script>
${miniPubsub}
</script>
<script defer>${bubbleAsset}
(function runChecks() {
  const readCount = () => {
    const v = document.querySelector('#live-bubble-host [data-header-cart-count-value]');
    const bubble = document.querySelector('#live-bubble-host [data-header-cart-count]');
    return {
      text: v ? v.textContent : '',
      hidden: bubble ? bubble.hidden : true,
    };
  };

  document.dispatchEvent(new CustomEvent('plt:cart-updated', {
    bubbles: true,
    detail: { item_count: 7, total_price: 700, cart: { item_count: 7 } },
  }));

  const afterPlt = readCount();
  document.getElementById('live-bubble-meta').textContent =
    afterPlt.text === '7' && !afterPlt.hidden
      ? 'OK: plt:cart-updated aplicó contador 7'
      : 'FAIL: esperado visible "7", obtuvo ' + JSON.stringify(afterPlt);

  const pubHost = document.getElementById('pubsub-bubble-host');
  publish(PUB_SUB_EVENTS.cartUpdate, { cartData: { item_count: 2 } });
  const pubVal = pubHost.querySelector('[data-header-cart-count-value]');
  const pubBubble = pubHost.querySelector('[data-header-cart-count]');
  document.getElementById('pubsub-bubble-meta').textContent =
    pubVal && pubVal.textContent === '2' && pubBubble && !pubBubble.hidden
      ? 'OK: pubsub fallback aplicó contador 2'
      : 'FAIL pubsub fallback';
})();
</script>`;
};