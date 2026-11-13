/**
 * Theme bridge for <plt-cart-drawer>.
 * Owns cart mutations (CartApi /cart/change.js), maps /cart.js → lines/subtotal,
 * and exposes a cart-notification-compatible host for product-form / quick-add / Alpine.
 */
(() => {
  const DRAWER_READY_TIMEOUT_MS = 3000;

  function getConfig() {
    return window.PltCartDrawerConfig || {};
  }

  function getDrawer() {
    const id = getConfig().drawerId || 'plt-cart-drawer';
    return document.getElementById(id) || document.querySelector('plt-cart-drawer');
  }

  function formatMoney(cents, currency, locale) {
    const config = getConfig();
    try {
      return new Intl.NumberFormat(locale || config.locale || undefined, {
        style: 'currency',
        currency: currency || config.currency || 'USD',
      }).format((Number(cents) || 0) / 100);
    } catch {
      return String((Number(cents) || 0) / 100);
    }
  }

  function linesFromCart(cart) {
    const currency = cart.currency || getConfig().currency || 'USD';
    const locale = getConfig().locale;
    return (cart.items || []).map((item) => {
      const compare =
        item.original_line_price > item.final_line_price
          ? formatMoney(item.original_line_price, currency, locale)
          : null;
      const variantTitle = item.product_has_only_default_variant
        ? null
        : item.variant_title || null;
      return {
        id: item.key,
        title: item.product_title || item.title,
        url: item.url,
        imageUrl: item.image || null,
        imageAlt: item.product_title || item.title,
        variantTitle,
        quantity: item.quantity,
        price: formatMoney(item.final_line_price, currency, locale),
        compareAtPrice: compare,
      };
    });
  }

  async function fetchCart() {
    if (window.CartApi?.get) return window.CartApi.get();
    const response = await fetch('/cart.js');
    if (!response.ok) throw new Error('Cart fetch failed');
    return response.json();
  }

  async function changeLine(lineId, quantity) {
    if (window.CartApi?.change) return window.CartApi.change(lineId, quantity);
    const response = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: lineId, quantity }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(
        (data && (data.description || data.message)) || 'Cart change failed'
      );
      error.data = data;
      throw error;
    }
    return data;
  }

  function applyCartToDrawer(cart, drawer = getDrawer()) {
    if (!drawer || !cart) return;
    drawer.lines = linesFromCart(cart);
    drawer.subtotal = formatMoney(
      cart.total_price,
      cart.currency || getConfig().currency,
      getConfig().locale
    );
    drawer.error = '';
  }

  async function syncAlpineStore(cart) {
    const store = window.Alpine?.store?.('cart');
    if (!store) return;
    if (cart) {
      store.cart = cart;
      store.item_count = cart.item_count || 0;
      store.total_price = cart.total_price || 0;
      store.error = null;
      return;
    }
    if (typeof store.refresh === 'function') {
      await store.refresh();
    }
  }

  async function whenDrawerDefined() {
    const ready = await Promise.race([
      customElements.whenDefined('plt-cart-drawer').then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), DRAWER_READY_TIMEOUT_MS)),
    ]);
    return ready;
  }

  let changingQty = false;
  let listenersBound = false;

  async function refreshAndShow() {
    const drawer = getDrawer();
    if (!drawer) {
      window.location.href = getConfig().cartUrl || window.routes?.cart_url || '/cart';
      return;
    }

    const ready = await whenDrawerDefined();
    if (!ready) {
      window.location.href = getConfig().cartUrl || window.routes?.cart_url || '/cart';
      return;
    }

    drawer.error = '';
    try {
      const cart = await fetchCart();
      applyCartToDrawer(cart, drawer);
      await syncAlpineStore(cart);
    } catch (err) {
      console.error(err);
    }

    if (typeof drawer.show === 'function') drawer.show();
  }

  async function onLineChange(event) {
    const { lineId, quantity } = event.detail || {};
    if (!lineId || changingQty) return;
    changingQty = true;
    const drawer = getDrawer();
    if (drawer) {
      drawer.busy = true;
      drawer.error = '';
    }
    try {
      let cart;
      try {
        cart = await changeLine(lineId, quantity);
      } catch {
        if (drawer) drawer.error = getConfig().errorMessage || '';
        try {
          applyCartToDrawer(await fetchCart(), drawer);
        } catch {
          /* keep previous lines */
        }
        return;
      }
      applyCartToDrawer(cart, drawer);
      await syncAlpineStore(cart);
      if (typeof window.refreshCartFragment === 'function') {
        await window.refreshCartFragment();
      }
    } finally {
      changingQty = false;
      if (drawer) drawer.busy = false;
    }
  }

  function bindListeners() {
    if (listenersBound) return;
    listenersBound = true;

    document.addEventListener('plt:cart-line-change', (event) => {
      void onLineChange(event);
    });
    document.addEventListener('plt:cart-line-remove', (event) => {
      const lineId = event.detail?.lineId;
      if (!lineId) return;
      void onLineChange({ detail: { lineId, quantity: 0 } });
    });

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest?.('#cart-icon-bubble');
      if (!trigger || !getDrawer()) return;
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.button && event.button !== 0) return;
      event.preventDefault();
      void refreshAndShow();
    });
  }

  /**
   * Drop-in replacement for the Dawn cart-notification host API used by
   * product-form.js, quick-add.js and Alpine product cards.
   */
  const host = {
    getSectionsToRender() {
      return [];
    },
    setActiveElement() {},
    renderContents() {
      return refreshAndShow();
    },
    open() {
      return refreshAndShow();
    },
    close() {
      getDrawer()?.hide?.();
    },
  };

  function exposeHost() {
    window.PltCartDrawerHost = host;
    // Compat alias so existing querySelector('cart-notification') call sites
    // can be pointed at the host without keeping the Dawn CE.
    window.CartNotificationCompat = host;
  }

  function init() {
    exposeHost();
    if (!getDrawer()) return;
    bindListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
