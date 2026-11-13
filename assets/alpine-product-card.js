document.addEventListener('alpine:init', () => {
    Alpine.data('productCard', ({ productUrl, sectionId, productId }) => ({
        loading: false,
        modalOpen: false,
        errorMessage: '',
        quickAddInfo: '',

        init() {
            // Initialize logic if needed
        },

        addToCart(formElement) {
            this.loading = true;
            this.errorMessage = '';

            const formData = new FormData(formElement);

            // Add sections to update if cart drawer is present
            const cartNotification = document.querySelector('cart-notification');
            if (cartNotification) {
                formData.append(
                    'sections',
                    cartNotification.getSectionsToRender().map((section) => section.id)
                );
                formData.append('sections_url', window.location.pathname);
            }

            const config = {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/javascript'
                },
                body: formData
            };

            fetch(window.routes.cart_add_url, config)
                .then(response => response.json())
                .then(response => {
                    if (response.status) {
                        // Error
                        this.errorMessage = response.errors || response.description || response.message;

                        // Publish error event
                        if (window.publish && window.PUB_SUB_EVENTS) {
                            window.publish(window.PUB_SUB_EVENTS.cartError, {
                                source: 'product-form',
                                productVariantId: formData.get('id'),
                                errors: response.errors || response.description,
                                message: response.message
                            });
                        }
                        return;
                    }

                    // Success
                    if (window.publish && window.PUB_SUB_EVENTS) {
                        window.publish(window.PUB_SUB_EVENTS.cartUpdate, {
                            source: 'product-form',
                            productVariantId: formData.get('id'),
                            cartData: response
                        });
                    } else if (cartNotification) {
                        cartNotification.renderContents(response);
                    } else {
                        window.location = window.routes.cart_url;
                    }
                })
                .catch(e => {
                    console.error(e);
                    this.errorMessage = e.message;
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        openQuickAdd() {
            if (this.quickAddInfo) {
                this.modalOpen = true;
                return;
            }

            this.loading = true;

            fetch(productUrl)
                .then(response => response.text())
                .then(responseText => {
                    const parser = new DOMParser();
                    const responseHTML = parser.parseFromString(responseText, 'text/html');
                    const productElement = responseHTML.querySelector('product-info');

                    if (productElement) {
                        this.preprocessHTML(productElement);
                        this.quickAddInfo = productElement.outerHTML;
                        this.modalOpen = true;

                        // Initialize Shopify Payment Buttons and XR if needed
                        this.$nextTick(() => {
                            if (window.Shopify && Shopify.PaymentButton) {
                                Shopify.PaymentButton.init();
                            }
                            if (window.ProductModel) window.ProductModel.loadShopifyXR();
                        });
                    } else {
                        console.error('Product info not found in response');
                    }
                })
                .catch(e => console.error(e))
                .finally(() => {
                    this.loading = false;
                });
        },

        preprocessHTML(productElement) {
            const oldId = sectionId;
            const newId = `quickadd-${sectionId}`;

            // Replace IDs to prevent conflicts
            productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);

            Array.from(productElement.attributes).forEach((attribute) => {
                if (attribute.value.includes(oldId)) {
                    productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
                }
            });

            productElement.dataset.originalSection = sectionId;

            // Remove unwanted elements that might conflict or are not needed in modal
            productElement.querySelectorAll('pickup-availability, product-modal, modal-dialog').forEach(el => el.remove());

            // Prevent URL switching when selecting variants
            productElement.setAttribute('data-update-url', 'false');
        },

        closeModal() {
            this.modalOpen = false;
        }

    }));
});
