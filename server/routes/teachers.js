const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const Teacher  = require('../models/Teacher');
const School   = require('../models/School');
const multer   = require('multer');
const xlsx     = require('xlsx');
const fs       = require('fs');
const upload   = multer({ dest: 'uploads/' });

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-teacher
router.post('/add-teacher', async (req, res) => {
  try {
    const { name, subject, school_id, login_id, password } = req.body;
    if (!name || !subject || !school_id || !login_id || !password)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });
    if (!(await School.findById(school_id))) return res.status(404).json({ success: false, message: 'School not found.' });
    if (await Teacher.findOne({ login_id: login_id.trim() })) return res.status(409).json({ success: false, message: 'Login ID already in use.' });
    const hashed  = await bcrypt.hash(password, 10);
    const teacher = await new Teacher({ name, subject, school_id, login_id: login_id.trim(), password: hashed }).save();
    res.status(201).json({ success: true, message: 'Teacher added!', teacher: { _id: teacher._id, name: teacher.name, subject: teacher.subject, login_id: teacher.login_id } });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /teachers/:school_id
router.get('/teachers/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const teachers = await Teacher.find({ school_id }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, teachers });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// DELETE /teacher/:id
router.delete('/teacher/:id', async (req, res) => {
  try {
    const { id } = req.params; const { school_id } = req.body;
    if (!validId(id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const t = await Teacher.findOne({ _id: id, school_id });
    if (!t) return res.status(404).json({ success: false, message: 'Not found or access denied.' });
    await Teacher.findByIdAndDelete(id);
    res.json({ success: true, message: 'Teacher removed.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;

// POST /bulk-add-teachers
router.post('/bulk-add-teachers', upload.single('file'), async (req, res) => {
  try {
    const { school_id } = req.body;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });
    if (!(await School.findById(school_id))) return res.status(404).json({ success: false, message: 'School not found.' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    fs.unlinkSync(req.file.path);

    if (!data || data.length === 0) return res.status(400).json({ success: false, message: 'Excel file is empty.' });

    const hashed = await bcrypt.hash('123456', 10);
    let addedCount = 0; let skippedCount = 0;

    for (const row of data) {
      let name = '', subject = '', login_id = '';
      for (const key in row) {
        const k = key.toLowerCase().trim();
        if (k.includes('name')) name = String(row[key] || '').trim();
        else if (k.includes('subject') || k.includes('sub')) subject = String(row[key] || '').trim();
        else if (k.includes('login') || k.includes('id')) login_id = String(row[key] || '').trim();
      }
      if (!name || !subject || !login_id) { skippedCount++; continue; }
      
      const exists = await Teacher.findOne({ login_id });
      if (exists) { skippedCount++; continue; }

      await new Teacher({ name, subject, school_id, login_id, password: hashed }).save();
      addedCount++;
    }
    res.json({ success: true, message: `Successfully added ${addedCount} teachers. Skipped ${skippedCount} items.`, addedCount, skippedCount });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error processing file.' });
  }
});
