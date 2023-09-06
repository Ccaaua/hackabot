const mongoose = require('mongoose');
const { stringifiersSym } = require('pino/lib/symbols');

const { Schema } = mongoose;

const mentorSchema = new Schema({
  _id: { type: String },
  userID: { type: String },
  amount: { type: Number },
  mentoringThis: { type: Boolean, default: false },
  lastMentoring: [
    {
      _id: false,
      teamID: {type: String},
      dateInitial: { type: Number },
      dateEnd: { type: Number },
      feedback: {type: String},
    },
  ],
});

const Mentor = mongoose.model('Mentor', mentorSchema);
module.exports = Mentor;
