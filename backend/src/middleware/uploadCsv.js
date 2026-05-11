const multer = require('multer');
const path = require('path');
const os = require('os');
const config = require('../config');

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, os.tmpdir());
  },
  filename(_req, file, cb) {
    const base = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    cb(null, `${base}${path.extname(file.originalname) || '.csv'}`);
  },
});

function csvFileFilter(_req, file, cb) {
  const name = (file.originalname || '').toLowerCase();
  const ok = name.endsWith('.csv') || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';
  if (!ok) {
    cb(new Error('Only CSV files are allowed'));
    return;
  }
  cb(null, true);
}

const uploadCsv = multer({
  storage,
  limits: { fileSize: config.maxCsvBytes },
  fileFilter: csvFileFilter,
});

module.exports = { uploadCsv };
