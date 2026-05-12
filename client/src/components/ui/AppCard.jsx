export default function AppCard({ title, subtitle, children, rightSlot }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
      {(title || subtitle || rightSlot) && (
        <header className="mb-6 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-xl font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          {rightSlot}
        </header>
      )}
      {children}
    </section>
  );
}

