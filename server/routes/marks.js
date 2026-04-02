const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Marks    = require('../models/Marks');
const Student  = require('../models/Student');

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-marks
router.post('/add-marks', async (req, res) => {
  try {
    const { student_id, school_id, subject, marks, total, exam_type } = req.body;
    if (!student_id || !school_id || !subject || marks === undefined)
      return res.status(400).json({ success: false, message: 'student_id, school_id, subject and marks are required.' });
    if (!validId(student_id) || !validId(school_id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });

    const student = await Student.findOne({ _id: student_id, school_id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found in this school.' });

    const m = await new Marks({ student_id, school_id, subject, marks, total: total || 100, exam_type: exam_type || 'Unit Test' }).save();
    res.status(201).json({ success: true, message: 'Marks added!', marks: m });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /bulk-add-marks
router.post('/bulk-add-marks', async (req, res) => {
  try {
    const { school_id, subject, exam_type, total, marks_data } = req.body;
    // marks_data should be an array of { student_id, marks }
    if (!school_id || !subject || !marks_data || !Array.isArray(marks_data)) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });

    let addedCount = 0;
    for (const data of marks_data) {
      if (!validId(data.student_id) || data.marks === undefined || data.marks === '') continue;
      
      // Use findOneAndUpdate with upsert to prevent duplicates for student+subject+exam_type
      await Marks.findOneAndUpdate(
        { 
          student_id: data.student_id, 
          school_id, 
          subject, 
          exam_type: exam_type || 'Unit Test' 
        },
        { 
          marks: data.marks, 
          total: total || 100 
        },
        { upsert: true, new: true }
      );
      addedCount++;
    }

    res.status(201).json({ success: true, message: `Successfully saved marks for ${addedCount} students.` });
  } catch (err) {
    console.error('Bulk Marks Error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /marks/school/:school_id
router.get('/marks/school/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    
    // Find all marks for the given school, and populate student_id with name, class, login_id
    const marks = await Marks.find({ school_id })
                             .populate('student_id', 'name class login_id')
                             .sort({ createdAt: -1 });

    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /marks/:student_id?school_id=
router.get('/marks/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;
    const { school_id }  = req.query;
    if (!validId(student_id)) return res.status(400).json({ success: false, message: 'Invalid student ID.' });

    const filter = { student_id };
    if (school_id && validId(school_id)) filter.school_id = school_id;

    const marks = await Marks.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /marks/:id
router.delete('/marks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.body;
    if (!validId(id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const m = await Marks.findOne({ _id: id, school_id });
    if (!m) return res.status(404).json({ success: false, message: 'Not found or access denied.' });
    await Marks.findByIdAndDelete(id);
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
