import { Link } from 'react-router-dom';
import SaveIconButton from '../ui/SaveIconButton';

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

export default function PostContent({ post, commentCount, isSaved, onToggleSave }) {
  if (!post) return null;

  return (
    <article className="flex-1 min-w-0 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h1 className="-mt-1 font-headline-xl text-headline-xl text-on-surface leading-tight">
          {post.title}
        </h1>
        <SaveIconButton
          saved={isSaved}
          onClick={onToggleSave}
          className="mt-1"
          title={isSaved ? 'Đã lưu' : 'Lưu'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 font-body-sm text-body-sm text-secondary pb-3 border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Link to={post.author?._id ? `/users/${post.author._id}` : '#'} className="flex items-center gap-2">
            <img
              src={post.author?.avatar && post.author.avatar !== 'default-avatar.png'
                ? post.author.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullName || 'U')}&background=0066cc&color=fff&size=32`
              }
              alt={post.author?.fullName}
              className="w-6 h-6 rounded-full border border-outline-variant"
            />
            <span className="font-medium text-primary-container hover:underline">{post.author?.fullName}</span>
          </Link>
          {post.author?.major && (
            <span className="text-outline">· {post.author.major}</span>
          )}
        </div>

        <span className="text-outline">· {timeAgo(post.createdAt)}</span>

        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <span>{post.viewCount?.toLocaleString()} lượt xem</span>
        </div>

        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span>{commentCount} bình luận</span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="basis-full flex flex-wrap gap-2 pt-1">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-lg font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] border border-outline-variant hover:bg-secondary-fixed/80 transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-on-surface font-body-md text-body-md leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>
    </article>
  );
}
