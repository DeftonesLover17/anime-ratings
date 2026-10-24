const ratings = require('./rating-scale');
const { createThemeController } = require('./theme');
const { createMotionController } = require('./motion');
const { bindScoreInput } = require('./score-input');

const theme = createThemeController(window);
const motion = createMotionController(window);

// The legacy screen renderer has one explicit bridge; new modules stay independent of it.
window.AnivoidUI = {
    ...ratings,
    bindScoreInput,
    readTheme: theme.readTheme,
    setTheme: theme.setTheme,
    animate: motion.animate,
    cancel: motion.cancel,
    cancelAll: motion.cancelAll
};
theme.install();
motion.install();
