'use client';

import { useCallback, useRef, useState } from 'react';
import { Alert } from './Alert';
import { Card } from './Card';
import { CapturePanel } from './CapturePanel';
import { PrimaryButton } from './PrimaryButton';
import { uploadReportsCsv } from '../services/api/client';
import { useJobPolling } from '../hooks/useJobPolling';

const STATUS_STYLES = {
  pending: 'bg-gradient-to-r from-amber-100/90 to-orange-50/80 text-amber-950 ring-amber-300/60',
  processing: 'bg-gradient-to-r from-sky-100/90 to-cyan-50/80 text-sky-950 ring-sky-300/60',
  completed: 'bg-gradient-to-r from-emerald-100/90 to-teal-50/80 text-emerald-950 ring-emerald-300/60',
  failed: 'bg-gradient-to-r from-red-100/90 to-rose-50/80 text-red-950 ring-red-300/60',
};

export function BulkUploadSection() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const { data: job, loading: jobLoading, error: jobError } = useJobPolling(jobId);

  const progressPct =
    job && job.totalRows > 0 ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100)) : null;

  const onFileChosen = useCallback((f) => {
    setFile(f || null);
    setSubmitError(null);
  }, []);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && /\.csv$/i.test(f.name)) onFileChosen(f);
    else if (f) setSubmitError('Please drop a .csv file.');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) {
      setSubmitError('Choose a CSV file first.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setJobId(null);
    setCopyDone(false);
    try {
      const res = await uploadReportsCsv(file);
      setJobId(res.jobId);
    } catch (err) {
      setSubmitError(err.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyJobId() {
    if (!jobId || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(jobId);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }

  const progressLabel =
    job && job.totalRows > 0
      ? `${job.processedRows} / ${job.totalRows} rows`
      : job?.status === 'pending'
        ? 'Queued — worker will start shortly…'
        : 'Scanning file…';

  return (
    <>
      <CapturePanel mode="upload" title="Upload Spreadsheet">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-5">
          <div>
            <span className="sr-only">CSV file</span>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={[
                'capture-dropzone mt-0',
                dragOver ? 'capture-dropzone-active' : 'capture-dropzone-idle',
              ].join(' ')}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => onFileChosen(e.target.files?.[0] || null)}
              />
              <div className="pointer-events-none rounded-2xl bg-gradient-to-br from-white/60 to-cyan-300/40 p-3 shadow-lg shadow-teal-900/20 ring-1 ring-cyan-300/50">
                <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="pointer-events-none mt-4 text-sm font-semibold text-teal-950">
                {file ? file.name : 'Drag & drop your CSV here'}
              </p>
              <p className="pointer-events-none mt-1 text-xs text-teal-950/65">
                {file ? `${(file.size / 1024).toFixed(1)} KB · click to replace` : 'or click to browse  .csv only'}
              </p>
            </div>
            {file ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PrimaryButton
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                >
                  Clear file
                </PrimaryButton>
              </div>
            ) : null}
          </div>

          {submitError ? (
            <Alert type="error" title="Upload blocked">
              {submitError}
            </Alert>
          ) : null}

          <PrimaryButton type="submit" disabled={submitting || !file} className="mt-auto min-w-[200px]">
            {submitting ? 'Uploading…' : 'Upload and process'}
          </PrimaryButton>
        </form>
      </CapturePanel>

      {jobId ? (
        <div className="col-span-full w-full min-w-0">
          <Card className="w-full space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-teal-950">Import status</h3>
                <p className="mt-1 text-xs text-teal-950/70">
                  Job ID{' '}
                  <code className="rounded-md border border-teal-600/30 bg-teal-900/10 px-1.5 py-0.5 font-mono text-teal-950">
                    {jobId}
                  </code>
                </p>
              </div>
              <PrimaryButton type="button" variant="outline" className="shrink-0 text-xs" onClick={copyJobId}>
                {copyDone ? 'Copied!' : 'Copy job ID'}
              </PrimaryButton>
            </div>

          {jobLoading && !job ? <p className="text-sm text-teal-950/75">Loading status…</p> : null}
          {jobError ? (
            <Alert type="error" title="Status error">
              {jobError}
            </Alert>
          ) : null}

          {job ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${STATUS_STYLES[job.status] || 'bg-slate-100/90 text-slate-800 ring-slate-300/60'}`}
                >
                  {job.status}
                </span>
                <span className="text-sm font-medium text-teal-950/85">{progressLabel}</span>
              </div>

              {progressPct !== null ? (
                <div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90 ring-1 ring-slate-300/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-400 transition-all duration-500 ease-out shadow-sm shadow-teal-600/30"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-teal-950/60">{progressPct}% complete</p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Succeeded" value={job.successCount} tone="ok" />
                <Stat label="Failed" value={job.failureCount} tone={job.failureCount ? 'bad' : 'neutral'} />
                <Stat label="Total rows" value={job.totalRows} tone="neutral" />
              </div>

              {job.status === 'completed' && job.failureCount === 0 ? (
                <Alert type="success" title="Import finished">
                  All rows were imported successfully.
                </Alert>
              ) : null}
              {job.status === 'failed' ? (
                <Alert type="error" title="Job failed">
                  See errors below for details from the worker.
                </Alert>
              ) : null}

              {job.errors?.length ? (
                <div className="max-h-56 overflow-auto rounded-xl border border-cyan-600/25 bg-teal-950/10 p-4 text-xs shadow-inner backdrop-blur-sm">
                  <div className="font-semibold text-teal-950">Row issues (latest {Math.min(20, job.errors.length)})</div>
                  <ul className="mt-2 space-y-2 text-teal-950/85">
                    {job.errors.slice(-20).map((er, idx) => (
                      <li key={`${er.row}-${idx}`} className="border-b border-teal-800/15 pb-2 last:border-0 last:pb-0">
                        <span className="font-mono text-sm text-teal-950/70">Row {er.row ?? '—'}</span>
                        <span className="mt-0.5 block text-teal-950">{er.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
          </Card>
        </div>
      ) : null}
    </>
  );
}

function Stat({ label, value, tone }) {
  const styles =
    tone === 'ok'
      ? 'border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 ring-emerald-100'
      : tone === 'bad'
        ? 'border-red-200/50 bg-gradient-to-br from-red-50/80 to-rose-50/30 ring-red-100'
        : 'border-slate-200/60 bg-white/60 ring-slate-100';
  return (
    <div className={`rounded-xl border px-3 py-3 ring-1 ${styles}`}>
      <div className="text-xs font-semibold text-teal-950/65">{label}</div>
      <div className="mt-1 bg-gradient-to-r from-slate-800 to-teal-800 bg-clip-text text-xl font-semibold tabular-nums text-transparent">
        {value}
      </div>
    </div>
  );
}
