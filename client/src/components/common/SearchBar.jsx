import { useEffect, useRef, useState } from 'react';
import { searchAuthorsApi } from '../../services/userService';
import { getTagsApi } from '../../services/postService';

function SearchBar({
  placeholder = 'Tìm kiếm câu hỏi, tag, chủ đề...',
  className = '',
  value = '',
  onChange,
  onSearch,
  inputClassName = '',
  buttonClassName = '',
  showButton = true,
  showIcon = true,
}) {
  const [showHelper, setShowHelper] = useState(false);
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorQuery, setAuthorQuery] = useState(null);
  const containerRef = useRef(null);

  const detectAuthorQuery = (text) => {
    const match = text.match(/\[author:\s*([^\]]*)$/i);
    if (match) {
      return match[1];
    }
    return null;
  };

  useEffect(() => {
    const q = detectAuthorQuery(value);
    setAuthorQuery(q);

    if (q === null || q.trim().length < 2) {
      setAuthorSuggestions([]);
      setAuthorLoading(false);
      return;
    }

    const keyword = q.trim();
    let ignore = false;
    setAuthorLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await searchAuthorsApi(keyword);
        if (!ignore) {
          setAuthorSuggestions(response.data?.data || []);
        }
      } catch (error) {
        if (!ignore) {
          setAuthorSuggestions([]);
        }
      } finally {
        if (!ignore) {
          setAuthorLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [value]);

  const handleSelectAuthor = (authorName) => {
    const lastIndex = value.lastIndexOf('[author:');
    if (lastIndex !== -1) {
      const before = value.substring(0, lastIndex);
      const newValue = `${before}[author:${authorName}] `;
      onChange?.(newValue);
    }
  };

  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagQuery, setTagQuery] = useState(null);

  const detectTagQuery = (text) => {
    const match = text.match(/\[tag:\s*([^\]]*)$/i);
    if (match) {
      return match[1];
    }
    return null;
  };

  useEffect(() => {
    const q = detectTagQuery(value);
    setTagQuery(q);

    if (q === null) {
      setTagSuggestions([]);
      setTagLoading(false);
      return;
    }

    const keyword = q.trim();
    let ignore = false;
    setTagLoading(true);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await getTagsApi({ search: keyword, limit: 8 });
        if (!ignore) {
          setTagSuggestions(response.data?.data || []);
        }
      } catch (error) {
        if (!ignore) {
          setTagSuggestions([]);
        }
      } finally {
        if (!ignore) {
          setTagLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timeoutId);
    };
  }, [value]);

  const handleSelectTag = (tagName) => {
    const lastIndex = value.lastIndexOf('[tag:');
    if (lastIndex !== -1) {
      const before = value.substring(0, lastIndex);
      const newValue = `${before}[tag:${tagName}] `;
      onChange?.(newValue);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
      setShowHelper(false);
    }
  };

  const handleSearch = () => {
    onSearch?.();
    setShowHelper(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowHelper(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Icon Search */}
      {showIcon && (
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
      )}

      {/* Input */}
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowHelper(true)}
        placeholder={placeholder}
        aria-label="Tìm kiếm bài đăng"
        className={`
          w-full
          bg-white border border-slate-200
          rounded-lg
          pl-10 pr-16 py-2.5
          text-sm text-slate-800
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500
          transition-all duration-200
          shadow-sm
          ${inputClassName}
        `}
      />

      {/* Nút tìm kiếm */}
      {showButton && (
        <button
          id="search-btn"
          type="button"
          onClick={handleSearch}
          aria-label="Tìm kiếm"
          className={`
            absolute right-2 top-1/2 -translate-y-1/2
            bg-sky-600 hover:bg-sky-700
            text-white text-xs font-semibold
            px-3 py-1.5 rounded-md
            transition-colors duration-150
            ${buttonClassName}
          `}
        >
          Tìm
        </button>
      )}

      {/* Gợi ý tác giả */}
      {authorQuery !== null && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto border border-slate-200 bg-white rounded-lg shadow-lg">
          {authorLoading && (
            <div className="px-3 py-2 text-xs text-slate-500">Đang tìm tác giả...</div>
          )}
          {!authorLoading && authorSuggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">Không tìm thấy tài khoản phù hợp.</div>
          )}
          {!authorLoading && authorSuggestions.map((author) => (
            <button
              key={author._id}
              type="button"
              onClick={() => handleSelectAuthor(author.fullName)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <span className="min-w-0 truncate text-sm font-semibold text-slate-700">
                {author.fullName}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-400" title={`${Number(author.reputation || 1).toLocaleString('vi-VN')} điểm uy tín`}>
                <span className="material-symbols-outlined text-[16px] leading-none text-amber-500">military_tech</span>
                <span>{Number(author.reputation || 1).toLocaleString('vi-VN')}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Gợi ý tag */}
      {tagQuery !== null && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-60 overflow-y-auto border border-slate-200 bg-white rounded-lg shadow-lg">
          {tagLoading && (
            <div className="px-3 py-2 text-xs text-slate-500">Đang tìm tag...</div>
          )}
          {!tagLoading && tagSuggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">Không tìm thấy tag phù hợp.</div>
          )}
          {!tagLoading && tagSuggestions.map((tag) => (
            <button
              key={tag._id || tag.name}
              type="button"
              onClick={() => handleSelectTag(tag.name)}
              className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <span className="min-w-0 truncate text-sm font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100/50">
                {tag.name}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-400">
                {tag.totalCount || 0} bài đăng
              </span>
            </button>
          ))}
        </div>
      )}

      {showHelper && authorQuery === null && tagQuery === null && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <span className="font-mono text-slate-900">[tag:tên]</span>
              <span>Tìm trong tag cụ thể</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono text-slate-900">[author:tên]</span>
              <span>Lọc bài viết theo tác giả</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Gợi ý cú pháp tìm kiếm</span>
            <button
              type="button"
              onClick={() => setShowHelper(false)}
              className="text-sky-600 hover:text-sky-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
