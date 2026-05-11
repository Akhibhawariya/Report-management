const reportService = require('../services/reportService');
const csvImportService = require('../services/csvImportService');
const { validateDashboardQuery } = require('../validations/reportValidation');
const { asyncHandler } = require('../utils/http');

async function postReport(req, res) {
  const row = await reportService.submitSingleReport(req.body);
  res.status(200).json({
    message: 'Report saved',
    report: {
      id: row.id,
      ngoId: row.ngoId,
      month: row.month,
      peopleHelped: row.peopleHelped,
      eventsConducted: row.eventsConducted,
      fundsUtilized: row.fundsUtilized.toString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
}

async function postReportsUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'CSV file is required (field name: file)' } });
  }
  const savedPath = await csvImportService.createUploadFromDisk(req.file.path, req.file.originalname);
  const job = await csvImportService.scheduleCsvImport(savedPath);
  res.status(202).json({
    message: 'Upload accepted; processing in background',
    jobId: job.id,
  });
}

async function getJobStatus(req, res) {
  const job = await csvImportService.getJobStatus(req.params.job_id);
  res.json({
    jobId: job.id,
    status: job.status,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    successCount: job.successCount,
    failureCount: job.failureCount,
    errors: job.errors || [],
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  });
}

async function getDashboard(req, res) {
  const parsed = validateDashboardQuery(req.query);
  if (!parsed.ok) {
    return res.status(400).json({ error: { message: 'Invalid query', details: parsed.errors } });
  }
  const data = await reportService.getDashboard(parsed.value);
  res.json(data);
}

module.exports = {
  postReport: asyncHandler(postReport),
  postReportsUpload: asyncHandler(postReportsUpload),
  getJobStatus: asyncHandler(getJobStatus),
  getDashboard: asyncHandler(getDashboard),
};
