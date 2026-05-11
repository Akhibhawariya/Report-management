const fs = require('fs/promises');
const path = require('path');
const { validate: isUuid } = require('uuid');
const config = require('../config');
const importJobRepository = require('../repositories/importJobRepository');
const { enqueueCsvImport } = require('../queues/csvImportQueue');

async function ensureUploadsDir() {
  await fs.mkdir(config.uploadsDir, { recursive: true });
}

async function createUploadFromDisk(tempPath, originalName) {
  await ensureUploadsDir();
  const ext = path.extname(originalName || '') || '.csv';
  const safeBase = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const dest = path.join(config.uploadsDir, `${safeBase}${ext}`);
  try {
    await fs.rename(tempPath, dest);
  } catch (err) {
    // /tmp and UPLOADS_DIR are different mounts in Docker → rename throws EXDEV.
    if (err.code !== 'EXDEV') throw err;
    await fs.copyFile(tempPath, dest);
    await fs.unlink(tempPath);
  }
  return dest;
}

async function scheduleCsvImport(savedPath) {
  const job = await importJobRepository.createJob(savedPath);
  await enqueueCsvImport(job.id);
  return job;
}

function assertUuid(id) {
  return typeof id === 'string' && isUuid(id);
}

async function getJobStatus(jobId) {
  if (!assertUuid(jobId)) {
    const err = new Error('job_id must be a UUID');
    err.status = 400;
    throw err;
  }
  const job = await importJobRepository.getJobById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }
  return job;
}

module.exports = {
  createUploadFromDisk,
  scheduleCsvImport,
  getJobStatus,
};
