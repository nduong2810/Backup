import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import FormAlert from '../../components/ui/FormAlert';
import ReputationBadge from '../../components/ui/ReputationBadge';
import { getPublicAuthorProfileApi } from '../../services/donationService';

const POST_LIMIT = 5;

const statusLabelMap = {
  completed: 'Đã duyệt',
  pending_review: 'Chờ duyệt',
  pending_payment: 'Chờ thanh toán',
  rejected: 'Đã từ chối',
};

const paymentMethodLabelMap = {
  cod: 'Chuyển khoản thủ công',
  vnpay: 'VNPAY sandbox',
};

const getAvatarUrl = (user, size = 160, background = '0066cc') => {
  const name = user?.fullName || user?.email || 'U';
  if (user?.avatar && user.avatar !== 'default-avatar.png') return user.avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff&size=${size}`;
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa rõ';

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const getExcerpt = (value = '') => {
  const text = String(value).replace(/<[^>]+>/g, '').trim();
  if (!text) return 'Bài viết chưa có phần mô tả.';
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
};

const buildPaginationItems = (current, total) => {
  if (total <= 1) return [];
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push('ellipsis-end');
  items.push(total);
  return items;
};

function StatBox({ label, value, tone = 'slate', icon }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-900',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[tone];

  return (
    <div className={`rounded-xl border border-slate-100 p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function PostTypeBadge({ type }) {
  const isAdvice = type === 'advice';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${isAdvice ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
      {isAdvice ? 'Lời khuyên' : 'Câu hỏi'}
    </span>
  );
}

function AuthorPostCard({ post }) {
  const commentLabel = post.postType === 'advice' ? 'bình luận' : 'câu trả lời';
  const reactionCount = post.postType === 'advice' ? post.likeCount : post.upvoteCount;
  const reactionLabel = post.postType === 'advice' ? 'lượt thích' : 'upvote';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary/30 hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PostTypeBadge type={post.postType} />
            <span className="text-xs font-medium text-slate-500">Đăng ngày {formatDate(post.createdAt)}</span>
          </div>
          <Link to={`/posts/${post._id}`} className="text-lg font-extrabold leading-snug text-slate-900 hover:text-primary">
            {post.title}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{getExcerpt(post.content)}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:w-56">
          <div className="rounded-lg bg-slate-50 px-2 py-2"><div className="text-sm font-bold text-slate-900">{formatNumber(reactionCount)}</div><div className="text-[11px] text-slate-500">{reactionLabel}</div></div>
          <div className="rounded-lg bg-slate-50 px-2 py-2"><div className="text-sm font-bold text-slate-900">{formatNumber(post.answerCount)}</div><div className="text-[11px] text-slate-500">{commentLabel}</div></div>
          <div className="rounded-lg bg-slate-50 px-2 py-2"><div className="text-sm font-bold text-slate-900">{formatNumber(post.viewCount)}</div><div className="text-[11px] text-slate-500">lượt xem</div></div>
        </div>
      </div>
    </article>
  );
}

export default function AuthorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorProfile, setAuthorProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getPublicAuthorProfileApi(id, { page, limit: POST_LIMIT });
        if (!mounted) return;
        setAuthorProfile(response?.data?.data || null);
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError?.response?.data?.message || 'Không thể tải hồ sơ công khai.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [id, page]);

  const setPage = (nextPage) => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.set('page', String(nextPage));
      return params;
    });
  };

  const paginationItems = useMemo(() => {
    const totalPages = authorProfile?.postsPagination?.totalPages || 1;
    return buildPaginationItems(page, totalPages);
  }, [authorProfile?.postsPagination?.totalPages, page]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl pt-2 pb-8">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl pt-2 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">Hồ sơ công khai</h1>
          <p className="mt-1 text-sm text-slate-500">Không thể tải dữ liệu người dùng.</p>
          <div className="mt-5"><FormAlert type="error" message={error} /></div>
          <div className="mt-5 flex gap-3">
            <AppButton onClick={() => navigate(-1)}>Quay lại</AppButton>
            <AppButton variant="secondary" onClick={() => navigate('/home')}>Về trang chủ</AppButton>
          </div>
        </section>
      </div>
    );
  }

  if (!authorProfile) return null;

  const { user, donations = [], donationSummary = {}, postSummary = {}, posts = [], postsPagination = {} } = authorProfile;
  const isAdminProfile = user.role === 'admin';
  const totalPages = postsPagination.totalPages || 1;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const memberSince = formatDate(user.createdAt);
  const roleLabel = isAdminProfile ? 'Quản trị viên hệ thống' : (user.major || 'Thành viên cộng đồng');
  const hasBankInfo = Boolean(user.bankName && user.bankAccountNumber);

  return (
    <div className="mx-auto max-w-6xl pt-2 pb-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </button>
        <Link to="/user/profile" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50">
          Hồ sơ của tôi
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.55)]">
        <div className={`${isAdminProfile ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950' : 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900'} px-6 py-8 text-white sm:px-8`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
              <img src={getAvatarUrl(user, 180, isAdminProfile ? '1d4ed8' : '0066cc')} alt={user.fullName} className="h-28 w-28 rounded-2xl border-4 border-white/25 object-cover shadow-lg" />
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-extrabold text-sky-100 ring-1 ring-sky-300/25">
                    <span className="material-symbols-outlined text-[15px]">person</span>
                    {roleLabel}
                  </span>
                  <ReputationBadge reputation={user.reputationInfo?.reputation || user.reputation || 1} size="md" showLabel />
                </div>
                <h1 className="break-words text-3xl font-black leading-tight sm:text-4xl">{user.fullName}</h1>
                <p className="mt-2 text-sm font-medium text-white/75">{user.email}</p>
                <p className="mt-1 text-sm text-white/70">Tham gia từ {memberSince}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:w-[460px]">
              <div className="rounded-xl bg-white/12 p-3 text-center ring-1 ring-white/15"><div className="text-2xl font-black">{formatNumber(postSummary.totalPosts)}</div><div className="text-xs text-white/70">bài viết</div></div>
              <div className="rounded-xl bg-white/12 p-3 text-center ring-1 ring-white/15"><div className="text-2xl font-black">{formatNumber(postSummary.totalViews)}</div><div className="text-xs text-white/70">lượt xem</div></div>
              <div className="rounded-xl bg-white/12 p-3 text-center ring-1 ring-white/15"><div className="text-2xl font-black">{formatNumber(postSummary.totalUpvotes)}</div><div className="text-xs text-white/70">upvote</div></div>
              <div className="rounded-xl bg-white/12 p-3 text-center ring-1 ring-white/15"><div className="text-2xl font-black">{formatNumber(donationSummary.donationCount)}</div><div className="text-xs text-white/70">ủng hộ</div></div>
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_320px]">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r sm:p-8">
            <h2 className="text-lg font-extrabold text-slate-900">Giới thiệu công khai</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {user.bio || 'Người dùng này chưa cập nhật phần giới thiệu công khai.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-6 sm:p-8 md:grid-cols-1">
            <StatBox label="Câu hỏi" value={formatNumber(postSummary.questionCount)} tone="blue" icon="help_center" />
            <StatBox label="Lời khuyên" value={formatNumber(postSummary.adviceCount)} tone="emerald" icon="tips_and_updates" />
            <StatBox label="Tổng donate" value={`${formatNumber(donationSummary.totalAmount)}đ`} tone="amber" icon="volunteer_activism" />
            <StatBox label="Uy tín" value={formatNumber(user.reputationInfo?.reputation || user.reputation || 1)} tone="slate" icon="workspace_premium" />
          </div>
        </div>
      </section>

      <div className={`mt-6 grid gap-6 ${isAdminProfile ? '' : 'lg:grid-cols-[1fr_340px]'}`}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">Bài viết công khai</h2>
              <p className="mt-1 text-sm text-slate-500">{formatNumber(postsPagination.total)} bài viết đang hiển thị trên diễn đàn</p>
            </div>
            {totalPages > 1 && <div className="text-sm font-semibold text-slate-500">Trang {page} / {totalPages}</div>}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">Người dùng này chưa có bài viết công khai nào.</div>
          ) : (
            <div className="space-y-3">{posts.map((post) => <AuthorPostCard key={post._id} post={post} />)}</div>
          )}

          {totalPages > 1 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setPage(page - 1)} disabled={!canGoPrev} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Trước</button>
              <div className="flex flex-wrap items-center gap-1">
                {paginationItems.map((item) => {
                  if (typeof item !== 'number') return <span key={item} className="px-2 text-slate-400">...</span>;
                  const isActive = item === page;
                  return <button key={item} type="button" onClick={() => setPage(item)} className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-bold ${isActive ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{item}</button>;
                })}
              </div>
              <button type="button" onClick={() => setPage(page + 1)} disabled={!canGoNext} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Sau</button>
            </div>
          )}
        </section>

        {!isAdminProfile && (
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-black text-slate-900">Thông tin nhận chuyển khoản</h2>
              <p className="mt-1 text-sm text-slate-500">Dùng khi người khác muốn ủng hộ bằng chuyển khoản thủ công.</p>
              {hasBankInfo ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Ngân hàng</p><p className="mt-1 font-bold text-slate-900">{user.bankName}</p></div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">STK</p><p className="mt-1 font-mono text-lg font-black text-slate-900">{user.bankAccountNumber}</p></div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">Tên người nhận</p><p className="mt-1 font-bold text-slate-900">{user.fullName}</p></div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">Người dùng này chưa cập nhật thông tin nhận chuyển khoản.</div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-black text-slate-900">Hoạt động ủng hộ</h2>
              <p className="mt-1 text-sm text-slate-500">Các lượt donate được ghi nhận cho tác giả.</p>
              {donations.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Chưa có lượt ủng hộ nào được duyệt cho người dùng này.</div>
              ) : (
                <div className="mt-5 space-y-3">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><div className="truncate text-sm font-bold text-slate-900">{donation.donor?.fullName || donation.donorSnapshot?.fullName || 'Ẩn danh'}</div><div className="mt-1 text-xs text-slate-500">{new Date(donation.createdAt).toLocaleString('vi-VN')}</div></div>
                        <div className="text-right text-sm font-black text-amber-700">{formatNumber(donation.amount)}đ</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">{paymentMethodLabelMap[donation.paymentMethod] || donation.paymentMethod}</span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">{statusLabelMap[donation.status] || donation.status}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{donation.post?.title || donation.postSnapshot?.title || 'Bài viết được ủng hộ'}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
