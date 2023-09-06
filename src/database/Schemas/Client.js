const mongoose = require('mongoose');

const { Schema } = mongoose;

const clientSchema = new Schema({
  _id: { type: String },
  maintenance: {
    is: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    users: [
      {
        _id: false,
        idUser: { type: String },
      },
    ],
  },
  blacklist: [
    {
      _id: false,
      idUser: { type: String },
      reason: { type: String },
    },
  ],
  mentors: [
    {
      _id: false,
      uID: { type: String },
      groups: [],
    },
  ],
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
