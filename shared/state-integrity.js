function parseStoredState(text) {
    const state = JSON.parse(text);
    if (!state || typeof state !== 'object' || Array.isArray(state) ||
        !Array.isArray(state.registeredUsers) || !Array.isArray(state.animes)) {
        throw new Error('invalid_stored_state');
    }
    return state;
}

module.exports = { parseStoredState };
