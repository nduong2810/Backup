import ReportTicket from '../model/reportTicket.model.js';

class ReportRepository {
  async create(payload) {
    return ReportTicket.create(payload);
  }

  async findById(ticketId) {
    return ReportTicket.findById(ticketId)
      .populate('reporter', 'fullName avatar')
      .populate('post', 'title status author')
      .populate('history.actor', 'fullName');
  }

  async findByReporter(reporterId) {
    return ReportTicket.find({ reporter: reporterId })
      .populate('post', 'title status')
      .sort({ createdAt: -1 });
  }

  async findForAdmin(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.flagType) query.flagType = filters.flagType;

    return ReportTicket.find(query)
      .populate('reporter', 'fullName email avatar')
      .populate('post', 'title status author')
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

  async countActiveByFlagType(postId, flagType) {
    return ReportTicket.countDocuments({
      post: postId,
      flagType,
      status: { $in: ['submitted', 'received', 'in_review'] },
    });
  }

  async bulkMarkActionTakenByPost(postId, note) {
    return ReportTicket.updateMany(
      {
        post: postId,
        status: { $in: ['submitted', 'received', 'in_review'] },
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
      .populate('history.actor', 'fullName');
  }
}

export default new ReportRepository();
