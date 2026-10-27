const { escapeHtml } = require('./dom');

/**
 * Transforms a native <select> into an Awwwards-tier animated glass dropdown drawer.
 * Keeps the native <select> visually hidden but fully synchronized in the DOM for accessibility,
 * forms, and programmatic access.
 */
function createAwwwardsSelect(selectEl, options = {}) {
    if (!selectEl || selectEl.dataset.avEnhanced === 'true') return null;
    selectEl.dataset.avEnhanced = 'true';

    // Visually hide native select
    selectEl.classList.add('av-sr-only');
    selectEl.style.cssText =
        'position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; opacity: 0 !important; pointer-events: none !important; z-index: -1 !important;';

    // Wrapper container
    const wrap = document.createElement('div');
    wrap.className =
        'av-custom-select-wrap' +
        (options.className ? ' ' + options.className : '');
    wrap.style.position = 'relative';
    wrap.style.display =
        options.display || (options.width === '100%' ? 'block' : 'inline-block');
    if (options.width) wrap.style.width = options.width;

    // Trigger button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className =
        'av-custom-select-trigger' +
        (options.triggerClass ? ' ' + options.triggerClass : '');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerLabel = document.createElement('span');
    triggerLabel.className = 'av-trigger-text';

    const chevron = document.createElement('span');
    chevron.className = 'av-select-chevron-icon';
    chevron.innerHTML = `<svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);"><path d="m6 9 6 6 6-6"/></svg>`;

    trigger.append(triggerLabel, chevron);

    // Dropdown list drawer
    const list = document.createElement('div');
    list.className = 'select-options-list av-dropdown-drawer flex-col hidden';
    list.setAttribute('role', 'listbox');
    list.style.position = 'absolute';
    list.style.zIndex = '10050';
    if (options.align === 'right') {
        list.style.left = 'auto';
        list.style.right = '0';
        list.style.minWidth = '180px';
    } else {
        list.style.left = '0';
        list.style.right = '0';
        list.style.width = '100%';
    }
    list.style.top = 'calc(100% + 6px)';
    list.style.maxHeight = options.maxHeight || '280px';
    list.style.overflowY = 'auto';

    list.__dropdownTrigger = trigger;
    list.__dropdownContainer = wrap;

    function getSelectedOption() {
        const selected = selectEl.options[selectEl.selectedIndex];
        return selected || selectEl.options[0] || null;
    }

    function updateTriggerText() {
        const opt = getSelectedOption();
        triggerLabel.textContent = opt
            ? opt.textContent
            : options.placeholder || 'Selecione';
    }

    function close() {
        if (
            list.classList.contains('hidden') ||
            list.classList.contains('av-closing')
        )
            return;
        const chev = trigger.querySelector('.select-chevron');
        if (chev) chev.style.transform = '';
        trigger.setAttribute('aria-expanded', 'false');

        if (
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            list.classList.add('hidden');
            list.classList.remove('flex', 'av-closing');
            return;
        }

        list.classList.add('av-closing');
        setTimeout(() => {
            list.classList.add('hidden');
            list.classList.remove('flex', 'av-closing');
        }, 160);
    }

    function open() {
        // Close all other open dropdowns first
        document
            .querySelectorAll('.select-options-list:not(.hidden)')
            .forEach((el) => {
                if (el !== list && typeof el.__close === 'function')
                    el.__close();
                else if (el !== list) {
                    el.classList.add('hidden');
                    el.classList.remove('flex');
                }
            });

        rebuildList();

        // Check if opens upward or downward based on viewport
        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 220 && rect.top > 220) {
            list.style.top = 'auto';
            list.style.bottom = 'calc(100% + 6px)';
        } else {
            list.style.bottom = 'auto';
            list.style.top = 'calc(100% + 6px)';
        }

        const chev = trigger.querySelector('.select-chevron');
        if (chev) chev.style.transform = 'rotate(180deg)';
        trigger.setAttribute('aria-expanded', 'true');

        list.classList.remove('hidden', 'av-closing');
        list.classList.add('flex');

        // Re-trigger staggered item cascade animations
        list.querySelectorAll('.av-dropdown-item').forEach((btn) => {
            btn.style.animation = 'none';
            void btn.offsetWidth;
            btn.style.animation = '';
        });

        // Scroll selected item into view
        const selectedBtn = list.querySelector('.av-option-selected');
        if (selectedBtn) {
            selectedBtn.scrollIntoView({ block: 'nearest' });
        }
    }

    list.__close = close;

    function rebuildList() {
        list.innerHTML = '';
        const currentVal = selectEl.value;

        Array.from(selectEl.options).forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'av-dropdown-item';
            btn.setAttribute('role', 'option');
            btn.style.setProperty('--item-idx', idx);

            const isSelected = String(opt.value) === String(currentVal);
            if (isSelected) {
                btn.classList.add('av-option-selected');
                btn.setAttribute('aria-selected', 'true');
            }

            const beam = isSelected
                ? '<span class="av-selected-pill-beam"></span>'
                : '';
            const check = isSelected
                ? '<svg class="av-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px; margin-left: auto; flex-shrink: 0; color: var(--av-accent);"><polyline points="20 6 9 17 4 12"/></svg>'
                : '';

            btn.innerHTML = `${beam}<span class="av-option-label"><span class="av-option-text">${escapeHtml(opt.textContent)}</span></span>${check}`;

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.style.transform = 'scale(0.96)';

                selectEl.value = opt.value;
                updateTriggerText();
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));

                close();
            });

            list.appendChild(btn);
        });
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (list.classList.contains('hidden')) {
            open();
        } else {
            close();
        }
    });

    // Close on outside click
    const onDocClick = (e) => {
        if (!wrap.contains(e.target)) {
            close();
        }
    };
    document.addEventListener('click', onDocClick);

    // Close on Escape key
    const onDocKey = (e) => {
        if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onDocKey);

    // Sync when select value changes
    selectEl.addEventListener('change', () => {
        updateTriggerText();
    });

    // MutationObserver to watch options dynamic updates
    const observer = new MutationObserver(() => {
        updateTriggerText();
        if (!list.classList.contains('hidden')) {
            rebuildList();
        }
    });
    observer.observe(selectEl, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['selected', 'value'],
    });

    updateTriggerText();
    rebuildList();

    // Insert wrapper in DOM
    if (selectEl.parentNode) {
        selectEl.parentNode.insertBefore(wrap, selectEl);
        wrap.appendChild(selectEl);
        wrap.appendChild(trigger);
        wrap.appendChild(list);
    }

    return {
        wrap,
        trigger,
        list,
        sync: () => {
            updateTriggerText();
            rebuildList();
        },
        destroy: () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onDocKey);
            observer.disconnect();
            if (wrap.parentNode) {
                wrap.parentNode.insertBefore(selectEl, wrap);
                wrap.remove();
            }
        },
    };
}

module.exports = { createAwwwardsSelect };
