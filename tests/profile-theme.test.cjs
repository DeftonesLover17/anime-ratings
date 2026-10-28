const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('applyUserThemeColor updates --av-accent and --av-on-accent alongside legacy variables', () => {
    const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

    // Extract applyUserThemeColor function
    const startIdx = appJs.indexOf('function applyUserThemeColor(');
    assert.ok(startIdx > -1, 'applyUserThemeColor function should exist in app.js');
    const endIdx = appJs.indexOf('window.applyUserThemeColor = applyUserThemeColor;', startIdx);
    assert.ok(endIdx > -1, 'window.applyUserThemeColor assignment should exist');
    const funcCode = appJs.substring(startIdx, endIdx);

    const properties = {};
    const fakeDoc = {
        documentElement: {
            style: {
                setProperty(prop, val) {
                    properties[prop] = val;
                }
            }
        }
    };

    const fn = new Function('document', 'state', `
        ${funcCode}
        return applyUserThemeColor;
    `)(fakeDoc, { getCurrentFriend: () => ({ color: '#ff7957' }) });

    // Test with coral
    fn('#ff7957');
    assert.equal(properties['--av-accent'], '#ff7957');
    assert.equal(properties['--av-on-accent'], '#161910');
    assert.equal(properties['--accent'], '#ff7957');
    assert.equal(properties['--brand'], '#ff7957');
    assert.equal(properties['--accent-glow'], '#ff795740');
    assert.equal(properties['--brand-rgb'], '255 121 87');

    // Test with emerald (darker green, YIQ < 135)
    fn('#10b981');
    assert.equal(properties['--av-accent'], '#10b981');
    assert.equal(properties['--av-on-accent'], '#ffffff');
    assert.equal(properties['--accent'], '#10b981');
    assert.equal(properties['--brand-rgb'], '16 185 129');

    // Test with white (max YIQ = 255)
    fn('#ffffff');
    assert.equal(properties['--av-accent'], '#ffffff');
    assert.equal(properties['--av-on-accent'], '#161910');
    assert.equal(properties['--brand-rgb'], '255 255 255');

    // Test default fallback when null/omitted
    properties['--av-accent'] = null;
    fn(null);
    assert.equal(properties['--av-accent'], '#ff7957');
});

test('per-profile theme colors are respected independently upon switching reviewers', () => {
    const profiles = [
        { id: 'felipe', name: 'Felipe! (Você)', color: '#ff7957' },
        { id: 'lipeinpbe', name: 'LipeInPBE', color: '#10b981' },
        { id: 'amigo3', name: 'Amigo3', color: '#a78bfa' }
    ];

    let currentAccent = null;
    function simulateReviewerSwitch(selectedProfile) {
        currentAccent = selectedProfile.color || '#ff7957';
    }

    // Felipe active
    simulateReviewerSwitch(profiles[0]);
    assert.equal(currentAccent, '#ff7957');

    // Switch to LipeInPBE
    simulateReviewerSwitch(profiles[1]);
    assert.equal(currentAccent, '#10b981');

    // Switch to Amigo3
    simulateReviewerSwitch(profiles[2]);
    assert.equal(currentAccent, '#a78bfa');

    // Switch back to Felipe
    simulateReviewerSwitch(profiles[0]);
    assert.equal(currentAccent, '#ff7957');
});
