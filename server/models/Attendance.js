const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  school_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'School',  required: true },
  date:       { type: String, required: true },   // "YYYY-MM-DD"
  status:     { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
