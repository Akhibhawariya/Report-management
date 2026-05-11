const IORedis = require('ioredis');
const config = require('./index');

function createRedisConnection() {
  return new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });
}

module.exports = { createRedisConnection };
