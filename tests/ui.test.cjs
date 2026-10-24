const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../frontend/ui/rating-scale');
const { createMotionController } = require('../frontend/ui/motion');

test('rating bands agree at decimal boundaries and keep missing values neutral', () => {
    for (const value of [null, undefined, '', '-', 0, -1, 11, Infinity, '8x']) assert.equal(ui.scoreTone(value), 'neutral', String(value));
    for (const value of [.1, 3.5, 4.9]) assert.equal(ui.scoreTone(value), 'low');
    for (const value of [5, 6.9]) assert.equal(ui.scoreTone(value), 'mid');
    for (const value of [7, 7.9]) assert.equal(ui.scoreTone(value), 'good');
    for (const value of [8, 8.1, '9,5', 10]) assert.equal(ui.scoreTone(value), 'high');
});

test('score colors remain CSS variables so theme changes do not need data rerenders', () => {
    assert.equal(ui.scoreColor(9.2).text, 'var(--score-high)');
    assert.equal(ui.scoreColor(3.2).text, 'var(--score-low)');
    assert.equal(ui.scoreColor(0).glow, 'var(--score-neutral-glow)');
});

test('replaced animations cancel safely and reduced motion skips new animations', async () => {
    let reduced = false;
    const fakeWindow = { matchMedia: () => ({ get matches() { return reduced; } }) };
    const controller = createMotionController(fakeWindow);
    const created = [];
    const element = { animate() {
        let reject;
        const animation = { finished: new Promise((_, fail) => { reject = fail; }), cancelled: false,
            cancel() { this.cancelled = true; reject(new Error('Animation replaced')); } };
        created.push(animation);
        return animation;
    } };
    controller.animate(element, [], { channel: 'detail' });
    controller.animate(element, [], { channel: 'detail' });
    assert.equal(created[0].cancelled, true);
    await Promise.resolve(); // Cleanup of the old animation must leave its replacement active.
    controller.cancelAll();
    assert.equal(created[1].cancelled, true);
    reduced = true;
    assert.equal(controller.animate(element, [], { channel: 'detail' }), null);
    assert.equal(created.length, 2);
});
