// assets/cart-api.js

; (() => {
    async function request(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        let data = null;

        try {
            // Shopify casi siempre devuelve JSON en la API de cart
            data = await response.json();
        } catch (e) {
            // Si no hay JSON, lo dejamos como null
        }

        if (!response.ok) {
            // Shopify suele mandar { description, message, status }
            const message =
                (data && (data.description || data.message)) ||
                `Cart request failed with status ${response.status}`;

            const error = new Error(message);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    const CartApi = {
        /**
         * Obtiene el carrito completo desde Shopify (/cart.js)
         */
        get() {
            return request('/cart.js', {
                method: 'GET',
            });
        },

        /**
         * Agrega una variante al carrito
         * @param {number} variantId - ID de la variante
         * @param {number} quantity  - Cantidad (por defecto 1)
         * @param {object|null} properties - Opcional: propiedades personalizadas
         */
        add(variantId, quantity = 1, properties = null) {
            const payload = { id: variantId, quantity };

            if (properties && typeof properties === 'object') {
                payload.properties = properties;
            }

            return request('/cart/add.js', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },

        /**
         * Cambia la cantidad de una línea específica del carrito
         * @param {number} id - ID de variante)
         * @param {number} quantity - nueva cantidad (0 para eliminar)
         */
        change(id, quantity) {
            return request('/cart/change.js', {
                method: 'POST',
                body: JSON.stringify({ id, quantity }),
            });
        },

        /**
         * Actualiza múltiples campos del carrito en un solo request
         * (por ejemplo attributes, note, etc.)
         * @param {object} payload - objeto con campos de /cart/update.js
         */
        update(payload = {}) {
            return request('/cart/update.js', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
    };

    // Exponer en el global para que Alpine lo use: this.CartApi / window.CartApi
    window.CartApi = CartApi;
})();
