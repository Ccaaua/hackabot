const mongoose = require('mongoose');
const { stringifiersSym } = require('pino/lib/symbols');

const { Schema } = mongoose;

const userSchema = new Schema({
  _id: { type: String },
  messageSent: { type: Number, default: 0 },
  commandSent: { type: Number, default: 0 },
  termsAccepted: { type: Boolean, default: false },
  TeamID: { type: String, default: null },
  callInfo: {
    timeAll: { type: Number, default: 0 },
    callID: { type: String },
    date: { type: Number },
    lastCalls: [
      {
        _id: false,
        callID: { type: String },
        dateEntry: { type: Number },
        dateLeft: { type: Number },
        time: { type: Number },
      },
    ],
  },
  logs: [
    {
      _id: false,
      type: { type: String },
      content: { type: String },
      moment: { type: Number },
      amount: { type: Number },
    },
  ],
  cooldowns: {
    command: { type: Number, default: 0 },
  },
  ticket: {
    channelID: { type: String },
    date: { type: Number },
    lastTickets: [
      {
        _id: false,
        channelID: { type: String },
        dateOpen: { type: Number },
        dateFinish: { type: Number },
        userFinishID: { type: String },
        feedback: { type: String },
      },
    ],
  },
});

const User = mongoose.model('Users', userSchema);
module.exports = User;
