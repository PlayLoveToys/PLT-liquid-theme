/**
 * Bridge: cancelable plt:* collection events → Shopify Section Rendering.
 *
 * Roots opt in with `data-plt-section-nav` (+ `data-plt-section-id`, optional
 * `data-plt-morph-target`, default `#product-grid-container`). Without a matching
 * root the WC keeps its native GET / link behaviour.
 *
 * See docs/ds-port-2b-js-plan.md (corte JS-A).
 */
;(() => {
  const SORT = 'plt:sort-change';
  const FILTER = 'plt:filter-change';
  const PAGE = 'plt:page-change';
  const DEFAULT_TARGET = '#product-grid-container';

  function rootFor(el) {
    return el instanceof Element ? el.closest('[data-plt-section-nav]') : null;
  }

  function morphSelector(root) {
    return root.dataset.pltMorphTarget || DEFAULT_TARGET;
  }

  function urlFromForm(form, detail) {
    const action = form.getAttribute('action') || window.location.pathname;
    const url = new URL(action, window.location.origin);
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (value !== '' && value != null) params.append(key, String(value));
    }
    if (detail?.name) params.set(detail.name, detail.value ?? '');
    url.search = params.toString();
    return url;
  }

  function urlFromSort(target, detail) {
    const form = target.querySelector(':scope > form:not([data-plt-fallback])');
    if (form) return urlFromForm(form, detail);
    const url = new URL(window.location.href);
    if (detail?.name) url.searchParams.set(detail.name, detail.value ?? '');
    return url;
  }

  function urlFromFilter(target, detail) {
    const action = target.getAttribute('action') || window.location.pathname;
    const url = new URL(action, window.location.origin);
    const preserved = target.preserve && typeof target.preserve === 'object' ? target.preserve : {};
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(preserved)) {
      if (Array.isArray(value)) value.forEach((v) => { if (v !== '' && v != null) params.append(key, String(v)); });
      else if (value !== '' && value != null) params.set(key, String(value));
    }
    if (detail?.query) {
      new URLSearchParams(detail.query).forEach((v, k) => params.append(k, v));
    }
    url.search = params.toString();
    return url;
  }

  function urlFromPage(detail) {
    if (!detail?.url) return new URL(window.location.href);
    return new URL(detail.url, window.location.origin);
  }

  function stripSectionId(url) {
    const clean = new URL(url.toString());
    clean.searchParams.delete('section_id');
    return clean;
  }

  async function navigate(root, nextUrl) {
    const sectionId = root.dataset.pltSectionId;
    const targetSel = morphSelector(root);
    const historyUrl = stripSectionId(nextUrl);
    const fetchUrl = new URL(historyUrl.toString());
    if (sectionId) fetchUrl.searchParams.set('section_id', sectionId);

    let html;
    try {
      const response = await fetch(fetchUrl.toString(), {
        headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!response.ok) throw new Error(`section fetch ${response.status}`);
      html = await response.text();
    } catch (_err) {
      window.location.assign(historyUrl.toString());
      return;
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const incoming = doc.querySelector(targetSel);
    const current = document.querySelector(targetSel);
    if (!incoming || !current) {
      window.location.assign(historyUrl.toString());
      return;
    }

    current.replaceWith(incoming);
    history.pushState({ pltSectionNav: true }, '', historyUrl.toString());
    if (window.Alpine && typeof window.Alpine.initTree === 'function') {
      window.Alpine.initTree(incoming);
    }
  }

  function onPltEvent(event) {
    const root = rootFor(event.target);
    if (!root) return;

    let nextUrl;
    switch (event.type) {
      case SORT:
        nextUrl = urlFromSort(event.target, event.detail);
        break;
      case FILTER:
        nextUrl = urlFromFilter(event.target, event.detail);
        break;
      case PAGE:
        nextUrl = urlFromPage(event.detail);
        break;
      default:
        return;
    }

    event.preventDefault();
    navigate(root, nextUrl);
  }

  async function onPopState() {
    const root = document.querySelector('[data-plt-section-nav][data-plt-section-id]');
    if (!root) return;
    await navigate(root, new URL(window.location.href));
  }

  document.addEventListener(SORT, onPltEvent);
  document.addEventListener(FILTER, onPltEvent);
  document.addEventListener(PAGE, onPltEvent);
  window.addEventListener('popstate', onPopState);
})();
