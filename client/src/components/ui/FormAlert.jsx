export default function FormAlert({ message, type = 'info' }) {
  if (!message) return null;

  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`flex min-h-11 items-center rounded-xl border px-4 py-2.5 text-sm font-medium ${styles[type]}`}>
      {message}
    </div>
  );
}

