const mongoose = require('mongoose');
const { stringifiersSym } = require('pino/lib/symbols');

const { Schema } = mongoose;

const advisorSchema = new Schema({
  _id: { type: String },
  name: { type: String },
  userID: { type: String },
  dateEntry: { type: String },
  teams: [
    {
      _id: false,
      teamID: {type: String},
    },
  ],
});

const Advisor = mongoose.model('Advisor', advisorSchema);
module.exports = Advisor;
