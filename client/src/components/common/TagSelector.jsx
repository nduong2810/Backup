import React, { useState, useEffect, useRef } from 'react';
import { getTagsApi } from '../../services/postService';

export default function TagSelector({ selectedTags = [], onChange, disabled = false }) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch tags from API
  const fetchSuggestions = async (searchVal) => {
    setLoading(true);
    try {
      const response = await getTagsApi({
        search: searchVal,
        limit: 8,
        sortBy: 'posts'
      });
      const items = response?.data?.data || [];
      // Lọc bỏ những tag đã được chọn
      const filtered = items.filter(
        (item) => !selectedTags.includes(item.slug)
      );
      setSuggestions(filtered);
      setHighlightedIndex(filtered.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search when input value changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 250);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen, selectedTags]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    fetchSuggestions(inputValue);
  };

  const handleSelectTag = (tag) => {
    if (disabled) return;
    if (!selectedTags.includes(tag.slug)) {
      onChange([...selectedTags, tag.slug]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (slug) => {
    if (disabled) return;
    onChange(selectedTags.filter((t) => t !== slug));
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (suggestions.length > 0) {
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && suggestions.length > 0) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault(); // Tránh submit form chính
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectTag(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      // Nhấn Backspace khi ô nhập rỗng để xóa tag cuối cùng
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input container mimicking standard input styling */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-full rounded-xl border border-outline-variant bg-white dark:bg-slate-955 px-3 py-2 flex flex-wrap gap-2 items-center cursor-text min-h-[46px] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        {/* Selected Tags list */}
        {selectedTags.map((slug) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-lg border border-primary/20 transition-all select-none"
          >
            <span className="truncate max-w-[120px]" title={slug}>{slug}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(slug);
                }}
                className="hover:bg-primary/25 rounded p-0.5 inline-flex items-center justify-center transition-colors"
                aria-label={`Xóa tag ${slug}`}
              >
                <span className="material-symbols-outlined text-[14px] leading-none block">close</span>
              </button>
            )}
          </span>
        ))}

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? "Tìm kiếm và chọn thẻ gợi ý..." : ""}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200 min-w-[120px] py-0.5 border-none p-0 focus:ring-0"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-[105] left-0 right-0 bottom-full mb-1.5 bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-y-auto overscroll-contain py-1 animate-fade-in-quick">
          {loading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-secondary flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <span>Đang tải danh sách thẻ...</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((tag, idx) => (
              <div
                key={tag._id || tag.slug}
                onClick={() => handleSelectTag(tag)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  idx === highlightedIndex
                    ? 'bg-primary/10 text-primary dark:bg-slate-800 dark:text-white'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold truncate max-w-[200px]" title={tag.slug}>#{tag.slug}</span>
                  {tag.name && tag.name.toLowerCase() !== tag.slug && (
                    <span className="text-xs text-secondary truncate max-w-[200px]" title={tag.name}>{tag.name}</span>
                  )}
                </div>
                {tag.totalCount !== undefined && (
                  <span className="text-xs text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                    {tag.totalCount} bài viết
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-secondary">
              {inputValue ? 'Không tìm thấy thẻ phù hợp.' : 'Gõ từ khóa để tìm thẻ...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
