/**
 * Fase 5: product grid cards no longer use Alpine.data('productCard').
 * Quick-add relies on <product-form>, quick-add-modal and PltCartDrawerHost.
 *
 * Forwards Shopify cartUpdate pub/sub to plt:cart-updated on document so Shell/Header
 * can sync without Alpine.store when plt-cart-drawer-bridge.js does not yet emit it
 * (see PlayLoveToys/PLT-liquid-theme#31). Payload matches the agreed contract:
 * detail { item_count, total_price, cart }.
 */
(() => {
  const CART_UPDATED = 'plt:cart-updated';

  function emitCartUpdated(cart) {
    if (!cart || cart.item_count == null) return;
    document.dispatchEvent(
      new CustomEvent(CART_UPDATED, {
        bubbles: true,
        detail: {
          item_count: cart.item_count,
          total_price: cart.total_price,
          cart,
        },
      })
    );
  }

  function init() {
    if (typeof subscribe !== 'function' || !window.PUB_SUB_EVENTS?.cartUpdate) return;
    subscribe(PUB_SUB_EVENTS.cartUpdate, (payload) => {
      const source = payload?.source;
      if (source !== 'product-form' && source !== 'quick-add') return;
      if (payload?.cartData) emitCartUpdated(payload.cartData);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();