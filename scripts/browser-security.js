const fs = require('node:fs');
const path = require('node:path');

function assertBrowserInputs(root, inputs) {
    for (const file of Object.keys(inputs)) {
        const relative = path.relative(root, path.resolve(file)).replaceAll('\\', '/');
        const publicModule = /^(?:frontend|shared|emails|node_modules)\//.test(relative);
        if (!publicModule || relative.startsWith('../') || path.isAbsolute(relative) || /(?:^|\/)\.env(?:\.|$)|(?:^|\/)\.dev\.vars(?:\.|$)/.test(relative)) throw new Error('Browser build includes a private server module: ' + relative);
    }
}

function assertNoBrowserSecrets(source, { root, environment = {} } = {}) {
    // Report the variable name only. Never echo a matched credential.
    const candidates = { ...environment };
    if (root) {
        for (const name of ['.env', '.env.local', '.dev.vars']) {
            const file = path.join(root, name);
            if (!fs.existsSync(file)) continue;
            for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
                const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
                if (match) candidates[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
            }
        }
    }
    for (const [key, raw] of Object.entries(candidates)) {
        if (!/(?:SECRET|PRIVATE_KEY|PASSWORD|API_TOKEN|API_KEY|DATABASE_URL|ADMIN_RESET_KEY)/.test(key)) continue;
        if (/(?:ITERATIONS|MIN_LENGTH|MAX_LENGTH)/.test(key)) continue;
        const value = String(raw || '');
        const encodings = [value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value)];
        if (value.length >= 8 && encodings.some(text => source.includes(text))) throw new Error('Private environment value found in browser output: ' + key);
    }
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source)) throw new Error('Private key found in browser output');
    if (/\b(?:password|passwordHash|passwordSalt|temporaryPassword|ADMIN_RESET_KEY|EMAIL_VERIFICATION_API_KEY|privateKey|apiKey|api_key|accessToken|secretKey)\b['"]?\s*[:=]\s*['"][^'"\r\n]{12,}['"]/.test(source)) throw new Error('Credential literal found in browser output');
    if (/postgres(?:ql)?:\/\/[^\s'"/]+:[^\s'"@]+@/.test(source)) throw new Error('Database credentials found in browser output');
}
module.exports = { assertBrowserInputs, assertNoBrowserSecrets };
