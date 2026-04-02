const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  class: { type: String, required: true, trim: true },
  school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  login_id: { type: String, required: true, unique: true, trim: true }, // Admission Number
  password: { type: String, required: true, minlength: 4 },
  is_first_login: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
