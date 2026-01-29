const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  worker_id: String,
  workstation_id: String,
  event_type: {
    type: String,
    enum: ['working', 'idle', 'absent', 'product_count']
  },
  confidence: Number,
  count: { type: Number, default: 0 }
});

module.exports = mongoose.model('Event', EventSchema);
