/**
 * Header cart count bubble (#cart-icon-bubble).
 * Primary: plt:cart-updated from plt-cart-drawer-bridge.js (item_count in detail).
 * Fallback: Dawn pubsub PUB_SUB_EVENTS.cartUpdate when cartData arrives before bridge refresh.
 */
(() => {
  const ROOT_ID = 'cart-icon-bubble';
  const BUBBLE_SELECTOR = '[data-header-cart-count]';
  const VALUE_SELECTOR = '[data-header-cart-count-value]';
  const A11Y_SELECTOR = '[data-header-cart-count-a11y]';

  function formatA11y(count) {
    return count === 1 ? `${count} item` : `${count} items`;
  }

  function getRoot() {
    return document.getElementById(ROOT_ID);
  }

  function applyCount(count) {
    const root = getRoot();
    if (!root) return;

    const n = Math.max(0, Number(count) || 0);
    let bubble = root.querySelector(BUBBLE_SELECTOR);

    if (n === 0) {
      if (bubble) bubble.hidden = true;
      return;
    }

    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'cart-count-bubble';
      bubble.setAttribute('data-header-cart-count', '');
      bubble.innerHTML = `<span aria-hidden="true" data-header-cart-count-value></span><span class="visually-hidden" data-header-cart-count-a11y></span>`;
      root.appendChild(bubble);
    }

    bubble.hidden = false;

    const valueEl = bubble.querySelector(VALUE_SELECTOR);
    if (valueEl) {
      if (n < 100) {
        valueEl.textContent = String(n);
        valueEl.hidden = false;
      } else {
        valueEl.textContent = '';
        valueEl.hidden = true;
      }
    }

    const a11yEl = bubble.querySelector(A11Y_SELECTOR);
    if (a11yEl) a11yEl.textContent = formatA11y(n);
  }

  document.addEventListener('plt:cart-updated', (event) => {
    applyCount(event.detail?.item_count);
  });

  function bindPubSubFallback() {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
    subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      const fromCart = event?.cartData?.item_count;
      if (fromCart != null) applyCount(fromCart);
    });
  }

  function init() {
    bindPubSubFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();