// The cache is optional. Quota limits or blocked storage must not break login.
// Failed writes remain available for this tab; credentials never belong here.
function createAccountStorage(browser) {
    const memory = new Map();
    return {
        getItem(key) {
            if (memory.has(key)) return memory.get(key);
            try { return browser.localStorage.getItem(key); } catch { return null; }
        },
        setItem(key, value) {
            value = String(value);
            try {
                browser.localStorage.setItem(key, value);
                memory.delete(key);
            } catch { memory.set(key, value); }
        },
        removeItem(key) {
            try {
                browser.localStorage.removeItem(key);
                memory.delete(key);
            } catch { memory.set(key, null); }
        },
        keys() {
            const keys = new Set(memory.keys());
            try {
                for (let i = 0; i < browser.localStorage.length; i++) keys.add(browser.localStorage.key(i));
            } catch {}
            return [...keys];
        }
    };
}
module.exports = { createAccountStorage };
