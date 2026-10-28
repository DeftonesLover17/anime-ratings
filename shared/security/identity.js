const legacyId = (value) =>
    (typeof value === 'string' ? value : '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
const usernameKey = (value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';
const validUsernameReference = (value) =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= 254;
const emailKey = (value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';
const list = (value) =>
    String(value || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

function uniqueUser(state, username) {
    const users = state?.registeredUsers || [];
    const matches = users.filter(
        (user) => usernameKey(user?.username) === usernameKey(username)
    );
    if (matches.length !== 1) return null;
    // Existing ratings use this legacy key. Ambiguous ownership fails closed;
    // resolving old collisions must never silently merge or delete accounts.
    return users.filter(
        (user) => legacyId(user?.username) === legacyId(username)
    ).length === 1
        ? matches[0]
        : null;
}

function findLoginUser(state, identifier) {
    const key = usernameKey(identifier);
    if (!key) return null;
    const users = state?.registeredUsers || [];
    const exact = users.filter(
        (user) =>
            emailKey(user?.email) === key || usernameKey(user?.username) === key
    );
    const candidates = exact.length
        ? exact
        : users.filter(
              (user) => legacyId(user?.username) === legacyId(identifier)
          );
    return candidates.length === 1
        ? uniqueUser(state, candidates[0].username)
        : null;
}

function isAdmin(user, env, state) {
    if (!user || !uniqueUser(state, user.username)) return false;
    const ids = list(env.ADMIN_ACCOUNT_IDS);
    if (ids.length)
        return Boolean(user.accountId && ids.includes(user.accountId));
    // Legacy configuration resolves once against an unambiguous stored account.
    // New registrations cannot claim any configured administrator's legacy key.
    return list(env.ADMIN_USERS || 'felipe,lipeinpbe,lipe').some((name) => {
        const owner = findLoginUser(state, name);
        return (
            owner && usernameKey(owner.username) === usernameKey(user.username)
        );
    });
}

function canManageSystem(user, env, state) {
    if (!isAdmin(user, env, state)) return false;
    const owner = findLoginUser(state, 'felipe');
    return Boolean(owner && usernameKey(owner.username) === usernameKey(user.username));
}

function registrationError(state, input, env = {}) {
    if (
        typeof input?.username !== 'string' ||
        input.username !== input.username.trim() ||
        input.username.length < 3 ||
        input.username.length > 40 ||
        legacyId(input.username).length < 3 ||
        /[<>&"'\u0000-\u001f\u007f]/.test(input.username)
    )
        return 'Nome de usuário inválido. Use de 3 a 40 caracteres, sem marcação HTML.';
    if (!validEmail(input.email)) return 'Informe um e-mail válido.';
    const id = legacyId(input.username);
    if (['constructor', 'prototype', 'proto'].includes(id))
        return 'Nome de usuário indisponível.';
    if (
        list(env.ADMIN_USERS || 'felipe,lipeinpbe,lipe').some(
            (name) => legacyId(name) === id
        ) ||
        (state.registeredUsers || []).some(
            (user) =>
                legacyId(user.username) === id ||
                emailKey(user.email) === emailKey(input.email) ||
                usernameKey(user.username) === emailKey(input.email) ||
                emailKey(user.email) === usernameKey(input.username)
        )
    ) {
        return 'Nome de usuário ou e-mail indisponível.';
    }
    return '';
}

function validEmail(value) {
    return (
        typeof value === 'string' &&
        value.length <= 254 &&
        /^[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+$/.test(value.trim())
    );
}

function assignAccountIds(state, randomId) {
    const seen = new Set();
    for (const user of state.registeredUsers || []) {
        if (!user.accountId || seen.has(user.accountId))
            user.accountId = randomId();
        seen.add(user.accountId);
    }
}

module.exports = {
    legacyId,
    usernameKey,
    validUsernameReference,
    emailKey,
    uniqueUser,
    findLoginUser,
    isAdmin,
    canManageSystem,
    registrationError,
    validEmail,
    assignAccountIds
};
