const icons = {
  error: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export function Alert({ type = 'info', title, children }) {
  const styles =
    type === 'error'
      ? 'border-red-200/80 bg-gradient-to-br from-red-50 to-rose-50/90 text-red-950 shadow-red-900/5'
      : type === 'success'
        ? 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/80 text-emerald-950 shadow-emerald-900/5'
        : 'border-sky-200/70 bg-gradient-to-br from-sky-50/90 to-slate-50/80 text-slate-800 shadow-slate-900/5';

  const Icon = icons[type] || icons.info;

  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm shadow-md backdrop-blur-sm ${styles}`}
      role="status"
    >
      <span className="mt-0.5 opacity-90">{Icon}</span>
      <div className="min-w-0 flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        <div className={title ? 'mt-0.5 text-sm opacity-95' : ''}>{children}</div>
      </div>
    </div>
  );
}
