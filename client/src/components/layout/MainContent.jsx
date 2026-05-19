import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useOutletContext } from 'react-router-dom';
import { getTrendingTodayPosts } from '../../services/postService';

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

const getTrendingPageSize = (width) => {
    if (width < 640) return 1;
    if (width < 1024) return 2;
    if (width < 1280) return 3;
    return 4;
};

const TrendingCard = ({ post, rank, onTagClick }) => {
    const tags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : [];

    return (
        <article className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm p-4 flex flex-col gap-3 h-full">
            <div className="flex items-center justify-between text-xs text-secondary">
                <span className="inline-flex items-center justify-center h-6 px-2 rounded-DEFAULT bg-primary-container/15 text-primary-container font-semibold">
                    #{rank}
                </span>
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>

            <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-headline-md text-headline-md leading-snug line-clamp-2 min-h-[3.25rem]">
                    <Link className="text-primary-container hover:text-primary-container/80 transition-colors" to={`/posts/${post._id}`}>
                        {post.title}
                    </Link>
                </h3>
                <div className="flex flex-wrap gap-1 min-h-[1.75rem]">
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => onTagClick?.(tag)}
                            className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 transition-colors"
                            aria-label={`Loc theo tag ${tag}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-secondary">
                <span>
                    Hôm nay <span className="font-semibold text-on-surface">{post.viewsToday ?? 0}</span> views
                </span>
                <span>
                    Tổng <span className="font-semibold text-on-surface">{post.views ?? 0}</span>
                </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
                <img
                    alt="Author Avatar"
                    className="w-6 h-6 rounded-DEFAULT object-cover"
                    src={post.author?.avatar || 'https://i.pravatar.cc/150'}
                />
                <span className="text-on-surface">
                    {post.author?.fullName || post.author?.username || 'Ẩn danh'}
                </span>
            </div>
        </article>
    );
};

const TrendingCardSkeleton = () => (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm p-4 flex flex-col gap-3 animate-pulse h-full">
        <div className="flex items-center justify-between">
            <div className="h-3 w-10 bg-surface-container rounded" />
            <div className="h-3 w-16 bg-surface-container rounded" />
        </div>
        <div className="h-4 w-3/4 bg-surface-container rounded" />
        <div className="flex gap-2">
            <div className="h-5 w-12 bg-surface-container rounded" />
            <div className="h-5 w-12 bg-surface-container rounded" />
        </div>
        <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-surface-container rounded" />
            <div className="h-3 w-16 bg-surface-container rounded" />
        </div>
        <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-surface-container rounded-DEFAULT" />
            <div className="h-3 w-24 bg-surface-container rounded" />
        </div>
    </div>
);

// ==========================================
// COMPONENT CHÍNH
// ==========================================
const MainContent = () => {
    const { list: questionsList, loading, error, pagination } = useSelector((state) => state.posts);
    const { filters, handleFilterChange, handleApplyFilters } = useOutletContext();
    const [trending, setTrending] = useState([]);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [trendingError, setTrendingError] = useState('');
    const [trendingPage, setTrendingPage] = useState(0);
    const initialLoadRef = useRef(true);
    const [pageSize, setPageSize] = useState(() => {
        if (typeof window === 'undefined') return 4;
        return getTrendingPageSize(window.innerWidth);
    });

    const totalTrendingPages = useMemo(() => {
        if (!trending.length) return 0;
        return Math.ceil(trending.length / pageSize);
    }, [trending.length, pageSize]);
    const maxTrendingPage = Math.max(0, totalTrendingPages - 1);
    const visibleTrending = useMemo(() => {
        const startIndex = trendingPage * pageSize;
        return trending.slice(startIndex, startIndex + pageSize);
    }, [trending, trendingPage, pageSize]);

    useEffect(() => {
        let mounted = true;

        const loadTrending = async (silent = false) => {
            try {
                if (!silent) setTrendingLoading(true);
                const response = await getTrendingTodayPosts(10);
                const data = response?.data?.data;
                if (!mounted) return;
                setTrending(Array.isArray(data) ? data : []);
                setTrendingError('');
                if (!silent) setTrendingPage(0);
            } catch (err) {
                if (!mounted) return;
                if (!silent) {
                    setTrending([]);
                    setTrendingError('Không thể tải dữ liệu trending.');
                }
            } finally {
                if (!silent && mounted) setTrendingLoading(false);
                if (mounted) initialLoadRef.current = false;
            }
        };

        loadTrending(false);
        const intervalId = setInterval(() => {
            if (initialLoadRef.current) return;
            loadTrending(true);
        }, 15000);
        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handleResize = () => setPageSize(getTrendingPageSize(window.innerWidth));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (trendingPage > maxTrendingPage) {
            setTrendingPage(maxTrendingPage);
        }
    }, [trendingPage, maxTrendingPage]);
    const sortOptions = [
        { label: 'Mới nhất', value: 'Newest' },
        { label: 'Nhiều lượt xem', value: 'MostViewed' },
        { label: 'Nhiều upvote', value: 'MostUpvoted' },
    ];
    const canGoPrev = trendingPage > 0;
    const canGoNext = trendingPage < maxTrendingPage;
    const trendingPageLabel = totalTrendingPages
        ? `${trendingPage + 1} / ${totalTrendingPages}`
        : '0 / 0';
    const applyTrendingTagFilter = (tag) => {
        const normalized = String(tag || '').trim();
        if (!normalized) return;
        handleFilterChange?.('tags', normalized);
        handleApplyFilters?.({ tags: normalized });
    };

    return (
        <main className="flex-1 flex flex-col min-w-0 pb-12">
            <section className="mb-stack-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-wide">TRENDING TODAY</h2>
                        <p className="font-body-sm text-body-sm text-secondary">
                            Top 10 bài viết có lượt xem cao nhất hôm nay
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTrendingPage((prev) => Math.max(0, prev - 1))}
                            disabled={!canGoPrev}
                            className={`h-9 w-9 rounded-DEFAULT border border-outline-variant flex items-center justify-center transition-colors ${
                                canGoPrev
                                    ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                                    : 'bg-surface-container-low text-outline cursor-not-allowed'
                            }`}
                            aria-label="Trang trước"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="font-body-sm text-body-sm text-secondary">{trendingPageLabel}</span>
                        <button
                            type="button"
                            onClick={() => setTrendingPage((prev) => Math.min(maxTrendingPage, prev + 1))}
                            disabled={!canGoNext}
                            className={`h-9 w-9 rounded-DEFAULT border border-outline-variant flex items-center justify-center transition-colors ${
                                canGoNext
                                    ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                                    : 'bg-surface-container-low text-outline cursor-not-allowed'
                            }`}
                            aria-label="Trang tiếp"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {trendingLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: pageSize }, (_, index) => (
                            <TrendingCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {!trendingLoading && trendingError && (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">
                        {trendingError}
                    </div>
                )}

                {!trendingLoading && !trendingError && trending.length === 0 && (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">
                        Chưa có dữ liệu trending hôm nay.
                    </div>
                )}

                {!trendingLoading && !trendingError && trending.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleTrending.map((post, index) => (
                            <TrendingCard
                                key={post._id}
                                post={post}
                                rank={trendingPage * pageSize + index + 1}
                                onTagClick={applyTrendingTagFilter}
                            />
                        ))}
                    </div>
                )}
            </section>

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
        </main>
    );
};

export default MainContent;