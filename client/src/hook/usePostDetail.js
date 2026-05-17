import { useState, useEffect, useCallback } from 'react';
import { getPostDetail, votePost, getRelatedPosts } from '../services/postService';

export default function usePostDetail(postId) {
  // === State: Bài viết ===
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === State: Vote ===
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [userVote, setUserVote] = useState(null); // null | 'upvote' | 'downvote'
  const [voteLoading, setVoteLoading] = useState(false);

  // === State: Bài viết liên quan ===
  const [relatedPosts, setRelatedPosts] = useState([]);

  // === Fetch chi tiết bài viết ===
  const fetchPostDetail = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getPostDetail(postId);
      const { post: postData, comments: commentsData, commentCount: count } = response.data.data;

      setPost(postData);
      setComments(commentsData);
      setCommentCount(count);
      setUpvoteCount(postData.upvoteCount || 0);
      setDownvoteCount(postData.downvoteCount || 0);
      setUserVote(postData.userVote || null);
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải bài viết.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // === Fetch bài viết liên quan ===
  const fetchRelatedPosts = useCallback(async () => {
    if (!post || !post.tags || post.tags.length === 0) return;

    try {
      // Lấy bài liên quan theo tag đầu tiên
      const firstTag = post.tags[0];
      const response = await getRelatedPosts(firstTag, postId);
      setRelatedPosts(response.data.data || []);
    } catch {
      // Không hiển thị lỗi nếu related posts fail — không quan trọng
      setRelatedPosts([]);
    }
  }, [post, postId]);

  // === Xử lý Vote (Axios — không reload trang) ===
  const handleVote = useCallback(async (voteType) => {
    if (voteLoading) return;

    setVoteLoading(true);
    try {
      const response = await votePost(postId, voteType);
      const { upvoteCount: up, downvoteCount: down, userVote: vote } = response.data.data;

      // Cập nhật state local ngay lập tức (không reload)
      setUpvoteCount(up);
      setDownvoteCount(down);
      setUserVote(vote);
    } catch (err) {
      // Nếu chưa đăng nhập → thông báo
      if (err.response?.status === 401) {
        alert('Bạn cần đăng nhập để vote bài viết.');
      }
    } finally {
      setVoteLoading(false);
    }
  }, [postId, voteLoading]);

  // === Effects ===
  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  useEffect(() => {
    fetchRelatedPosts();
  }, [fetchRelatedPosts]);

  // === Trả về cho Component ===
  return {
    // Dữ liệu bài viết
    post,
    comments,
    commentCount,

    // Trạng thái
    loading,
    error,

    // Vote
    upvoteCount,
    downvoteCount,
    userVote,
    handleVote,
    voteLoading,

    // Bài viết liên quan
    relatedPosts,

    // Actions
    refreshPost: fetchPostDetail,
  };
}
