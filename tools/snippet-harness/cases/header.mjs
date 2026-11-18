// Visual harness for fase-3-header: cart bubble, mega menu (open), drawer (open).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {harnessOutPath} from '../lib/verify-carousel-slides.mjs';

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
              links: [
                {title: 'Lingerie', handle: 'lingerie', url: '/collections/lingerie', current: false},
                {title: 'Toys', handle: 'toys', url: '/collections/toys', current: false},
              ],
            },
          ],
        },
        {title: 'About', handle: 'about', url: '/pages/about', current: false, links: []},
      ],
    },
  },
};

const dawnRootTypo = `
<style data-harness="dawn-root-type">
  :root {
    --font-body-scale: 1.1;
    --font-scale-mobile: 0.8;
    --font-scale-tablet: 1;
    --font-scale-desktop: 1.1;
    --font-scale-widescreen: 1.2;
    --font-scale-fullhd: 1.3;
  }
  html {
    font-size: calc(var(--font-body-scale) * var(--font-scale-mobile) * 62.5%);
  }
  body { font-size: 1.5rem; margin: 0; }
  @media screen and (min-width: 769px) {
    html { font-size: calc(var(--font-body-scale) * var(--font-scale-tablet) * 62.5%); }
  }
  @media screen and (min-width: 1024px) {
    html { font-size: calc(var(--font-body-scale) * var(--font-scale-desktop) * 62.5%); }
  }
</style>`;

const legacyCartBubble = `
  <a href="/cart" class="header__icon header__icon--cart link focus-inset" id="cart-icon-bubble-legacy">
    <span class="b-icon"><i class="b-icon">…</i></span>
    <div class="cart-count-bubble"><span aria-hidden="true">3</span></div>
    <p class="theme-meta">main @ c9b6948: Bulma b-icon + Alpine x-show/x-text</p>
  </a>`;

const drawerMarkup = (open = true) => `
  <header-drawer data-breakpoint="tablet">
    <details id="Details-menu-drawer-container" class="menu-drawer-container"${open ? ' open' : ''}>
      <summary class="header__icon header__icon--menu header__icon--summary link focus-inset" aria-label="Menu">
        <span>☰</span>
      </summary>
      <div id="menu-drawer" class="gradient menu-drawer motion-reduce color-scheme-1">
        <div class="menu-drawer__inner-container">
          <nav class="menu-drawer__navigation">
            <ul class="menu-drawer__menu list-menu" role="list">
              <li><a class="menu-drawer__menu-item list-menu__item link link--text" href="/collections/all">Shop</a></li>
              <li><a class="menu-drawer__menu-item list-menu__item link link--text" href="/pages/about">About</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </details>
  </header-drawer>`;

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
    `{% render 'header-mega-menu', section: section %}`,
    {section: sectionFixture},
  );

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

  const mobileHeaderShell = (caseId) => `
  <div class="shopify-section section-header" data-harness-case="${caseId}">
    <header class="header header--middle-left header--mobile-center drawer-menu page-width header--has-menu">
      ${drawerMarkup(true)}
      <a href="/" class="header__heading-link link link--text focus-inset">
        <div class="header__heading-logo-wrapper" style="width:130px;height:32px;background:#eee" aria-hidden="true"></div>
      </a>
      <div class="header__icons">${searchModal}${bubble3}</div>
    </header>
  </div>`;

  return `
<style data-harness="header-components">${extraStyles}</style>
${dawnRootTypo}
<style>
  .harness-header-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 24px; border-bottom: 1px solid #ddd; position: relative;
    min-height: 64px;
  }
  .harness-viewport { max-width: 100%; margin: 0 auto; }
  .mega-menu[open] .mega-menu__content,
  details.mega-menu[open] .mega-menu__content { opacity: 1; transform: translateY(0); }
  details[open].menu-drawer-container .menu-drawer { visibility: visible; transform: translateX(0); }
  .header__inline-menu { display: inline-flex; }
  @media (max-width: 989px) { .header__inline-menu { display: none; } }
</style>

<section class="case"><h3>Antes (main): burbuja Bulma + Alpine</h3>
  <div class="harness-header-bar harness-viewport">${legacyCartBubble}</div>
</section>

<section class="case"><h3>Después: burbuja svg-wrapper + data-header-cart-count (cart vacío / 3 ítems)</h3>
  <div class="harness-header-bar harness-viewport">
    ${bubble0}
    <span style="margin:0 24px">→</span>
    ${bubble3}
  </div>
</section>

<section class="case" data-harness-case="header-desktop-1440"><h3>Desktop 1440 — mega menu abierto</h3>
  <div class="header-wrapper color-scheme-1 gradient shopify-section section-header">
    <header class="header header--middle-left page-width header--has-menu" style="position:relative">
      ${megaOpen.replace('<details id="Details-HeaderMenu-1"', '<details id="Details-HeaderMenu-1" open')}
    </header>
  </div>
</section>

<section class="case" data-harness-case="header-tablet-768"><h3>Tablet 768 — drawer abierto</h3>
  ${mobileHeaderShell('header-tablet-768')}
</section>

<section class="case" data-harness-case="header-mobile-390"><h3>Móvil 390 — drawer abierto</h3>
  ${mobileHeaderShell('header-mobile-390')}
</section>

<script defer>${bubbleAsset}
document.dispatchEvent(new CustomEvent('plt:cart-updated', {bubbles:true, detail:{item_count:5}}));
</script>
<p class="theme-meta case">Simula <code>plt:cart-updated</code> → contador 5 (emisión automática vía <code>plt-cart-drawer-bridge.js</code>).</p>`;
};

export async function verify({root}) {
  const {chromium} = await import('playwright');
  const htmlPath = harnessOutPath(root, 'header');
  const browser = await chromium.launch({headless: true});

  try {
    for (const [caseId, viewport, assert] of [
      [
        'header-mobile-390',
        {width: 390, height: 900},
        async (page) => {
          const itemFont = await page.$eval(
            '#Details-menu-drawer-container .menu-drawer__menu-item',
            (el) => parseFloat(getComputedStyle(el).fontSize),
          );
          if (itemFont < 20) {
            throw new Error(`móvil drawer: font-size ${itemFont}px < 20px`);
          }
          const headerH = await page.$eval('[data-harness-case="header-mobile-390"] .header', (el) =>
            el.getBoundingClientRect().height,
          );
          if (headerH > 90) {
            throw new Error(`móvil header alto ${headerH}px > 90px`);
          }
        },
      ],
      [
        'header-tablet-768',
        {width: 768, height: 900},
        async (page) => {
          const drawerW = await page.$eval('#menu-drawer.menu-drawer', (el) =>
            el.getBoundingClientRect().width,
          );
          if (drawerW < 600) {
            throw new Error(`tablet drawer ancho ${drawerW}px < 600px`);
          }
          const itemFont = await page.$eval(
            '#Details-menu-drawer-container .menu-drawer__menu-item',
            (el) => parseFloat(getComputedStyle(el).fontSize),
          );
          if (itemFont < 20) {
            throw new Error(`tablet drawer: font-size ${itemFont}px < 20px`);
          }
        },
      ],
      [
        'header-desktop-1440',
        {width: 1440, height: 900},
        async (page) => {
          const linkCount = await page.$$eval('.mega-menu__link', (els) => els.length);
          if (linkCount < 4) {
            throw new Error(`mega-menu: expected links, got ${linkCount}`);
          }
          const level2Font = await page.$eval('.mega-menu__link--level-2', (el) =>
            parseFloat(getComputedStyle(el).fontSize),
          );
          if (level2Font < 14) {
            throw new Error(`mega-menu level-2 font ${level2Font}px < 14px`);
          }
        },
      ],
    ]) {
      const page = await browser.newPage({viewport});
      await page.goto(`file://${path.resolve(htmlPath)}`, {waitUntil: 'load'});
      await assert(page);
    }
  } finally {
    await browser.close();
  }
}