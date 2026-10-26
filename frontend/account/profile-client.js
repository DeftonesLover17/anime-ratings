const { AccountError, createAccountRequest } = require('./request');

function createProfileClient(browser, options) {
    const request = createAccountRequest(browser, options);
    return {
        async save({ username, fields, currentPassword, newPassword }) {
            let data;
            const credentialChange = Boolean(newPassword || Object.hasOwn(fields, 'email'));
            try {
                data = await request('/api/patch-user', { username, fields, currentPassword, ...(newPassword ? { newPassword } : {}) });
                if (data.success !== true || data.user?.username !== username) throw new AccountError('O servidor enviou uma resposta inválida.', 'INVALID_RESPONSE');
            } catch (error) {
                if (credentialChange && (error.status >= 500 || ['TIMEOUT', 'NETWORK_ERROR', 'INVALID_RESPONSE'].includes(error.code))) {
                    throw new AccountError('Não foi possível confirmar o salvamento. Se a senha foi alterada, entre usando a nova senha; não repita a troca automaticamente.', 'CHANGE_UNCONFIRMED');
                }
                throw error;
            }
            if (credentialChange) {
                try {
                    const session = await request('/api/users');
                    if (session.viewerUsername !== username) throw new Error('session_changed');
                    data.registeredUsers = session.registeredUsers;
                } catch {
                    const error = new AccountError('Alterações salvas. Não foi possível confirmar sua sessão; entre novamente usando a nova senha, se você a alterou.', 'PROFILE_SAVED_SESSION_REQUIRED');
                    error.saved = true;
                    throw error;
                }
            }
            return data;
        }
    };
}
module.exports = { createProfileClient };
