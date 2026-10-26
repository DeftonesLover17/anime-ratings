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
const { createRecoveryController } = require('../account/recovery');
const { createWelcomeEmail } = require('../account/welcome-email');
const { installDomActions } = require('../security/dom-actions');

const { createProfileClient } = require('../account/profile-client');
const { bindProfileForm } = require('../account/profile-form');
const profiles = require('../profiles/model');
const { createProfileDialogs } = require('../profiles/dialog');
const { createApiFetch } = require('../security/api-client');
const { cleanBrowserCache } = require('../security/cache');
const { cachedUserResponse } = require('../../shared/security/responses');

const recovery = createRecoveryController(window, { baseUrl: window.ANIVOID_API_BASE_URL || '' });
const theme = createThemeController(window);
const motion = createMotionController(window);
const account = createAccountDrawer(window, motion);
const storage = createAccountStorage(window);
cleanBrowserCache(storage);
const session = createAccountSession(window, storage);
const login = createLoginClient(window, { baseUrl: window.ANIVOID_API_BASE_URL || '' });

// The legacy screen renderer has one explicit bridge; new modules stay independent of it.
window.AnivoidUI = {
    ...ratings,
    cachedUserResponse,
    profiles,
    bindProfileForm: options => bindProfileForm(window, { client: createProfileClient(window, { baseUrl: window.ANIVOID_API_BASE_URL || '' }), session, ...options }),
    profileDialogs: createProfileDialogs(window),
    createApiFetch,
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
recovery.install();
