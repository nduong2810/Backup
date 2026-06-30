import { useNavigate } from 'react-router-dom';

// ====================================================================
// RelatedPosts — Danh sách bài viết liên quan cùng tag
// Hiển thị ở cuối trang chi tiết bài viết
// Đã tích hợp design tokens từ hệ thống thiết kế chính
// ====================================================================

export default function RelatedPosts({ posts }) {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-secondary" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
        </svg>
        Bài viết liên quan
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {posts.map((post) => (
          <button
            key={post._id}
            onClick={() => navigate(`/posts/${post._id}`)}
            className="text-left bg-surface-container-lowest rounded-xl border border-outline-variant p-4 hover:border-primary hover:shadow-md transition-all duration-200 group"
          >
            {/* Thumbnail nhỏ nếu có ảnh */}
            {post.images && post.images.length > 0 && (
              <img
                src={post.images[0]}
                alt=""
                className="w-full h-28 object-cover rounded-lg mb-3 bg-surface-container-low"
                loading="lazy"
              />
            )}

            {/* Title */}
            <h4 className="font-semibold text-on-surface font-body-md text-body-md leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">
              {post.title}
            </h4>

            {/* Tags + Stats */}
            <div className="flex items-center justify-between mt-2 font-body-sm text-body-sm text-outline">
              <div className="flex gap-1.5 flex-wrap">
                {post.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-surface-container-low text-secondary font-label-mono text-label-mono">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {post.viewCount}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
