const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  station_id: String,
  type: String
});

module.exports = mongoose.model('Station', StationSchema);
