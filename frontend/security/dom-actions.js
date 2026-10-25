function installDomActions(browser) {
    const document = browser.document;
    document.addEventListener('click', (event) => {
        const reset = event.target.closest('[data-reset-filters]');
        if (reset) browser.resetFilters?.();
        const title = event.target.closest('[data-admin-title]');
        if (
            title &&
            ['admin', 'founder', 'both'].includes(title.dataset.adminTitle)
        )
            browser.selectAdminTitle?.(title.dataset.adminTitle);
        const dismiss = event.target.closest('[data-dismiss-welcome]');
        if (dismiss) {
            const modal = document.getElementById('member-welcome-modal');
            if (modal) {
                const remove = () => {
                    modal.remove();
                    document.body.style.overflow = '';
                };
                const animation = browser.AnivoidUI.animate(
                    modal,
                    [{ opacity: 1 }, { opacity: 0 }],
                    { duration: 400, fill: 'forwards' }
                );
                if (animation) animation.finished.catch(() => {}).then(remove);
                else remove();
            }
        }
    });
    document.addEventListener(
        'error',
        (event) => {
            const image = event.target;
            if (
                image.tagName === 'IMG' &&
                image.dataset.fallback ===
                    'covers/cyberpunk-edgerunners-2.jpg' &&
                !image.dataset.fallbackUsed
            ) {
                image.dataset.fallbackUsed = 'true';
                image.src = image.dataset.fallback;
            }
        },
        true
    );
}
module.exports = { installDomActions };
