const { Queue } = require('bullmq');
const { createRedisConnection } = require('../config/redis');

const CSV_IMPORT_QUEUE = 'csv-import';

const connection = createRedisConnection();

const csvImportQueue = new Queue(CSV_IMPORT_QUEUE, { connection });

async function enqueueCsvImport(importJobId) {
  await csvImportQueue.add(
    'process',
    { importJobId },
    {
      jobId: importJobId,
      attempts: 1,
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 604800 },
    }
  );
}

module.exports = {
  CSV_IMPORT_QUEUE,
  enqueueCsvImport,
};
