const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const Parent   = require('../models/Parent');
const Student  = require('../models/Student');

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-parent
router.post('/add-parent', async (req, res) => {
  try {
    const { name, student_id, school_id, login_id, phone } = req.body;
    if (!name || !student_id || !school_id || !login_id)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (!validId(student_id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const student = await Student.findOne({ _id: student_id, school_id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found in this school.' });
    if (await Parent.findOne({ login_id: login_id.trim() })) return res.status(409).json({ success: false, message: 'Login ID already in use.' });
    const hashed = await bcrypt.hash('123456', 10);
    const parent = await new Parent({ name, student_id, school_id, login_id: login_id.trim(), password: hashed, phone: phone || '' }).save();
    res.status(201).json({ success: true, message: 'Parent added!', parent: { _id: parent._id, name: parent.name, login_id: parent.login_id } });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /parents/:school_id
router.get('/parents/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const parents = await Parent.find({ school_id }).select('-password').populate('student_id', 'name class').sort({ createdAt: -1 });
    res.json({ success: true, parents });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// DELETE /parent/:id
router.delete('/parent/:id', async (req, res) => {
  try {
    const { id } = req.params; const { school_id } = req.body;
    if (!validId(id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const p = await Parent.findOne({ _id: id, school_id });
    if (!p) return res.status(404).json({ success: false, message: 'Not found or access denied.' });
    await Parent.findByIdAndDelete(id);
    res.json({ success: true, message: 'Parent removed.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
