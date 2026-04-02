const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const School   = require('../models/School');
const Student  = require('../models/Student');
const Teacher  = require('../models/Teacher');
const Parent   = require('../models/Parent');
const Staff    = require('../models/Staff');

const validId = id => mongoose.Types.ObjectId.isValid(id);

// ── POST /admin/register ──────────────────────────────────
router.post('/admin/register', async (req, res) => {
  try {
    const { school_name, email, password } = req.body;
    if (!school_name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (await School.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const school = await new School({ school_name, email: email.toLowerCase(), password: hashed }).save();
    res.status(201).json({ success: true, message: 'School registered!', school_id: school._id, school_name: school.school_name });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /admin/login ─────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const school = await School.findOne({ email: email.toLowerCase() });
    if (!school || !(await bcrypt.compare(password, school.password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    res.json({ success: true, school_id: school._id, school_name: school.school_name, role: 'admin' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /student/login ───────────────────────────────────
router.post('/student/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;
    if (!login_id || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const student = await Student.findOne({ login_id: login_id.trim() });
    if (!student || !(await bcrypt.compare(password, student.password)))
      return res.status(401).json({ success: false, message: 'Invalid login ID or password.' });
    
    if (student.is_first_login) {
      return res.json({ success: true, require_password_change: true, user_id: student._id, role: 'student' });
    }
    res.json({ success: true, student_id: student._id, school_id: student.school_id, name: student.name, class: student.class, login_id: student.login_id, role: 'student' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /teacher/login ───────────────────────────────────
router.post('/teacher/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;
    if (!login_id || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const teacher = await Teacher.findOne({ login_id: login_id.trim() });
    if (!teacher || !(await bcrypt.compare(password, teacher.password)))
      return res.status(401).json({ success: false, message: 'Invalid login ID or password.' });
    
    if (teacher.is_first_login) {
      return res.json({ success: true, require_password_change: true, user_id: teacher._id, role: 'teacher' });
    }
    res.json({ success: true, teacher_id: teacher._id, school_id: teacher.school_id, name: teacher.name, subject: teacher.subject, login_id: teacher.login_id, role: 'teacher' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /parent/login ────────────────────────────────────
router.post('/parent/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;
    if (!login_id || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const parent = await Parent.findOne({ login_id: login_id.trim() });
    if (!parent || !(await bcrypt.compare(password, parent.password)))
      return res.status(401).json({ success: false, message: 'Invalid login ID or password.' });
    
    if (parent.is_first_login) {
      return res.json({ success: true, require_password_change: true, user_id: parent._id, role: 'parent' });
    }
    const student = await Student.findById(parent.student_id).select('name class');
    res.json({ success: true, parent_id: parent._id, school_id: parent.school_id, student_id: parent.student_id, name: parent.name, student_name: student?.name, student_class: student?.class, login_id: parent.login_id, role: 'parent' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /staff/login ─────────────────────────────────────
router.post('/staff/login', async (req, res) => {
  try {
    const { login_id, password } = req.body;
    if (!login_id || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const staff = await Staff.findOne({ login_id: login_id.trim() });
    if (!staff || !(await bcrypt.compare(password, staff.password)))
      return res.status(401).json({ success: false, message: 'Invalid login ID or password.' });
    
    if (staff.is_first_login) {
      return res.json({ success: true, require_password_change: true, user_id: staff._id, role: 'staff' });
    }
    res.json({ success: true, staff_id: staff._id, school_id: staff.school_id, name: staff.name, role_title: staff.role, login_id: staff.login_id, role: 'staff' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ── POST /change-password ─────────────────────────────────
router.post('/change-password', async (req, res) => {
  try {
    const { user_id, role, new_password } = req.body;
    if (!user_id || !role || !new_password) return res.status(400).json({ success: false, message: 'Missing fields.' });
    if (new_password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    
    const hashed = await bcrypt.hash(new_password, 10);
    let user;
    if (role === 'student') user = await Student.findByIdAndUpdate(user_id, { password: hashed, is_first_login: false });
    else if (role === 'teacher') user = await Teacher.findByIdAndUpdate(user_id, { password: hashed, is_first_login: false });
    else if (role === 'parent') user = await Parent.findByIdAndUpdate(user_id, { password: hashed, is_first_login: false });
    else if (role === 'staff') user = await Staff.findByIdAndUpdate(user_id, { password: hashed, is_first_login: false });
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'Password updated successfully! Please login with your new password.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// Backward-compat aliases (school-register.html still posts here)
async function handleAdminRegister(req, res) {
  try {
    const { school_name, email, password } = req.body;
    if (!school_name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    if (await School.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const school = await new School({ school_name, email: email.toLowerCase(), password: hashed }).save();
    res.status(201).json({ success: true, message: 'School registered!', school_id: school._id, school_name: school.school_name });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
}

async function handleAdminLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
    const school = await School.findOne({ email: email.toLowerCase() });
    if (!school || !(await bcrypt.compare(password, school.password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    res.json({ success: true, school_id: school._id, school_name: school.school_name, role: 'admin' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
}

router.post('/school/register', handleAdminRegister);
router.post('/school/login',    handleAdminLogin);

module.exports = router;
