const mongoose = require('mongoose');
const parentSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  school_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
  login_id:   { type: String, required: true, unique: true, trim: true },
  password:   { type: String, required: true },
  phone:      { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Parent', parentSchema);
