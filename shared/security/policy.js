const { emailKey, usernameKey, validEmail } = require('./identity');
const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_JSON_BYTES = 12 * 1024 * 1024;
const PROFILE_FIELDS = [
    'color',
    'avatar',
    'banner',
    'favoriteGenres',
    'favoriteStudios',
    'favoriteAnimes',
    'activeTitle',
    'featuredAnimeId'
];

function userResponse(user, viewerUsername = '') {
    if (!user || typeof user !== 'object') return null;
    const fields = [
        'username',
        'color',
        'avatar',
        'banner',
        'friends',
        'favoriteGenres',
        'favoriteStudios',
        'favoriteAnimes',
        'activeTitle',
        'featuredAnimeId',
        'memberNumber',
        'memberDesc',
        'isVirtual'
    ];
    const result = Object.fromEntries(
        fields
            .filter((key) => Object.hasOwn(user, key))
            .map((key) => [key, user[key]])
    );
    result.emailVerified = Boolean(
        user.emailVerified === true &&
            user.emailVerifiedAt &&
            emailKey(user.emailVerifiedEmail) === emailKey(user.email)
    );
    if (
        viewerUsername &&
        usernameKey(viewerUsername) === usernameKey(user.username)
    ) {
        for (const key of [
            'accountId',
            'email',
            'notifications',
            'friendRequests'
        ]) {
            if (Object.hasOwn(user, key)) result[key] = user[key];
        }
    }
    return result;
}

class SecurityError extends Error {
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

function passwordPolicyError(password) {
    if (
        typeof password !== 'string' ||
        password.length < 10 ||
        password.length > 256 ||
        !/\d/.test(password) ||
        !/[a-zA-Z]/.test(password)
    ) {
        return 'A senha deve ter de 10 a 256 caracteres, contendo letras e números.';
    }
    return '';
}

function passwordChangeError(currentPassword, newPassword) {
    return passwordPolicyError(newPassword) || (currentPassword === newPassword ? 'A nova senha deve ser diferente da senha atual.' : '');
}

function mutationPolicy(
    { method, origin, contentType, fetchSite, authorization },
    allowedOrigins
) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return null;
    if (origin && !allowedOrigins.includes(origin))
        return new SecurityError(
            403,
            'ORIGIN_REJECTED',
            'Origem da requisição não autorizada.'
        );
    if (fetchSite === 'cross-site')
        return new SecurityError(
            403,
            'ORIGIN_REJECTED',
            'Origem da requisição não autorizada.'
        );
    // Non-browser clients use an explicit bearer credential. Browser writes must
    // identify an allowed Origin. JSON cannot be sent by a simple HTML form.
    if (!origin && !/^Bearer\s+\S+$/i.test(authorization || ''))
        return new SecurityError(
            403,
            'ORIGIN_REQUIRED',
            'Recarregue a página antes de continuar.'
        );
    if (!/^application\/json(?:\s*;|$)/i.test(contentType || ''))
        return new SecurityError(
            415,
            'JSON_REQUIRED',
            'Envie a requisição como application/json.'
        );
    return null;
}

async function readJson(request, limit = MAX_JSON_BYTES) {
    if (Number(request.headers.get('Content-Length')) > limit)
        throw new SecurityError(
            413,
            'BODY_TOO_LARGE',
            'A requisição excede o tamanho permitido.'
        );
    if (!request.body) return {};
    const reader = request.body.getReader();
    const chunks = [];
    let size = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > limit) {
                // A cloned Request tees the stream. Waiting for cancellation
                // would also wait for its unconsumed sibling branch.
                reader.cancel().catch(() => {});
                throw new SecurityError(
                    413,
                    'BODY_TOO_LARGE',
                    'A requisição excede o tamanho permitido.'
                );
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }
    if (!size) return {};
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    let body;
    try {
        body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        throw new SecurityError(400, 'INVALID_JSON', 'JSON inválido.');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new SecurityError(400, 'INVALID_JSON', 'Envie um objeto JSON.');
    return body;
}

function catalogAnimeError(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Dados do anime inválidos.';
    for (const key of ['id', 'title', 'japaneseTitle', 'synopsis', 'coverUrl', 'studioLogoUrl', 'studio', 'season']) {
        if (input[key] != null && typeof input[key] !== 'string') return 'Campo de anime inválido: ' + key + '.';
    }
    if (input.episodes != null && typeof input.episodes !== 'string' &&
        !(typeof input.episodes === 'number' && Number.isFinite(input.episodes))) return 'Campo de anime inválido: episodes.';
    if (input.genres != null && (!Array.isArray(input.genres) || input.genres.some(genre => typeof genre !== 'string'))) return 'Campo de anime inválido: genres.';
    if (typeof input.id === 'string' && input.id.length > 120) return 'Identificador de anime muito longo.';
    return '';
}

function profilePatch(user, fields, users) {
    if (!fields || typeof fields !== 'object' || Array.isArray(fields))
        throw new SecurityError(400, 'INVALID_PROFILE_FIELDS', 'Campos de perfil inválidos.');
    for (const key of PROFILE_FIELDS) {
        if (!Object.hasOwn(fields, key) || fields[key] === null) continue;
        const value = fields[key];
        const valid = ['favoriteGenres', 'favoriteStudios', 'favoriteAnimes'].includes(key)
            ? Array.isArray(value) && value.every(item => typeof item === 'string')
            : typeof value === 'string';
        if (!valid) throw new SecurityError(400, 'INVALID_PROFILE_FIELDS', 'Campo de perfil inválido: ' + key + '.');
    }
    const patch = Object.fromEntries(
        PROFILE_FIELDS.filter((key) => Object.hasOwn(fields, key)).map(
            (key) => [key, fields[key]]
        )
    );
    if (
        Object.hasOwn(fields, 'email') &&
        emailKey(fields.email) !== emailKey(user.email)
    ) {
        if (!validEmail(fields.email))
            throw new SecurityError(
                400,
                'INVALID_EMAIL',
                'Informe um e-mail válido.'
            );
        if (
            users.some(
                (other) =>
                    other !== user &&
                    (emailKey(other.email) === emailKey(fields.email) ||
                     usernameKey(other.username) === emailKey(fields.email))
            )
        )
            throw new SecurityError(
                409,
                'EMAIL_UNAVAILABLE',
                'E-mail indisponível.'
            );
        patch.email = emailKey(fields.email);
        patch.emailVerified = false;
        patch.emailVerifiedAt = null;
        patch.emailVerifiedEmail = null;
    }
    return patch;
}

function authToken(headers) {
    const authorization = headers.get('Authorization') || '';
    const bearer = authorization.match(/^Bearer\s+([A-Za-z0-9_-]{43})$/i);
    if (authorization) return bearer?.[1] || '';
    return (
        (headers.get('Cookie') || '').match(
            /(?:^|;\s*)anivoid_auth_token=([A-Za-z0-9_-]{43})(?:;|$)/
        )?.[1] || ''
    );
}
const sessionCookie = (token) =>
    `anivoid_auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_ABSOLUTE_MS / 1000)}`;
const expiredCookie = () =>
    'anivoid_auth_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
const encodeCssUrl = (value) =>
    String(value || '').replace(
        /['"()\\<>\r\n]/g,
        (character) => '%' + character.charCodeAt(0).toString(16).toUpperCase()
    );
module.exports = {
    SecurityError,
    SESSION_IDLE_MS,
    SESSION_ABSOLUTE_MS,
    MAX_JSON_BYTES,
    passwordPolicyError,
    passwordChangeError,
    mutationPolicy,
    readJson,
    profilePatch,
    catalogAnimeError,
    authToken,
    sessionCookie,
    expiredCookie,
    encodeCssUrl,
    userResponse
};
