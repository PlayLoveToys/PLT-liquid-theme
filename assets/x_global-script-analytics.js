// Global Analytics Script for PlayLoveToys
// This file handles analytics tracking and events

(function () {
  'use strict';

  // Initialize analytics when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {

    // Track page views
    if (typeof window.plausible !== 'undefined') {
      window.plausible('pageview');
    }

    // Track outbound links
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link && link.hostname !== window.location.hostname) {
        if (typeof window.plausible !== 'undefined') {
          window.plausible('Outbound Link: Click', {
            props: { url: link.href }
          });
        }
      }
    });

    // Track form submissions
    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (form.tagName === 'FORM') {
        if (typeof window.plausible !== 'undefined') {
          window.plausible('Form Submit', {
            props: { form: form.action || 'unknown' }
          });
        }
      }
    });

    // Track cart events
    document.addEventListener('cart:item-added', function (event) {
      if (typeof window.plausible !== 'undefined') {
        window.plausible('Add to Cart', {
          props: {
            product: event.detail.product_title || 'unknown',
            variant: event.detail.variant_title || 'unknown'
          }
        });
      }
    });

    // Track search events
    var searchForms = document.querySelectorAll('form[action*="/search"]');
    searchForms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var searchInput = form.querySelector('input[name="q"]');
        if (searchInput && searchInput.value) {
          if (typeof window.plausible !== 'undefined') {
            window.plausible('Search', {
              props: { query: searchInput.value }
            });
          }
        }
      });
    });

  });

})();

window.plausible =
  window.plausible ||
  function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
