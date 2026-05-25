import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import usePostDetail from '../../hook/usePostDetail';
import ImageSlider from '../../components/post/ImageSlider';
import VoteSidebar from '../../components/post/VoteSidebar';
import PostContent from '../../components/post/PostContent';
import CommentSection from '../../components/post/CommentSection';
import RelatedPosts from '../../components/post/RelatedPosts';
import { fetchCollectionsThunk, savePostToCollectionThunk, toggleSaveThunk } from '../../store/slices/savedSlice';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { ids: savedIds, collections, loadingCollections } = useSelector((state) => state.saved);
  const isAuthenticated = useSelector((state) => state.login.isAuthenticated);
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
    relatedPosts,
  } = usePostDetail(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-outline-variant border-t-primary rounded-full animate-spin" />
        <p className="text-secondary font-body-sm text-body-sm">Đang tải bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-error font-body-md text-body-md font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="font-body-sm text-body-sm text-primary hover:underline"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  if (!post) return null;

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

  return (
    <div className="flex-1 min-w-0 max-w-4xl mx-auto pb-12">
      <button
        onClick={handleBack}
        className="flex items-center gap-1 font-body-sm text-body-sm text-secondary hover:text-primary transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Quay lại
      </button>

      <div className="flex gap-4 sm:gap-6">
        <div className="hidden sm:block">
          <VoteSidebar
            upvoteCount={upvoteCount}
            downvoteCount={downvoteCount}
            userVote={userVote}
            onVote={handleVote}
            loading={voteLoading}
          />
        </div>

        <PostContent
          post={post}
          commentCount={commentCount}
          isSaved={isSaved}
          onToggleSave={handleToggleSave}
        />
      </div>

      <div className="sm:hidden flex items-center justify-center gap-4 mt-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
        <button
          onClick={() => handleVote('upvote')}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-all
            ${userVote === 'upvote'
              ? 'bg-primary-fixed text-primary border border-primary/30'
              : 'bg-surface-container-low text-secondary border border-outline-variant hover:bg-primary-fixed/30'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
          {upvoteCount}
        </button>
        <span className="text-lg font-bold text-on-surface">
          {upvoteCount - downvoteCount}
        </span>
        <button
          onClick={() => handleVote('downvote')}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-body-sm text-body-sm font-medium transition-all
            ${userVote === 'downvote'
              ? 'bg-error-container text-error border border-error/30'
              : 'bg-surface-container-low text-secondary border border-outline-variant hover:bg-error-container/30'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 20l8-8h-5V4H9v8H4z" />
          </svg>
          {downvoteCount}
        </button>
      </div>

      <div className="mt-10 sm:mt-12">
        <ImageSlider images={post.images} />
      </div>

      <CommentSection
        comments={comments}
        commentCount={commentCount}
        postAuthorId={post.author?._id}
      />

      <RelatedPosts posts={relatedPosts} />

      {saveModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => {
              setSaveModalOpen(false);
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
    </div>
  );
}

