function createAccountAccess(document, session) {
    const canManageSystem = () => session.canManageSystem();
    function refresh() {
        const allowed = canManageSystem();
        const group = document.getElementById('av-account-tools');
        if (group) { group.hidden = !allowed; group.classList.toggle('hidden', !allowed); }
        for (const id of ['open-backup-center', 'open-admin-center']) {
            const button = document.getElementById(id);
            if (!button) continue;
            button.hidden = !allowed;
            button.disabled = !allowed;
            button.classList.toggle('hidden', !allowed);
        }
        if (!allowed) {
            for (const id of ['backup-modal', 'admin-modal']) {
                const modal = document.getElementById(id);
                modal?.classList.add('hidden');
                modal?.classList.remove('flex');
            }
            for (const id of ['admin-overview', 'admin-users-list', 'admin-backups-list']) {
                document.getElementById(id)?.replaceChildren();
            }
        }
    }
    return { canManageSystem, refresh };
}

module.exports = { createAccountAccess };
