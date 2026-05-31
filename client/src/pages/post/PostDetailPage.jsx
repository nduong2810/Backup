import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import usePostDetail from '../../hook/usePostDetail';
import ImageSlider from '../../components/post/ImageSlider';
import VoteSidebar from '../../components/post/VoteSidebar';
import PostContent from '../../components/post/PostContent';
import CommentSection from '../../components/post/CommentSection';
import RelatedPosts from '../../components/post/RelatedPosts';
import {
  clearReportCreateMessages,
  createReportTicketThunk,
  fetchPostFlagSummaryThunk,
} from '../../store/slices/reportSlice';
import {
  fetchCollectionsThunk,
  savePostToCollectionThunk,
  toggleSaveThunk,
} from '../../store/slices/savedSlice';

const flagOptions = [
  { value: 'spam', label: 'Xóa vì spam quảng cáo hàng loạt' },
  { value: 'rude_abusive', label: 'Xóa vì công kích/xúc phạm' },
  { value: 'off_topic', label: 'Không đúng chủ đề cộng đồng' },
  { value: 'needs_detail', label: 'Cần thêm chi tiết hoặc làm rõ' },
  { value: 'needs_focus', label: 'Cần tập trung vào một vấn đề cụ thể' },
  { value: 'opinion_based', label: 'Dựa trên quan điểm cá nhân' },
  { value: 'duplicate', label: 'Trùng bài viết/câu hỏi đã có' },
  { value: 'very_low_quality', label: 'Chất lượng rất thấp, khó cứu vãn' },
  { value: 'moderator_attention', label: 'Cần moderator xem thủ công' },
];

const flagTypeLabelMap = {
  spam: 'Spam quảng cáo hàng loạt',
  rude_abusive: 'Công kích/Xúc phạm',
  off_topic: 'Lạc chủ đề cộng đồng',
  needs_detail: 'Cần thêm chi tiết/làm rõ',
  needs_focus: 'Cần tập trung vào một vấn đề cụ thể',
  opinion_based: 'Dựa trên quan điểm cá nhân',
  duplicate: 'Trùng bài viết/câu hỏi đã có',
  very_low_quality: 'Chất lượng rất thấp, khó cứu vãn',
  moderator_attention: 'Cần moderator xem thủ công',
};

const postStatusLabelMap = {
  active: 'Đang hiển thị',
  closed: 'Đã khóa',
  deleted: 'Đã xóa',
};

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (value.$oid) return normalizeId(value.$oid);
    if (value._id) return normalizeId(value._id);
    if (value.id) return normalizeId(value.id);
    if (value.authorId) return normalizeId(value.authorId);
    if (value.userId) return normalizeId(value.userId);
    if (value.author) return normalizeId(value.author);
    if (value.user) return normalizeId(value.user);
    if (value.createdBy) return normalizeId(value.createdBy);
  }
  return '';
};

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.login);
  const { ids: savedIds, collections, loadingCollections } = useSelector((state) => state.saved);
  const {
    creating,
    createSuccessMessage,
    createErrorMessage,
    ownerSummary,
    loadingOwnerSummary,
    ownerSummaryErrorMessage,
  } = useSelector((state) => state.reports);
  const [flagType, setFlagType] = useState('');
  const [details, setDetails] = useState('');
  const [showOwnerSummary, setShowOwnerSummary] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  const {
    post,
    comments,
    commentCount,
    loading,
    error,
    upvoteCount,
    downvoteCount,
    userVote,
    handleVote,
    voteLoading,
    likeCount,
    dislikeCount,
    userReaction,
    handlePostReaction,
    reactionLoading,
    submitComment,
    submittingComment,
    commentError,
    reactComment,
    reactingCommentId,
    relatedPosts,
  } = usePostDetail(id);

  const minReportReputation = 15;
  const userReputation = user?.reputationInfo?.reputation ?? user?.reputation ?? 1;
  const isReportLockedByRep = isAuthenticated && userReputation < minReportReputation;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-primary" />
        <p className="text-body-sm font-body-sm text-secondary">Đang tải bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex-1 min-w-0 max-w-4xl pb-12">
        <div className="mt-8 flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-error/30 bg-error-container/30 px-6 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="mt-4 text-body-md font-body-md font-semibold text-error">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-1 text-body-sm font-body-sm text-primary hover:underline">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;
  const isPostOwner = user?._id && post?.author?._id && user._id === post.author._id;

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!user?._id) {
      alert('Bạn cần đăng nhập để gửi cờ báo cáo.');
      return;
    }
    if (isReportLockedByRep) {
      alert(`Bạn cần tối thiểu ${minReportReputation} điểm reputation để gửi cờ báo cáo.`);
      return;
    }
    if (!flagType) return;

    const action = await dispatch(createReportTicketThunk({ postId: id, flagType, details: details.trim() }));
    if (createReportTicketThunk.fulfilled.match(action)) {
      setFlagType('');
      setDetails('');
    }
  };

  const isSaved = savedIds.includes(post._id);
  const handleToggleSave = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (isSaved) {
      dispatch(toggleSaveThunk(post._id));
      return;
    }

    setSaveModalOpen(true);
    dispatch(fetchCollectionsThunk());
  };

  const handleConfirmSaveToCollection = async () => {
    await dispatch(savePostToCollectionThunk({
      postId: post._id,
      collectionId: selectedCollectionId || null,
    }));
    setSaveModalOpen(false);
    setSelectedCollectionId('');
  };

  const handleBack = () => {
    if (location.state?.from === '/user/saves') {
      navigate('/user/saves');
      return;
    }
    navigate(-1);
  };

  const handleStartDonate = (comment = {}) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    const isPostDonation = comment?.isPostDonation === true;
    const realPostId = normalizeId(post?._id || post?.id || id);
    const postAuthorCandidate = post?.author || post?.authorId || post?.user || post?.userId || post?.createdBy || '';
    const commentAuthorCandidate = comment?.author || comment?.authorId || comment?.user || comment?.userId || comment?.createdBy || '';
    const targetAuthorCandidate = isPostDonation ? postAuthorCandidate : commentAuthorCandidate;
    const postAuthorId = normalizeId(postAuthorCandidate);
    const targetAuthorId = normalizeId(targetAuthorCandidate);

    if (!realPostId) {
      alert('Thiếu dữ liệu bài viết. Vui lòng tải lại trang rồi thử lại.');
      return;
    }

    const answerId = !isPostDonation ? normalizeId(comment?._id || comment?.id) : '';
    const answerContent = !isPostDonation ? (comment?.content || comment?.body || '') : '';

    const checkoutPayload = {
      postId: realPostId,
      postTitle: post?.title || 'Bài viết',
      postAuthorId: postAuthorId || '',
      postAuthorName: postAuthorCandidate?.fullName || postAuthorCandidate?.email || '',
      authorId: targetAuthorId || postAuthorId || '',
      authorName: targetAuthorCandidate?.fullName || targetAuthorCandidate?.email || 'tác giả',
      authorAvatar: targetAuthorCandidate?.avatar || '',
      answerId,
      answerContent,
    };

    const checkoutSearch = new URLSearchParams(checkoutPayload);
    sessionStorage.setItem('donationCheckoutContext', JSON.stringify(checkoutPayload));
    navigate(`/donate/checkout?${checkoutSearch.toString()}`, { state: checkoutPayload });
  };

  const requireLoginOrReact = (reactionType) => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    handlePostReaction(reactionType);
  };

  return (
    <div className="mx-auto flex-1 min-w-0 max-w-4xl pb-12">
      <button onClick={handleBack} className="mb-4 flex items-center gap-1 text-body-sm font-body-sm text-secondary transition-colors hover:text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Quay lại
      </button>

      <div className="flex gap-4 sm:gap-6">
        <div className="hidden sm:block">
          <VoteSidebar upvoteCount={upvoteCount} downvoteCount={downvoteCount} userVote={userVote} onVote={handleVote} loading={voteLoading} />
        </div>

        <PostContent
          post={post}
          commentCount={commentCount}
          isSaved={isSaved}
          onToggleSave={handleToggleSave}
          likeCount={likeCount}
          dislikeCount={dislikeCount}
          userReaction={userReaction}
          reactionLoading={reactionLoading}
          onPostReaction={requireLoginOrReact}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest py-3 sm:hidden">
        <button
          onClick={() => handleVote('upvote')}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-body-sm font-body-sm font-medium transition-all ${userVote === 'upvote' ? 'border border-primary/30 bg-primary-fixed text-primary' : 'border border-outline-variant bg-surface-container-low text-secondary hover:bg-primary-fixed/30'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 4l-8 8h5v8h6v-8h5z" /></svg>
          {upvoteCount}
        </button>
        <span className="text-lg font-bold text-on-surface">{upvoteCount - downvoteCount}</span>
        <button
          onClick={() => handleVote('downvote')}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-body-sm font-body-sm font-medium transition-all ${userVote === 'downvote' ? 'border border-error/30 bg-error-container text-error' : 'border border-outline-variant bg-surface-container-low text-secondary hover:bg-error-container/30'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 20l8-8h-5V4H9v8H4z" /></svg>
          {downvoteCount}
        </button>
      </div>

      <div className="mt-10 sm:mt-12">
        <ImageSlider images={post.images} />
      </div>

      {/* <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-amber-950">Ủng hộ tác giả khi thấy câu trả lời hữu ích</h3>
            <p className="mt-1 text-sm text-amber-900/80">Chọn mức 20K, 50K hoặc 100K để gửi một tách cafe cho người trả lời.</p>
          </div>
          <button
            type="button"
            onClick={() => handleStartDonate({ author: post.author, _id: post.author?._id, isPostDonation: true })}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Ủng hộ tác giả của bài viết
          </button>
        </div>
      </section> */}

      <CommentSection
        comments={comments}
        commentCount={commentCount}
        postAuthorId={post.author?._id}
        onDonate={handleStartDonate}
        isAuthenticated={isAuthenticated}
        onLoginRequired={() => navigate('/auth/login')}
        onSubmitComment={submitComment}
        submittingComment={submittingComment}
        commentError={commentError}
        currentUserId={user?._id || user?.id || ''}
        onReactComment={reactComment}
        reactingCommentId={reactingCommentId}
      />

      <RelatedPosts posts={relatedPosts} />

      <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-rose-900">Gắn cờ bài viết</h3>
            <p className="mt-1 text-sm text-rose-800">Chọn lý do gắn cờ để cộng đồng và admin xử lý.</p>
          </div>
          <button type="button" onClick={() => navigate('/reports/history')} className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-800 hover:bg-rose-100">
            Lịch sử cờ báo cáo
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmitReport}>
          <select
            value={flagType}
            onChange={(e) => { dispatch(clearReportCreateMessages()); setFlagType(e.target.value); }}
            disabled={isReportLockedByRep}
            className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Chọn loại cờ...</option>
            {flagOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            placeholder="Mô tả thêm (đặc biệt hữu ích khi chọn 'Cần moderator xem thủ công')"
            disabled={isReportLockedByRep}
            className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700"
          />

          <button type="submit" disabled={creating || !flagType || isReportLockedByRep} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
            {creating ? 'Đang gửi...' : 'Gửi cờ báo cáo'}
          </button>

          {isReportLockedByRep && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <span className="mt-0.5 text-rose-700">!</span>
              <p className="leading-5">Bạn cần tối thiểu {minReportReputation} điểm reputation để gửi cờ báo cáo.</p>
            </div>
          )}

          {createSuccessMessage && <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><span className="mt-0.5 text-emerald-700">✓</span><p className="leading-5">{createSuccessMessage}</p></div>}
          {createErrorMessage && <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"><span className="mt-0.5 text-rose-700">!</span><p className="leading-5">{createErrorMessage}</p></div>}
        </form>
      </section>

      {isPostOwner && (
        <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Tình trạng cờ trên bài viết của bạn</h3>
              <p className="mt-1 text-sm text-blue-800">Dành cho chủ bài: xem tổng hợp số lượng cờ và loại cờ đang tác động lên bài viết.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showOwnerSummary) {
                  setShowOwnerSummary(false);
                  return;
                }
                setShowOwnerSummary(true);
                if (!ownerSummary) dispatch(fetchPostFlagSummaryThunk(id));
              }}
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-800 hover:bg-blue-100"
            >
              {loadingOwnerSummary ? 'Đang tải...' : showOwnerSummary ? 'Đóng tổng hợp cờ' : 'Xem tổng hợp cờ'}
            </button>
          </div>

          {showOwnerSummary && ownerSummaryErrorMessage && <p className="mt-3 text-sm text-red-700">{ownerSummaryErrorMessage}</p>}
          {showOwnerSummary && ownerSummary && (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><strong>Tổng số cờ:</strong> {ownerSummary.totalFlags}</p>
              <p><strong>Trạng thái bài:</strong> {postStatusLabelMap[ownerSummary.postStatus] || ownerSummary.postStatus}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ownerSummary.summaryByType || {}).map(([key, value]) => (
                  <span key={key} className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs text-blue-800">
                    {flagTypeLabelMap[key] || key}: {value} cờ
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {saveModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" onClick={() => { setSaveModalOpen(false); setSelectedCollectionId(''); }} className="absolute inset-0 bg-black/45" aria-label="Đóng" />
          <div className="relative w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl">
            <div className="px-5 py-4 border-b border-outline-variant"><h3 className="text-lg font-semibold text-on-surface">Lưu bài viết vào thư mục</h3></div>
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
              <button type="button" onClick={() => { setSaveModalOpen(false); setSelectedCollectionId(''); }} className="px-3 py-1.5 text-sm rounded-DEFAULT border border-outline-variant hover:bg-surface-container-low">Hủy</button>
              <button type="button" onClick={handleConfirmSaveToCollection} className="px-3 py-1.5 text-sm rounded-DEFAULT bg-primary text-white hover:bg-primary/90">Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
