const fs = require('fs/promises');
const { parse } = require('csv-parse/sync');
const { Worker } = require('bullmq');
require('../config');
const { CSV_IMPORT_QUEUE } = require('../queues/csvImportQueue');
const { createRedisConnection } = require('../config/redis');
const importJobRepository = require('../repositories/importJobRepository');
const { JOB_STATUS } = importJobRepository;
const reportRepository = require('../repositories/reportRepository');
const { validateReportPayload } = require('../validations/reportValidation');
const { safeUnlink } = require('../utils/fs');

const PROGRESS_EVERY = 5;

function normalizeCsvRecord(record) {
  const map = {};
  for (const [k, v] of Object.entries(record)) {
    const key = String(k).trim().toLowerCase().replace(/\s+/g, '_');
    map[key] = v;
  }
  return {
    ngoId: map.ngo_id ?? map.ngoid,
    month: map.month,
    peopleHelped: map.people_helped ?? map.peoplehelped,
    eventsConducted: map.events_conducted ?? map.eventsconducted,
    fundsUtilized: map.funds_utilized ?? map.fundsutilized,
  };
}

async function processImportJob(importJobId) {
  const jobRow = await importJobRepository.getJobById(importJobId);
  if (!jobRow) {
    throw new Error('Import job not found');
  }
  if (jobRow.status === JOB_STATUS.COMPLETED) {
    return;
  }
  if (!jobRow.filePath) {
    await importJobRepository.failJob(importJobId, 'Missing upload file');
    return;
  }

  let raw;
  try {
    raw = await fs.readFile(jobRow.filePath, 'utf8');
  } catch (e) {
    await importJobRepository.failJob(importJobId, `Could not read upload: ${e.message}`);
    await safeUnlink(jobRow.filePath);
    return;
  }

  let rows;
  try {
    rows = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (e) {
    await importJobRepository.failJob(importJobId, `Invalid CSV: ${e.message}`);
    await safeUnlink(jobRow.filePath);
    return;
  }

  const totalRows = rows.length;
  await importJobRepository.setJobProcessing(importJobId, totalRows);

  const errors = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const lineNumber = i + 2;
    const normalized = normalizeCsvRecord(rows[i]);
    const validated = validateReportPayload(normalized);

    if (!validated.ok) {
      failureCount += 1;
      errors.push({
        row: lineNumber,
        message: validated.errors.map((e) => `${e.field}: ${e.message}`).join('; '),
      });
    } else {
      try {
        await reportRepository.upsertReport(validated.value);
        successCount += 1;
      } catch (e) {
        failureCount += 1;
        errors.push({ row: lineNumber, message: e.message || 'Database error' });
      }
    }

    const processedRows = i + 1;
    if (processedRows % PROGRESS_EVERY === 0 || processedRows === totalRows) {
      await importJobRepository.patchJob(importJobId, {
        processedRows,
        successCount,
        failureCount,
        errors: errors.slice(-200),
      });
    }
  }

  await importJobRepository.completeJob(importJobId, {
    totalRows,
    processedRows: totalRows,
    successCount,
    failureCount,
    errors: errors.slice(-500),
  });

  await safeUnlink(jobRow.filePath);
  await importJobRepository.patchJob(importJobId, { filePath: null });
}

function startWorker() {
  const worker = new Worker(
    CSV_IMPORT_QUEUE,
    async (bullJob) => {
      const { importJobId } = bullJob.data;
      await bullJob.updateProgress({ stage: 'started', importJobId });
      await processImportJob(importJobId);
      await bullJob.updateProgress({ stage: 'done', importJobId });
    },
    { connection: createRedisConnection() }
  );

  worker.on('failed', async (job, err) => {
    if (!job?.data?.importJobId) return;
    try {
      await importJobRepository.failJob(job.data.importJobId, err.message || 'Worker failed');
      const row = await importJobRepository.getJobById(job.data.importJobId);
      await safeUnlink(row?.filePath);
    } catch {
      // ignore
    }
  });

  return worker;
}

if (require.main === module) {
  startWorker();
  // eslint-disable-next-line no-console
  console.log(`CSV import worker listening on queue "${CSV_IMPORT_QUEUE}"`);
}

module.exports = { startWorker };
