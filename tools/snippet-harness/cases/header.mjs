// Visual harness for fase-3-header: cart bubble, mega menu (open), drawer (open).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const theme = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const readCss = (file) => fs.readFileSync(path.join(theme, 'assets', file), 'utf8');

const sectionFixture = {
  id: 'header-harness',
  settings: {
    menu_type_desktop: 'mega',
    menu_color_scheme: 'scheme-1',
    enable_country_selector: false,
    enable_language_selector: false,
    menu: {
      links: [
        {
          title: 'Shop',
          handle: 'shop',
          url: '/collections/all',
          child_active: false,
          levels: 2,
          links: [
            {
              title: 'All products',
              handle: 'all',
              url: '/collections/all',
              current: false,
              links: [
                {title: 'New', handle: 'new', url: '/collections/new', current: false},
                {title: 'Sale', handle: 'sale', url: '/collections/sale', current: false},
              ],
            },
            {
              title: 'Collections',
              handle: 'collections',
              url: '/collections',
              current: false,
              links: [],
            },
          ],
        },
        {title: 'About', handle: 'about', url: '/pages/about', current: false, links: []},
      ],
    },
  },
};

const legacyCartBubble = `
  <a href="/cart" class="header__icon header__icon--cart link focus-inset" id="cart-icon-bubble-legacy">
    <span class="b-icon"><i class="b-icon">…</i></span>
    <div class="cart-count-bubble"><span aria-hidden="true">3</span></div>
    <p class="theme-meta">main @ c9b6948: Bulma b-icon + Alpine x-show/x-text</p>
  </a>`;

export default async ({engine}) => {
  const bubbleAsset = fs.readFileSync(path.join(theme, 'assets', 'header-cart-bubble.js'), 'utf8');

  const routes = {cart_url: '/cart', root_url: '/'};
  const cartEmpty = {item_count: 0, empty: true};
  const cartBusy = {item_count: 3, empty: false};

  const renderCartAnchor = async (cart) => {
    const tpl = `
      <a href="{{ routes.cart_url }}" class="header__icon header__icon--cart link focus-inset" id="cart-icon-bubble">
        <span class="svg-wrapper" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/>
          </svg>
        </span>
        <span class="visually-hidden">Cart</span>
        <div class="cart-count-bubble" data-header-cart-count {% if cart.item_count == 0 %}hidden{% endif %}>
          {% if cart.item_count < 100 %}
            <span aria-hidden="true" data-header-cart-count-value>{{ cart.item_count }}</span>
          {% endif %}
          <span class="visually-hidden" data-header-cart-count-a11y>{{ cart.item_count }} items</span>
        </div>
      </a>`;
    return engine.parseAndRender(tpl, {cart, routes});
  };

  const megaOpen = await engine.parseAndRender(
    `{% render 'header-mega-menu' %}`,
    {section: sectionFixture},
  );

  const drawerOpen = `
    <header-drawer data-breakpoint="tablet">
      <details id="Details-menu-drawer-container" class="menu-drawer-container" open>
        <summary class="header__icon header__icon--menu header__icon--summary link focus-inset" aria-label="Menu">
          <span>☰</span>
        </summary>
        <div id="menu-drawer" class="gradient menu-drawer motion-reduce color-scheme-1">
          <div class="menu-drawer__inner-container">
            <nav class="menu-drawer__navigation">
              <ul class="menu-drawer__menu list-menu" role="list">
                <li><a class="menu-drawer__menu-item link" href="/collections/all">Shop</a></li>
                <li><a class="menu-drawer__menu-item link" href="/pages/about">About</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </details>
    </header-drawer>`;

  const bubble0 = await renderCartAnchor(cartEmpty);
  const bubble3 = await renderCartAnchor(cartBusy);

  const extraStyles = [
    'component-list-menu.css',
    'component-menu-drawer.css',
    'component-mega-menu.css',
    'component-search.css',
  ]
    .map((f) => readCss(f))
    .join('\n');

  const searchModal = await engine.parseAndRender(
    `{% render 'header-search', input_id: 'Harness-Search' %}`,
    {section: sectionFixture, settings: {predictive_search_enabled: false}, routes, search: {terms: ''}},
  );

  return `
<style data-harness="header-components">${extraStyles}</style>
<style>
  .harness-header-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 24px; border-bottom: 1px solid #ddd; position: relative;
    min-height: 64px;
  }
  .harness-viewport { max-width: 100%; margin: 0 auto; }
  .harness-viewport--390 { max-width: 390px; }
  .harness-viewport--768 { max-width: 768px; }
  .harness-viewport--1280 { max-width: 1280px; }
  .mega-menu[open] .mega-menu__content,
  details.mega-menu[open] .mega-menu__content { opacity: 1; transform: translateY(0); }
  details[open].menu-drawer-container .menu-drawer { visibility: visible; }
  .header__inline-menu { display: inline-flex; }
  @media (max-width: 989px) { .header__inline-menu { display: none; } }
</style>

<section class="case"><h3>Antes (main): burbuja Bulma + Alpine</h3>
  <div class="harness-header-bar harness-viewport harness-viewport--1280">${legacyCartBubble}</div>
</section>

<section class="case"><h3>Después: burbuja svg-wrapper + data-header-cart-count (cart vacío / 3 ítems)</h3>
  <div class="harness-header-bar harness-viewport harness-viewport--1280">
    ${bubble0}
    <span style="margin:0 24px">→</span>
    ${bubble3}
  </div>
</section>

<section class="case"><h3>Desktop 1280 — mega menu abierto</h3>
  <div class="header-wrapper color-scheme-1 gradient harness-viewport harness-viewport--1280">
    <header class="header header--middle-left page-width header--has-menu" style="position:relative">
      ${megaOpen.replace('<details id="Details-HeaderMenu-1"', '<details id="Details-HeaderMenu-1" open')}
    </header>
  </div>
</section>

<section class="case"><h3>Tablet 768 — barra + búsqueda (tokens d-input / theme-label-bold)</h3>
  <div class="harness-header-bar harness-viewport harness-viewport--768">
    ${searchModal}
    ${bubble3}
  </div>
</section>

<section class="case"><h3>Móvil 390 — drawer abierto</h3>
  <div class="harness-viewport harness-viewport--390 gradient color-scheme-1">
    <header class="header header--mobile-center drawer-menu page-width">
      ${drawerOpen}
      <div class="header__icons">${bubble3}</div>
    </header>
  </div>
</section>

<script defer>${bubbleAsset}
document.dispatchEvent(new CustomEvent('plt:cart-updated', {bubbles:true, detail:{item_count:5}}));
</script>
<p class="theme-meta case">Simula <code>plt:cart-updated</code> → contador 5 (emisión automática vía <code>plt-cart-drawer-bridge.js</code>).</p>`;
};