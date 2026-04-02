const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const School = mongoose.model('School', new mongoose.Schema({
  school_name: String,
  email: { type: String, unique: true },
  password: String
}));

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/school_erp');
  const email = 'login@jindal.com';
  const password = await bcrypt.hash('3680', 10);
  
  const existing = await School.findOne({ email });
  if (existing) {
    existing.password = password;
    await existing.save();
    console.log('Admin updated: login@jindal.com / 3680');
  } else {
    await new School({ school_name: 'Jindal Adarsh School', email, password }).save();
    console.log('Admin created: login@jindal.com / 3680');
  }
  process.exit();
}

seed();
