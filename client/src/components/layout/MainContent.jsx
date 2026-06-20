import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { getTopUpvotedPosts, getTrendingTodayPosts, votePost, reactPost } from '../../services/postService';
import SaveIconButton from '../ui/SaveIconButton';
import { fetchCollectionsThunk, savePostToCollectionThunk, toggleSaveThunk } from '../../store/slices/savedSlice';
import { updatePostVoteInList, updatePostReactionInList } from '../../store/slices/postSlice';
import { useToast } from '../../context/ToastContext';

const PER_PAGE_OPTIONS = [15, 30, 50];

const buildPaginationItems = (current, total) => {
    if (total <= 1) return [];
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

    const items = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) items.push('ellipsis-start');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < total - 1) items.push('ellipsis-end');

    items.push(total);
    return items;
};

const getPlainText = (value) => {
    if (!value) return '';
    return String(value).replace(/<[^>]+>/g, '').trim();
};

const SmallPostActionButton = ({ active, disabled, onClick, icon, label, count, activeClass, hoverClass }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold leading-none transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? activeClass : `border-outline-variant bg-surface-container-lowest text-secondary ${hoverClass}`
            }`}
    >
        <span className="material-symbols-outlined text-[14px] leading-none">{icon}</span>
        <span>{label}</span>
        <span>{count}</span>
    </button>
);

const QuestionCard = ({
    question,
    isSaved,
    onToggleSave,
    onVotePost,
    onReactPost,
    votingPostId,
    reactingPostId,
}) => {
    const answerCount = question.answerCount ?? 0;
    const upvoteCount = question.upvoteCount ?? question.upvotes ?? 0;
    const downvoteCount = question.downvoteCount ?? question.downvotes ?? 0;
    const likeCount = question.likeCount ?? question.likes ?? 0;
    const dislikeCount = question.dislikeCount ?? question.dislikes ?? 0;
    const userVote = question.userVote ?? null;
    const userReaction = question.userReaction ?? null;
    const isVoting = votingPostId === question._id;
    const isReacting = reactingPostId === question._id;
    const isAdvice = question.postType === 'advice';

    return (
        <article className="flex flex-col sm:flex-row gap-stack-md sm:gap-6 py-stack-md border-b border-outline-variant hover:bg-surface-container-low transition-colors px-3">
            <div className="flex sm:flex-col items-center justify-center gap-2 sm:w-28 flex-shrink-0 text-center">
                {isAdvice ? (
                    <div className={`w-full text-center py-1 px-2 rounded-lg font-body-sm text-body-sm transition-colors duration-200 ${answerCount > 0 ? 'text-[#2e7d32] border border-[#2e7d32] bg-[#e8f5e9]' : 'text-secondary border border-outline-variant bg-surface-container-lowest'}`}>
                        <span className="font-semibold">{answerCount}</span> bình luận
                    </div>
                ) : (
                    <div className={`w-full text-center py-1 px-2 rounded-lg font-body-sm text-body-sm transition-colors duration-200 ${answerCount > 0 ? 'text-[#0066cc] border border-[#0066cc] bg-[#e3f2fd]' : 'text-secondary border border-outline-variant bg-surface-container-lowest'}`}>
                        <span className="font-semibold">{answerCount}</span> câu trả lời
                    </div>
                )}
                <div className="font-body-sm text-body-sm text-secondary mt-0.5">
                    <span className="font-semibold">{question.views || 0}</span> lượt xem
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-5 pr-1">
                    <h3 className="font-headline-md text-headline-md mb-1 flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        {isAdvice ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="material-symbols-outlined text-[11px] leading-none">tips_and_updates</span>
                                Lời khuyên
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <span className="material-symbols-outlined text-[11px] leading-none">help_center</span>
                                Câu hỏi
                            </span>
                        )}
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

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {question.tags && question.tags.map((tag, index) => (
                                <span key={index} className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 cursor-pointer">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                            {!isAdvice ? (
                                <>
                                    <SmallPostActionButton
                                        active={userVote === 'upvote'}
                                        disabled={isVoting}
                                        onClick={() => onVotePost?.(question._id, 'upvote')}
                                        icon="arrow_upward"
                                        label="Upvote"
                                        count={upvoteCount}
                                        activeClass="border-primary/30 bg-primary-fixed text-primary"
                                        hoverClass="hover:bg-primary-fixed/30 hover:text-primary"
                                    />
                                    <SmallPostActionButton
                                        active={userVote === 'downvote'}
                                        disabled={isVoting}
                                        onClick={() => onVotePost?.(question._id, 'downvote')}
                                        icon="arrow_downward"
                                        label="Downvote"
                                        count={downvoteCount}
                                        activeClass="border-error/30 bg-error-container text-error"
                                        hoverClass="hover:bg-error-container/30 hover:text-error"
                                    />
                                </>
                            ) : (
                                <>
                                    <SmallPostActionButton
                                        active={userReaction === 'like'}
                                        disabled={isReacting}
                                        onClick={() => onReactPost?.(question._id, 'like')}
                                        icon="thumb_up"
                                        label="Like"
                                        count={likeCount}
                                        activeClass="border-blue-300 bg-blue-50 text-blue-700"
                                        hoverClass="hover:bg-blue-50 hover:text-blue-700"
                                    />
                                    <SmallPostActionButton
                                        active={userReaction === 'dislike'}
                                        disabled={isReacting}
                                        onClick={() => onReactPost?.(question._id, 'dislike')}
                                        icon="thumb_down"
                                        label="Dislike"
                                        count={dislikeCount}
                                        activeClass="border-rose-300 bg-rose-50 text-rose-700"
                                        hoverClass="hover:bg-rose-50 hover:text-rose-700"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <img
                            alt="Author Avatar"
                            className="w-6 h-6 rounded-DEFAULT object-cover"
                            src={question.author?.avatar && question.author.avatar !== 'default-avatar.png'
                                ? question.author.avatar
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(question.author?.fullName || 'U')}&background=0066cc&color=fff&size=32`}
                        />
                        <a className="font-body-sm text-body-sm text-primary-container hover:text-primary-container/80" href="#">
                            {question.author?.fullName || question.author?.username || 'Ẩn danh'}
                        </a>
                        <span className="font-body-sm text-body-sm text-secondary">
                            đăng {new Date(question.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
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
                <span className="inline-flex items-center justify-center h-6 px-2 rounded-DEFAULT bg-primary-container/15 text-primary-container font-semibold">#{rank}</span>
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-headline-md text-headline-md leading-snug line-clamp-2 min-h-[3.25rem]">
                    <Link className="text-primary-container hover:text-primary-container/80 transition-colors" to={`/posts/${post._id}`}>
                        {post.title}
                    </Link>
                </h3>
                <div className="flex flex-wrap gap-1 min-h-[1.75rem]">
                    {tags.map((tag) => (
                        <button key={tag} type="button" onClick={() => onTagClick?.(tag)} className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 transition-colors" aria-label={`Loc theo tag ${tag}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
                <span>Hôm nay <span className="font-semibold text-on-surface">{post.viewsToday ?? 0}</span> lượt xem</span>
                <span>Tổng <span className="font-semibold text-on-surface">{post.views ?? 0}</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
                <img
                    alt="Author Avatar"
                    className="w-6 h-6 rounded-DEFAULT object-cover"
                    src={post.author?.avatar && post.author.avatar !== 'default-avatar.png'
                        ? post.author.avatar
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullName || 'U')}&background=0066cc&color=fff&size=32`}
                />
                <span className="text-on-surface">{post.author?.fullName || post.author?.username || 'Ẩn danh'}</span>
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
                <span className="inline-flex items-center justify-center h-6 px-2 rounded-DEFAULT bg-primary-container/15 text-primary-container font-semibold">#{rank}</span>
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-headline-md text-headline-md leading-snug line-clamp-2 min-h-[3.25rem]">
                    <Link className="text-primary-container hover:text-primary-container/80 transition-colors" to={`/posts/${post._id}`}>{post.title}</Link>
                </h3>
                <div className="flex flex-wrap gap-1 min-h-[1.75rem]">
                    {tags.map((tag) => (
                        <button key={tag} type="button" onClick={() => onTagClick?.(tag)} className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 transition-colors" aria-label={`Loc theo tag ${tag}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
                <span>Hôm nay <span className="font-semibold text-on-surface">{upvotesToday}</span> lượt upvote</span>
                <span>Tổng <span className="font-semibold text-on-surface">{upvotes}</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
                <img
                    alt="Author Avatar"
                    className="w-6 h-6 rounded-DEFAULT object-cover"
                    src={post.author?.avatar && post.author.avatar !== 'default-avatar.png'
                        ? post.author.avatar
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullName || 'U')}&background=0066cc&color=fff&size=32`}
                />
                <span className="text-on-surface">{post.author?.fullName || post.author?.username || 'Ẩn danh'}</span>
            </div>
        </article>
    );
};

const TrendingCardSkeleton = () => (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm p-4 flex flex-col gap-3 animate-pulse h-full">
        <div className="flex items-center justify-between"><div className="h-3 w-10 bg-surface-container rounded" /><div className="h-3 w-16 bg-surface-container rounded" /></div>
        <div className="h-4 w-3/4 bg-surface-container rounded" />
        <div className="flex gap-2"><div className="h-5 w-12 bg-surface-container rounded" /><div className="h-5 w-12 bg-surface-container rounded" /></div>
        <div className="flex items-center justify-between"><div className="h-3 w-20 bg-surface-container rounded" /><div className="h-3 w-16 bg-surface-container rounded" /></div>
        <div className="flex items-center gap-2"><div className="h-6 w-6 bg-surface-container rounded-DEFAULT" /><div className="h-3 w-24 bg-surface-container rounded" /></div>
    </div>
);

const MainContent = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: questionsList, loading, error, pagination } = useSelector((state) => state.posts);
    const { ids: savedIds, collections, loadingCollections } = useSelector((state) => state.saved);
    const isAuthenticated = useSelector((state) => state.login.isAuthenticated);
    const currentUser = useSelector((state) => state.login.user);
    const isAdmin = currentUser?.role === 'admin';
    const { toast } = useToast();
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
    const [reactingPostId, setReactingPostId] = useState('');
    const [pageSize, setPageSize] = useState(() => {
        if (typeof window === 'undefined') return 4;
        return getTrendingPageSize(window.innerWidth);
    });
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [savePostId, setSavePostId] = useState(null);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');

    const totalTrendingPages = useMemo(() => trending.length ? Math.ceil(trending.length / pageSize) : 0, [trending.length, pageSize]);
    const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

    const handleToggleSave = (postId, isSaved) => {
        if (!isAuthenticated) return navigate('/auth/login');
        if (isSaved) return dispatch(toggleSaveThunk(postId));
        setSavePostId(postId);
        setSaveModalOpen(true);
        dispatch(fetchCollectionsThunk());
    };

    const handleVotePost = async (postId, voteType) => {
        if (!isAuthenticated) return navigate('/auth/login');
        if (isAdmin) { toast.warning('Quản trị viên không được phép thực hiện tương tác này.'); return; }
        if (!postId || votingPostId) return;
        setVotingPostId(postId);
        try {
            const response = await votePost(postId, voteType);
            const data = response?.data?.data || {};
            dispatch(updatePostVoteInList({ postId, upvoteCount: data.upvoteCount ?? 0, downvoteCount: data.downvoteCount ?? 0, userVote: data.userVote ?? null }));
        } catch (voteError) {
            alert(voteError?.response?.data?.message || 'Không thể upvote/downvote bài viết.');
        } finally {
            setVotingPostId('');
        }
    };

    const handleReactPost = async (postId, reactionType) => {
        if (!isAuthenticated) return navigate('/auth/login');
        if (isAdmin) { toast.warning('Quản trị viên không được phép thực hiện tương tác này.'); return; }
        if (!postId || reactingPostId) return;
        setReactingPostId(postId);
        try {
            const response = await reactPost(postId, reactionType);
            const data = response?.data?.data || {};
            dispatch(updatePostReactionInList({ postId, likeCount: data.likeCount ?? 0, dislikeCount: data.dislikeCount ?? 0, userReaction: data.userReaction ?? null }));
        } catch (reactionError) {
            alert(reactionError?.response?.data?.message || 'Không thể like/dislike bài viết.');
        } finally {
            setReactingPostId('');
        }
    };

    const handleConfirmSaveToCollection = async () => {
        if (!savePostId) return;
        await dispatch(savePostToCollectionThunk({ postId: savePostId, collectionId: selectedCollectionId || null }));
        setSaveModalOpen(false);
        setSavePostId(null);
        setSelectedCollectionId('');
    };

    const maxTrendingPage = Math.max(0, totalTrendingPages - 1);
    const visibleTrending = useMemo(() => {
        const startIndex = Math.min(trendingPage, maxTrendingPage) * pageSize;
        return trending.slice(startIndex, startIndex + pageSize);
    }, [trending, trendingPage, pageSize, maxTrendingPage]);

    const totalTopUpvotedPages = useMemo(() => topUpvoted.length ? Math.ceil(topUpvoted.length / pageSize) : 0, [topUpvoted.length, pageSize]);
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
                if (mounted && !silent) {
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
            if (!initialLoadRef.current) loadTrending(true);
        }, 15000);
        return () => { mounted = false; clearInterval(intervalId); };
    }, []);

    useEffect(() => {
        let mounted = true;
        const loadTopUpvoted = async (silent = false) => {
            try {
                if (!silent) setTopUpvotedLoading(true);
                const response = await getTopUpvotedPosts(10);
                const data = response?.data?.data;
                if (!mounted) return;
                setTopUpvoted(Array.isArray(data) ? data.map((item) => ({ ...item, userVote: item.userVote ?? null })) : []);
                setTopUpvotedError('');
                if (!silent) setTopUpvotedPage(0);
            } catch {
                if (mounted && !silent) {
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
            if (!topUpvotedInitialLoadRef.current) loadTopUpvoted(true);
        }, 15000);
        return () => { mounted = false; clearInterval(intervalId); };
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
    const trendingPageLabel = totalTrendingPages ? `${safeTrendingPage + 1} / ${totalTrendingPages}` : '0 / 0';
    const canGoPrevTopUpvoted = safeTopUpvotedPage > 0;
    const canGoNextTopUpvoted = safeTopUpvotedPage < maxTopUpvotedPage;
    const topUpvotedPageLabel = totalTopUpvotedPages ? `${safeTopUpvotedPage + 1} / ${totalTopUpvotedPages}` : '0 / 0';
    const applyTagFilter = (tag) => {
        const normalized = String(tag || '').trim();
        if (!normalized) return;
        handleFilterChange?.('tags', normalized);
        handleApplyFilters?.({ tags: normalized });
    };

    const currentPage = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;
    const paginationItems = buildPaginationItems(currentPage, totalPages);

    const renderPagerButton = (enabled, onClick, icon, label) => (
        <button
            type="button"
            onClick={onClick}
            disabled={!enabled}
            className={`h-9 w-9 rounded-DEFAULT border border-outline-variant flex items-center justify-center transition-colors ${enabled ? 'bg-surface-container-lowest text-on-surface hover:bg-surface-container' : 'bg-surface-container-low text-outline cursor-not-allowed'}`}
            aria-label={label}
        >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </button>
    );

    return (
        <main className="flex-1 flex flex-col min-w-0 pb-12">
            <section className="mb-stack-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-wide">Thịnh hành hôm nay</h2>
                        <p className="font-body-sm text-body-sm text-secondary">Top 10 bài viết có lượt xem cao nhất hôm nay</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {renderPagerButton(canGoPrev, () => setTrendingPage((prev) => Math.min(maxTrendingPage, Math.max(0, prev - 1))), 'chevron_left', 'Trang trước')}
                        <span className="font-body-sm text-body-sm text-secondary">{trendingPageLabel}</span>
                        {renderPagerButton(canGoNext, () => setTrendingPage((prev) => Math.min(maxTrendingPage, prev + 1)), 'chevron_right', 'Trang tiếp')}
                    </div>
                </div>

                {trendingLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: pageSize }, (_, index) => <TrendingCardSkeleton key={index} />)}</div>}
                {!trendingLoading && trendingError && <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">{trendingError}</div>}
                {!trendingLoading && !trendingError && trending.length === 0 && <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">Chưa có dữ liệu trending hôm nay.</div>}
                {!trendingLoading && !trendingError && trending.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleTrending.map((post, index) => <TrendingCard key={post._id} post={post} rank={safeTrendingPage * pageSize + index + 1} onTagClick={applyTagFilter} />)}
                    </div>
                )}
            </section>

            <section className="mb-stack-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-headline-xl text-headline-xl text-on-surface tracking-wide">Bình chọn cao nhất</h2>
                        <p className="font-body-sm text-body-sm text-secondary">Top 10 bài viết có nhiều upvote nhất hôm nay</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {renderPagerButton(canGoPrevTopUpvoted, () => setTopUpvotedPage((prev) => Math.min(maxTopUpvotedPage, Math.max(0, prev - 1))), 'chevron_left', 'Trang trước')}
                        <span className="font-body-sm text-body-sm text-secondary">{topUpvotedPageLabel}</span>
                        {renderPagerButton(canGoNextTopUpvoted, () => setTopUpvotedPage((prev) => Math.min(maxTopUpvotedPage, prev + 1)), 'chevron_right', 'Trang tiếp')}
                    </div>
                </div>

                {topUpvotedLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{Array.from({ length: pageSize }, (_, index) => <TrendingCardSkeleton key={index} />)}</div>}
                {!topUpvotedLoading && topUpvotedError && <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">{topUpvotedError}</div>}
                {!topUpvotedLoading && !topUpvotedError && topUpvoted.length === 0 && <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-4 text-secondary">Chưa có dữ liệu top upvote.</div>}
                {!topUpvotedLoading && !topUpvotedError && topUpvoted.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleTopUpvoted.map((post, index) => <TopUpvotedCard key={post._id} post={post} rank={safeTopUpvotedPage * pageSize + index + 1} onTagClick={applyTagFilter} />)}
                    </div>
                )}
            </section>

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-stack-lg gap-4 border-b border-outline-variant pb-4">
                <div>
                    <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Bài viết mới nhất</h1>
                    <p className="font-body-md text-body-md text-secondary">{pagination.total?.toLocaleString('vi-VN') || 0} bài viết</p>
                </div>

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
                                className={`px-3 py-1.5 font-body-sm text-body-sm border-outline-variant transition-colors ${index < sortOptions.length - 1 ? 'border-r' : ''} ${filters?.sortBy === option.value ? 'bg-surface-container-low text-on-surface font-semibold' : 'text-secondary hover:bg-surface-container hover:text-on-surface'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-0 border-t border-outline-variant">
                {loading && <p className="p-4 text-center text-secondary">Đang tải danh sách bài viết...</p>}
                {error && <p className="p-4 text-center text-red-500">{error}</p>}
                {!loading && !error && questionsList && questionsList.length > 0 && questionsList.map((q) => (
                    <QuestionCard
                        key={q._id}
                        question={q}
                        isSaved={savedIdSet.has(q._id)}
                        onToggleSave={handleToggleSave}
                        onVotePost={handleVotePost}
                        onReactPost={handleReactPost}
                        votingPostId={votingPostId}
                        reactingPostId={reactingPostId}
                    />
                ))}
                {!loading && !error && (!questionsList || questionsList.length === 0) && <p className="p-4 text-center text-secondary">Chưa có bài viết nào trên diễn đàn.</p>}
            </div>

            {!loading && !error && totalPages > 1 && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-outline-variant pt-4">
                    <div className="flex items-center gap-1 flex-wrap">
                        {paginationItems.map((item) => {
                            if (typeof item !== 'number') return <span key={item} className="px-2 text-secondary">...</span>;
                            const isActive = item === currentPage;
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => handleApplyFilters?.({ page: item })}
                                    className={`min-w-[36px] px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm border transition-colors ${isActive ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-secondary hover:bg-surface-container-low'}`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    {item}
                                </button>
                            );
                        })}
                        <button type="button" onClick={() => handleApplyFilters?.({ page: Math.min(currentPage + 1, totalPages) })} className="px-3 py-1.5 rounded-DEFAULT font-body-sm text-body-sm border border-outline-variant text-secondary hover:bg-surface-container-low" disabled={currentPage >= totalPages}>
                            Next
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm">
                        <span>per page</span>
                        <div className="flex items-center gap-1">
                            {PER_PAGE_OPTIONS.map((size) => {
                                const isActive = Number(filters?.limit) === size;
                                return (
                                    <button key={size} type="button" onClick={() => handleApplyFilters?.({ limit: size, page: 1 })} className={`min-w-[36px] px-3 py-1.5 rounded-DEFAULT border transition-colors ${isActive ? 'bg-primary-container text-on-primary border-primary-container' : 'border-outline-variant text-secondary hover:bg-surface-container-low'}`}>
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
                    <button type="button" onClick={() => { setSaveModalOpen(false); setSavePostId(null); setSelectedCollectionId(''); }} className="absolute inset-0 bg-black/45" aria-label="Đóng" />
                    <div className="relative w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
                        <div className="px-5 py-4 border-b border-outline-variant">
                            <h3 className="text-lg font-semibold text-on-surface">Lưu bài viết vào thư mục</h3>
                        </div>
                        <div className="px-5 py-4">
                            <label className="block text-sm text-secondary mb-2">Chọn thư mục</label>
                            <select value={selectedCollectionId} onChange={(event) => setSelectedCollectionId(event.target.value)} className="w-full rounded-DEFAULT border border-outline-variant px-3 py-2 text-sm bg-surface-container-lowest">
                                <option value="">Lưu vào thư mục mặc định (Lưu trữ)</option>
                                {collections.filter((collection) => !collection.isDefault).map((collection) => (
                                    <option key={collection._id} value={collection._id}>{collection.isDefault ? 'Lưu trữ' : collection.name}</option>
                                ))}
                            </select>
                            {loadingCollections && <p className="text-xs text-secondary mt-2">Đang tải thư mục...</p>}
                        </div>
                        <div className="px-5 py-4 border-t border-outline-variant flex justify-end gap-2">
                            <button type="button" onClick={() => { setSaveModalOpen(false); setSavePostId(null); setSelectedCollectionId(''); }} className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low">
                                Hủy
                            </button>
                            <button type="button" onClick={handleConfirmSaveToCollection} className="px-3 py-1.5 text-sm rounded-DEFAULT bg-primary text-white hover:bg-primary/90">
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
