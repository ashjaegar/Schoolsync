const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  school_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  class:       { type: String, required: true, trim: true },
  subject:     { type: String, default: 'General' },
  due_date:    { type: String, required: true }   // "YYYY-MM-DD"
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
