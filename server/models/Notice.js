const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title:     { type: String, required: true, trim: true },
  content:   { type: String, required: true, trim: true },
  priority:  { type: String, enum: ['Normal', 'Important', 'Urgent'], default: 'Normal' },
  file_url:  { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
