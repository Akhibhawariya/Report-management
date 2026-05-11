require('dotenv').config();

const requiredInProduction = ['DATABASE_URL', 'REDIS_URL'];

function validateEnv() {
  if (process.env.NODE_ENV === 'production') {
    for (const key of requiredInProduction) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }
}

validateEnv();

module.exports = {
  port: Number(process.env.PORT) || 4000,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  uploadsDir: process.env.UPLOADS_DIR || require('path').join(__dirname, '..', '..', 'uploads'),
  maxCsvBytes: Number(process.env.MAX_CSV_BYTES) || 10 * 1024 * 1024,
};
