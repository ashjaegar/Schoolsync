const mongoose = require('mongoose');
const staffSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  role:      { type: String, required: true, trim: true },
  school_id: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  login_id:  { type: String, required: true, unique: true, trim: true },
  password:  { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Staff', staffSchema);
