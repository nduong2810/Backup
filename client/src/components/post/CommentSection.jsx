import CommentItem from './CommentItem';

// ====================================================================
// CommentSection — Section bình luận với danh sách comments
// Đã tích hợp design tokens từ hệ thống thiết kế chính
// ====================================================================

export default function CommentSection({ comments, commentCount, postAuthorId }) {
  return (
    <section className="mt-8">
      {/* Header */}
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        {commentCount} Bình luận
      </h3>

      {/* Danh sách comments */}
      {comments && comments.length > 0 ? (
        <div className="flex flex-col gap-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-6 shadow-sm">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postAuthorId={postAuthorId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-outline bg-surface-container-low rounded-xl border border-outline-variant">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-2 text-outline-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="font-body-md text-body-md">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      )}
    </section>
  );
}
