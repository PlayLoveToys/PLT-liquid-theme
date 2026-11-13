// Markup mirror of templates/gift_card.liquid expired badge (layout none; theme.css + d-badge).
export default async () => {
  const expired = `<p class="d-badge theme-label-bold">Expired</p>`;
  const legacy = `<p class="badge badge--expired">Expired (legacy)</p>`;

  return `
<section class="case"><h3>Gift card expired → d-badge</h3>
  <div class="gift-card__price" style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
    <h1 style="margin:0;font:700 28px system-ui">$50.00</h1>
    ${expired}
  </div>
</section>
<section class="case"><h3>Legacy reference (template-giftcard.css, not loaded here)</h3>
  ${legacy}
</section>
<section class="case"><h3>DS reference</h3>
  <span class="d-badge theme-label-bold">Sold out</span>
  <span class="d-badge d-badge-secondary theme-label-bold">Sale</span>
</section>`;
};
