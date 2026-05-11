const { prisma } = require('../config/db');

function dashboardWhere(month, ngoIdContains) {
  const where = { month };
  if (ngoIdContains) {
    where.ngoId = { contains: ngoIdContains, mode: 'insensitive' };
  }
  return where;
}

async function upsertReport(data) {
  return prisma.report.upsert({
    where: {
      ngoId_month: {
        ngoId: data.ngoId,
        month: data.month,
      },
    },
    create: {
      ngoId: data.ngoId,
      month: data.month,
      peopleHelped: data.peopleHelped,
      eventsConducted: data.eventsConducted,
      fundsUtilized: data.fundsUtilized,
    },
    update: {
      peopleHelped: data.peopleHelped,
      eventsConducted: data.eventsConducted,
      fundsUtilized: data.fundsUtilized,
    },
  });
}

async function aggregateDashboard(month, ngoIdContains = null) {
  const where = dashboardWhere(month, ngoIdContains);
  const agg = await prisma.report.aggregate({
    where,
    _sum: {
      peopleHelped: true,
      eventsConducted: true,
      fundsUtilized: true,
    },
    _count: { _all: true },
  });

  return {
    month,
    totalNgosReporting: agg._count._all,
    totalPeopleHelped: agg._sum.peopleHelped ?? 0,
    totalEventsConducted: agg._sum.eventsConducted ?? 0,
    totalFundsUtilized: agg._sum.fundsUtilized?.toString() ?? '0',
  };
}

async function listReportsForDashboard(month, ngoIdContains, page, pageSize) {
  const where = dashboardWhere(month, ngoIdContains);
  const skip = (page - 1) * pageSize;

  const [totalCount, rows] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: [{ ngoId: 'asc' }, { id: 'asc' }],
      skip,
      take: pageSize,
      select: {
        id: true,
        ngoId: true,
        month: true,
        peopleHelped: true,
        eventsConducted: true,
        fundsUtilized: true,
        updatedAt: true,
      },
    }),
  ]);

  return { rows, totalCount };
}

module.exports = {
  upsertReport,
  aggregateDashboard,
  listReportsForDashboard,
};
