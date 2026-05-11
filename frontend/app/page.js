'use client';

import { useState } from 'react';
import { Alert } from '../components/Alert';
import { BulkUploadSection } from '../components/BulkUploadSection';
import { CapturePanel } from '../components/CapturePanel';
import { PrimaryButton } from '../components/PrimaryButton';
import { submitReport } from '../services/api/client';
import { currentMonthString } from '../utils/date';
import { formatCurrency, formatInteger } from '../utils/format';

const empty = {
  ngoId: '',
  month: currentMonthString(),
  peopleHelped: '',
  eventsConducted: '',
  fundsUtilized: '',
};

export default function HomePage() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedSummary, setSavedSummary] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedSummary(null);
    try {
      const payload = {
        ngoId: form.ngoId.trim(),
        month: form.month.trim(),
        peopleHelped: Number(form.peopleHelped),
        eventsConducted: Number(form.eventsConducted),
        fundsUtilized: Number(String(form.fundsUtilized).replace(/,/g, '')),
      };
      const res = await submitReport(payload);
      setSavedSummary(res.report);
      setForm((f) => ({ ...empty, month: f.month }));
    } catch (err) {
      const detail =
        Array.isArray(err.details) && err.details.length
          ? err.details.map((d) => `${d.field}: ${d.message}`).join('; ')
          : err.message;
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="max-w-4xl">
        <p className="page-eyebrow">Workspaces</p>
        <h1 className="page-title">Submissions</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <CapturePanel mode="form" title="Single Report">
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-6">
            <fieldset className="space-y-4">
              <legend className="sr-only">Report identity</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="ngoId" className="text-sm font-semibold text-teal-950">
                    NGO ID
                  </label>
                  <input
                    id="ngoId"
                    name="ngoId"
                    value={form.ngoId}
                    onChange={onChange}
                    className="input-field w-full"
                    autoComplete="off"
                    placeholder="e.g. ngo-east-42"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="month" className="text-sm font-semibold text-teal-950">
                    Month (YYYY-MM)
                  </label>
                  <input
                    id="month"
                    name="month"
                    value={form.month}
                    onChange={onChange}
                    pattern="\d{4}-(0[1-9]|1[0-2])"
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-t border-cyan-700/20 pt-6">
              <legend className="text-sm font-bold text-teal-950">Impact</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label htmlFor="peopleHelped" className="text-sm font-semibold text-teal-950">
                    People helped
                  </label>
                  <input
                    id="peopleHelped"
                    name="peopleHelped"
                    type="number"
                    min={0}
                    step={1}
                    value={form.peopleHelped}
                    onChange={onChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="eventsConducted" className="text-sm font-semibold text-teal-950">
                    Events
                  </label>
                  <input
                    id="eventsConducted"
                    name="eventsConducted"
                    type="number"
                    min={0}
                    step={1}
                    value={form.eventsConducted}
                    onChange={onChange}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="fundsUtilized" className="text-sm font-semibold text-teal-950">
                    Funds (INR)
                  </label>
                  <input
                    id="fundsUtilized"
                    name="fundsUtilized"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fundsUtilized}
                    onChange={onChange}
                    className="input-field w-full"
                    placeholder="₹"
                    title="Amount in Indian Rupees"
                    required
                  />
                </div>
              </div>
            </fieldset>

            {error ? (
              <Alert type="error" title="Could not save">
                {error}
              </Alert>
            ) : null}
            {savedSummary ? (
              <>
                <Alert type="success" title="Saved">
                  Saved {savedSummary.ngoId} · {savedSummary.month}
                </Alert>
                <div className="grid gap-3 rounded-xl border border-emerald-600/30 bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-cyan-500/20 p-4 shadow-inner sm:grid-cols-3">
                  <SummaryPill label="People helped" value={formatInteger(savedSummary.peopleHelped)} />
                  <SummaryPill label="Events" value={formatInteger(savedSummary.eventsConducted)} />
                  <SummaryPill label="Funds (INR)" value={formatCurrency(savedSummary.fundsUtilized)} />
                </div>
              </>
            ) : null}

            <PrimaryButton disabled={loading} className="mt-auto min-w-[140px]">
              {loading ? 'Saving…' : 'Upload reports'}
            </PrimaryButton>
          </form>
        </CapturePanel>

        <div className="contents">
          <BulkUploadSection />
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value }) {
  return (
    <div className="rounded-xl border border-emerald-500/35 bg-white/50 px-3 py-2.5 shadow-sm ring-1 ring-cyan-400/20 backdrop-blur-sm">
      <div className="text-xs font-semibold text-emerald-950/90">{label}</div>
      <div className="mt-0.5 bg-gradient-to-r from-slate-800 to-teal-800 bg-clip-text text-lg font-semibold tabular-nums text-transparent">
        {value}
      </div>
    </div>
  );
}
