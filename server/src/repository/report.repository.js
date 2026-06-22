import ReportTicket from '../model/reportTicket.model.js';

class ReportRepository {
  async create(payload) {
    return ReportTicket.create(payload);
  }

  async findById(ticketId) {
    return ReportTicket.findById(ticketId)
      .populate('reporter', 'fullName avatar')
      .populate('post', 'title status author')
      .populate({
        path: 'comment',
        select: 'content author post',
        populate: { path: 'author', select: 'fullName email avatar' }
      })
      .populate('history.actor', 'fullName');
  }

  async findByReporter(reporterId) {
    return ReportTicket.find({ reporter: reporterId })
      .populate('post', 'title status')
      .populate({
        path: 'comment',
        select: 'content author post',
        populate: { path: 'author', select: 'fullName email avatar' }
      })
      .sort({ createdAt: -1 });
  }

  async findForAdmin(filters = {}) {
    const query = {};
    const bufferLimit = new Date(Date.now() - 30 * 60 * 1000);

    if (filters.status) {
      if (filters.status === 'submitted') {
        query.status = 'submitted';
        query.createdAt = { $lte: bufferLimit };
      } else if (filters.status === 'received') {
        query.$or = [
          { status: 'received' },
          { status: 'submitted', createdAt: { $lte: bufferLimit } }
        ];
      } else {
        query.status = filters.status;
      }
    } else {
      query.$or = [
        { status: { $ne: 'submitted' } },
        { status: 'submitted', createdAt: { $lte: bufferLimit } }
      ];
    }

    if (filters.flagType) query.flagType = filters.flagType;

    return ReportTicket.find(query)
      .populate('reporter', 'fullName email avatar')
      .populate('post', 'title status author')
      .populate({
        path: 'comment',
        select: 'content author post',
        populate: { path: 'author', select: 'fullName email avatar' }
      })
      .sort({ createdAt: -1 });
  }

  async findByPost(postId) {
    return ReportTicket.find({ post: postId }).sort({ createdAt: -1 });
  }

  async findByPostForOwner(postId) {
    return ReportTicket.find({ post: postId })
      .populate('reporter', 'fullName avatar')
      .sort({ createdAt: -1 });
  }

  async findExistingFlag(postId, reporterId, flagType) {
    return ReportTicket.findOne({ post: postId, reporter: reporterId, flagType });
  }

  async findExistingCommentFlag(commentId, reporterId, flagType) {
    return ReportTicket.findOne({ comment: commentId, reporter: reporterId, flagType });
  }

  async countActiveByFlagType(postId, flagType) {
    return ReportTicket.countDocuments({
      post: postId,
      flagType,
      status: { $in: ['submitted', 'received'] },
    });
  }

  async countActiveCommentByFlagType(commentId, flagType) {
    return ReportTicket.countDocuments({
      comment: commentId,
      flagType,
      status: { $in: ['submitted', 'received'] },
    });
  }

  async bulkMarkActionTakenByPost(postId, note) {
    return ReportTicket.updateMany(
      {
        post: postId,
        status: { $in: ['submitted', 'received'] },
      },
      {
        $set: { status: 'action_taken', outcome: 'helpful' },
        $push: {
          history: {
            status: 'action_taken',
            note,
            actorRole: 'system',
            actor: null,
          },
        },
      },
    );
  }

  async bulkMarkActionTakenByComment(commentId, note) {
    return ReportTicket.updateMany(
      {
        comment: commentId,
        status: { $in: ['submitted', 'received'] },
      },
      {
        $set: { status: 'action_taken', outcome: 'helpful' },
        $push: {
          history: {
            status: 'action_taken',
            note,
            actorRole: 'system',
            actor: null,
          },
        },
      },
    );
  }

  async updateById(ticketId, updates) {
    return ReportTicket.findByIdAndUpdate(ticketId, updates, { new: true })
      .populate('reporter', 'fullName avatar')
      .populate('post', 'title status author')
      .populate({
        path: 'comment',
        select: 'content author post',
        populate: { path: 'author', select: 'fullName email avatar' }
      })
      .populate('history.actor', 'fullName');
  }
}

export default new ReportRepository();
