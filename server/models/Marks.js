const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  school_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
  subject:    { type: String, required: true, trim: true },
  marks:      { type: Number, required: true, min: 0, max: 100 },
  total:      { type: Number, default: 100 },
  exam_type:  { type: String, default: 'Unit Test' }
}, { timestamps: true });

module.exports = mongoose.model('Marks', marksSchema);
