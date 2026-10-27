const { escapeHtml } = require('./dom');

/**
 * Universal counter for deterministic, accessible ID generation.
 */
let selectCounter = 0;

/**
 * Transforms a native <select> into an Awwwards-tier animated glass dropdown drawer.
 *
 * Keeps the native <select> visually hidden but fully synchronized in the DOM for:
 *  - Form submissions & native change handlers
 *  - Screen reader & assistive technology semantics
 *  - Programmatic value updates
 *
 * Implements WCAG 2.1 AA keyboard navigation:
 *  - [Enter] / [Space] / [ArrowDown] / [ArrowUp] opens drawer from trigger
 *  - [ArrowDown] / [ArrowUp] navigates options
 *  - [Home] / [End] jumps to first / last option
 *  - [Enter] / [Space] selects highlighted option and returns focus to trigger
 *  - [Escape] closes drawer and returns focus to trigger
 *  - [Tab] closes drawer and allows normal focus progression
 *  - Type-ahead character search jumps to matching items
 *
 * @param {HTMLSelectElement} selectEl - The native select element to enhance.
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.className] - Additional CSS class for the wrapper.
 * @param {string} [options.triggerClass] - Additional CSS class for the trigger button.
 * @param {string} [options.align='left'] - Alignment ('left' or 'right').
 * @param {string} [options.width] - Optional explicit width (e.g. '100%').
 * @param {string} [options.maxHeight='280px'] - Maximum height for options scroll.
 * @param {string} [options.placeholder='Selecione'] - Fallback trigger text if empty.
 * @returns {Object|null} Controller object with { wrap, trigger, list, open, close, sync, destroy }
 */
function createAwwwardsSelect(selectEl, options = {}) {
    if (!selectEl || selectEl.dataset.avEnhanced === 'true') return null;
    selectEl.dataset.avEnhanced = 'true';

    // Store original styling for clean restoration on destroy
    const originalStyle = selectEl.getAttribute('style') || '';
    const uniqueId =
        selectEl.id || `av-select-${++selectCounter}-${Math.random().toString(36).slice(2, 7)}`;
    const listId = `${uniqueId}-list`;
    const triggerId = `${uniqueId}-trigger`;

    // Visually hide native select with accessible screen-reader clipping
    selectEl.classList.add('av-sr-only');
    selectEl.setAttribute('tabindex', '-1');
    selectEl.setAttribute('aria-hidden', 'true');

    // Root wrapper
    const wrap = document.createElement('div');
    wrap.className = 'av-custom-select-wrap' + (options.className ? ` ${options.className}` : '');
    if (options.width) wrap.style.width = options.width;
    if (options.width === '100%') wrap.classList.add('w-full');

    // Accessible Trigger Button
    const trigger = document.createElement('button');
    trigger.id = triggerId;
    trigger.type = 'button';
    trigger.className = 'av-custom-select-trigger' + (options.triggerClass ? ` ${options.triggerClass}` : '');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', listId);

    const triggerLabel = document.createElement('span');
    triggerLabel.className = 'av-trigger-text';

    const chevron = document.createElement('span');
    chevron.className = 'av-select-chevron-icon';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = `<svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

    trigger.append(triggerLabel, chevron);

    // In-DOM Glass Dropdown Drawer
    const list = document.createElement('div');
    list.id = listId;
    list.className = 'select-options-list av-dropdown-drawer hidden';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-labelledby', triggerId);
    list.setAttribute('tabindex', '-1');

    if (options.align === 'right') {
        list.classList.add('av-dropdown-right');
    }
    if (options.maxHeight) {
        list.style.maxHeight = options.maxHeight;
    }

    list.__dropdownTrigger = trigger;
    list.__dropdownContainer = wrap;

    let highlightedIndex = -1;
    let typeAheadBuffer = '';
    let typeAheadTimeout = null;

    function getSelectedOption() {
        return selectEl.options[selectEl.selectedIndex] || selectEl.options[0] || null;
    }

    function updateTriggerText() {
        const opt = getSelectedOption();
        triggerLabel.textContent = opt ? opt.textContent : (options.placeholder || 'Selecione');
    }

    function isReducedMotion() {
        return typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function setHighlighted(index, scrollIntoView = true) {
        const items = list.querySelectorAll('.av-dropdown-item');
        if (!items.length) {
            highlightedIndex = -1;
            list.removeAttribute('aria-activedescendant');
            return;
        }

        // Bound index with wrap-around
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        highlightedIndex = index;

        items.forEach((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            item.classList.toggle('av-option-highlighted', isHighlighted);
            if (isHighlighted) {
                list.setAttribute('aria-activedescendant', item.id);
                if (scrollIntoView) {
                    item.scrollIntoView({ block: 'nearest' });
                }
            }
        });
    }

    function close() {
        if (list.classList.contains('hidden') || list.classList.contains('av-closing')) return;

        const chev = trigger.querySelector('.select-chevron');
        if (chev) chev.style.transform = '';
        trigger.setAttribute('aria-expanded', 'false');
        list.removeAttribute('aria-activedescendant');

        if (isReducedMotion()) {
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
        // Dismiss other open dropdowns across the site
        document.querySelectorAll('.select-options-list:not(.hidden)').forEach(el => {
            if (el !== list && typeof el.__close === 'function') {
                el.__close();
            } else if (el !== list) {
                el.classList.add('hidden');
                el.classList.remove('flex');
            }
        });

        rebuildList();

        // Responsive boundary detection: flip upward if clamped near viewport bottom
        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 220 && rect.top > 220) {
            list.classList.add('av-dropdown-dropup');
        } else {
            list.classList.remove('av-dropdown-dropup');
        }

        const chev = trigger.querySelector('.select-chevron');
        if (chev) chev.style.transform = 'rotate(180deg)';
        trigger.setAttribute('aria-expanded', 'true');

        list.classList.remove('hidden', 'av-closing');
        list.classList.add('flex');

        // Initial highlight matches currently selected option
        const selectedIdx = selectEl.selectedIndex >= 0 ? selectEl.selectedIndex : 0;
        setHighlighted(selectedIdx, true);
    }

    list.__close = close;

    function selectByIndex(index) {
        if (index < 0 || index >= selectEl.options.length) return;
        const opt = selectEl.options[index];
        selectEl.value = opt.value;
        updateTriggerText();
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        close();
        trigger.focus();
    }

    function rebuildList() {
        list.innerHTML = '';
        const currentVal = selectEl.value;

        Array.from(selectEl.options).forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = `${listId}-opt-${idx}`;
            btn.className = 'av-dropdown-item';
            btn.setAttribute('role', 'option');
            btn.style.setProperty('--item-idx', idx);

            const isSelected = String(opt.value) === String(currentVal);
            if (isSelected) {
                btn.classList.add('av-option-selected');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.setAttribute('aria-selected', 'false');
            }

            const beam = isSelected ? '<span class="av-selected-pill-beam" aria-hidden="true"></span>' : '';
            const check = isSelected
                ? '<svg class="av-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'
                : '';

            btn.innerHTML = `${beam}<span class="av-option-label"><span class="av-option-text">${escapeHtml(opt.textContent)}</span></span>${check}`;

            btn.addEventListener('mouseenter', () => {
                setHighlighted(idx, false);
            });

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectByIndex(idx);
            });

            list.appendChild(btn);
        });
    }

    // Trigger Click Handler
    const onTriggerClick = (e) => {
        e.stopPropagation();
        if (list.classList.contains('hidden')) {
            open();
        } else {
            close();
        }
    };
    trigger.addEventListener('click', onTriggerClick);

    // Keyboard Navigation for Trigger & List
    const onTriggerKeyDown = (e) => {
        const isClosed = list.classList.contains('hidden');

        if (isClosed) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                open();
            }
            return;
        }

        // Handle open list keyboard interactions
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(highlightedIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(highlightedIndex - 1);
        } else if (e.key === 'Home') {
            e.preventDefault();
            setHighlighted(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            setHighlighted(selectEl.options.length - 1);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (highlightedIndex >= 0) {
                selectByIndex(highlightedIndex);
            } else {
                close();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
            trigger.focus();
        } else if (e.key === 'Tab') {
            close();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Type-ahead match
            clearTimeout(typeAheadTimeout);
            typeAheadBuffer += e.key.toLowerCase();
            typeAheadTimeout = setTimeout(() => {
                typeAheadBuffer = '';
            }, 500);

            const matchIndex = Array.from(selectEl.options).findIndex(opt =>
                opt.textContent.trim().toLowerCase().startsWith(typeAheadBuffer)
            );
            if (matchIndex >= 0) {
                setHighlighted(matchIndex);
            }
        }
    };
    trigger.addEventListener('keydown', onTriggerKeyDown);

    // Document Outside Click Dismissal
    const onDocClick = (e) => {
        if (!wrap.contains(e.target)) {
            close();
        }
    };
    document.addEventListener('click', onDocClick);

    // Native Select Change Listener
    const onSelectChange = () => {
        updateTriggerText();
    };
    selectEl.addEventListener('change', onSelectChange);

    // Dynamic Mutation Observer for Options
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
        attributeFilter: ['selected', 'value']
    });

    // Initial Population
    updateTriggerText();
    rebuildList();

    // DOM Attachment
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
        open,
        close,
        sync: () => {
            updateTriggerText();
            rebuildList();
        },
        destroy: () => {
            trigger.removeEventListener('click', onTriggerClick);
            trigger.removeEventListener('keydown', onTriggerKeyDown);
            document.removeEventListener('click', onDocClick);
            selectEl.removeEventListener('change', onSelectChange);
            observer.disconnect();

            // Restore native select attributes
            delete selectEl.dataset.avEnhanced;
            selectEl.classList.remove('av-sr-only');
            selectEl.removeAttribute('tabindex');
            selectEl.removeAttribute('aria-hidden');
            if (originalStyle) {
                selectEl.setAttribute('style', originalStyle);
            } else {
                selectEl.removeAttribute('style');
            }

            // Restore DOM hierarchy
            if (wrap.parentNode) {
                wrap.parentNode.insertBefore(selectEl, wrap);
                wrap.remove();
            }
        }
    };
}

module.exports = { createAwwwardsSelect };
