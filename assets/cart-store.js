// assets/cart-store.js

document.addEventListener("alpine:init", () => {
  Alpine.store("cart", {
    cart: null,
    isBusy: false,
    error: null,
    item_count: 0,
    total_price: 0,

    async init() {
      if (!window.__CART__) {
        this.cart = await CartApi.get();

      } else {
        this.cart = window.__CART__;
      }
      try {
        this.error = null;
        this.item_count = this.cart?.item_count || 0;
        this.total_price = this.cart?.total_price || 0;
      } catch (err) {
        this.error = err;
        console.error("Failed to initialize cart:", err);
      }
    },

    async refresh() {
      try {
        this.cart = await CartApi.get();
        this.error = null;
        this.item_count = this.cart?.item_count || 0;
        this.total_price = this.cart?.total_price || 0;

      } catch (err) {
        this.error = err;
        console.error("Failed to refresh cart:", err);
      }
    },

    async add(variantId, qty = 1, properties = null) {
      if (this.isBusy) return;
      this.isBusy = true;

      try {
        await CartApi.add(variantId, qty, properties);
        await this.refresh();
        await refreshCartFragment();
        return { ok: true, result };
      } catch (err) {
        this.error = err.message || "Error updating cart";
        return { ok: false, error: err };
      } finally {
        this.isBusy = false;
      }
    },

    async change(id, qty) {
      if (this.isBusy) return;
      this.isBusy = true;

      try {
        await CartApi.change(id, qty);
        await this.refresh();
        await refreshCartFragment();
        return { ok: true, result };
      } catch (err) {
        this.error = err.message || "Error updating cart";
        return { ok: false, error: err };
      } finally {
        this.isBusy = false;
      }
    },
  });

  // Initialize cart data on page load
  Alpine.nextTick(() => {
    Alpine.store("cart").init();
  });
});
