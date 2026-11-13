// assets/cart-fragment.js

window.refreshCartFragment = async function () {
    const container = document.querySelector('[data-cart-fragment]');
    if (!container) return;

    const url = window.location.pathname + '?section_id=main-cart-items';

    const html = await fetch(url)
        .then(r => r.text())
        .catch(() => null);

    if (!html) return;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-cart-fragment]');

    if (!fresh) return;

    // Reemplazar fragmento
    container.replaceWith(fresh);

    // Re-inicializar Alpine dentro del fragmento
    if (window.Alpine) {
        Alpine.initTree(fresh);
    }
};
