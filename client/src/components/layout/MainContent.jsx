import React from 'react';
import { useSelector } from 'react-redux';
import { useOutletContext, Link } from 'react-router-dom';

const PER_PAGE_OPTIONS = [15, 30, 50];

const buildPaginationItems = (current, total) => {
    if (total <= 1) return [];
    if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    const items = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) items.push('ellipsis-start');
    for (let page = start; page <= end; page += 1) {
        items.push(page);
    }
    if (end < total - 1) items.push('ellipsis-end');

    items.push(total);
    return items;
};

// ==========================================
// COMPONENT CON: Đại diện cho 1 câu hỏi
// ==========================================
const QuestionCard = ({ question }) => {
    const answerCount = question.answerCount ?? 0;

    return (
        <article className="flex flex-col sm:flex-row gap-stack-md py-stack-md border-b border-outline-variant hover:bg-surface-container-low transition-colors px-2">
            {/* Cột thông số */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:w-24 flex-shrink-0 text-right">
                <div className="font-body-sm text-body-sm text-on-surface flex items-center sm:justify-end gap-1">
                    <span className="font-semibold">{question.upvotes || 0}</span> votes
                </div>
                <div className={`font-body-sm text-body-sm px-2 py-0.5 rounded-DEFAULT flex items-center sm:justify-end gap-1 ${answerCount > 0 ? 'text-[#2e7d32] border border-[#2e7d32] bg-[#e8f5e9]' : 'text-secondary'}`}>
                    <span className="font-semibold">{answerCount}</span> answers
                </div>
                <div className="font-body-sm text-body-sm text-secondary flex items-center sm:justify-end gap-1">
                    <span className="font-semibold">{question.views || 0}</span> views
                </div>
            </div>

            {/* Cột Nội dung */}
            <div className="flex-1 min-w-0">
                <h3 className="font-headline-md text-headline-md mb-1">
                    <Link className="text-primary-container hover:text-primary-container/80 transition-colors break-words" to={`/posts/${question._id}`}>
                        {question.title}
                    </Link>
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-2 line-clamp-2">
                    {question.content}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    {/* Danh sách Tags */}
                    <div className="flex flex-wrap gap-1">
                        {question.tags && question.tags.map((tag, index) => (
                            <span key={index} className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 cursor-pointer">
                                {tag}
                            </span>
                        ))}
                    </div>
                    {/* Thông tin tác giả */}
                    <div className="flex items-center gap-2 ml-auto">
                        <img
                            alt="Author Avatar"
                            className="w-6 h-6 rounded-DEFAULT object-cover"
                            src={question.author?.avatar || "https://i.pravatar.cc/150"}
                        />
                        <a className="font-body-sm text-body-sm text-primary-container hover:text-primary-container/80" href="#">
                            {question.author?.fullName || question.author?.username || "Ẩn danh"}
                        </a>
                        <span className="font-body-sm text-body-sm text-secondary">
                            asked {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
};

// ==========================================
// COMPONENT CHÍNH
// ==========================================
const MainContent = () => {
    const { list: questionsList, loading, error, pagination } = useSelector((state) => state.posts);
    const { filters, handleFilterChange, handleApplyFilters } = useOutletContext();
    const sortOptions = [
        { label: 'Mới nhất', value: 'Newest' },
        { label: 'Nhiều lượt xem', value: 'MostViewed' },
        { label: 'Nhiều upvote', value: 'MostUpvoted' },
    ];

    const currentPage = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;
    const paginationItems = buildPaginationItems(currentPage, totalPages);

    return (
        <main className="flex-1 flex flex-col min-w-0 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-stack-lg gap-4 border-b border-outline-variant pb-4">
                <div>
                    <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Newest Questions</h1>
                    <p className="font-body-md text-body-md text-secondary">
                        {pagination.total?.toLocaleString('vi-VN') || 0} questions
                    </p>
                </div>

                {/* Phần thanh công cụ Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex border border-outline-variant rounded-DEFAULT overflow-hidden bg-surface-container-lowest">
                        {sortOptions.map((option, index) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    handleFilterChange?.('sortBy', option.value);
                                    handleApplyFilters?.({ sortBy: option.value });
                                }}
                                className={`px-3 py-1.5 font-body-sm text-body-sm border-outline-variant transition-colors ${
                                    index < sortOptions.length - 1 ? 'border-r' : ''
                                } ${
                                    filters?.sortBy === option.value
                                        ? 'bg-surface-container-low text-on-surface font-semibold'
                                        : 'text-secondary hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-0 border-t border-outline-variant">
                {/* Hiển thị trạng thái đang tải */}
                {loading && <p className="p-4 text-center text-secondary">Đang tải danh sách câu hỏi...</p>}

                {/* Hiển thị lỗi nếu gọi API thất bại */}
                {error && <p className="p-4 text-center text-red-500">{error}</p>}

                {/* Render danh sách bài viết từ Backend */}
                {!loading && !error && questionsList && questionsList.length > 0 && (
                    questionsList.map((q) => (
                        <QuestionCard key={q._id} question={q} />
                    ))
                )}

                {/* Nếu mảng trống */}
                {!loading && !error && (!questionsList || questionsList.length === 0) && (
                    <p className="p-4 text-center text-secondary">Chưa có câu hỏi nào trên diễn đàn.</p>
                )}
            </div>

            {!loading && !error && totalPages > 1 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-outline-variant pt-4">
                    <div className="flex items-center gap-1 flex-wrap">
                        {paginationItems.map((item) => {
                            if (typeof item !== 'number') {
                                return (
                                    <span key={item} className="px-2 text-secondary">...</span>
                                );
                            }

                            const isActive = item === currentPage;
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => handleApplyFilters?.({ page: item })}
                                    className={`min-w-[36px] px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm border transition-colors ${
                                        isActive
                                            ? 'bg-primary-container text-on-primary border-primary-container'
                                            : 'border-outline-variant text-secondary hover:bg-surface-container-low'
                                    }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {item}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => handleApplyFilters?.({ page: Math.min(currentPage + 1, totalPages) })}
                            className="px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm border border-outline-variant text-secondary hover:bg-surface-container-low"
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
                        <span>per page</span>
                        <div className="flex items-center gap-1">
                            {PER_PAGE_OPTIONS.map((size) => {
                                const isActive = Number(filters?.limit) === size;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => handleApplyFilters?.({ limit: size, page: 1 })}
                                        className={`min-w-[36px] px-3 py-1.5 rounded-DEFAULT border transition-colors ${
                                            isActive
                                                ? 'bg-primary-container text-on-primary border-primary-container'
                                                : 'border-outline-variant text-secondary hover:bg-surface-container-low'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MainContent;