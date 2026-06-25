import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import usePostDetail from '../../hook/usePostDetail';
import ImageSlider from '../../components/post/ImageSlider';
import VoteSidebar from '../../components/post/VoteSidebar';
import PostContent from '../../components/post/PostContent';
import CommentSection from '../../components/post/CommentSection';
import RelatedPosts from '../../components/post/RelatedPosts';
import ReportCommentModal from '../../components/post/ReportCommentModal';
import ReportPostModal from '../../components/post/ReportPostModal';
import FreeVotesIntroModal from '../../components/post/FreeVotesIntroModal';
import PostFlagSummaryModal from '../../components/post/PostFlagSummaryModal';
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
import { fetchProfileThunk } from '../../store/slices/profileSlice';
import { useToast } from '../../context/ToastContext';



const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value?.toHexString === 'function') return value.toHexString();
  if (typeof value === 'object') {
    if (typeof value._id === 'string') return value._id.trim();
    if (typeof value._id?.toHexString === 'function') return value._id.toHexString();
    if (typeof value.id === 'string') return value.id.trim();
    if (typeof value.authorId === 'string') return value.authorId.trim();
    if (typeof value.userId === 'string') return value.userId.trim();
    if (typeof value.createdBy === 'string') return value.createdBy.trim();
  }
  return '';
};

export default function PostDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
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
  const [flagSummaryModalOpen, setFlagSummaryModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [reportCommentModalOpen, setReportCommentModalOpen] = useState(false);
  const [reportingComment, setReportingComment] = useState(null);
  const [reportPostModalOpen, setReportPostModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfileThunk());
    }
  }, [isAuthenticated, dispatch]);

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
    deleteComment,
    refreshPost,
    handleAcceptComment,
    showFreeVotesModal,
    setShowFreeVotesModal,
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
  const isPostLocked = post.status === 'resolved' || post.status === 'hidden' || post.status === 'deleted';

  const handleSubmitPostReport = async (selectedFlagType) => {
    if (!user?._id) {
      toast.warning('Bạn cần đăng nhập để gửi cờ báo cáo.');
      return;
    }
    if (isReportLockedByRep) {
      toast.warning(`Bạn cần tối thiểu ${minReportReputation} điểm uy tín để gửi cờ báo cáo.`);
      return;
    }
    const action = await dispatch(createReportTicketThunk({ postId: id, flagType: selectedFlagType, details: '' }));
    if (createReportTicketThunk.fulfilled.match(action)) {
      toast.success('Báo cáo bài viết thành công!');
    } else {
      toast.error(action.payload || 'Báo cáo bài viết thất bại.');
    }
    setReportPostModalOpen(false);
  };

  const handleReportComment = (comment) => {
    if (!isAuthenticated) {
      toast.warning('Bạn cần đăng nhập để gửi báo cáo bình luận.');
      navigate('/auth/login');
      return;
    }
    setReportingComment(comment);
    setReportCommentModalOpen(true);
  };

  const handleSubmitCommentReport = async (selectedFlagType) => {
    if (!reportingComment) return;
    const action = await dispatch(createReportTicketThunk({
      commentId: reportingComment._id,
      flagType: selectedFlagType,
      details: ''
    }));
    if (createReportTicketThunk.fulfilled.match(action)) {
      toast.success('Báo cáo bình luận thành công!');
    } else {
      toast.error(action.payload || 'Báo cáo bình luận thất bại.');
    }
    setReportCommentModalOpen(false);
    setReportingComment(null);
  };

  const isSaved = savedIds.includes(post._id);
  const handleToggleSave = () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (user?.role === 'admin') {
      toast.warning('Quản trị viên không được phép thực hiện tương tác này.');
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

    if (isPostLocked) {
      toast.warning('Bài viết đã bị khóa hoặc không hợp lệ, không thể thực hiện quyên góp.');
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
      toast.error('Thiếu dữ liệu bài viết. Vui lòng tải lại trang rồi thử lại.');
      return;
    }

    const answerContent = !isPostDonation ? (comment?.content || comment?.body || '') : '';

    const checkoutPayload = {
      postId: realPostId,
      postTitle: post?.title || 'Bài viết',
      postAuthorId: postAuthorId || '',
      postAuthorName: postAuthorCandidate?.fullName || postAuthorCandidate?.email || '',
      authorId: targetAuthorId || postAuthorId || '',
      authorName: targetAuthorCandidate?.fullName || targetAuthorCandidate?.email || 'tác giả',
      authorAvatar: targetAuthorCandidate?.avatar || '',
      answerId: '',
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

      <div className="flex gap-4 sm:gap-6 w-full min-w-0">
        {post.postType === 'question' && (
          <div className="hidden sm:block">
            <VoteSidebar 
              upvoteCount={upvoteCount} 
              downvoteCount={downvoteCount} 
              userVote={userVote} 
              onVote={handleVote} 
              loading={voteLoading} 
              disabled={isPostLocked}
              userReputation={isAuthenticated ? userReputation : undefined}
              weeklyFreeVotesUsed={user?.reputationInfo?.weeklyFreeVotesUsed || 0}
              weeklyFreeVotesLimit={user?.reputationInfo?.weeklyFreeVotesLimit || 5}
            />
          </div>
        )}

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
          currentUserId={user?._id || user?.id || ''}
          currentUserRole={user?.role || ''}
          onPostUpdated={refreshPost}
          isAuthenticated={isAuthenticated}
          userReputation={userReputation}
          onReportPost={() => setReportPostModalOpen(true)}
          onShowFlagSummary={() => {
            setFlagSummaryModalOpen(true);
            dispatch(fetchPostFlagSummaryThunk(id));
          }}
          isAdmin={user?.role === 'admin'}
        />
      </div>

      {post.postType === 'question' && (
        <div className="mt-4 flex items-center justify-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest py-3 sm:hidden">
          <button
            onClick={() => handleVote('upvote')}
            disabled={voteLoading || isPostLocked}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-body-sm font-body-sm font-medium transition-all ${userVote === 'upvote' ? 'border border-primary/30 bg-primary-fixed text-primary' : 'border border-outline-variant bg-surface-container-low text-secondary hover:bg-primary-fixed/30'} ${isPostLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 4l-8 8h5v8h6v-8h5z" /></svg>
            {upvoteCount}
          </button>
          <span className="text-lg font-bold text-on-surface">{upvoteCount - downvoteCount}</span>
          <button
            onClick={() => handleVote('downvote')}
            disabled={voteLoading || isPostLocked || (isAuthenticated && userReputation < 100)}
            title={isPostLocked ? 'Bài viết đã bị khóa, không thể vote' : (isAuthenticated && userReputation < 100) ? 'Bạn cần tối thiểu 100 điểm uy tín để Downvote' : 'Bình chọn xuống'}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-body-sm font-body-sm font-medium transition-all ${userVote === 'downvote' ? 'border border-error/30 bg-error-container text-error' : 'border border-outline-variant bg-surface-container-low text-secondary hover:bg-error-container/30'} ${(isPostLocked || (isAuthenticated && userReputation < 100)) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 20l8-8h-5V4H9v8H4z" /></svg>
            {downvoteCount}
          </button>
          {userReputation !== undefined && userReputation < 15 && (
            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-bold select-none tabular-nums" title="Lượt bình chọn miễn phí hàng tuần còn lại">
              Free: {Math.max(0, (user?.reputationInfo?.weeklyFreeVotesLimit || 5) - (user?.reputationInfo?.weeklyFreeVotesUsed || 0))}/5
            </span>
          )}
        </div>
      )}

      <div className="mt-10 sm:mt-12 flex flex-col gap-4">
        {post.images && post.images.length > 0 && <ImageSlider images={post.images} />}
        {post.videos && post.videos.length > 0 ? (
          post.videos.map((vidUrl, index) => (
            <div key={index} className="rounded-xl overflow-hidden border border-outline-variant bg-black max-h-[480px] flex items-center justify-center">
              <video src={vidUrl} controls className="max-w-full max-h-[480px] object-contain" />
            </div>
          ))
        ) : (
          post.video && (
            <div className="rounded-xl overflow-hidden border border-outline-variant bg-black max-h-[480px] flex items-center justify-center">
              <video src={post.video} controls className="max-w-full max-h-[480px] object-contain" />
            </div>
          )
        )}
      </div>

      {/* {post.author?.role !== 'admin' && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
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
        </section>
      )} */}

      <CommentSection
        comments={comments}
        commentCount={commentCount}
        postAuthorId={post.author?._id}
        postType={post.postType}
        onDonate={handleStartDonate}
        isAuthenticated={isAuthenticated}
        onLoginRequired={() => navigate('/auth/login')}
        onSubmitComment={submitComment}
        submittingComment={submittingComment}
        commentError={commentError}
        currentUserId={user?._id || user?.id || ''}
        onReactComment={reactComment}
        reactingCommentId={reactingCommentId}
        onDeleteComment={deleteComment}
        postStatus={post.status}
        onCommentUpdated={refreshPost}
        onReportComment={handleReportComment}
        bestAnswerId={post.bestAnswer}
        onAcceptComment={handleAcceptComment}
        userReputation={isAuthenticated ? userReputation : undefined}
      />

      <RelatedPosts posts={relatedPosts} />



      {flagSummaryModalOpen && (
        <PostFlagSummaryModal
          isOpen={flagSummaryModalOpen}
          onClose={() => setFlagSummaryModalOpen(false)}
          ownerSummary={ownerSummary}
          loading={loadingOwnerSummary}
          error={ownerSummaryErrorMessage}
        />
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

      <ReportCommentModal
        isOpen={reportCommentModalOpen}
        onClose={() => { setReportCommentModalOpen(false); setReportingComment(null); }}
        comment={reportingComment}
        onSubmitReport={handleSubmitCommentReport}
      />

      <ReportPostModal
        isOpen={reportPostModalOpen}
        onClose={() => setReportPostModalOpen(false)}
        onSubmitReport={handleSubmitPostReport}
      />

      <FreeVotesIntroModal
        isOpen={showFreeVotesModal}
        onClose={() => setShowFreeVotesModal(false)}
      />
    </div>
  );
}
