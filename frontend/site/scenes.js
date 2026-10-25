function createScenes(browser, animateFallback) {
    const document = browser.document;
    const preference = browser.matchMedia('(prefers-reduced-motion: reduce)');
    let sequence = 0;
    let transition;
    const pending = new Set();
    const observer = new browser.IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.dataset.entered = 'true';
                pending.delete(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px 32px 0px' },
    );

    preference.addEventListener('change', () => {
        if (!preference.matches) return;
        transition?.skipTransition();
        pending.forEach((node) => {
            node.dataset.entered = 'true';
            observer.unobserve(node);
        });
        pending.clear();
    });

    function reveal(root) {
        const nodes = [...root.querySelectorAll('[data-av-reveal]')];
        nodes.forEach((node, index) => {
            node.style.setProperty(
                '--av-delay',
                `${Math.min(index % 5, 4) * 38}ms`,
            );
            if (preference.matches) node.dataset.entered = 'true';
            else {
                node.dataset.entered = 'false';
                pending.add(node);
                observer.observe(node);
            }
        });
        return () =>
            nodes.forEach((node) => {
                pending.delete(node);
                observer.unobserve(node);
            });
    }

    function coverFor(id) {
        return [...document.querySelectorAll('[data-av-cover]')].find(
            (node) =>
                node.dataset.avCover === String(id) &&
                node.getClientRects().length &&
                node.getBoundingClientRect().bottom > 72 &&
                node.getBoundingClientRect().top < browser.innerHeight,
        );
    }

    function finish() {
        const current = transition;
        current?.skipTransition();
        return current?.finished.catch(() => {});
    }

    function cancel() {
        sequence++;
        return finish();
    }

    function run(
        update,
        {
            source,
            destination,
            animate = true,
            kind = 'forward',
            sharedName = 'av-scene-media',
        } = {},
    ) {
        const token = ++sequence;
        transition?.skipTransition();
        const splash = document.getElementById('splash-screen');
        const introVisible =
            splash && browser.getComputedStyle(splash).display !== 'none';
        if (!animate || preference.matches || introVisible) {
            update();
            return;
        }
        if (!document.startViewTransition) {
            update();
            const detail = document.getElementById('anime-detail-page');
            const target =
                detail && !detail.classList.contains('hidden')
                    ? detail
                    : document.getElementById('anime-grid-section');
            animateFallback?.(target, [{ opacity: 0.4 }, { opacity: 1 }], {
                channel: 'site-scene',
                duration: 200,
                easing: 'cubic-bezier(.22,1,.36,1)',
            });
            return;
        }
        const owned = [];
        const name = sharedName;
        let applied = false;
        const tag = (node) => {
            if (!node) return;
            node.dataset.avTransitionOwner = String(token);
            node.style.viewTransitionName = name;
            owned.push(node);
        };
        const releaseOwned = () =>
            owned.forEach((node) => {
                if (node.dataset.avTransitionOwner !== String(token)) return;
                node.style.viewTransitionName = '';
                delete node.dataset.avTransitionOwner;
            });
        tag(source);
        document.documentElement.dataset.avScene = kind;
        try {
            const current = document.startViewTransition(() => {
                if (token !== sequence) return;
                applied = true;
                if (source) source.style.viewTransitionName = '';
                update();
                tag(destination?.());
            });
            transition = current;
            current.ready.catch(() => {});
            current.finished
                .catch(() => {})
                .finally(() => {
                    releaseOwned();
                    if (transition === current) transition = null;
                    delete document.documentElement.dataset.avScene;
                });
        } catch (_) {
            releaseOwned();
            if (!applied) update();
        }
    }

    return { run, reveal, coverFor, finish, cancel };
}

module.exports = { createScenes };
