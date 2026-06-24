import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPostDetailSidebarData } from '../../services/postService';

const getItemId = (item, index) => item?._id || item?.id || item?.slug || item?.title || `hot-question-${index}`;
const getTagName = (item) => item?.tag || item?.name || item?._id || '';

const PostDetailRightSidebar = () => {
  const [hotQuestions, setHotQuestions] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSidebarData = async () => {
      try {
        setLoading(true);
        const response = await getPostDetailSidebarData();
        const data = response?.data?.data || {};

        if (!mounted) return;
        setHotQuestions(Array.isArray(data.hotQuestions) ? data.hotQuestions : []);
        setPopularTags(Array.isArray(data.popularTags) ? data.popularTags : []);
      } catch (error) {
        if (!mounted) return;
        setHotQuestions([]);
        setPopularTags([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSidebarData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-stack-lg pb-12">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm overflow-hidden">
        <div className="bg-surface-container-low border-b border-outline-variant px-4 py-3">
          <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Câu hỏi nổi bật</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {loading && <p className="text-secondary font-body-sm text-body-sm">Đang tải...</p>}
          {!loading && hotQuestions.length === 0 && (
            <p className="text-secondary font-body-sm text-body-sm">Chưa có dữ liệu.</p>
          )}
          {hotQuestions.map((item, index) => {
            const itemId = getItemId(item, index);
            return (
              <Link
                key={`hot-${itemId}-${index}`}
                to={`/posts/${item?._id || item?.id || itemId}`}
                className="font-body-sm text-body-sm text-primary hover:underline leading-5 break-words"
              >
                {item?.title || 'Không có tiêu đề'}
              </Link>
            );
          })}
        </div>
      </div>
 
      <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm overflow-hidden">
        <div className="bg-surface-container-low border-b border-outline-variant px-4 py-3">
          <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Thẻ phổ biến</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {loading && <p className="text-secondary font-body-sm text-body-sm">Đang tải...</p>}
          {!loading && popularTags.length === 0 && (
            <p className="text-secondary font-body-sm text-body-sm">Chưa có dữ liệu.</p>
          )}
          {popularTags.map((item, index) => {
            const tag = getTagName(item);
            if (!tag) return null;
            return (
              <div key={`tag-${tag}-${index}`} className="flex items-center justify-between">
                <Link
                  to={`/home?tags=${encodeURIComponent(tag)}`}
                  className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 max-w-[180px] truncate"
                  title={`Lọc bài viết theo tag: ${tag}`}
                >
                  {tag}
                </Link>
                <span className="font-body-sm text-body-sm text-secondary">x {item?.count || 0}</span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default PostDetailRightSidebar;
