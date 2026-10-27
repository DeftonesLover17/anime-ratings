const test = require('node:test');
const assert = require('node:assert/strict');
const { createDesignUpdate } = require('../frontend/account/design-update');
test('notice waits for login, remembers dismissal per account and closes on logout', () => {
    let username = '', tick, changed, dialog, blocked = true;
    const saved = new Map(), handlers = {};
    const doc = {
        body: { appendChild() {} }, addEventListener() {},
        querySelectorAll: () => blocked ? [{ classList: { contains: () => false } }] : [],
        createElement: () => dialog = {
            open: false, setAttribute() {},
            querySelector: selector => ({ addEventListener: (_, fn) => handlers[selector] = fn, focus() {} }),
            addEventListener: (event, fn) => handlers[event] = fn,
            showModal() { this.open = true; }, close() { this.open = false; }
        }
    };
    const browser = {
        document: doc, getComputedStyle: () => ({ display: 'flex' }),
        requestAnimationFrame: fn => { tick = fn; return 1; }, cancelAnimationFrame: () => { tick = null; },
        MutationObserver: class { constructor(fn) { changed = fn; } observe() {} disconnect() {} }
    };
    const notice = createDesignUpdate(browser, { username: () => username }, {
        getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value)
    });
    notice.sync(); assert.equal(dialog, undefined);
    username = 'Ana'; notice.sync(); tick(); assert.equal(dialog, undefined);
    blocked = false; changed(); tick(); assert.equal(dialog.open, true);
    handlers['[data-update-enter]'](); assert.equal(dialog.open, false);
    notice.sync(); assert.equal(dialog.open, false);
    username = 'Bruno'; notice.sync(); tick(); assert.equal(dialog.open, true);
    username = ''; notice.sync(); assert.equal(dialog.open, false);
    username = 'Bruno'; notice.sync(); tick(); assert.equal(dialog.open, true);
    handlers.cancel({ preventDefault() {} }); notice.sync(); assert.equal(dialog.open, false);
    assert.equal(saved.size, 2);
});
