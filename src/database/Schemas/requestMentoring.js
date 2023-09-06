const mongoose = require('mongoose');
const { stringifiersSym } = require('pino/lib/symbols');

const { Schema } = mongoose;

const requestMentoringSchema = new Schema({
  teamID: { type: String },
  userID: { type: String },
  mentorID: { type: String },
  attempts: { type: Number},
  date: { type: Number },
  dateInitial: { type: Number },
  dateEnd: { type: Number },
  status: { type: String },
});

const requestMentoring = mongoose.model('requestMentoring', requestMentoringSchema);
module.exports = requestMentoring;
