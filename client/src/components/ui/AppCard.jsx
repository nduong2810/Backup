export default function AppCard({
  title,
  subtitle,
  children,
  rightSlot,
  icon,
  className = '',
  contentClassName = '',
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] sm:p-8 ${className}`}>
      {(title || subtitle || rightSlot) && (
        <header className="relative mb-7 border-b border-slate-100 pb-6 text-center">
          {rightSlot && (
            <div className="absolute right-0 top-0">
              {rightSlot}
            </div>
          )}
          <div className="mx-auto max-w-md">
            {icon && (
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[26px]">{icon}</span>
              </div>
            )}
            {title && <h2 className="text-[26px] font-extrabold leading-tight text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}

