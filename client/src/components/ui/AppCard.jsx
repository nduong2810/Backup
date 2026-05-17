export default function AppCard({ title, subtitle, children, rightSlot }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-sm sm:p-10">
      {(title || subtitle || rightSlot) && (
        <header className="mb-8 flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center w-full">
            {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-2 text-base text-slate-600">{subtitle}</p>}
          </div>
          {rightSlot}
        </header>
      )}
      {children}
    </section>
  );
}

