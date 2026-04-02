const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const multer   = require('multer');
const xlsx     = require('xlsx');
const fs       = require('fs');
const Student  = require('../models/Student');
const School   = require('../models/School');

const upload = multer({ dest: 'uploads/' });

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-student
router.post('/add-student', async (req, res) => {
  try {
    const { name, class: cls, school_id, login_id } = req.body;
    if (!name || !cls || !school_id || !login_id)
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    if (!validId(school_id))
      return res.status(400).json({ success: false, message: 'Invalid school ID.' });
    if (!(await School.findById(school_id)))
      return res.status(404).json({ success: false, message: 'School not found.' });
    if (await Student.findOne({ login_id: login_id.trim() }))
      return res.status(409).json({ success: false, message: 'Admission number already exists.' });

    const hashed  = await bcrypt.hash('123456', 10);
    const student = await new Student({ name, class: cls, school_id, login_id: login_id.trim(), password: hashed }).save();
    res.status(201).json({ success: true, message: 'Student added!', student: { _id: student._id, name: student.name, class: student.class, login_id: student.login_id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /students/:school_id
router.get('/students/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });
    const students = await Student.find({ school_id }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /student/:id
router.delete('/student/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.body;
    if (!validId(id) || !validId(school_id))
      return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const s = await Student.findOne({ _id: id, school_id });
    if (!s) return res.status(404).json({ success: false, message: 'Student not found or access denied.' });
    await Student.findByIdAndDelete(id);
    res.json({ success: true, message: 'Student removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /bulk-add-students
router.post('/bulk-add-students', upload.single('file'), async (req, res) => {
  try {
    const { school_id } = req.body;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });
    if (!(await School.findById(school_id))) return res.status(404).json({ success: false, message: 'School not found.' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    fs.unlinkSync(req.file.path);

    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty.' });
    }

    const hashed = await bcrypt.hash('123456', 10);
    let addedCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      let name = '', cls = '', login_id = '';
      for (const key in row) {
        const k = key.toLowerCase().trim();
        if (k.includes('name')) name = String(row[key] || '').trim();
        else if (k.includes('class') || k.includes('grade')) cls = String(row[key] || '').trim();
        else if (k.includes('admission') || k.includes('login') || k.includes('id')) login_id = String(row[key] || '').trim();
      }

      if (!name || !cls || !login_id) {
        skippedCount++;
        continue;
      }

      const exists = await Student.findOne({ login_id });
      if (exists) {
        skippedCount++;
        continue;
      }

      await new Student({ name, class: cls, school_id, login_id, password: hashed }).save();
      addedCount++;
    }

    res.json({ success: true, message: `Successfully enrolled ${addedCount} students. Skipped ${skippedCount} items (missing fields or duplicates).`, addedCount, skippedCount });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error processing file.' });
  }
});

module.exports = router;
