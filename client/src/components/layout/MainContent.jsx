import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { getTopUpvotedPosts, getTrendingTodayPosts, votePost } from '../../services/postService';
import SaveIconButton from '../ui/SaveIconButton';
import { fetchCollectionsThunk, savePostToCollectionThunk, toggleSaveThunk } from '../../store/slices/savedSlice';
import { updatePostVoteInList } from '../../store/slices/postSlice';

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

const getPlainText = (value) => {
    if (!value) return '';
    return String(value).replace(/<[^>]+>/g, '').trim();
};

// ==========================================
// COMPONENT CON: Đại diện cho 1 câu hỏi
// ==========================================
const QuestionCard = ({ question, isSaved, onToggleSave, onVotePost, votingPostId }) => {
    const answerCount = question.answerCount ?? 0;
    const upvoteCount = question.upvoteCount ?? question.upvotes ?? 0;
    const downvoteCount = question.downvoteCount ?? question.downvotes ?? 0;
    const userVote = question.userVote ?? null;
    const isVoting = votingPostId === question._id;

    return (
        <article className="flex flex-col sm:flex-row gap-stack-md py-stack-md border-b border-outline-variant hover:bg-surface-container-low transition-colors px-3">
            {/* Cột thông số */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:w-24 flex-shrink-0 text-right">
                <div className="font-body-sm text-body-sm text-on-surface flex items-center sm:justify-end gap-1">
                    <span className="font-semibold">{upvoteCount}</span> votes
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
                <div className="flex items-start justify-between gap-5 pr-1">
                    <h3 className="font-headline-md text-headline-md mb-1 flex-1 min-w-0">
                        <Link className="text-primary-container hover:text-primary-container/80 transition-colors break-words" to={`/posts/${question._id}`}>
                            {question.title}
                        </Link>
                    </h3>
                    <SaveIconButton
                        saved={isSaved}
                        onClick={() => onToggleSave?.(question._id, isSaved)}
                        className="-mt-1 ml-2 shrink-0"
                        title={isSaved ? 'Bo luu bai viet' : 'Luu bai viet'}
                    />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-2 line-clamp-2">
                    {getPlainText(question.content) || 'Chua co noi dung.'}
                </p>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onVotePost?.(question._id, 'upvote')}
                        disabled={isVoting}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            userVote === 'upvote'
                                ? 'border-blue-300 bg-blue-50 text-blue-700'
                                : 'border-outline-variant bg-surface-container-lowest text-secondary hover:bg-blue-50 hover:text-blue-700'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                        Like {upvoteCount}
                    </button>
                    <button
                        type="button"
                        onClick={() => onVotePost?.(question._id, 'downvote')}
                        disabled={isVoting}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            userVote === 'downvote'
                                ? 'border-rose-300 bg-rose-50 text-rose-700'
                                : 'border-outline-variant bg-surface-container-lowest text-secondary hover:bg-rose-50 hover:text-rose-700'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                        Dislike {downvoteCount}
                    </button>
                </div>

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

const TopUpvotedCard = ({ post, rank, onTagClick }) => {
    const tags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : [];
    const upvotes = post.upvoteCount ?? 0;
    const upvotesToday = post.upvotesToday ?? 0;

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
                    Hôm nay <span className="font-semibold text-on-surface">{upvotesToday}</span> upvotes
                </span>
                <span>
                    Tổng <span className="font-semibold text-on-surface">{upvotes}</span>
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
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: questionsList, loading, error, pagination } = useSelector((state) => state.posts);
    const { ids: savedIds, collections, loadingCollections } = useSelector((state) => state.saved);
    const isAuthenticated = useSelector((state) => state.login.isAuthenticated);
    const { filters, handleFilterChange, handleApplyFilters } = useOutletContext();
    const [trending, setTrending] = useState([]);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [trendingError, setTrendingError] = useState('');
    const [trendingPage, setTrendingPage] = useState(0);
    const initialLoadRef = useRef(true);
    const [topUpvoted, setTopUpvoted] = useState([]);
    const [topUpvotedLoading, setTopUpvotedLoading] = useState(true);
    const [topUpvotedError, setTopUpvotedError] = useState('');
    const [topUpvotedPage, setTopUpvotedPage] = useState(0);
    const topUpvotedInitialLoadRef = useRef(true);
    const [votingPostId, setVotingPostId] = useState('');
    const [pageSize, setPageSize] = useState(() => {
        if (typeof window === 'undefined') return 4;
        return getTrendingPageSize(window.innerWidth);
    });
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [savePostId, setSavePostId] = useState(null);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');

    const totalTrendingPages = useMemo(() => {
        if (!trending.length) return 0;
        return Math.ceil(trending.length / pageSize);
    }, [trending.length, pageSize]);

    const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

    const handleToggleSave = (postId, isSaved) => {
        if (!isAuthenticated) {
            navigate('/auth/login');
            return;
        }
        if (isSaved) {
            dispatch(toggleSaveThunk(postId));
            return;
        }
        setSavePostId(postId);
        setSaveModalOpen(true);
        dispatch(fetchCollectionsThunk());
    };

    const handleVotePost = async (postId, voteType) => {
        if (!isAuthenticated) {
            navigate('/auth/login');
            return;
        }

        if (!postId || votingPostId) return;

        setVotingPostId(postId);
        try {
            const response = await votePost(postId, voteType);
            const data = response?.data?.data || {};
            dispatch(updatePostVoteInList({
                postId,
                upvoteCount: data.upvoteCount ?? 0,
                downvoteCount: data.downvoteCount ?? 0,
                userVote: data.userVote ?? null,
            }));
        } catch (voteError) {
            alert(voteError?.response?.data?.message || 'Không thể vote bài viết.');
        } finally {
            setVotingPostId('');
        }
    };

    const handleConfirmSaveToCollection = async () => {
        if (!savePostId) return;
        await dispatch(savePostToCollectionThunk({
            postId: savePostId,
            collectionId: selectedCollectionId || null,
        }));
        setSaveModalOpen(false);
        setSavePostId(null);
        setSelectedCollectionId('');
    };
    const maxTrendingPage = Math.max(0, totalTrendingPages - 1);
    const visibleTrending = useMemo(() => {
        const startIndex = Math.min(trendingPage, maxTrendingPage) * pageSize;
        return trending.slice(startIndex, startIndex + pageSize);
    }, [trending, trendingPage, pageSize, maxTrendingPage]);

    const totalTopUpvotedPages = useMemo(() => {
        if (!topUpvoted.length) return 0;
        return Math.ceil(topUpvoted.length / pageSize);
    }, [topUpvoted.length, pageSize]);
    const maxTopUpvotedPage = Math.max(0, totalTopUpvotedPages - 1);
    const visibleTopUpvoted = useMemo(() => {
        const startIndex = Math.min(topUpvotedPage, maxTopUpvotedPage) * pageSize;
        return topUpvoted.slice(startIndex, startIndex + pageSize);
    }, [topUpvoted, topUpvotedPage, pageSize, maxTopUpvotedPage]);

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
            } catch {
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
        let mounted = true;

        const loadTopUpvoted = async (silent = false) => {
            try {
                if (!silent) setTopUpvotedLoading(true);
                const response = await getTopUpvotedPosts(10);
                const data = response?.data?.data;
                if (!mounted) return;
                const normalized = Array.isArray(data)
                    ? data.map((item) => ({ ...item, userVote: item.userVote ?? null }))
                    : [];
                setTopUpvoted(normalized);
                setTopUpvotedError('');
                if (!silent) setTopUpvotedPage(0);
            } catch {
                if (!mounted) return;
                if (!silent) {
                    setTopUpvoted([]);
                    setTopUpvotedError('Không thể tải dữ liệu top upvote.');
                }
            } finally {
                if (!silent && mounted) setTopUpvotedLoading(false);
                if (mounted) topUpvotedInitialLoadRef.current = false;
            }
        };

        loadTopUpvoted(false);
        const intervalId = setInterval(() => {
            if (topUpvotedInitialLoadRef.current) return;
            loadTopUpvoted(true);
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

    const safeTrendingPage = Math.min(trendingPage, maxTrendingPage);
    const safeTopUpvotedPage = Math.min(topUpvotedPage, maxTopUpvotedPage);
    const sortOptions = [
        { label: 'Mới nhất', value: 'Newest' },
        { label: 'Nhiều lượt xem', value: 'MostViewed' },
        { label: 'Nhiều upvote', value: 'MostUpvoted' },
    ];
    const canGoPrev = safeTrendingPage > 0;
    const canGoNext = safeTrendingPage < maxTrendingPage;
    const trendingPageLabel = totalTrendingPages
        ? `${safeTrendingPage + 1} / ${totalTrendingPages}`
        : '0 / 0';
    const canGoPrevTopUpvoted = safeTopUpvotedPage > 0;
    const canGoNextTopUpvoted = safeTopUpvotedPage < maxTopUpvotedPage;
    const topUpvotedPageLabel = totalTopUpvotedPages
        ? `${safeTopUpvotedPage + 1} / ${totalTopUpvotedPages}`
        : '0 / 0';
    const applyTagFilter = (tag) => {
        const normalized = String(tag || '').trim();
        if (!normalized) return;
        handleFilterChange?.('tags', normalized);
        handleApplyFilters?.({ tags: normalized });
    };


    const currentPage = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;
    const paginationItems = buildPaginationItems(currentPage, totalPages);

    return (
        <main className="flex-1 flex flex-col min-w-0 pb-12">
            <section className="mb-stack-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-wide">Trending Today</h2>
                        <p className="font-body-sm text-body-sm text-secondary">
                            Top 10 bài viết có lượt xem cao nhất hôm nay
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTrendingPage((prev) => Math.min(maxTrendingPage, Math.max(0, prev - 1)))}
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
                                rank={safeTrendingPage * pageSize + index + 1}
                                onTagClick={applyTagFilter}
                            />
                        ))}
                    </div>
                )}
            </section>

            <section className="mb-stack-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-wide">Top Upvoted</h2>
                        <p className="font-body-sm text-body-sm text-secondary">
                            Top 10 bài viết có nhiều upvote nhất hôm nay
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTopUpvotedPage((prev) => Math.min(maxTopUpvotedPage, Math.max(0, prev - 1)))}
                            disabled={!canGoPrevTopUpvoted}
                            className={`h-9 w-9 rounded-DEFAULT border border-outline-variant flex items-center justify-center transition-colors ${
                                canGoPrevTopUpvoted
                                    ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                                    : 'bg-surface-container-low text-outline cursor-not-allowed'
                            }`}
                            aria-label="Trang trước"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="font-body-sm text-body-sm text-secondary">{topUpvotedPageLabel}</span>
                        <button
                            type="button"
                            onClick={() => setTopUpvotedPage((prev) => Math.min(maxTopUpvotedPage, prev + 1))}
                            disabled={!canGoNextTopUpvoted}
                            className={`h-9 w-9 rounded-DEFAULT border border-outline-variant flex items-center justify-center transition-colors ${
                                canGoNextTopUpvoted
                                    ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                                    : 'bg-surface-container-low text-outline cursor-not-allowed'
                            }`}
                            aria-label="Trang tiếp"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>

                {topUpvotedLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: pageSize }, (_, index) => (
                            <TrendingCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {!topUpvotedLoading && topUpvotedError && (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">
                        {topUpvotedError}
                    </div>
                )}

                {!topUpvotedLoading && !topUpvotedError && topUpvoted.length === 0 && (
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">
                        Chưa có dữ liệu top upvote.
                    </div>
                )}

                {!topUpvotedLoading && !topUpvotedError && topUpvoted.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleTopUpvoted.map((post, index) => (
                            <TopUpvotedCard
                                key={post._id}
                                post={post}
                                rank={safeTopUpvotedPage * pageSize + index + 1}
                                onTagClick={applyTagFilter}
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
                        <QuestionCard
                            key={q._id}
                            question={q}
                            isSaved={savedIdSet.has(q._id)}
                            onToggleSave={handleToggleSave}
                            onVotePost={handleVotePost}
                            votingPostId={votingPostId}
                        />
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

            {saveModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <button
                        type="button"
                        onClick={() => {
                            setSaveModalOpen(false);
                            setSavePostId(null);
                            setSelectedCollectionId('');
                        }}
                        className="absolute inset-0 bg-black/45"
                        aria-label="Đóng"
                    />
                    <div className="relative w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
                        <div className="px-5 py-4 border-b border-outline-variant">
                            <h3 className="text-lg font-semibold text-on-surface">Lưu bài viết vào thư mục</h3>
                        </div>
                        <div className="px-5 py-4">
                            <label className="block text-sm text-secondary mb-2">Chọn thư mục</label>
                            <select
                                value={selectedCollectionId}
                                onChange={(event) => setSelectedCollectionId(event.target.value)}
                                className="w-full rounded-DEFAULT border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest"
                            >
                                <option value="">Lưu vào thư mục mặc định (Lưu trữ)</option>
                                {collections.filter((collection) => !collection.isDefault).map((collection) => (
                                    <option key={collection._id} value={collection._id}>
                                        {collection.isDefault ? 'Lưu trữ' : collection.name}
                                    </option>
                                ))}
                            </select>
                            {loadingCollections && <p className="text-xs text-secondary mt-2">Đang tải thư mục...</p>}
                        </div>
                        <div className="px-5 py-4 border-t border-outline-variant flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSaveModalOpen(false);
                                    setSavePostId(null);
                                    setSelectedCollectionId('');
                                }}
                                className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSaveToCollection}
                                className="px-3 py-1.5 text-sm rounded-DEFAULT bg-primary text-white hover:bg-primary/90"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default MainContent;