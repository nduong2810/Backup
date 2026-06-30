export default function AppButton({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
}) {
  const variants = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary/90',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-extrabold transition focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}

