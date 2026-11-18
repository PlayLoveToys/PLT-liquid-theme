// assets/cart-fragment.js

/**
 * Refreshes cart page sections via Shopify Section Rendering (no Alpine).
 */
window.refreshCartFragment = async function () {
  const itemsContainer = document.querySelector('[data-cart-fragment]');
  const footerContainer = document.querySelector('[data-cart-footer]');

  const tasks = [];
  const pathname = window.location.pathname;

  if (itemsContainer) {
    tasks.push(
      fetch(`${pathname}?section_id=main-cart-items`)
        .then((r) => r.text())
        .then((html) => {
          if (!html) return;
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const fresh = doc.querySelector('[data-cart-fragment]');
          if (fresh) itemsContainer.replaceWith(fresh);
        })
    );
  }

  if (footerContainer) {
    tasks.push(
      fetch(`${pathname}?section_id=main-cart-footer`)
        .then((r) => r.text())
        .then((html) => {
          if (!html) return;
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const fresh = doc.querySelector('[data-cart-footer]');
          if (fresh) footerContainer.replaceWith(fresh);
        })
    );
  }

  await Promise.all(tasks.map((p) => p.catch(() => null)));
};