export function PrimaryButton({ children, disabled, type = 'submit', onClick, variant = 'solid', className = '' }) {
  const variants = {
    solid:
      'bg-gradient-to-r from-teal-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25 hover:from-teal-500 hover:via-teal-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-teal-500/30 disabled:from-slate-400 disabled:via-slate-400 disabled:to-slate-500 disabled:shadow-none',
    outline:
      'border border-teal-200/80 bg-white/70 text-slate-700 shadow-sm backdrop-blur-sm hover:border-teal-300 hover:bg-teal-50/90 hover:text-teal-900 disabled:border-slate-200 disabled:bg-slate-50',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] || variants.solid} ${className}`}
    >
      {children}
    </button>
  );
}
