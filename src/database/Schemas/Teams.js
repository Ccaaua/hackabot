const mongoose = require('mongoose');
const { stringifiersSym } = require('pino/lib/symbols');

const { Schema } = mongoose;

const teamsSchema = new Schema({
  _id: { type: String },
  name: { type: String },
  ownerID: { type: String },
  categoryInfo: {
    categoryID: { type: String },
    textID: { type: String },
    voiceID: { type: String },
    roleID: { type: String },
  },
  members: [
    {
      _id: false,
      memberName: {type: String},
      memberID: { type: String },
      dateEntry: { type: Number },
      isOwner: { type: Boolean, default: false},
      isAdvisor: { type: Boolean, default: false}
    },
  ],
});

const Teams = mongoose.model('Teams', teamsSchema);
module.exports = Teams;
