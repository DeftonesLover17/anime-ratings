const test = require('node:test');
const assert = require('node:assert/strict');
const { bindCatalogSaveForm } = require('../frontend/catalog/save-form');

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
class Control extends EventTarget { setAttribute() {} }

function fixture({ fields = () => ({ title: 'Anime A' }), onSaved } = {}) {
    const form = new Control(), button = new Control(), close = new Control(), disabledInput = new Control();
    disabledInput.disabled = true;
    button.disabled = close.disabled = false;
    button.innerHTML = '<span>Salvar</span><svg></svg>';
    form.querySelectorAll = () => [button, disabledInput];
    const nodes = { 'add-anime-form': form, 'anime-form-submit': button, 'close-add-anime': close };
    const operation = deferred(), saved = [], errors = [], timers = new Map();
    let version = 0, calls = 0, signal, timerId = 0;
    const browser = {
        document: { getElementById: id => nodes[id] },
        fetch: (url, init) => { calls++; signal = init.signal; return operation.promise; },
        setTimeout: callback => { timers.set(++timerId, callback); return timerId; },
        clearTimeout: id => timers.delete(id)
    };
    const session = { username: () => 'Felipe!', version: () => version, isCurrent: current => current === version,
        invalidatePending: () => version++ };
    const controller = bindCatalogSaveForm(browser, { session, canEdit: () => true, readFields: fields,
        onSaved: onSaved || (result => saved.push(result)), onError: error => errors.push(error.message) });
    controller.begin();
    return { controller, browser, session, button, close, disabledInput, operation, saved, errors, timers,
        calls: () => calls, signal: () => signal, changeSession: () => version++ };
}
const response = () => ({ ok: true, json: async () => ({ anime: { id: 'a', title: 'Anime A' } }) });

test('catalog saves deduplicate submissions and protect the modal until completion', async () => {
    const f = fixture();
    const label = f.button.innerHTML;
    const beforeSave = f.session.version();
    const pending = f.controller.submit();
    assert.equal(f.session.isCurrent(beforeSave), false);
    const duringSave = f.session.version();
    await f.controller.submit();
    assert.equal(f.calls(), 1);
    assert.equal(f.controller.busy, true);
    assert.equal(f.controller.close(), false);
    assert.equal(f.controller.begin(), false);
    assert.equal(f.button.disabled, true);
    assert.equal(f.close.disabled, true);
    f.operation.resolve(response());
    await pending;
    assert.equal(f.saved.length, 1);
    assert.equal(f.session.isCurrent(duringSave), false);
    assert.equal(f.controller.busy, false);
    assert.equal(f.button.disabled, false);
    assert.equal(f.disabledInput.disabled, true);
    assert.equal(f.button.innerHTML, label);
    assert.equal(f.controller.close(), true);
});

test('an old catalog response cannot restore data after the session changes', async () => {
    const f = fixture();
    const pending = f.controller.submit();
    f.changeSession();
    f.operation.resolve(response());
    await pending;
    assert.equal(f.saved.length, 0);
    assert.deepEqual(f.errors, []);
    assert.equal(f.controller.busy, false);
});

test('catalog timeout releases the form without repeating an uncertain mutation', async () => {
    const f = fixture();
    const pending = f.controller.submit();
    [...f.timers.values()][0]();
    await pending;
    assert.equal(f.calls(), 1);
    assert.equal(f.signal().aborted, true);
    assert.equal(f.controller.busy, false);
    assert.match(f.errors[0], /conferir se a obra foi salva/);
    assert.equal(f.timers.size, 0);
});

test('invalid logo fields prevent submission and a post-save rendering error is explicit', async () => {
    const invalid = fixture({ fields: () => null });
    await invalid.controller.submit();
    assert.equal(invalid.calls(), 0);
    const saved = fixture({ onSaved: () => { throw new Error('local rendering failed'); } });
    const pending = saved.controller.submit();
    saved.operation.resolve(response());
    await pending;
    assert.match(saved.errors[0], /A obra foi salva/);
    assert.equal(saved.calls(), 1);
});
