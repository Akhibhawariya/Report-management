'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const pathname = usePathname();
  const submissionsActive = pathname === '/' || pathname === '/bulk-upload';
  const dashboardActive = pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-teal-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 shadow-lg shadow-slate-900/25">
      <div className="flex w-full items-center justify-between gap-4 py-3 pl-4 pr-4 sm:py-4 sm:pl-5 sm:pr-5 lg:pl-6 lg:pr-6">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-3 rounded-lg outline-none ring-offset-2 ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-teal-500/35 ring-2 ring-white/10">
            NR
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-white sm:text-lg">NGO Reports</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3" aria-label="Primary">
          <Link
            href="/"
            className={[
              'rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
              submissionsActive
                ? 'bg-teal-500/15 text-teal-100 shadow-inner ring-1 ring-teal-400/35'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            Submissions
          </Link>
          <Link
            href="/dashboard"
            className={[
              'rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-4',
              dashboardActive
                ? 'bg-teal-500/15 text-teal-100 shadow-inner ring-1 ring-teal-400/35'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
