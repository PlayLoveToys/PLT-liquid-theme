const faqs = {
  title: [{language: 'en-US', value: 'Frequently asked questions'}],
  items: [
    {
      question: [{language: 'en-US', value: 'What is harness testing?'}],
      answer: [{language: 'en-US', value: 'Fixture render without Shopify runtime.'}],
    },
    {
      question: [{language: 'en-US', value: 'Is JSON-LD preserved?'}],
      answer: [{language: 'en-US', value: 'Yes — FAQPage block unchanged.'}],
    },
  ],
};

export default async ({engine}) => {
  const html = await engine.parseAndRender(
    `{% render '_collection-seo-faqs', faqs: faqs, locale: 'en-US' %}`,
    {faqs},
  );
  return `<section class="case"><h3>_collection-seo-faqs (plt-faq + d-collapse)</h3>${html}</section>`;
};