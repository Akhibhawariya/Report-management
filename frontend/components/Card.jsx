export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-teal-500/35 bg-gradient-to-br from-teal-500/20 via-cyan-500/15 to-indigo-500/20 p-6 shadow-[0_12px_40px_-8px_rgba(15,118,110,0.25)] backdrop-blur-md ring-1 ring-white/25 ${className}`}
    >
      {children}
    </div>
  );
}
