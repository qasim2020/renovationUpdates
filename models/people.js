const mongoose = require('mongoose');

var People = mongoose.model('people', {
  Rank: {
    type: String,
  },
  Name: {
    type: String,
  },
  'P Lve': {
    type: Date
  },
  addlDays: {
    type: Number
  },
  leave: [{
    leaveType: String,
    start: Date,
    end: Date,
    specialDays: String
  }],
  tempLeave: [{
    leaveType: String,
    start: Date,
    end: Date,
    specialDays: String
  }]
});

module.exports = {People};
