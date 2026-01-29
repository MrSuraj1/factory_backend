const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  worker_id: String,
  name: String
});

module.exports = mongoose.model('Worker', WorkerSchema);
