/** Default month YYYY-MM */
export function currentMonthString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonthString(s) {
  return typeof s === 'string' && MONTH_RE.test(s);
}

/** @param {string} ym YYYY-MM */
export function addCalendarMonths(ym, delta) {
  const [y, mo] = ym.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}
