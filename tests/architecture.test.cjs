const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const layers = ['shared', 'frontend', 'backend', 'functions'];
const allowed = {
    shared: new Set(['shared']),
    frontend: new Set(['frontend', 'shared']),
    backend: new Set(['backend', 'shared']),
    functions: new Set(['functions', 'backend', 'shared'])
};
const relative = file => path.relative(root, file).replace(/\\/g, '/');

function sourceFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) return sourceFiles(file);
        return /\.(?:c?js)$/.test(entry.name) ? [file] : [];
    });
}

function localModule(importer, specifier) {
    const base = path.resolve(path.dirname(importer), specifier);
    return [base, `${base}.js`, `${base}.cjs`, path.join(base, 'index.js')]
        .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

test('production modules keep dependency direction and contain no import cycles', () => {
    const files = layers.flatMap(layer => sourceFiles(path.join(root, layer)));
    const graph = new Map();
    const violations = [];

    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        const imports = [...source.matchAll(/(?:\brequire\(\s*|\bfrom\s*|\bimport\(\s*)['"](\.[^'"]+)['"]/g)];
        const dependencies = [];
        for (const [, specifier] of imports) {
            const resolved = localModule(file, specifier);
            if (!resolved || !/\.(?:c?js)$/.test(resolved)) continue;
            const from = relative(file), to = relative(resolved);
            if (!allowed[from.split('/')[0]].has(to.split('/')[0])) violations.push(`${from} -> ${to}`);
            dependencies.push(to);
        }
        graph.set(relative(file), dependencies);
    }

    const seen = new Set(), active = new Set(), stack = [], cycles = [];
    function visit(file) {
        if (active.has(file)) {
            cycles.push([...stack.slice(stack.indexOf(file)), file].join(' -> '));
            return;
        }
        if (seen.has(file)) return;
        active.add(file);
        stack.push(file);
        for (const dependency of graph.get(file) || []) visit(dependency);
        stack.pop();
        active.delete(file);
        seen.add(file);
    }
    for (const file of graph.keys()) visit(file);

    assert.deepEqual(violations, []);
    assert.deepEqual(cycles, []);
});
