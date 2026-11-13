<!--
DRAFT — not published. Target: PlayLoveToys/PLT-design-system (public).
Suggested title below. Publish with:
  gh issue create --repo PlayLoveToys/PLT-design-system --title "<title>" --body-file docs/upstream/ds-issue-numeric-pagination.md
(remove this comment block and the "Title" line first)
-->

**Title:** `plt-pagination`: numbered store pagination needs a compact variant, and the Liquid adapter needs an `anchor` option

## Summary

`<plt-pagination>` (and the `Pagination` renderers) render numbered page links as wide, wrapping blocks, which
breaks the usual store use case (`Previous 1 2 … 11 12 Next`). Separately, the Liquid adapter cannot append a URL
fragment to its links, which blocks themes that paginate in-page content such as article comments.

Found while adopting the Liquid pagination adapter in a storefront theme.

## Problem 1: numbered pagination is not compact

`packages/design-system/src/patterns.css` (the `.plt-pagination` rules, around lines 802–824 on current `main`):

```css
.plt-pagination .d-join { flex-wrap: wrap; width: 100%; }
.plt-pagination .d-btn  { height: auto; min-height: var(--size); flex: 1 1 14rem; white-space: normal; … }
```

The comment above these rules says they are for doc pagination "with full page titles". With numeric labels
every button gets a 14rem flex-basis:

- At a 340px content width each button takes the full row: one column of 7 stacked buttons.
- At desktop width the buttons form a grid of ~14rem-wide cells instead of a single joined row.

Both the Lit component (`packages/web-components/src/collection/plt-pagination.ts`, which emits the same
`plt-pagination` / `d-join` markup) and the Astro/Liquid renderers share this CSS, so every consumer
with numbered pages is affected.

**Expected:** a compact joined row (`d-join`) of content-sized buttons that still wraps when there are too many
for the viewport.

**Proposal:** add an opt-in compact presentation and keep the current behavior as the default, so doc consumers
do not change:

- `<plt-pagination variant="compact">` (reflected attribute) adds `plt-pagination--compact` to the inner `nav`.
  Renderers/adapters accept the same flag (`compact: true` in Liquid, `compact` in Astro).
- CSS, scoped to the modifier:

  ```css
  .plt-pagination--compact .d-join { width: auto; }
  .plt-pagination--compact .d-btn  { flex: 0 0 auto; white-space: nowrap; min-width: var(--size); padding-inline: 0.75rem; }
  ```

An alternative is to default to compact when no label is longer than N characters, but an explicit variant is
easier to reason about and to test.

## Problem 2: no way to append a fragment to links

`packages/web-components/adapters/liquid/plt-pagination.liquid` builds every URL from `paginate.parts[].url`,
`paginate.previous.url` and `paginate.next.url` and exposes no way to add a suffix. Themes that paginate a
section of a page (e.g. an article's comments, which links to `?page=2#Comments-<article id>`) must otherwise
fall back to their own markup. Shopify themes commonly expose this as an `anchor` argument on their pagination
snippet.

**Proposal:** add an optional `anchor` parameter (e.g. `'#Comments-123'`) to the Liquid adapter and append it to:

- every `url` in the `pages` JSON,
- `previous-url` / `next-url`,
- the `data-plt-fallback` links.

The Astro adapter should take an equivalent prop for parity.

## Notes for the fix

- Update `packages/design-system/contracts/components.md` (Pagination) for the new flag and parameter.
- Cover both in the existing checks (`check:contracts`, `check:renderers`) and in a unit test for
  `plt-pagination` (compact class present; anchor present on all links).
- Visual check against a 12-page fixture at 390px and 1280px: the compact variant should be a single joined
  row at 1280px and wrap without one-button-per-row stacking at 390px.

## Consumer context

Until this ships, the affected storefront keeps its existing pagination markup. Following the upstream UI policy,
it will not carry a local override of the `.plt-pagination` CSS or edit the vendored `plt-pagination.liquid`
snippet.
