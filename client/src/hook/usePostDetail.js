import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getPostDetail,
  votePost,
  reactPost,
  getRelatedPosts,
  createPostComment,
  reactPostComment,
  deleteCommentApi,
} from '../services/postService';
import { connectSocket, getSocket } from '../lib/socketClient';
import { useToast } from '../context/ToastContext';

const LOCKED_POST_MESSAGE = 'Bài viết đang bị khóa';
const ADMIN_INTERACTION_MESSAGE = 'Quản trị viên không được phép thực hiện tương tác này.';

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

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [reactingCommentId, setReactingCommentId] = useState('');

  const [relatedPosts, setRelatedPosts] = useState([]);

  const { user: currentUser } = useSelector((state) => state.login);
  const isAdmin = currentUser?.role === 'admin';
  const { toast } = useToast();

  const isPostLocked = post?.status === 'resolved';

  const fetchPostDetail = useCallback(async (showLoading = true) => {
    if (!postId) return;

    if (showLoading) {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await getPostDetail(postId);
      const {
        post: postData,
        comments: commentsData,
        commentCount: count,
      } = response.data.data;

      setPost(postData);
      setComments(commentsData);
      setCommentCount(count);
      setUpvoteCount(postData.upvoteCount || 0);
      setDownvoteCount(postData.downvoteCount || 0);
      setUserVote(postData.userVote || null);
      setLikeCount(postData.likeCount || postData.likes?.length || 0);
      setDislikeCount(postData.dislikeCount || postData.dislikes?.length || 0);
      setUserReaction(postData.userReaction || null);
      setCommentError(postData.status === 'resolved' ? LOCKED_POST_MESSAGE : '');
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể tải bài viết.';
      setError(message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
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

    if (isAdmin) {
      toast.warning(ADMIN_INTERACTION_MESSAGE);
      return;
    }

    if (isPostLocked) {
      toast.warning(LOCKED_POST_MESSAGE);
      return;
    }

    setVoteLoading(true);

    try {
      const response = await votePost(postId, voteType);
      const {
        upvoteCount: up,
        downvoteCount: down,
        userVote: vote,
      } = response.data.data;

      setUpvoteCount(up);
      setDownvoteCount(down);
      setUserVote(vote);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.warning('Bạn cần đăng nhập để vote bài viết.');
      } else {
        toast.error(err.response?.data?.message || 'Không thể vote bài viết.');
      }
    } finally {
      setVoteLoading(false);
    }
  }, [postId, voteLoading, isPostLocked, isAdmin, toast]);

  const handlePostReaction = useCallback(async (reactionType) => {
    if (reactionLoading) return;

    if (isAdmin) {
      toast.warning(ADMIN_INTERACTION_MESSAGE);
      return;
    }

    if (isPostLocked) {
      toast.warning(LOCKED_POST_MESSAGE);
      return;
    }

    setReactionLoading(true);

    try {
      const response = await reactPost(postId, reactionType);
      const {
        likeCount: likes,
        dislikeCount: dislikes,
        userReaction: reaction,
      } = response.data.data;

      setLikeCount(likes);
      setDislikeCount(dislikes);
      setUserReaction(reaction);

      setPost((currentPost) => currentPost
        ? {
            ...currentPost,
            likeCount: likes,
            dislikeCount: dislikes,
            userReaction: reaction,
          }
        : currentPost);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.warning('Bạn cần đăng nhập để like/dislike bài viết.');
      } else {
        toast.error(err.response?.data?.message || 'Không thể like/dislike bài viết.');
      }
    } finally {
      setReactionLoading(false);
    }
  }, [postId, reactionLoading, isPostLocked, isAdmin, toast]);

  const submitComment = useCallback(async (payload) => {
    if (submittingComment) return false;

    if (isAdmin) {
      toast.warning(ADMIN_INTERACTION_MESSAGE);
      return false;
    }

    if (isPostLocked) {
      setCommentError(LOCKED_POST_MESSAGE);
      return false;
    }

    setSubmittingComment(true);
    setCommentError('');

    try {
      await createPostComment(postId, payload);
      await fetchPostDetail(false);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Không thể gửi bình luận.';
      setCommentError(message);
      return false;
    } finally {
      setSubmittingComment(false);
    }
  }, [postId, submittingComment, fetchPostDetail, isPostLocked, isAdmin, toast]);

  const reactComment = useCallback(async (commentId, reactionType) => {
    if (reactingCommentId) return false;

    if (isAdmin) {
      toast.warning(ADMIN_INTERACTION_MESSAGE);
      return false;
    }

    if (isPostLocked) {
      toast.warning(LOCKED_POST_MESSAGE);
      return false;
    }

    setReactingCommentId(commentId);

    try {
      await reactPostComment(commentId, reactionType);
      await fetchPostDetail(false);
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        toast.warning('Bạn cần đăng nhập để like/dislike bình luận.');
      } else {
        toast.error(err.response?.data?.message || 'Không thể cập nhật like/dislike bình luận.');
      }

      return false;
    } finally {
      setReactingCommentId('');
    }
  }, [reactingCommentId, fetchPostDetail, isPostLocked, isAdmin, toast]);

  const deleteComment = useCallback(async (commentId) => {
    try {
      await deleteCommentApi(commentId);
      toast.success('Xóa bình luận thành công!');
      await fetchPostDetail(false);
      return true;
    } catch (err) {
      console.error('[usePostDetail] Delete comment error:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa bình luận.');
      return false;
    }
  }, [fetchPostDetail, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPostDetail();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchPostDetail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRelatedPosts();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchRelatedPosts]);

  useEffect(() => {
    if (!postId) return undefined;

    const token = localStorage.getItem('accessToken');
    const socket = token ? connectSocket(token) : getSocket();

    if (!socket) return undefined;

    const handleNewComment = (payload) => {
      if (String(payload?.postId) === String(postId)) {
        fetchPostDetail(false);
      }
    };

    socket.emit('post:join', postId);
    socket.on('comment:new', handleNewComment);

    return () => {
      socket.off('comment:new', handleNewComment);
      socket.emit('post:leave', postId);
    };
  }, [postId, fetchPostDetail]);

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
    refreshPost: fetchPostDetail,
    deleteComment,
  };
}