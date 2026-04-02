const express     = require('express');
const mongoose    = require('mongoose');
const cors        = require('cors');
const path        = require('path');

const authRoutes        = require('./routes/auth');
const studentRoutes     = require('./routes/students');
const teacherRoutes     = require('./routes/teachers');
const parentRoutes      = require('./routes/parents');
const staffRoutes       = require('./routes/staff');
const marksRoutes       = require('./routes/marks');
const attendanceRoutes  = require('./routes/attendance');
const noticeRoutes      = require('./routes/notices');
const assignmentRoutes  = require('./routes/assignments');

const app = express();

app.use(cors());
app.use(express.json());
const staticPath = path.join(__dirname, 'client');
console.log('📂 Serving static files from:', staticPath);
app.use(express.static(staticPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_erp';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('❌ MongoDB:', err.message); process.exit(1); });

app.use('/api', authRoutes);
app.use('/api', studentRoutes);
app.use('/api', teacherRoutes);
app.use('/api', parentRoutes);
app.use('/api', staffRoutes);
app.use('/api', marksRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', noticeRoutes);
app.use('/api', assignmentRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
