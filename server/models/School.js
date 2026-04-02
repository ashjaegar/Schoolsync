const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  school_name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  }
}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);
