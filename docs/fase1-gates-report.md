=== Gates post-merge dev-ai 9a8593d+ 2026-11-18T19:01:30Z ===
origin/dev-ai: 9a8593def0e17741f099c682cdea6b65aa5223d5
HEAD tras merge: 154f3c7afb5a05f875167b945671fbc106099195

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

Done in 227ms
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

> test:harness
> node scripts/run-harness-cases.mjs

harness: a-logo-motto OK
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
harness: 31/31 case(s) passed

=== Resumen ===
Todos los gates OK; test:harness 31/31 (incl. a-logo-motto #33)
Preflight probe: sin qty 171x44 / con 145x40; d-btn pad 1px vs 0px → sigue diferido
