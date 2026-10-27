const test = require('node:test');
const assert = require('node:assert/strict');
const { createAccountDrawer } = require('../frontend/account/drawer');

// A minimal DOM boundary keeps these tests about lifecycle and event ordering.
function fixture({ reduced = false, canManageSystem = () => false } = {}) {
    const nodes = new Map();
    const active = new Map();
    const animations = [];
    const document = { activeElement: null };
    const makeNode = (id = '') => {
        const attributes = new Map();
        const classes = new Set();
        const listeners = new Map();
        const node = {
            id, dataset: {}, style: {}, children: [], isConnected: true,
            classList: { add: (...values) => values.forEach((v) => classes.add(v)), remove: (...values) => values.forEach((v) => classes.delete(v)), contains: (v) => classes.has(v) },
            setAttribute: (key, value) => attributes.set(key, String(value)),
            getAttribute: (key) => attributes.get(key),
            addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(listener); },
            emit(type, event = {}) { for (const listener of listeners.get(type) || []) { listener(event); if (event.stopped) break; } },
            append(child) { child.parentElement = node; node.children.push(child); },
            replaceChildren(fragment) { node.children = fragment.children; },
            focus() { document.activeElement = node; },
            querySelector(selector) { if (selector === '.av-account-scrim') return scrim; if (selector === '#av-account-close') return closer; return node.firstFocus || null; },
            querySelectorAll: () => groups,
            closest: () => node.dataset.accountAction !== undefined ? node : null,
        };
        if (id) nodes.set(id, node);
        return node;
    };
    const panel = makeNode('friends-dropdown');
    panel.classList.add('hidden');
    const trigger = makeNode('profile-indicator');
    const closer = makeNode('av-account-close');
    const scrim = makeNode();
    const groups = [makeNode(), makeNode()];
    const list = makeNode('friends-dropdown-list');
    document.documentElement = { style: { overflow: 'auto' } };
    document.body = makeNode();
    document.getElementById = (id) => nodes.get(id) || null;
    let dialog;
    document.createElement = (tag) => {
        const node = makeNode();
        if (tag === 'dialog') {
            dialog = node;
            node.open = false;
            node.showModal = () => { node.open = true; };
            node.close = () => { node.open = false; node.emit('close'); };
        }
        node.click = () => click(node, 0);
        return node;
    };
    document.createDocumentFragment = () => makeNode();
    const cancel = (node) => {
        const entry = active.get(node);
        if (entry) { active.delete(node); entry.reject(Error('cancelled')); }
    };
    const motion = { cancel, animate(node) {
        cancel(node);
        let resolve, reject;
        const finished = new Promise((pass, fail) => { resolve = pass; reject = fail; });
        finished.catch(() => {});
        const entry = { finished, resolve, reject };
        active.set(node, entry);
        animations.push(entry);
        return entry;
    } };
    const browser = { document, matchMedia: () => ({ matches: reduced }), getComputedStyle: () => ({ transform: 'none', opacity: '1' }), requestAnimationFrame: (fn) => fn() };
    function click(node, detail = 1) {
        const event = { target: node, detail, stopped: false, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() { this.stopped = true; } };
        dialog.emit('click', event);
        if (!event.stopped) node.emit('click', event);
    }
    const drawer = createAccountDrawer(browser, motion, { canManageSystem });
    drawer.mount();
    const finish = async () => {
        for (const entry of active.values()) entry.resolve();
        active.clear();
        await new Promise(setImmediate);
    };
    const action = (handler) => {
        const button = makeNode('test-action');
        button.dataset.accountAction = '';
        button.dataset.accountDestination = 'destination';
        button.click = () => click(button, 0);
        const destination = makeNode('destination');
        destination.classList.add('hidden');
        destination.firstFocus = makeNode('destination-close');
        button.addEventListener('click', () => { destination.classList.remove('hidden'); handler(); });
        return button;
    };
    return { drawer, document, panel, trigger, closer, list, animations, action, click, finish, get dialog() { return dialog; } };
}

test('reduced motion opens immediately, contains focus and restores the previous scroll state', async () => {
    const f = fixture({ reduced: true });
    f.drawer.mount();
    assert.equal(f.document.body.children.length, 1);
    f.drawer.open();
    assert.equal(f.drawer.phase, 'open');
    assert.equal(f.document.activeElement, f.closer);
    assert.equal(f.trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(f.animations.length, 0);
    await f.drawer.close();
    assert.equal(f.drawer.phase, 'closed');
    assert.equal(f.dialog.open, false);
    assert.equal(f.document.activeElement, f.trigger);
    assert.equal(f.document.documentElement.style.overflow, 'auto');
});

test('reopening an interrupted exit cannot be hidden by its stale completion', async () => {
    const f = fixture();
    f.drawer.open();
    const closing = f.drawer.close();
    f.drawer.open();
    await f.finish();
    await closing;
    assert.equal(f.drawer.phase, 'open');
    assert.equal(f.dialog.open, true);
    assert.equal(f.trigger.getAttribute('aria-expanded'), 'true');
    await f.drawer.close({ animate: false });
});

test('repeated close requests share one exit and keyboard dismissal finishes immediately', async () => {
    const f = fixture();
    f.drawer.open({ animate: false });
    const first = f.drawer.close();
    assert.equal(f.drawer.close(), first);
    await f.drawer.close({ animate: false });
    await first;
    assert.equal(f.drawer.phase, 'closed');
    assert.equal(f.panel.classList.contains('hidden'), true);
    assert.equal(f.trigger.getAttribute('aria-expanded'), 'false');
});

test('an account action executes once after the drawer closes and receives focus', async () => {
    const f = fixture();
    let calls = 0;
    const action = f.action(() => { calls++; assert.equal(f.drawer.phase, 'closed'); });
    f.drawer.open({ animate: false });
    f.click(action);
    assert.equal(calls, 0);
    assert.equal(f.drawer.phase, 'closing');
    await f.finish();
    assert.equal(calls, 1);
    assert.equal(f.document.activeElement.id, 'destination-close');
});

test('Escape during the exit cancels a pending destination instead of opening it later', async () => {
    const f = fixture();
    let calls = 0;
    const action = f.action(() => calls++);
    f.drawer.open({ animate: false });
    f.click(action);
    f.dialog.emit('keydown', { key: 'Escape', preventDefault() {}, stopPropagation() {} });
    await f.finish();
    assert.equal(calls, 0);
    assert.equal(f.drawer.phase, 'closed');
    assert.equal(f.document.activeElement, f.trigger);
});

test('reviewer names remain text and the selected identity reaches the existing action', () => {
    const f = fixture();
    const friend = { id: 'ana', name: '<img src=x onerror=alert(1)>', avatar: 'javascript:alert(1)' };
    let selection;
    f.drawer.renderReviewers([friend], 'ana', (value) => { selection = value; });
    const button = f.list.children[0];
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.match(button.innerHTML, /&lt;img/);
    assert.doesNotMatch(button.innerHTML, /src="javascript:/);
    button.click();
    assert.equal(selection, friend);
});

test('privileged account tools start hidden and cannot be invoked by a member', () => {
    const f = fixture();
    assert.match(f.panel.innerHTML, /id="av-account-tools" hidden/);
    for (const id of ['open-backup-center', 'open-admin-center']) {
        assert.match(f.panel.innerHTML, new RegExp(`id="${id}"[^>]*hidden disabled data-account-owner-only`));
    }
    let calls = 0;
    const action = f.action(() => calls++);
    action.dataset.accountOwnerOnly = '';
    f.drawer.open({ animate: false });
    f.click(action);
    assert.equal(calls, 0);
    assert.equal(f.drawer.phase, 'open');
});

test('revoking owner access during the drawer exit cancels the privileged handoff', async () => {
    let allowed = true, calls = 0;
    const f = fixture({ canManageSystem: () => allowed });
    const action = f.action(() => calls++);
    action.dataset.accountOwnerOnly = '';
    f.drawer.open({ animate: false });
    f.click(action);
    allowed = false;
    await f.finish();
    assert.equal(calls, 0);
    assert.equal(f.drawer.phase, 'closed');
});
