const { prisma } = require('../config/db');

const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

async function createJob(filePath) {
  return prisma.importJob.create({
    data: {
      status: JOB_STATUS.PENDING,
      filePath,
    },
  });
}

async function getJobById(id) {
  return prisma.importJob.findUnique({ where: { id } });
}

async function setJobProcessing(id, totalRows) {
  return prisma.importJob.update({
    where: { id },
    data: {
      status: JOB_STATUS.PROCESSING,
      totalRows,
      processedRows: 0,
      successCount: 0,
      failureCount: 0,
      errors: [],
    },
  });
}

async function patchJob(id, data) {
  return prisma.importJob.update({
    where: { id },
    data,
  });
}

async function completeJob(id, final) {
  return prisma.importJob.update({
    where: { id },
    data: {
      status: JOB_STATUS.COMPLETED,
      processedRows: final.processedRows,
      successCount: final.successCount,
      failureCount: final.failureCount,
      totalRows: final.totalRows,
      errors: final.errors,
    },
  });
}

async function failJob(id, message) {
  return prisma.importJob.update({
    where: { id },
    data: {
      status: JOB_STATUS.FAILED,
      errors: [{ row: null, message: String(message) }],
    },
  });
}

module.exports = {
  JOB_STATUS,
  createJob,
  getJobById,
  setJobProcessing,
  patchJob,
  completeJob,
  failJob,
};
