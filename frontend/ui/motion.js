function createMotionController(browser) {
    const activeAnimations = new Map();
    const reducedMotion = browser.matchMedia('(prefers-reduced-motion: reduce)');

    function cancel(channel) {
        const animation = activeAnimations.get(channel);
        if (animation) { activeAnimations.delete(channel); animation.cancel(); }
    }

    function cancelAll() { Array.from(activeAnimations.keys()).forEach(cancel); }

    function animate(element, frames, options = {}) {
        const { channel = element, ...timing } = options;
        cancel(channel);
        if (!element || !element.animate || reducedMotion.matches) return null;
        const animation = element.animate(frames, timing);
        activeAnimations.set(channel, animation);
        const clean = () => { if (activeAnimations.get(channel) === animation) activeAnimations.delete(channel); };
        // Cancellation rejects finished; consume that rejection as normal interruption.
        animation.finished.then(clean, clean);
        return animation;
    }

    function install() {
        reducedMotion.addEventListener('change', cancelAll);
        browser.document.addEventListener('visibilitychange', () => { if (browser.document.hidden) cancelAll(); });
    }

    return { animate, cancel, cancelAll, install };
}

module.exports = { createMotionController };
