function SearchBar({
  placeholder = 'Tìm kiếm câu hỏi, tag, chủ đề...',
  className = '',
  value = '',
  onChange,
  onSearch,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
    }
  };

  const handleSearch = () => {
    onSearch?.();
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Icon Search */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1 0 4.5 4.5a7.5 7.5 0 0 0 12.15 12.15z"
        />
      </svg>

      {/* Input */}
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Tìm kiếm bài đăng"
        className="
          w-full
          bg-white border border-slate-200
          rounded-lg
          pl-10 pr-16 py-2.5
          text-sm text-slate-800
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
          transition-all duration-200
          shadow-sm
        "
      />

      {/* Nút tìm kiếm */}
      <button
        id="search-btn"
        type="button"
        onClick={handleSearch}
        aria-label="Tìm kiếm"
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          bg-sky-600 hover:bg-sky-700
          text-white text-xs font-semibold
          px-3 py-1.5 rounded-md
          transition-colors duration-150
        "
      >
        Tìm
      </button>
    </div>
  );
}

export default SearchBar;
