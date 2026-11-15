/**
 * Header cart count bubble (#cart-icon-bubble).
 * Primary contract: plt:cart-updated (PR #31 / fase-5-cart-store-retire).
 * Fallback on main without #31: Dawn pubsub cartUpdate + Alpine.store sync (removable after #31 merges).
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

  /** Fallback until PlayLoveToys/PLT-liquid-theme#31 lands (emitCartUpdated in bridge). */
  function bindPubSubFallback() {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;
    subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      const fromCart = event?.cartData?.item_count;
      if (fromCart != null) applyCount(fromCart);
    });
  }

  /** Fallback: bridge syncAlpineStore on main. TODO(PLT Alpine Migrator): drop after #31 merges. */
  function bindAlpineFallback() {
    const bind = () => {
      const store = window.Alpine?.store?.('cart');
      if (!store || store.__pltHeaderBubbleBound) return;
      store.__pltHeaderBubbleBound = true;
      if (typeof Alpine.effect === 'function') {
        Alpine.effect(() => applyCount(store.item_count));
      }
    };
    document.addEventListener('alpine:initialized', bind);
    if (window.Alpine) bind();
  }

  function init() {
    bindPubSubFallback();
    bindAlpineFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();