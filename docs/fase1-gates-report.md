=== Gates Fase 1 (post-merge dev-ai) 2026-11-18T18:53:13Z ===
merge-base dev-ai: f6c4705ee28f24fde30d84e474c7668d1a28e5df
origin/dev-ai: c57f76940815b89f6644117d9c94fc1ef610c73b
HEAD: ebbf4938c8b1cc768910e5ab4722ffbb6d97e1c5

> check:plt
> node scripts/sync-plt.mjs --check

Verified 10 PLT shared artifacts.

> check:theme-css
> node scripts/check-theme-css.mjs

check-theme-css: ok (6 markers present)

> check:no-legacy
> node scripts/check-no-legacy.mjs

check:no-legacy: ok — retired Alpine/Bulma assets blocked; any x-data in Liquid forbidden; Bulma markup scan off (assets b-style* always blocked).

> check:tailwind-arbitrary
> node scripts/check-tailwind-arbitrary.mjs --build


> build:css
> tailwindcss -i styles/global.css -o assets/theme.css --minify

≈ tailwindcss v4.3.5

Done in 228ms
check-tailwind-arbitrary: ok (scanned 243 files)

> test:templates:ci
> node scripts/test-templates-ci.mjs

test:templates:ci OK: 40/42 parsed; 2 expected failure(s): templates/blog.json, templates/page.test.json

> check:theme-check
> node scripts/check-theme-check-baseline.mjs

theme-check (@shopify/cli@3.91.0): 6 error(s), 362 warning(s) (baseline ≤ 6/362)

> check:branch-flow
> node scripts/check-branch-flow.mjs --base dev-ai --head cursor/fase1-preflight-tokens-a5e3

branch-flow: ok

> harness:snippet
> node tools/snippet-harness/render.mjs controls

Wrote tools/snippet-harness/.out/controls.layered.html

> harness:snippet
> node tools/snippet-harness/render.mjs controls

Wrote tools/snippet-harness/.out/controls.layered.html

> test:harness
> node scripts/run-harness-cases.mjs

harness: aa-hero-toggle-content OK
harness: article-card OK
harness: article-card-legacy-bulma FAILED
page.goto: net::ERR_FILE_NOT_FOUND at file:///agent/repos/PLT-liquid-theme/tools/snippet-harness/.out/article-card-legacy-bulma.html
Call log:
  - navigating to "file:///agent/repos/PLT-liquid-theme/tools/snippet-harness/.out/article-card-legacy-bulma.html", waiting until "load"

harness: b-carousel-desktop FAILED
page.goto: net::ERR_FILE_NOT_FOUND at file:///agent/repos/PLT-liquid-theme/tools/snippet-harness/.out/b-carousel-desktop.html
Call log:
  - navigating to "file:///agent/repos/PLT-liquid-theme/tools/snippet-harness/.out/b-carousel-desktop.html", waiting until "load"

harness: breadcrumb OK
harness: button OK
harness: carousel OK
harness: carousel-collection-card OK
harness: cart-footer-alpine-free OK
harness: cart-item-b OK
harness: cart-page-shell OK
harness: collection-hero-collapsable OK
harness: collection-list-carousel FAILED
page.goto: net::ERR_FILE_NOT_FOUND at file:///agent/repos/PLT-liquid-theme/tools/snippet-harness/.out/collection-list-carousel.html
Call log:
  - navigating to "file:///agent/repos/PLT-liquid-theme/tools/snippet-harness/.out/collection-list-carousel.html", waiting until "load"

harness: collection-product-grid OK
harness: collection-seo-faqs OK
harness: controls OK
harness: divider OK
harness: filter-bar OK
harness: filter-bar-boolean OK
harness: gift-card-badge OK
harness: header OK
harness: header-cart-bubble OK
harness: hero-expandable OK
harness: main-product-quantity OK
harness: pagination OK
harness: price OK
harness: product-card OK
harness: product-card-alpine-free OK
harness: product-card-quick-add OK
harness: sort-preserve OK
harness: 27/30 case(s) passed

> test:harness
> node scripts/run-harness-cases.mjs

harness: aa-hero-toggle-content OK
harness: article-card OK
harness: article-card-legacy-bulma OK
harness: b-carousel-desktop OK
harness: breadcrumb OK
harness: button OK
harness: carousel OK
harness: carousel-collection-card OK
harness: cart-footer-alpine-free OK
harness: cart-item-b OK
harness: cart-page-shell OK
harness: collection-hero-collapsable OK
harness: collection-list-carousel OK
harness: collection-product-grid OK
harness: collection-seo-faqs OK
harness: controls OK
harness: divider OK
harness: filter-bar OK
harness: filter-bar-boolean OK
harness: gift-card-badge OK
harness: header OK
harness: header-cart-bubble OK
harness: hero-expandable OK
harness: main-product-quantity OK
harness: pagination OK
harness: price OK
harness: product-card OK
harness: product-card-alpine-free OK
harness: product-card-quick-add OK
harness: sort-preserve OK
harness: 30/30 case(s) passed

=== Resumen gates (post-merge dev-ai) ===
check:plt OK | check:theme-css OK | check:no-legacy OK | check:tailwind-arbitrary OK
test:templates:ci 40/42 | check:theme-check 6/362 | check:branch-flow ok
test:harness 30/30 (env sin LEGACY_LAYER)
controls LEGACY_LAYER=import: OK manual
Preflight probe: plt-quantity 171x44 sin vs 145x40 con; filter checkboxes 0x0 con preflight
