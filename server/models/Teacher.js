const mongoose = require('mongoose');
const teacherSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  subject:   { type: String, required: true, trim: true },
  school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  login_id:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Teacher', teacherSchema);
