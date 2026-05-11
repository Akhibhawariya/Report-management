const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const routes = require('./routes');
const errorMiddleware = require('./middleware/errorMiddleware');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin.split(',').map((s) => s.trim()),
      credentials: false,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(routes);
  app.use(errorMiddleware);

  return app;
}

module.exports = { createApp };
