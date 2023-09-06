const mongoose = require('mongoose');
const logger = require('../services/logger');

module.exports = {
  async start() {
    try {
      await mongoose.connect('');

      logger.info('(DATABASE) - CONECTADO AO MONGOOSE DATABASE');
    } catch (err) {
      if (err) logger.info('(DATABASE) - ERROR:', +err);
    }
  },
};
