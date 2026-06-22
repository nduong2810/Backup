import { validationResult } from 'express-validator';
import postService from '../service/post.service.js';
import Post from '../model/post.model.js';
import User from '../model/user.model.js';
import notificationService from '../service/notification.service.js';

const ADMIN_INTERACTION_MESSAGE = 'Quản trị viên không được phép thực hiện tương tác này.';

const safeNotifyFreeVote = async ({ postId, voterId, result }) => {
  try {
    if (!['upvote', 'downvote'].includes(result?.userVote)) return;

    // Vote của người dưới 15 uy tín là free vote, không đi qua reputationService.award.
    // Tạo notification tại đây để chủ bài vẫn nhận thông báo.
    if (Number(result?.userReputation || 0) >= 15) return;

    const [post, voter] = await Promise.all([
      Post.findById(postId).select('title author status isAuthorActive').lean(),
      User.findById(voterId).select('fullName email avatar').lean(),
    ]);

    const authorId = post?.author?._id?.toString() || post?.author?.toString();
    if (!post || !voter || !authorId || String(authorId) === String(voterId)) return;

    await notificationService.createPostVoteNotification({
      recipientId: authorId,
      sender: voter,
      post,
      voteType: result.userVote,
    });
  } catch (error) {
    console.error('[PostVoteController] free vote notification failed:', error.message || error);
  }
};

class PostVoteController {
  checkValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
  }

  async votePost(req, res) {
    const validationError = this.checkValidationErrors(req, res);
    if (validationError) return validationError;

    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: ADMIN_INTERACTION_MESSAGE });
    }

    try {
      const result = await postService.toggleVote(req.params.id, req.user.userId, req.body.voteType);
      await safeNotifyFreeVote({ postId: req.params.id, voterId: req.user.userId, result });
      return res.status(200).json({ success: true, message: 'Vote thành công', data: result });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

export default new PostVoteController();