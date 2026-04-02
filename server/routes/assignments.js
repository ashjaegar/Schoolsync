const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const Assignment = require('../models/Assignment');

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-assignment
router.post('/add-assignment', async (req, res) => {
  try {
    const { school_id, title, description, class: cls, subject, due_date } = req.body;
    if (!school_id || !title || !description || !cls || !due_date)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });

    const a = await new Assignment({ school_id, title, description, class: cls, subject: subject || 'General', due_date }).save();
    res.status(201).json({ success: true, message: 'Assignment posted!', assignment: a });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /assignments/:class/:school_id
router.get('/assignments/:class/:school_id', async (req, res) => {
  try {
    const { class: cls, school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const assignments = await Assignment.find({ school_id, class: cls }).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /assignments/school/:school_id  (all assignments for admin)
router.get('/assignments/school/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const assignments = await Assignment.find({ school_id }).sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /assignment/:id
router.delete('/assignment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.body;
    if (!validId(id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const a = await Assignment.findOne({ _id: id, school_id });
    if (!a) return res.status(404).json({ success: false, message: 'Not found or access denied.' });
    await Assignment.findByIdAndDelete(id);
    res.json({ success: true, message: 'Assignment deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
