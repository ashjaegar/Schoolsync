const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const Staff    = require('../models/Staff');
const School   = require('../models/School');
const multer   = require('multer');
const xlsx     = require('xlsx');
const fs       = require('fs');
const upload   = multer({ dest: 'uploads/' });

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-staff
router.post('/add-staff', async (req, res) => {
  try {
    const { name, role, school_id, login_id } = req.body;
    if (!name || !role || !school_id || !login_id)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });
    if (!(await School.findById(school_id))) return res.status(404).json({ success: false, message: 'School not found.' });
    if (await Staff.findOne({ login_id: login_id.trim() })) return res.status(409).json({ success: false, message: 'Login ID already in use.' });
    const hashed = await bcrypt.hash('123456', 10);
    const staff  = await new Staff({ name, role, school_id, login_id: login_id.trim(), password: hashed }).save();
    res.status(201).json({ success: true, message: 'Staff added!', staff: { _id: staff._id, name: staff.name, role: staff.role, login_id: staff.login_id } });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /staff/:school_id
router.get('/staff/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const staffList = await Staff.find({ school_id }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, staff: staffList });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// DELETE /staff-member/:id
router.delete('/staff-member/:id', async (req, res) => {
  try {
    const { id } = req.params; const { school_id } = req.body;
    if (!validId(id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const s = await Staff.findOne({ _id: id, school_id });
    if (!s) return res.status(404).json({ success: false, message: 'Not found or access denied.' });
    await Staff.findByIdAndDelete(id);
    res.json({ success: true, message: 'Staff removed.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;

// POST /bulk-add-staff
router.post('/bulk-add-staff', upload.single('file'), async (req, res) => {
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
      let name = '', role = '', login_id = '';
      for (const key in row) {
        const k = key.toLowerCase().trim();
        if (k.includes('name')) name = String(row[key] || '').trim();
        else if (k.includes('role') || k.includes('dept') || k.includes('department')) role = String(row[key] || '').trim();
        else if (k.includes('login') || k.includes('id')) login_id = String(row[key] || '').trim();
      }
      if (!name || !role || !login_id) { skippedCount++; continue; }
      
      const exists = await Staff.findOne({ login_id });
      if (exists) { skippedCount++; continue; }

      await new Staff({ name, role, school_id, login_id, password: hashed }).save();
      addedCount++;
    }
    res.json({ success: true, message: `Successfully added ${addedCount} staff. Skipped ${skippedCount} items.`, addedCount, skippedCount });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error processing file.' });
  }
});
