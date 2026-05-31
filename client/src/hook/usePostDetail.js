import { useState, useEffect, useCallback } from 'react';
import { getPostDetail, votePost, getRelatedPosts, createPostComment, reactPostComment } from '../services/postService';

export default function usePostDetail(postId) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);

  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [reactingCommentId, setReactingCommentId] = useState('');

  const [relatedPosts, setRelatedPosts] = useState([]);

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

  const fetchRelatedPosts = useCallback(async () => {
    if (!post || !post.tags || post.tags.length === 0) return;

    try {
      const firstTag = post.tags[0];
      const response = await getRelatedPosts(firstTag, postId);
      setRelatedPosts(response.data.data || []);
    } catch {
      setRelatedPosts([]);
    }
  }, [post, postId]);

  const handleVote = useCallback(async (voteType) => {
    if (voteLoading) return;

    setVoteLoading(true);
    try {
      const effectiveVoteType = userVote && userVote !== voteType ? userVote : voteType;
      const response = await votePost(postId, effectiveVoteType);
      const { upvoteCount: up, downvoteCount: down, userVote: vote } = response.data.data;

      setUpvoteCount(up);
      setDownvoteCount(down);
      setUserVote(vote);
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Bạn cần đăng nhập để vote bài viết.');
      }
    } finally {
      setVoteLoading(false);
    }
  }, [postId, voteLoading, userVote]);

  const submitComment = useCallback(async ({ content, parentComment = null }) => {
    if (submittingComment) return false;

    setSubmittingComment(true);
    setCommentError('');

    try {
      await createPostComment(postId, { content, parentComment });
      await fetchPostDetail();
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể gửi bình luận.';
      setCommentError(message);
      return false;
    } finally {
      setSubmittingComment(false);
    }
  }, [postId, submittingComment, fetchPostDetail]);

  const reactComment = useCallback(async (commentId, reactionType) => {
    if (reactingCommentId) return false;

    setReactingCommentId(commentId);
    try {
      await reactPostComment(commentId, reactionType);
      await fetchPostDetail();
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Bạn cần đăng nhập để like/dislike bình luận.');
      } else {
        alert(err.response?.data?.message || 'Không thể cập nhật like/dislike bình luận.');
      }
      return false;
    } finally {
      setReactingCommentId('');
    }
  }, [reactingCommentId, fetchPostDetail]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  useEffect(() => {
    fetchRelatedPosts();
  }, [fetchRelatedPosts]);

  return {
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
    submitComment,
    submittingComment,
    commentError,
    reactComment,
    reactingCommentId,
    relatedPosts,
    refreshPost: fetchPostDetail,
  };
}
