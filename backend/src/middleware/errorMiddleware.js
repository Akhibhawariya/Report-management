const { sendError } = require('../utils/http');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err.message === 'Only CSV files are allowed') {
    return sendError(res, 400, err.message);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'File too large');
    }
    return sendError(res, 400, err.message || 'Upload error');
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  if (status === 500 && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return sendError(res, status, message, err.details);
}

module.exports = errorMiddleware;
