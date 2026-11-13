
// Safe localStorage wrapper for sandboxed environments
function safeLocalStorage() {
    try {
        // Check if we're in a sandboxed environment
        if (window.self !== window.top) {
            console.warn('[Theme] Running in sandboxed environment - localStorage may not be available');
            return {
                getItem: function (key) {
                    try {
                        return localStorage.getItem(key);
                    } catch (e) {
                        console.warn('[Theme] localStorage getItem failed:', e.message);
                        return null;
                    }
                },
                setItem: function (key, value) {
                    try {
                        localStorage.setItem(key, value);
                    } catch (e) {
                        console.warn('[Theme] localStorage setItem failed:', e.message);
                    }
                },
                removeItem: function (key) {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {
                        console.warn('[Theme] localStorage removeItem failed:', e.message);
                    }
                },
                clear: function () {
                    try {
                        localStorage.clear();
                    } catch (e) {
                        console.warn('[Theme] localStorage clear failed:', e.message);
                    }
                }
            };
        }
        return localStorage;
    } catch (e) {
        console.warn('[Theme] localStorage not available:', e.message);
        return {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
            clear: () => { }
        };
    }
}

// Global storage instance
const storage = safeLocalStorage();

// CSP violation handler for sandboxed environments
function handleCSPViolations() {
    if (window.self !== window.top) {
        console.warn('[Theme] Running in sandboxed environment - CSP violations may occur');

        // Handle iframe loading errors gracefully
        window.addEventListener('error', function (event) {
            if (event.message && event.message.includes('Content Security Policy')) {
                console.warn('[Theme] CSP violation detected, continuing gracefully');
                event.preventDefault();
            }
        });

        // Handle unhandled promise rejections from CSP violations
        window.addEventListener('unhandledrejection', function (event) {
            if (event.reason && event.reason.message && event.reason.message.includes('Content Security Policy')) {
                console.warn('[Theme] CSP violation in promise, continuing gracefully');
                event.preventDefault();
            }
        });
    }
}

// Initialize CSP violation handling
handleCSPViolations();

// Touch event intervention handler for mobile browsers
function handleTouchInterventions() {
    if (window.self !== window.top) {
        console.warn('[Theme] Running in sandboxed environment - touch interventions may occur');

        // Handle touch event interventions gracefully
        let isScrolling = false;

        document.addEventListener('touchstart', function () {
            isScrolling = false;
        }, { passive: true });

        document.addEventListener('touchmove', function (event) {
            isScrolling = true;
            // Don't prevent default during scrolling to avoid interventions
        }, { passive: true });

        document.addEventListener('touchend', function (event) {
            // Only handle touch events if we weren't scrolling
            if (!isScrolling) {
                // Handle touch interactions here if needed
            }
            isScrolling = false;
        }, { passive: true });

        // Override preventDefault for touch events during scrolling
        const originalPreventDefault = Event.prototype.preventDefault;
        Event.prototype.preventDefault = function () {
            if (this.type === 'touchmove' && isScrolling) {
                console.warn('[Theme] Prevented touchmove preventDefault during scroll');
                return;
            }
            return originalPreventDefault.apply(this, arguments);
        };
    }
}

// Initialize touch intervention handling
handleTouchInterventions();
