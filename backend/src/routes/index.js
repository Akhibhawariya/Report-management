const express = require('express');
const reportController = require('../controllers/reportController');
const { uploadCsv } = require('../middleware/uploadCsv');

const router = express.Router();

router.post('/report', express.json(), reportController.postReport);
router.post('/reports/upload', uploadCsv.single('file'), reportController.postReportsUpload);
router.get('/job-status/:job_id', reportController.getJobStatus);
router.get('/dashboard', reportController.getDashboard);

module.exports = router;
