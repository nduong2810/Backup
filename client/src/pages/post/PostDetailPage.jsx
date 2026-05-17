import { useParams, useNavigate } from 'react-router-dom';
import usePostDetail from '../../hook/usePostDetail';
import ImageSlider from '../../components/post/ImageSlider';
import VoteSidebar from '../../components/post/VoteSidebar';
import PostContent from '../../components/post/PostContent';
import CommentSection from '../../components/post/CommentSection';
import RelatedPosts from '../../components/post/RelatedPosts';

// ====================================================================
// PostDetailPage — Trang chi tiết bài viết
// Sử dụng usePostDetail hook → Component chỉ lo render UI
// ====================================================================

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  // === Loading state ===
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Đang tải bài viết...</p>
      </div>
    );
  }

  // === Error state ===
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-sky-600 hover:underline"
        >
          ← Quay lại
        </button>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Quay lại
      </button>

      {/* Content Grid: Vote Sidebar + Post Body */}
      <div className="flex gap-4 sm:gap-6">
        {/* Vote Sidebar — ẩn trên mobile nhỏ */}
        <div className="hidden sm:block">
          <VoteSidebar
            upvoteCount={upvoteCount}
            downvoteCount={downvoteCount}
            userVote={userVote}
            onVote={handleVote}
            loading={voteLoading}
          />
        </div>

        {/* Nội dung bài viết */}
        <PostContent post={post} commentCount={commentCount} />
      </div>

      {/* Vote Mobile — hiện trên mobile */}
      <div className="sm:hidden flex items-center justify-center gap-4 mt-4 py-3 bg-white/90 rounded-xl border border-slate-200">
        <button
          onClick={() => handleVote('upvote')}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${userVote === 'upvote'
              ? 'bg-sky-100 text-sky-700 border border-sky-300'
              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-sky-50'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
          {upvoteCount}
        </button>
        <span className="text-lg font-bold text-slate-700">
          {upvoteCount - downvoteCount}
        </span>
        <button
          onClick={() => handleVote('downvote')}
          disabled={voteLoading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${userVote === 'downvote'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-red-50'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 20l8-8h-5V4H9v8H4z" />
          </svg>
          {downvoteCount}
        </button>
      </div>

      {/* Swiper Image Slider (đặt cuối bài, trước phần bình luận) */}
      <div className="mt-10 sm:mt-12">
        <ImageSlider images={post.images} />
      </div>

      {/* Bình luận */}
      <CommentSection
        comments={comments}
        commentCount={commentCount}
        postAuthorId={post.author?._id}
      />

      {/* Bài viết liên quan */}
      <RelatedPosts posts={relatedPosts} />
    </div>
  );
}
