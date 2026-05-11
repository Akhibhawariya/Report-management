function FormGlyph() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function UploadGlyph() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

export function CapturePanel({ mode = 'form', title, children, className = '' }) {
  const Icon = mode === 'upload' ? UploadGlyph : FormGlyph;

  return (
    <section className={`flex h-full min-h-0 w-full min-w-0 flex-col ${className}`}>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-dashed border-teal-400/80 bg-gradient-to-br from-teal-500/35 via-emerald-400/25 to-cyan-500/30 p-4 shadow-[0_20px_50px_-12px_rgba(13,148,136,0.35)] ring-1 ring-inset ring-white/30 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-900/30 ring-2 ring-white/30">
              <Icon />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-teal-950 sm:text-xl">{title}</h2>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-dashed border-cyan-700/25 bg-gradient-to-b from-teal-950/15 via-teal-900/10 to-cyan-950/20 p-4 backdrop-blur-md ring-1 ring-white/25 sm:p-6">
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
