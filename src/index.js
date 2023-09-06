/**
 * Importações rápidas.
 */
module.exports = {
  logger: require('./services/logger'),


  Command: require('./structures/Command'),
  Event: require('./structures/Event'),
  User: require('./database/Schemas/User'),
  Guild: require('./database/Schemas/Guild'),
  Client: require('./database/Schemas/Client'),
  Teams: require('./database/Schemas/Teams'),
  requestMentoring: require('./database/Schemas/requestMentoring'),
  Mentor: require('./database/Schemas/Mentor'),
  Advisor: require('./database/Schemas/Advisor'),

  Cache: require('./app'),

  Group: require('./utils/GroupsUtils'),
  MentorJson: require('./utils/MentoresUtils'),
  MentorJson2: require('../mentores.json'),
  TeamsJson: require('../groups.json'),

  embedReportCM: require('./utils/reportUserCM'),

  EColors: require('./utils/EmbedColors'),

  Moment: require("moment"),

  Emojis: require('./utils/Emojis'),
};
