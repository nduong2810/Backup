import { useState, useMemo } from 'react';

/**
 * AppPagination Component
 * @param {object} props
 * @param {number} props.page - Current active page (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.onPageChange - Callback when page changes
 */
export default function AppPagination({
  page,
  totalPages,
  onPageChange,
  limit,
  limitOptions = [15, 30, 50],
  onLimitChange
}) {
  const [jumpPage, setJumpPage] = useState('');

  const paginationItems = useMemo(() => {
    const total = totalPages || 1;
    const current = page || 1;

    if (total <= 1) return [1];
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

    const items = [];
    
    // Always include page 1
    items.push(1);

    if (current > 3) {
      items.push('ellipsis-start');
    }

    // Determine middle items around current page
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let p = start; p <= end; p++) {
      if (p > 1 && p < total) {
        items.push(p);
      }
    }

    if (current < total - 2) {
      items.push('ellipsis-end');
    }

    // Always include the last page
    items.push(total);

    return items;
  }, [page, totalPages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpPage('');
    }
  };

  const current = page || 1;
  const total = totalPages || 1;
  const canGoPrev = current > 1;
  const canGoNext = current < total;

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
      {/* Left: Pagination Controls */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onPageChange(current - 1)}
          disabled={!canGoPrev}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition"
        >
          Trước
        </button>

        <div className="flex items-center gap-1">
          {paginationItems.map((item, index) => {
            if (typeof item !== 'number') {
              return (
                <span key={`${item}-${index}`} className="px-2 text-slate-400 font-bold select-none">
                  ...
                </span>
              );
            }
            const isActive = item === current;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                  isActive
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(current + 1)}
          disabled={!canGoNext}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition"
        >
          Sau
        </button>
      </div>

      {/* Right: Quick Jump & Limit Selector */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:pr-6">
        {/* Quick Jump Input */}
        {total >= 1 && (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Đến trang:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max={total}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-extrabold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={`${current}/${total}`}
              />
              <button
                type="submit"
                disabled={!jumpPage || parseInt(jumpPage, 10) < 1 || parseInt(jumpPage, 10) > total}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
              >
                Đi
              </button>
            </div>
          </form>
        )}

        {/* Limit Selector */}
        {onLimitChange && (
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <span className="whitespace-nowrap">Hiển thị:</span>
            <div className="flex items-center gap-1">
              {limitOptions.map((size) => {
                const isActive = Number(limit) === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onLimitChange(size)}
                    className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <span className="whitespace-nowrap">mỗi trang</span>
          </div>
        )}
      </div>
    </div>
  );
}
