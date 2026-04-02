const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Notice   = require('../models/Notice');
const multer   = require('multer');
const upload   = multer({ dest: 'uploads/' });

const validId = id => mongoose.Types.ObjectId.isValid(id);

// POST /add-notice
router.post('/add-notice', upload.single('file'), async (req, res) => {
  try {
    const { school_id, title, content, priority } = req.body;
    if (!school_id || !title || !content)
      return res.status(400).json({ success: false, message: 'school_id, title and content are required.' });
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid school ID.' });

    let file_url = '';
    if (req.file) file_url = '/uploads/' + req.file.filename;

    const n = await new Notice({ school_id, title, content, priority: priority || 'Normal', file_url }).save();
    res.status(201).json({ success: true, message: 'Notice posted!', notice: n });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /notices/:school_id
router.get('/notices/:school_id', async (req, res) => {
  try {
    const { school_id } = req.params;
    if (!validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const notices = await Notice.find({ school_id }).sort({ createdAt: -1 });
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /notice/:id
router.delete('/notice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.body;
    if (!validId(id) || !validId(school_id)) return res.status(400).json({ success: false, message: 'Invalid ID.' });
    const n = await Notice.findOne({ _id: id, school_id });
    if (!n) return res.status(404).json({ success: false, message: 'Not found or access denied.' });
    await Notice.findByIdAndDelete(id);
    res.json({ success: true, message: 'Notice deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
