const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const Attendance = require('../models/Attendance');
const Student    = require('../models/Student');

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-attendance
router.post('/add-attendance', async (req, res) => {
  try {
    const { student_id, school_id, date, status } = req.body;
    if (!student_id || !school_id || !date || !status)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (!validId(student_id) || !validId(school_id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const student = await Student.findOne({ _id: student_id, school_id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found in this school.' });

    const a = await new Attendance({ student_id, school_id, date, status }).save();
    res.status(201).json({ success: true, message: 'Attendance marked!', attendance: a });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /attendance/school/:school_id
router.get('/attendance/school/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const records = await Attendance.find({ school_id }).populate('student_id', 'name class login_id').sort({ date: -1 });
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /attendance/:student_id?school_id=
router.get('/attendance/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const { school_id }  = req.query;
    if (!validId(student_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const filter = { student_id };
    if (school_id && validId(school_id)) filter.school_id = school_id;

    const records = await Attendance.find(filter).sort({ date: -1 });

    const total   = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent  = records.filter(r => r.status === 'Absent').length;
    const late    = records.filter(r => r.status === 'Late').length;
    const pct     = total ? Math.round((present / total) * 100) : 0;

    res.json({ success: true, attendance: records, summary: { total, present, absent, late, percentage: pct } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
