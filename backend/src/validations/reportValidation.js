const { isValidMonth } = require('../utils/month');

function normalizeReportBody(body) {
  return {
    ngoId: body.ngoId ?? body.ngo_id,
    month: body.month,
    peopleHelped: body.peopleHelped ?? body.people_helped,
    eventsConducted: body.eventsConducted ?? body.events_conducted,
    fundsUtilized: body.fundsUtilized ?? body.funds_utilized,
  };
}

function validateReportPayload(raw) {
  const data = normalizeReportBody(raw);
  const errors = [];

  const ngoId = data.ngoId;
  if (ngoId === undefined || ngoId === null || String(ngoId).trim() === '') {
    errors.push({ field: 'ngoId', message: 'NGO ID is required' });
  }

  if (!isValidMonth(data.month)) {
    errors.push({ field: 'month', message: 'Month must be YYYY-MM' });
  }

  const people = Number(data.peopleHelped);
  if (!Number.isFinite(people) || !Number.isInteger(people) || people < 0) {
    errors.push({ field: 'peopleHelped', message: 'peopleHelped must be a non-negative integer' });
  }

  const events = Number(data.eventsConducted);
  if (!Number.isFinite(events) || !Number.isInteger(events) || events < 0) {
    errors.push({
      field: 'eventsConducted',
      message: 'eventsConducted must be a non-negative integer',
    });
  }

  const funds = parseFunds(data.fundsUtilized);
  if (!Number.isFinite(funds) || funds < 0) {
    errors.push({ field: 'fundsUtilized', message: 'fundsUtilized must be a non-negative number' });
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      ngoId: String(ngoId).trim(),
      month: data.month,
      peopleHelped: people,
      eventsConducted: events,
      fundsUtilized: funds,
    },
  };
}

function parseFunds(value) {
  if (value === undefined || value === null || value === '') return NaN;
  if (typeof value === 'number') return value;
  const n = Number(String(value).replace(/,/g, '').trim());
  return n;
}

function validateMonthQuery(month) {
  if (!isValidMonth(month)) {
    return { ok: false, errors: [{ field: 'month', message: 'Query month must be YYYY-MM' }] };
  }
  return { ok: true, value: month };
}

const MAX_NGO_FILTER_LEN = 200;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function validateDashboardQuery(query) {
  const parsedMonth = validateMonthQuery(query.month);
  if (!parsedMonth.ok) return parsedMonth;

  let rawNgo = query.ngoId ?? query.ngo_id;
  let ngoIdContains = null;
  if (rawNgo !== undefined && rawNgo !== null && String(rawNgo).trim() !== '') {
    const s = String(rawNgo).trim();
    if (s.length > MAX_NGO_FILTER_LEN) {
      return {
        ok: false,
        errors: [{ field: 'ngoId', message: `NGO filter must be at most ${MAX_NGO_FILTER_LEN} characters` }],
      };
    }
    ngoIdContains = s;
  }

  let page = Number.parseInt(String(query.page ?? ''), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let pageSize = Number.parseInt(String(query.pageSize ?? query.page_size ?? ''), 10);
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  return {
    ok: true,
    value: {
      month: parsedMonth.value,
      ngoIdContains,
      page,
      pageSize,
    },
  };
}

module.exports = {
  validateReportPayload,
  validateDashboardQuery,
};
