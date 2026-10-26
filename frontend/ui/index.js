const ratings = require('./rating-scale');
const { createThemeController } = require('./theme');
const { createMotionController } = require('./motion');
const { createSite } = require('../site');
const { imageUrl } = require('../shared/dom');
const studioMetadata = require('../../shared/studio-metadata');
const { createAccountDrawer } = require('../account/drawer');
const { createAccountSession } = require('../account/session');
const { createAccountStorage } = require('../account/storage');
const { createLoginClient } = require('../account/login-client');
const { bindLoginForm } = require('../account/login-form');
const { createWelcomeEmail } = require('../account/welcome-email');
const { installDomActions } = require('../security/dom-actions');

const theme = createThemeController(window);
const motion = createMotionController(window);
const account = createAccountDrawer(window, motion);
const storage = createAccountStorage(window);
const session = createAccountSession(window, storage);
const login = createLoginClient(window, { baseUrl: window.ANIVOID_API_BASE_URL || '' });

// The legacy screen renderer has one explicit bridge; new modules stay independent of it.
window.AnivoidUI = {
    ...ratings,
    imageUrl,
    studioMetadata,
    account,
    storage,
    session,
    login,
    welcome: createWelcomeEmail(window),
    bindLoginForm: (options) => bindLoginForm(window, { client: login, session, ...options }),
    site: createSite(window, motion.animate),
    readTheme: theme.readTheme,
    setTheme: theme.setTheme,
    animate: motion.animate,
    cancel: motion.cancel,
    cancelAll: motion.cancelAll
};
theme.install();
motion.install();
installDomActions(window);
