const reportRepository = require('../repositories/reportRepository');
const { validateReportPayload } = require('../validations/reportValidation');

async function submitSingleReport(body) {
  const parsed = validateReportPayload(body);
  if (!parsed.ok) {
    const err = new Error('Validation failed');
    err.status = 400;
    err.details = parsed.errors;
    throw err;
  }
  const row = await reportRepository.upsertReport(parsed.value);
  return row;
}

async function getDashboard({ month, ngoIdContains, page, pageSize }) {
  const filterNgo = ngoIdContains || null;

  const [aggregates, pageResult] = await Promise.all([
    reportRepository.aggregateDashboard(month, filterNgo),
    reportRepository.listReportsForDashboard(month, filterNgo, page, pageSize),
  ]);

  const { rows, totalCount } = pageResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    month,
    filters: {
      ngoId: filterNgo,
    },
    totalNgosReporting: aggregates.totalNgosReporting,
    totalPeopleHelped: aggregates.totalPeopleHelped,
    totalEventsConducted: aggregates.totalEventsConducted,
    totalFundsUtilized: aggregates.totalFundsUtilized,
    reports: rows.map((r) => ({
      id: r.id,
      ngoId: r.ngoId,
      month: r.month,
      peopleHelped: r.peopleHelped,
      eventsConducted: r.eventsConducted,
      fundsUtilized: r.fundsUtilized.toString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
  };
}

module.exports = {
  submitSingleReport,
  getDashboard,
};
