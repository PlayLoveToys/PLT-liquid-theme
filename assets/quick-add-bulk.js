if (!customElements.get('quick-add-bulk')) {
  customElements.define(
    'quick-add-bulk',
    class QuickAddBulk extends BulkAdd {
      constructor() {
        super();
        // JS-Q2: prefer plt-quantity-selector (updates[]); keep Dawn quantity-input fallback.
        this.quantity =
          this.querySelector('plt-quantity-selector') || this.querySelector('quantity-input');
        if (this.quantity?.matches?.('plt-quantity-selector')) {
          this.syncPltQuantityInputAttrs(this.quantity);
        }

        const debouncedOnChange = debounce((event) => {
          const target = this.getQuantityInputFromEvent(event) || event.target;
          const value = parseInt(event.detail?.value ?? target.value, 10);
          if (value === 0) {
            target.setAttribute('value', value);
            const host = target.closest?.('plt-quantity-selector');
            if (host) host.setAttribute('value', String(value));
            this.startQueue(target.dataset.index, value);
          } else {
            this.validateQuantity(event);
          }
        }, ON_CHANGE_DEBOUNCE_TIMER);

        // WC: plt:quantity-change only (avoids double-fire with bubbling input change).
        if (this.quantity?.matches?.('plt-quantity-selector')) {
          this.quantity.addEventListener('plt:quantity-change', debouncedOnChange.bind(this));
        } else {
          this.addEventListener('change', debouncedOnChange.bind(this));
        }
        this.listenForActiveInput();
        this.listenForKeydown();
        this.lastActiveInputId = null;
      }

      connectedCallback() {
        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
          if (
            event.source === 'quick-add' ||
            (event.cartData.items && !event.cartData.items.some((item) => item.id === parseInt(this.dataset.index))) ||
            (event.cartData.variant_id && !(event.cartData.variant_id === parseInt(this.dataset.index)))
          ) {
            return;
          }
          // If its another section that made the update
          this.onCartUpdate().then(() => {
            this.listenForActiveInput();
            this.listenForKeydown();
          });
        });
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }
      }

      get input() {
        const host = this.querySelector('plt-quantity-selector');
        if (host) return this.syncPltQuantityInputAttrs(host) || host.querySelector('input[type="number"]');
        return this.querySelector('quantity-input input');
      }

      selectProgressBar() {
        return this.querySelector('.progress-bar-container');
      }

      listenForActiveInput() {
        if (!this.classList.contains('hidden')) {
          this.input?.addEventListener('focusin', (event) => event.target.select());
        }
        this.isEnterPressed = false;
      }

      listenForKeydown() {
        this.input?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            this.input?.blur();
            this.isEnterPressed = true;
          }
        });
      }

      cleanErrorMessageOnType(event) {
        event.target.addEventListener(
          'keypress',
          () => {
            event.target.setCustomValidity('');
          },
          { once: true }
        );
      }

      get sectionId() {
        if (!this._sectionId) {
          this._sectionId = this.closest('.collection-quick-add-bulk').dataset.id;
        }

        return this._sectionId;
      }

      onCartUpdate() {
        return new Promise((resolve, reject) => {
          fetch(`${this.getSectionsUrl()}?section_id=${this.sectionId}`)
            .then((response) => response.text())
            .then((responseText) => {
              const html = new DOMParser().parseFromString(responseText, 'text/html');
              const sourceQty = html.querySelector(`#quick-add-bulk-${this.dataset.index}-${this.sectionId}`);
              if (sourceQty) {
                this.innerHTML = sourceQty.innerHTML;
              }
              resolve();
            })
            .catch((e) => {
              console.error(e);
              reject(e);
            });
        });
      }

      getSectionsUrl() {
        const pageParams = new URLSearchParams(window.location.search);
        const pageNumber = decodeURIComponent(pageParams.get('page') || '');

        return `${window.location.pathname}${pageNumber ? `?page=${pageNumber}` : ''}`;
      }

      updateMultipleQty(items) {
        this.selectProgressBar().classList.remove('hidden');

        const ids = Object.keys(items);
        const body = JSON.stringify({
          updates: items,
          sections: this.getSectionsToRender().map((section) => section.section),
          sections_url: this.getSectionsUrl(),
        });

        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            const parsedState = JSON.parse(state);
            this.renderSections(parsedState, ids);
            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'quick-add', cartData: parsedState });
          })
          .catch(() => {
            // Commented out for now and will be fixed when BE issue is done https://github.com/Shopify/shopify/issues/440605
            // e.target.setCustomValidity(error);
            // e.target.reportValidity();
            // this.resetQuantityInput(ids[index]);
            // this.selectProgressBar().classList.add('hidden');
            // e.target.select();
            // this.cleanErrorMessageOnType(e);
          })
          .finally(() => {
            this.selectProgressBar().classList.add('hidden');
            this.setRequestStarted(false);
          });
      }

      getSectionsToRender() {
        return [
          {
            id: `quick-add-bulk-${this.dataset.index}-${this.sectionId}`,
            section: this.sectionId,
            selector: `#quick-add-bulk-${this.dataset.index}-${this.sectionId}`,
          },
          {
            id: 'cart-icon-bubble',
            section: 'cart-icon-bubble',
            selector: '.shopify-section',
          },
        ];
      }

      renderSections(parsedState, ids) {
        const intersection = this.queue.filter((element) => ids.includes(element.id));
        if (intersection.length !== 0) return;
        this.getSectionsToRender().forEach((section) => {
          const sectionElement = document.getElementById(section.id);
          const elementToReplace =
            sectionElement && sectionElement.querySelector(section.selector)
              ? sectionElement.querySelector(section.selector)
              : sectionElement;
          if (elementToReplace) {
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          }
        });

        if (this.isEnterPressed) {
          const restored =
            this.querySelector(`#Quantity-${this.lastActiveInputId}`) ||
            this.querySelector(`plt-quantity-selector[data-index="${this.lastActiveInputId}"] input[type="number"]`);
          restored?.select?.();
        }

        this.quantity =
          this.querySelector('plt-quantity-selector') || this.querySelector('quantity-input');
        if (this.quantity?.matches?.('plt-quantity-selector')) {
          this.syncPltQuantityInputAttrs(this.quantity);
        }

        this.listenForActiveInput();
        this.listenForKeydown();
      }
    }
  );
}
