const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function isValidMonth(value) {
  return typeof value === 'string' && MONTH_REGEX.test(value);
}

module.exports = { isValidMonth };
