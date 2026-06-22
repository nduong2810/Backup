import crypto from 'crypto';
import qs from 'qs';
import mongoose from 'mongoose';
import donationRepository from '../repository/donation.repository.js';
import userRepository from '../repository/user.repository.js';
import Post from '../model/post.model.js';
import Comment from '../model/comment.model.js';
import DonationTransaction from '../model/donationTransaction.model.js';
import sendEmail from '../util/email.util.js';
import env from '../config/environment.js';
import reputationService from './reputation.service.js';
import notificationService from './notification.service.js';

const SUPPORTED_AMOUNTS = new Set([20000, 50000, 100000]);
const DONATION_STATUS_VALUES = ['pending_review', 'pending_payment', 'completed', 'rejected'];
const PAYMENT_METHOD_VALUES = ['cod', 'vnpay'];
const isMongoId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return isMongoId(value) ? value.trim() : '';
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  if (typeof value?.toHexString === 'function') return value.toHexString();
  if (typeof value === 'object') {
    if (typeof value._id === 'string' && isMongoId(value._id)) return value._id.trim();
    if (value._id instanceof mongoose.Types.ObjectId) return value._id.toHexString();
    if (typeof value.id === 'string' && isMongoId(value.id)) return value.id.trim();
    if (typeof value.$oid === 'string' && isMongoId(value.$oid)) return value.$oid.trim();
  }
  return '';
};

const pickText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const buildSnapshot = (doc = {}) => ({
  fullName: pickText(doc.fullName, doc.name, doc.username),
  avatar: pickText(doc.avatar),
  major: pickText(doc.major),
});

const hasBankTransferInfo = (user = {}) => Boolean(
  pickText(user.bankName) && pickText(user.bankAccountNumber),
);

const getRawBankTransferInfo = async (userId) => {
  const safeUserId = normalizeId(userId);
  if (!isMongoId(safeUserId)) return null;

  return await mongoose.connection.collection('users').findOne(
    { _id: new mongoose.Types.ObjectId(safeUserId) },
    { projection: { bankName: 1, bankAccountNumber: 1, fullName: 1 } },
  );
};

const normalizeEmail = (value = {}) => {
  if (typeof value === 'string') return value.includes('@') ? value.trim().toLowerCase() : '';
  return pickText(value.email, value.authorEmail, value.userEmail).toLowerCase();
};

const normalizeFullName = (value = {}) => {
  if (typeof value === 'string') return value.trim();
  return pickText(value.fullName, value.name, value.displayName);
};

const normalizeUsername = (value = {}) => {
  if (typeof value === 'string') return value.trim();
  return pickText(value.username, value.userName, value.slug);
};

const buildLegacyEmail = (candidate = {}) => {
  const username = normalizeUsername(candidate) || normalizeFullName(candidate) || 'legacy-author';
  const safeUsername = username
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'legacy-author';

  return `${safeUsername}@legacy.itforum.local`;
};

const formatVnpayDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const sortObjectForVnpay = (object) => {
  const sorted = {};
  Object.keys(object).sort().forEach((key) => {
    sorted[encodeURIComponent(key)] = encodeURIComponent(String(object[key])).replace(/%20/g, '+');
  });
  return sorted;
};

const safeNotify = async (email, subject, message) => {
  if (!email || !env.EMAIL_USER || !env.EMAIL_PASS) return;
  try {
    await sendEmail(email, subject, message);
  } catch (error) {
    console.error('[DonationService] Email notification failed:', error.message);
  }
};

const formatDonationAmount = (donation = {}) => Number(donation.amount || 0).toLocaleString('vi-VN');

const getDonationTitle = (donation = {}) => donation.postSnapshot?.title || donation.post?.title || 'IT Forum';

const getDonationDonorName = (donation = {}) => (
  donation.donorSnapshot?.fullName
  || donation.donor?.fullName
  || 'bạn'
);

const safeNotifyCodDonorApproval = async (donation) => {
  const donorEmail = normalizeEmail(donation?.donor);
  if (!donorEmail) return;

  const amount = formatDonationAmount(donation);
  const postTitle = getDonationTitle(donation);
  const donorName = getDonationDonorName(donation);

  await safeNotify(
    donorEmail,
    'Bill chuyển khoản của bạn đã được duyệt',
    `Xin chào ${donorName},\n\nGiao dịch chuyển khoản ${amount}đ cho bài viết "${postTitle}" đã được admin duyệt thành công.\n\nCảm ơn bạn đã ủng hộ tác giả trên IT Forum.\n\nTrân trọng,\nIT Forum`,
  );
};

const safeNotifyCodDonorRejection = async (donation, reason = '') => {
  const donorEmail = normalizeEmail(donation?.donor);
  if (!donorEmail) return;

  const amount = formatDonationAmount(donation);
  const postTitle = getDonationTitle(donation);
  const donorName = getDonationDonorName(donation);
  const cleanReason = pickText(reason) || 'Bill chuyển khoản chưa đủ điều kiện để duyệt.';

  await safeNotify(
    donorEmail,
    'Bill chuyển khoản của bạn chưa được duyệt',
    `Xin chào ${donorName},\n\nGiao dịch chuyển khoản ${amount}đ cho bài viết "${postTitle}" chưa được admin duyệt.\n\nLý do: ${cleanReason}\n\nBạn có thể kiểm tra lại bill chuyển khoản hoặc liên hệ admin để được hỗ trợ thêm.\n\nTrân trọng,\nIT Forum`,
  );
};

const safeCreateDonationApprovalNotification = async ({ donation, adminId }) => {
  try {
    const donorId = donation?.donor?._id?.toString() || donation?.donor?.toString();
    const postId = donation?.post?._id?.toString() || donation?.post?.toString();

    if (!donorId || !adminId || !postId) return;

    await notificationService.createDonationApprovedNotification({
      donorId,
      adminId,
      post: postId,
      donation,
    });
  } catch (error) {
    console.error('[DonationService] Donation approval notification failed:', error.message);
  }
};

const safeCreateDonationRejectionNotification = async ({ donation, adminId, reason }) => {
  try {
    const donorId = donation?.donor?._id?.toString() || donation?.donor?.toString();
    const postId = donation?.post?._id?.toString() || donation?.post?.toString();

    if (!donorId || !adminId || !postId) return;

    await notificationService.createDonationRejectedNotification({
      donorId,
      adminId,
      post: postId,
      donation,
      reason,
    });
  } catch (error) {
    console.error('[DonationService] Donation rejection notification failed:', error.message);
  }
};

const normalizeStatusFilter = (value = '') => {
  const status = String(value || '').trim();
  return DONATION_STATUS_VALUES.includes(status) ? status : '';
};

const normalizePaymentMethodFilter = (value = '') => {
  const paymentMethod = String(value || '').trim();
  return PAYMENT_METHOD_VALUES.includes(paymentMethod) ? paymentMethod : '';
};

const parseDateOnly = (value, endOfDay = false) => {
  const text = String(value || '').trim();
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const buildMonthlyTimeline = (rawTimeline = [], fromDate, toDate = new Date()) => {
  const from = fromDate || new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const to = toDate || new Date();
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const result = [];

  let cursor = start;
  let index = 0;
  while (cursor <= end && index < 36) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const found = rawTimeline.find((item) => item._id?.year === year && item._id?.month === month);
    result.push({
      year,
      month,
      label: `T${month}/${year}`,
      totalAmount: found?.totalAmount || 0,
      completedAmount: found?.completedAmount || 0,
      donationCount: found?.donationCount || 0,
      completedCount: found?.completedCount || 0,
    });
    cursor = new Date(year, month, 1);
    index += 1;
  }

  return result;
};

const populateDonation = (query) => query
  .populate('donor', 'fullName avatar major email')
  .populate('author', 'fullName avatar major email')
  .populate('post', 'title')
  .populate('answer', 'content');

class DonationService {
  async resolveAuthor(authorId, ...candidates) {
    const directAuthorId = normalizeId(authorId);
    if (isMongoId(directAuthorId)) {
      const author = await userRepository.findById(directAuthorId);
      if (author) return author;
    }

    for (const candidate of candidates) {
      const candidateId = normalizeId(candidate);
      if (isMongoId(candidateId)) {
        const author = await userRepository.findById(candidateId);
        if (author) return author;
      }

      const candidateEmail = normalizeEmail(candidate);
      if (candidateEmail) {
        const author = await userRepository.findByEmail(candidateEmail);
        if (author) return author;
      }

      const candidateUsername = normalizeUsername(candidate);
      if (candidateUsername && typeof userRepository.findByUsername === 'function') {
        const author = await userRepository.findByUsername(candidateUsername);
        if (author) return author;
      }

      const candidateFullName = normalizeFullName(candidate);
      if (candidateFullName && candidateFullName !== candidateUsername && typeof userRepository.findByFullName === 'function') {
        const author = await userRepository.findByFullName(candidateFullName);
        if (author) return author;
      }
    }

    for (const candidate of candidates) {
      const fullName = normalizeFullName(candidate);
      const username = normalizeUsername(candidate);
      const avatar = typeof candidate === 'object' ? pickText(candidate.avatar) : '';
      if (!fullName && !username) continue;

      const legacyEmail = normalizeEmail(candidate) || buildLegacyEmail(candidate);
      let existingAuthor = await userRepository.findByEmail(legacyEmail);
      if (existingAuthor) return existingAuthor;

      try {
        return await userRepository.createUser({
          fullName: fullName || username || 'Tác giả',
          email: legacyEmail,
          username: username || undefined,
          password: crypto.randomBytes(24).toString('hex'),
          role: 'user',
          isActive: true,
          avatar: avatar || 'default-avatar.png',
          major: typeof candidate === 'object' ? pickText(candidate.major) : '',
          bio: 'Tài khoản tác giả tự động tạo từ dữ liệu bài viết cũ.',
        });
      } catch (error) {
        existingAuthor = await userRepository.findByEmail(legacyEmail);
        if (existingAuthor) return existingAuthor;
        console.error('[DonationService] Cannot create legacy author:', error.message);
      }
    }

    return null;
  }

  async getAdminDonations(query = {}) {
    const status = normalizeStatusFilter(query.status);
    const paymentMethod = normalizePaymentMethodFilter(query.paymentMethod);
    const limit = query.limit || 100;
    return await donationRepository.findAdminDonations({ status, paymentMethod, limit });
  }

  async getAllAdminDonations(query = {}) {
    const status = normalizeStatusFilter(query.status);
    const paymentMethod = normalizePaymentMethodFilter(query.paymentMethod);
    const keyword = String(query.keyword || '').trim();
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(5, Number.parseInt(query.limit, 10) || 10));
    const now = new Date();
    const defaultTimelineFromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const fromDate = parseDateOnly(query.fromDate || query.startDate);
    const toDate = parseDateOnly(query.toDate || query.endDate, true);

    if ((query.fromDate || query.startDate) && !fromDate) {
      throw { status: 400, message: 'Ngày bắt đầu không hợp lệ. Định dạng đúng là YYYY-MM-DD.' };
    }

    if ((query.toDate || query.endDate) && !toDate) {
      throw { status: 400, message: 'Ngày kết thúc không hợp lệ. Định dạng đúng là YYYY-MM-DD.' };
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw { status: 400, message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' };
    }

    const timelineFromDate = fromDate || defaultTimelineFromDate;
    const timelineToDate = toDate || now;

    const result = await donationRepository.findAllAdminDonations({
      status,
      paymentMethod,
      keyword,
      page,
      limit,
      startDate: defaultTimelineFromDate,
      fromDate,
      toDate,
    });

    return {
      ...result,
      filters: {
        status,
        paymentMethod,
        keyword,
        fromDate: fromDate ? fromDate.toISOString() : '',
        toDate: toDate ? toDate.toISOString() : '',
      },
      dateRange: {
        fromDate: fromDate ? fromDate.toISOString() : '',
        toDate: toDate ? toDate.toISOString() : '',
        isCustom: Boolean(fromDate || toDate),
      },
      timeline: buildMonthlyTimeline(result.timeline, timelineFromDate, timelineToDate),
    };
  }

  async createCheckout(donorId, payload) {
    const amount = Number(payload.amount);
    const postId = normalizeId(payload.postId);
    const authorId = normalizeId(payload.authorId);
    const answerId = normalizeId(payload.answerId);
    const paymentMethod = String(payload.paymentMethod || '').trim();
    const note = String(payload.note || '').trim();
    const billImage = payload.billImage || '';

    if (!SUPPORTED_AMOUNTS.has(amount)) throw { status: 400, message: 'Chỉ hỗ trợ các mức 20K, 50K, 100K' };
    if (!isMongoId(donorId)) throw { status: 401, message: 'Phiên đăng nhập không hợp lệ' };
    if (!isMongoId(postId)) throw { status: 400, message: 'ID bài viết không hợp lệ' };

    const [donor, currentPost] = await Promise.all([
      userRepository.findById(donorId),
      Post.findById(postId).select('author title status').lean(),
    ]);

    if (!donor) throw { status: 404, message: 'Người donate không tồn tại' };
    if (!currentPost) throw { status: 404, message: 'Bài viết không tồn tại' };
    if (currentPost.status === 'resolved' || currentPost.status === 'closed') throw { status: 423, message: 'Bài viết đang bị khóa' };
    if (currentPost.status === 'hidden') throw { status: 403, message: 'Bài viết đang bị ẩn' };
    if (currentPost.status === 'deleted') throw { status: 410, message: 'Bài viết đã bị xóa' };

    let answer = null;
    let authorCandidate = currentPost.author;

    if (answerId) {
      answer = await Comment.findById(answerId).select('content author post').lean();
      if (!answer) throw { status: 404, message: 'Câu trả lời không tồn tại' };
      if (normalizeId(answer.post) !== normalizeId(currentPost._id)) {
        throw { status: 400, message: 'Câu trả lời không thuộc bài viết này' };
      }
      authorCandidate = answer.author;
    }

    const author = await this.resolveAuthor(authorId, authorCandidate, currentPost.author, answer?.author);
    if (!author) throw { status: 400, message: 'Không xác định được tác giả để ủng hộ.' };

    if (paymentMethod === 'cod') {
      const rawTransferInfo = hasBankTransferInfo(author)
        ? author
        : await getRawBankTransferInfo(author._id);

      if (!hasBankTransferInfo(rawTransferInfo)) {
        throw {
          status: 400,
          message: 'Tác giả chưa cập nhật thông tin nhận chuyển khoản nên chưa thể dùng phương thức chuyển khoản thủ công.',
        };
      }

      if (!billImage) {
        throw { status: 400, message: 'Bạn cần tải ảnh bill chuyển khoản trước khi gửi giao dịch thủ công.' };
      }
    }

    const basePayload = {
      donor: donor._id,
      author: author._id,
      post: currentPost._id,
      answer: answer?._id || null,
      amount,
      paymentMethod,
      note,
      billImage: billImage || '',
      donorSnapshot: buildSnapshot(donor),
      authorSnapshot: buildSnapshot(author),
      postSnapshot: { title: currentPost.title || '' },
      answerSnapshot: { content: answer?.content || '' },
    };

    if (paymentMethod === 'cod') {
      const donation = await donationRepository.createDonation({ ...basePayload, status: 'pending_review' });
      return { donation, paymentUrl: '', message: 'Giao dịch đã được tạo. Đang chờ admin duyệt bill.' };
    }

    if (paymentMethod === 'vnpay') return await this._createVnpayCheckout(basePayload);
    throw { status: 400, message: 'Phương thức thanh toán không hợp lệ' };
  }

  async _createVnpayCheckout(basePayload) {
    const { amount } = basePayload;
    if (!env.VNPAY_TMN_CODE || !env.VNPAY_HASH_SECRET || !env.VNPAY_URL || !env.VNPAY_RETURN_URL) {
      throw { status: 400, message: 'Sandbox VNPAY chưa được cấu hình trên server' };
    }

    const txnRef = `donation_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: env.VNPAY_TMN_CODE.trim(),
      vnp_Amount: String(Math.round(amount * 100)),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan ${txnRef}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: env.VNPAY_RETURN_URL.trim(),
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: formatVnpayDate(new Date()),
      vnp_ExpireDate: formatVnpayDate(new Date(Date.now() + 15 * 60 * 1000)),
    };

    const sortedParams = sortObjectForVnpay(params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const secureHash = crypto.createHmac('sha512', env.VNPAY_HASH_SECRET.trim()).update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams.vnp_SecureHash = secureHash;
    const paymentUrl = `${env.VNPAY_URL.trim()}?${qs.stringify(sortedParams, { encode: false })}`;

    const donation = await donationRepository.createDonation({
      ...basePayload,
      status: 'pending_payment',
      paymentUrl,
      orderId: txnRef,
      requestId: txnRef,
      gatewayResponse: { provider: 'vnpay', paymentUrl },
    });

    return { donation, paymentUrl, message: 'Đã tạo link thanh toán VNPAY sandbox' };
  }

  async confirmVnpayPayment({ transactionId, txnRef, responseCode, message = '', amount }) {
    const donation = transactionId
      ? await donationRepository.findById(transactionId)
      : await donationRepository.findByOrderId(txnRef);

    if (!donation) throw { status: 404, message: 'Không tìm thấy giao dịch' };
    if (donation.paymentMethod !== 'vnpay') throw { status: 400, message: 'Chỉ xác nhận được giao dịch VNPAY' };

    const gatewayResponse = { ...(donation.gatewayResponse || {}), responseCode, message, amount };

    if (String(responseCode) === '00') {
      const updatedDonation = await populateDonation(DonationTransaction.findOneAndUpdate(
        { _id: donation._id, paymentMethod: 'vnpay', status: 'pending_payment' },
        {
          $set: {
            status: 'completed',
            completedAt: donation.completedAt || new Date(),
            gatewayResponse,
          },
        },
        { new: true },
      ));

      if (!updatedDonation) {
        const latestDonation = await donationRepository.findById(donation._id);
        if (latestDonation?.status === 'completed') return latestDonation;
        throw {
          status: 409,
          message: `Giao dịch đã ở trạng thái ${latestDonation?.status || donation.status || 'không xác định'}, không thể xác nhận lại`,
        };
      }

      const authorId = updatedDonation.author?._id?.toString() || updatedDonation.author?.toString();
      if (authorId) {
        await reputationService.award(authorId, 'donate_received', updatedDonation._id);
      }
      await safeNotify(
        updatedDonation.author?.email,
        'Bạn vừa nhận được một lượt ủng hộ',
        `Bài viết "${updatedDonation.postSnapshot?.title || 'IT Forum'}" vừa nhận ${updatedDonation.amount.toLocaleString('vi-VN')}đ từ một người dùng.`,
      );
      return updatedDonation;
    }

    const rejectedDonation = await populateDonation(DonationTransaction.findOneAndUpdate(
      { _id: donation._id, paymentMethod: 'vnpay', status: 'pending_payment' },
      {
        $set: {
          status: 'rejected',
          rejectedAt: new Date(),
          gatewayResponse,
        },
      },
      { new: true },
    ));

    if (rejectedDonation) return rejectedDonation;

    const latestDonation = await donationRepository.findById(donation._id);
    if (latestDonation?.status === 'completed') return latestDonation;
    throw {
      status: 409,
      message: `Giao dịch đã ở trạng thái ${latestDonation?.status || donation.status || 'không xác định'}, không thể xác nhận lại`,
    };
  }

  async approveCodDonation(donationId, adminId) {
    if (!isMongoId(donationId)) throw { status: 400, message: 'ID giao dịch không hợp lệ' };

    const updatedDonation = await populateDonation(DonationTransaction.findOneAndUpdate(
      { _id: donationId, paymentMethod: 'cod', status: 'pending_review' },
      {
        $set: {
          status: 'completed',
          approvedBy: adminId,
          approvedAt: new Date(),
          completedAt: new Date(),
        },
      },
      { new: true },
    ));

    if (!updatedDonation) {
      const latestDonation = await donationRepository.findById(donationId);

      if (!latestDonation) {
        throw { status: 404, message: 'Không tìm thấy giao dịch' };
      }

      if (latestDonation.paymentMethod !== 'cod') {
        throw { status: 400, message: 'Chỉ duyệt được giao dịch chuyển khoản thủ công' };
      }

      throw {
        status: 409,
        message: `Giao dịch đã ở trạng thái ${latestDonation.status || 'không xác định'}, không thể duyệt lại`,
      };
    }

    const authorId = updatedDonation.author?._id?.toString() || updatedDonation.author?.toString();
    if (authorId) {
      await reputationService.award(authorId, 'donate_received', updatedDonation._id);
    }

    await safeNotify(updatedDonation.author?.email, 'Một lượt ủng hộ vừa được duyệt', `Bill chuyển khoản cho bài viết "${updatedDonation.postSnapshot?.title || 'IT Forum'}" vừa được admin duyệt với số tiền ${updatedDonation.amount.toLocaleString('vi-VN')}đ.`);
    await safeNotifyCodDonorApproval(updatedDonation);
    await safeCreateDonationApprovalNotification({ donation: updatedDonation, adminId });
    return updatedDonation;
  }

  async rejectCodDonation(donationId, adminId, reasonInput = '') {
    if (!isMongoId(donationId)) throw { status: 400, message: 'ID giao dịch không hợp lệ' };

    const reason = pickText(reasonInput) || 'Admin không duyệt bill chuyển khoản';
    const rejectedAt = new Date();
    const updatedDonation = await populateDonation(DonationTransaction.findOneAndUpdate(
      { _id: donationId, paymentMethod: 'cod', status: 'pending_review' },
      {
        $set: {
          status: 'rejected',
          rejectedAt,
          approvedBy: adminId,
          gatewayResponse: {
            rejectReason: reason,
            rejectedBy: adminId,
            rejectedAt,
          },
        },
      },
      { new: true },
    ));

    if (!updatedDonation) {
      const latestDonation = await donationRepository.findById(donationId);

      if (!latestDonation) {
        throw { status: 404, message: 'Không tìm thấy giao dịch' };
      }

      if (latestDonation.paymentMethod !== 'cod') {
        throw { status: 400, message: 'Chỉ từ chối được giao dịch chuyển khoản thủ công' };
      }

      throw {
        status: 409,
        message: `Giao dịch đã ở trạng thái ${latestDonation.status || 'không xác định'}, không thể từ chối lại`,
      };
    }

    await safeNotifyCodDonorRejection(updatedDonation, reason);
    await safeCreateDonationRejectionNotification({ donation: updatedDonation, adminId, reason });
    return updatedDonation;
  }

  async getAuthorDonationProfile(authorId) {
    const [author, donations, summary] = await Promise.all([
      userRepository.findById(authorId),
      donationRepository.findReceivedByAuthor(authorId, 20),
      donationRepository.getReceivedSummary(authorId),
    ]);
    if (!author) throw { status: 404, message: 'Tác giả không tồn tại' };
    return { author, donationSummary: { totalAmount: summary.totalAmount || 0, donationCount: summary.donationCount || 0 }, donations };
  }
}

export default new DonationService();