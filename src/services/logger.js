const pino = require('pino');

module.exports = pino({
  base: null,
  prettyPrint: {
    colorize: true,
    translateTime: 'yyyy/mm/dd HH:MM:ss',
  },
});
