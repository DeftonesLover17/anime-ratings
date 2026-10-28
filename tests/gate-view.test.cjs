const test = require('node:test');
const assert = require('node:assert/strict');
const { bindRegistrationGateView } = require('../frontend/account/gate-view');

function fixture() {
    const nodes = new Map();
    const makeNode = (id, classes = []) => {
        const listeners = new Map(), attributes = new Map(), values = new Set(classes);
        const node = {
            id, dataset: {}, className: '',
            classList: {
                toggle(name, force) { if (force) values.add(name); else values.delete(name); },
                contains: name => values.has(name)
            },
            setAttribute: (name, value) => attributes.set(name, String(value)),
            getAttribute: name => attributes.get(name),
            addEventListener(type, listener) { listeners.set(type, listener); },
            emit(type, target) { listeners.get(type)?.({ target }); }
        };
        nodes.set(id, node);
        return node;
    };
    const registration = makeNode('registration-form');
    const login = makeNode('login-form', ['hidden']);
    const gate = makeNode('registration-gate');
    const tabRegister = makeNode('tab-register');
    const tabLogin = makeNode('tab-login');
    const toLogin = { id: 'toggle-to-login', closest: () => toLogin };
    const toRegister = { id: 'toggle-to-register', closest: () => toRegister };
    makeNode('reg-header-tag'); makeNode('reg-header-title'); makeNode('reg-header-desc'); makeNode('reg-indicators');
    const document = { readyState: 'complete', getElementById: id => nodes.get(id) || null };
    bindRegistrationGateView({ document });
    return { gate, registration, login, tabRegister, tabLogin, toLogin, toRegister };
}

test('login switch remains available independently from registration setup', () => {
    const f = fixture();
    f.gate.emit('click', f.toLogin);
    assert.equal(f.registration.classList.contains('hidden'), true);
    assert.equal(f.login.classList.contains('hidden'), false);
    assert.equal(f.tabLogin.getAttribute('aria-pressed'), 'true');
    f.gate.emit('click', f.toRegister);
    assert.equal(f.registration.classList.contains('hidden'), false);
    assert.equal(f.login.classList.contains('hidden'), true);
    assert.equal(f.tabRegister.getAttribute('aria-pressed'), 'true');
});
