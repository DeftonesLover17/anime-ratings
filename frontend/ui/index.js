const ratings = require('./rating-scale');
const { createThemeController } = require('./theme');
const { createMotionController } = require('./motion');
const { createSite } = require('../site');
const { imageUrl } = require('../shared/dom');
const studioMetadata = require('../../shared/studio-metadata');
const { createAccountDrawer } = require('../account/drawer');

const theme = createThemeController(window);
const motion = createMotionController(window);
const account = createAccountDrawer(window, motion);

// The legacy screen renderer has one explicit bridge; new modules stay independent of it.
window.AnivoidUI = {
    ...ratings,
    imageUrl,
    studioMetadata,
    account,
    site: createSite(window, motion.animate),
    readTheme: theme.readTheme,
    setTheme: theme.setTheme,
    animate: motion.animate,
    cancel: motion.cancel,
    cancelAll: motion.cancelAll
};
theme.install();
motion.install();
