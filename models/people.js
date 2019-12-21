const mongoose = require('mongoose');

var People = mongoose.model('people', {
  Rank: {
    type: String,
  },
  Name: {
    type: String,
  },
  'Last Maj Lve': {
    type: Date
  },
  'Returned(ing)': {
    type: Date
  },
  'P Lve': {
    type: Date
  },
  daysSinceArrival: {
    type: Number
  },
  manualCtr: {
    type: Number
  },
  leave: []
});

module.exports = {People};
