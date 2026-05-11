function sendError(res, status, message, details) {
  const body = {
    error: {
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return res.status(status).json(body);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { sendError, asyncHandler };
