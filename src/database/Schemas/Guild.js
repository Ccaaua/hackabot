const mongoose = require('mongoose');

const { Schema } = mongoose;

const guildSchema = new Schema({
  _id: { type: String, required: true },
  cmd: {
    channels: { type: Array, default: [] },
    status: { type: Boolean, default: false },
  },
  ticket: {
    channelID: { type: String, },
    logsOpenID: { type: String },
    logsFinishID: { type: String },
    rolesID: { type: Array, default: [] },
  },
  call: {
    ignoredChannels: { type: Array, default: [] },
    logsOpenID: { type: String },
    logsFinishID: { type: String },
  },
});

const Guild = mongoose.model('Guilds', guildSchema);
module.exports = Guild;
