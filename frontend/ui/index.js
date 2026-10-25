const ratings = require('./rating-scale');
const { createThemeController } = require('./theme');
const { createMotionController } = require('./motion');
const { createSite } = require('../site');
const { imageUrl } = require('../shared/dom');

const theme = createThemeController(window);
const motion = createMotionController(window);

// The legacy screen renderer has one explicit bridge; new modules stay independent of it.
window.AnivoidUI = {
    ...ratings,
    imageUrl,
    site: createSite(window, motion.animate),
    readTheme: theme.readTheme,
    setTheme: theme.setTheme,
    animate: motion.animate,
    cancel: motion.cancel,
    cancelAll: motion.cancelAll
};
theme.install();
motion.install();
