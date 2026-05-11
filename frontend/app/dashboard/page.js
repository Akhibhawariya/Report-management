'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert } from '../../components/Alert';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { fetchDashboard } from '../../services/api/client';
import { addCalendarMonths, currentMonthString, isValidMonthString } from '../../utils/date';
import { formatCurrency, formatInteger } from '../../utils/format';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const STORAGE = {
  month: 'dashboard:month',
  ngo: 'dashboard:ngo',
  page: 'dashboard:page',
  pageSize: 'dashboard:pageSize',
};

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonthString());
  const [ngoDraft, setNgoDraft] = useState('');
  const [ngoFilter, setNgoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const storageReady = useRef(false);

  const load = useCallback(async () => {
    if (!isValidMonthString(month)) {
      setError('Use month format YYYY-MM (e.g. 2026-03).');
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboard(month, {
        ngoId: ngoFilter.trim() || undefined,
        page,
        pageSize,
      });
      setData(res);
      setUpdatedAt(new Date());
    } catch (e) {
      setData(null);
      const detail =
        Array.isArray(e.details) && e.details.length
          ? e.details.map((d) => `${d.field}: ${d.message}`).join('; ')
          : e.message;
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [month, ngoFilter, page, pageSize]);

  useLayoutEffect(() => {
    const rawMonth = sessionStorage.getItem(STORAGE.month);
    const nextMonth =
      rawMonth && isValidMonthString(rawMonth) ? rawMonth : currentMonthString();
    setMonth(nextMonth);

    const rawNgo = sessionStorage.getItem(STORAGE.ngo) ?? '';
    setNgoFilter(rawNgo);
    setNgoDraft(rawNgo);

    const rawPage = parseInt(sessionStorage.getItem(STORAGE.page) ?? '1', 10);
    setPage(Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1);

    const rawPs = parseInt(sessionStorage.getItem(STORAGE.pageSize) ?? '10', 10);
    setPageSize(PAGE_SIZE_OPTIONS.includes(rawPs) ? rawPs : 10);

    storageReady.current = true;
  }, []);

  useEffect(() => {
    if (!storageReady.current || !isValidMonthString(month)) return;
    sessionStorage.setItem(STORAGE.month, month);
  }, [month]);

  useEffect(() => {
    if (!storageReady.current) return;
    sessionStorage.setItem(STORAGE.ngo, ngoFilter);
  }, [ngoFilter]);

  useEffect(() => {
    if (!storageReady.current) return;
    sessionStorage.setItem(STORAGE.page, String(page));
  }, [page]);

  useEffect(() => {
    if (!storageReady.current) return;
    sessionStorage.setItem(STORAGE.pageSize, String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function applyNgoFilter() {
    setNgoFilter(ngoDraft.trim());
    setPage(1);
  }

  function clearNgoFilter() {
    setNgoDraft('');
    setNgoFilter('');
    setPage(1);
  }

  function shiftMonth(delta) {
    if (!isValidMonthString(month)) return;
    setPage(1);
    setMonth(addCalendarMonths(month, delta));
  }

  const pg = data?.pagination;
  const canPrev = pg && pg.page > 1;
  const canNext = pg && pg.page < pg.totalPages;

  return (
    <div className="space-y-8">
      <header className="max-w-4xl">
        <p className="page-eyebrow">Analytics</p>
        <h1 className="page-title">Dashboard</h1>
      </header>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="dash-month" className="block text-sm font-semibold text-teal-950">
                Month
              </label>
              <div className="mt-2 flex items-center gap-1">
                <PrimaryButton
                  type="button"
                  variant="outline"
                  className="px-3"
                  onClick={() => shiftMonth(-1)}
                  disabled={loading || !isValidMonthString(month)}
                  aria-label="Previous month"
                >
                  ←
                </PrimaryButton>
                <input
                  id="dash-month"
                  value={month}
                  onChange={(e) => {
                    setPage(1);
                    setMonth(e.target.value);
                  }}
                  pattern="\d{4}-(0[1-9]|1[0-2])"
                  className="input-field mt-2 w-36 py-2 text-center text-sm font-medium tabular-nums"
                />
                <PrimaryButton
                  type="button"
                  variant="outline"
                  className="px-3"
                  onClick={() => shiftMonth(1)}
                  disabled={loading || !isValidMonthString(month)}
                  aria-label="Next month"
                >
                  →
                </PrimaryButton>
              </div>
            </div>
            <PrimaryButton type="button" variant="outline" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </PrimaryButton>
          </div>

          <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="ngo-filter" className="block text-sm font-semibold text-teal-950">
                NGO ID contains
              </label>
              <input
                id="ngo-filter"
                value={ngoDraft}
                onChange={(e) => setNgoDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyNgoFilter();
                  }
                }}
                placeholder="e.g. ngo-east"
                className="input-field mt-2 w-full"
                autoComplete="off"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <PrimaryButton type="button" variant="outline" className="whitespace-nowrap" onClick={applyNgoFilter}>
                Apply
              </PrimaryButton>
              <PrimaryButton
                type="button"
                variant="outline"
                className="whitespace-nowrap"
                onClick={clearNgoFilter}
                disabled={!ngoDraft && !ngoFilter}
              >
                Clear
              </PrimaryButton>
            </div>
          </div>

          <div>
            <label htmlFor="page-size" className="block text-sm font-semibold text-teal-950">
              Rows per page
            </label>
            <select
              id="page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="input-field mt-2 w-full py-2 sm:w-28"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {ngoFilter ? (
          <p className="text-xs font-medium text-teal-900/80">
            Filter active: <span className="font-mono">{ngoFilter}</span> — totals and table rows match this search.
          </p>
        ) : (
          <p className="text-xs text-teal-950/65">No NGO filter — showing all reports for {month}.</p>
        )}

        {updatedAt && !loading ? (
          <p className="text-xs font-medium text-teal-950/70">
            Updated{' '}
            {updatedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        ) : null}
      </Card>

      {error ? (
        <Alert type="error" title="Could not load dashboard">
          {error}
        </Alert>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-gradient-to-br from-teal-100/50 via-white/30 to-cyan-100/40 ring-1 ring-white/50"
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              title="NGOs reporting"
              value={formatInteger(data.totalNgosReporting)}
              accent="border-l-4 border-l-teal-500"
              foot={data.month}
            />
            <Metric
              title="People helped"
              value={formatInteger(data.totalPeopleHelped)}
              accent="border-l-4 border-l-sky-500"
            />
            <Metric
              title="Events conducted"
              value={formatInteger(data.totalEventsConducted)}
              accent="border-l-4 border-l-violet-500"
            />
            <Metric
              title="Funds utilized (INR)"
              value={formatCurrency(data.totalFundsUtilized)}
              accent="border-l-4 border-l-amber-500"
              foot="Sum (INR)"
            />
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-teal-500/20 bg-teal-950/[0.06] px-4 py-3 sm:px-6">
              <h2 className="text-sm font-bold text-teal-950">Reports in scope</h2>
              <p className="mt-0.5 text-xs text-teal-950/65">
                {data.pagination?.totalCount != null
                  ? `${formatInteger(data.pagination.totalCount)} row(s) · page ${data.pagination.page} of ${data.pagination.totalPages}`
                  : null}
              </p>
            </div>

            {data.pagination?.totalCount === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-teal-950/70 sm:px-6">
                No reports for <span className="font-mono font-medium">{month}</span>
                {ngoFilter ? (
                  <>
                    {' '}
                    matching <span className="font-mono font-medium">{ngoFilter}</span>
                  </>
                ) : null}
                .
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal-500/15 bg-teal-950/[0.04] text-xs font-semibold uppercase tracking-wide text-teal-950/70">
                      <th className="px-4 py-3 sm:px-6">NGO ID</th>
                      <th className="px-4 py-3 sm:px-6">People</th>
                      <th className="px-4 py-3 sm:px-6">Events</th>
                      <th className="px-4 py-3 sm:px-6">Funds (INR)</th>
                      <th className="px-4 py-3 sm:px-6">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-teal-500/10 transition-colors hover:bg-teal-500/[0.06]"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-teal-950 sm:px-6">
                          {r.ngoId}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-teal-950 sm:px-6">{formatInteger(r.peopleHelped)}</td>
                        <td className="px-4 py-3 tabular-nums text-teal-950 sm:px-6">
                          {formatInteger(r.eventsConducted)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-teal-950 sm:px-6">
                          {formatCurrency(r.fundsUtilized)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-teal-950/75 sm:px-6">
                          {new Date(r.updatedAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.pagination && data.pagination.totalCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-teal-500/15 px-4 py-3 sm:px-6">
                <PrimaryButton
                  type="button"
                  variant="outline"
                  disabled={loading || !canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </PrimaryButton>
                <span className="text-xs font-medium text-teal-950/80">
                  Page {data.pagination.page} / {data.pagination.totalPages}
                </span>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  disabled={loading || !canNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </PrimaryButton>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {!loading && data && data.totalNgosReporting === 0 && !ngoFilter ? (
        <Alert type="info" title="No rows for this month">
          Submit a single report or run a bulk import — totals will show here once data exists for{' '}
          <span className="font-mono font-medium">{month}</span>.
        </Alert>
      ) : null}
    </div>
  );
}

function Metric({ title, value, foot, accent }) {
  return (
    <Card className={`${accent} overflow-hidden pt-5`}>
      <div className="text-sm font-semibold text-teal-950/70">{title}</div>
      {foot ? <div className="mt-1 text-xs text-teal-950/55">{foot}</div> : null}
      <div className="mt-3 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 bg-clip-text text-3xl font-semibold tracking-tight tabular-nums text-transparent">
        {value}
      </div>
    </Card>
  );
}
