import crypto from 'crypto';
import qs from 'qs';
import mongoose from 'mongoose';
import donationRepository from '../repository/donation.repository.js';
import userRepository from '../repository/user.repository.js';
import postRepository from '../repository/post.repository.js';
import commentRepository from '../repository/comment.repository.js';
import Post from '../model/post.model.js';
import sendEmail from '../util/email.util.js';
import env from '../config/environment.js';

const SUPPORTED_AMOUNTS = new Set([20000, 50000, 100000]);

const buildSnapshot = (doc) => ({
  fullName: doc?.fullName || '',
  avatar: doc?.avatar || '',
  major: doc?.major || '',
});

const normalizeId = (value, seen = new WeakSet()) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);

  if (value instanceof mongoose.Types.ObjectId || typeof value.toHexString === 'function') {
    return value.toHexString();
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '';
    seen.add(value);

    if (value.$oid) return normalizeId(value.$oid, seen);
    if (value._id && value._id !== value) return normalizeId(value._id, seen);
    if (typeof value.id === 'string') return value.id.trim();

    if (value.authorId && value.authorId !== value) return normalizeId(value.authorId, seen);
    if (value.userId && value.userId !== value) return normalizeId(value.userId, seen);
    if (value.createdBy && value.createdBy !== value) return normalizeId(value.createdBy, seen);
    if (value.author && value.author !== value) return normalizeId(value.author, seen);
    if (value.user && value.user !== value) return normalizeId(value.user, seen);

    if (typeof value.toString === 'function') {
      const text = value.toString();
      if (text && text !== '[object Object]') return text;
    }
  }

  return '';
};

const normalizeEmail = (value) => {
  if (!value || typeof value !== 'object') return '';
  return String(value.email || value.authorEmail || value.userEmail || '').trim().toLowerCase();
};

const normalizeFullName = (value) => {
  if (!value || typeof value !== 'object') return '';
  return String(value.fullName || value.name || value.displayName || '').trim();
};

const normalizeUsername = (value) => {
  if (!value || typeof value !== 'object') return '';
  return String(value.username || value.userName || value.slug || '').trim();
};

const buildLegacyEmail = (candidate) => {
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

const isMongoId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || '').trim());

const formatVnpayDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
};

const sortObjectForVnpay = (object) => {
  const sorted = {};

  Object.keys(object)
    .sort()
    .forEach((key) => {
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

class DonationService {
  async resolveAuthor(authorId, ...candidates) {
    if (isMongoId(authorId)) {
      const author = await userRepository.findById(authorId);
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

      const candidateFullName = normalizeFullName(candidate);
      if (candidateFullName && typeof userRepository.findByFullName === 'function') {
        const author = await userRepository.findByFullName(candidateFullName);
        if (author) return author;
      }
    }

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') continue;

      const fullName = normalizeFullName(candidate);
      const username = normalizeUsername(candidate);
      const avatar = candidate.avatar || '';

      if (!fullName && !username) continue;

      const legacyEmail = normalizeEmail(candidate) || buildLegacyEmail(candidate);
      let existingAuthor = await userRepository.findByEmail(legacyEmail);

      if (existingAuthor) return existingAuthor;

      try {
        return await userRepository.createUser({
          fullName: fullName || username || 'Tác giả',
          email: legacyEmail,
          password: crypto.randomBytes(24).toString('hex'),
          role: 'user',
          isActive: true,
          avatar: avatar || 'default-avatar.png',
          major: candidate.major || '',
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
    const status = query.status || '';
    const paymentMethod = query.paymentMethod || '';
    const limit = query.limit || 100;

    return await donationRepository.findAdminDonations({ status, paymentMethod, limit });
  }

  async createCheckout(donorId, payload) {
    const amount = Number(payload.amount);
    const { postId, authorId = '', answerId = null, paymentMethod, note = '', billImage = '' } = payload;

    if (!SUPPORTED_AMOUNTS.has(amount)) {
      throw { status: 400, message: 'Chỉ hỗ trợ các mức 20K, 50K, 100K' };
    }

    const [donor, post, rawPost] = await Promise.all([
      userRepository.findById(donorId),
      postRepository.findById(postId),
      Post.findById(postId).select('author title status'),
    ]);

    if (!donor) throw { status: 404, message: 'Người donate không tồn tại' };
    if (!post && !rawPost) throw { status: 404, message: 'Bài viết không tồn tại' };

    const currentPost = post || rawPost;
    if (currentPost.status === 'deleted') throw { status: 410, message: 'Bài viết đã bị xóa' };

    let answer = null;
    let authorCandidate = null;

    if (answerId) {
      answer = await commentRepository.findById(answerId);
      if (!answer) throw { status: 404, message: 'Câu trả lời không tồn tại' };

      const answerPostId = normalizeId(answer.post?._id || answer.post);
      const currentPostId = normalizeId(currentPost._id || rawPost?._id || postId);

      if (answerPostId !== currentPostId) {
        throw { status: 400, message: 'Câu trả lời không thuộc bài viết này' };
      }

      authorCandidate = answer.author;
    }

    if (!authorCandidate) {
      authorCandidate = post?.author || rawPost?.author;
    }

    const author = await this.resolveAuthor(
      authorId,
      authorCandidate,
      post?.author,
      rawPost?.author,
      answer?.author
    );

    if (!author) {
      throw {
        status: 400,
        message: 'Không xác định được tác giả để ủng hộ. Dữ liệu bài viết cần có author.fullName hoặc author.username.',
      };
    }

    const basePayload = {
      donor: donor._id,
      author: author._id,
      post: currentPost._id,
      answer: answer?._id || null,
      amount,
      paymentMethod,
      note: note.trim(),
      billImage: billImage || '',
      donorSnapshot: buildSnapshot(donor),
      authorSnapshot: buildSnapshot(author),
      postSnapshot: { title: currentPost.title || '' },
      answerSnapshot: { content: answer?.content || '' },
    };

    if (paymentMethod === 'cod') {
      const donation = await donationRepository.createDonation({
        ...basePayload,
        status: 'pending_review',
      });

      return {
        donation,
        paymentUrl: '',
        message: 'Giao dịch đã được tạo. Đang chờ admin duyệt bill.',
      };
    }

    if (paymentMethod === 'vnpay') {
      return await this._createVnpayCheckout(basePayload);
    }

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
    console.log('================ VNPAY DEBUG ================');
    console.log('TMN_CODE:', env.VNPAY_TMN_CODE);
    console.log('HASH_SECRET:', env.VNPAY_HASH_SECRET);
    console.log('HASH_SECRET_LENGTH:', env.VNPAY_HASH_SECRET?.length);
    console.log('RETURN_URL:', env.VNPAY_RETURN_URL);
    console.log('SIGN_DATA:', signData);
    console.log('=============================================');
    const secureHash = crypto
      .createHmac('sha512', env.VNPAY_HASH_SECRET.trim())
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    sortedParams.vnp_SecureHash = secureHash;

    const paymentUrl = `${env.VNPAY_URL.trim()}?${qs.stringify(sortedParams, { encode: false })}`;

    const donation = await donationRepository.createDonation({
      ...basePayload,
      status: 'pending_payment',
      paymentUrl,
      orderId: txnRef,
      requestId: txnRef,
      gatewayResponse: {
        provider: 'vnpay',
        paymentUrl,
      },
    });

    return {
      donation,
      paymentUrl,
      message: 'Đã tạo link thanh toán VNPAY sandbox',
    };
  }

  async confirmVnpayPayment({ transactionId, txnRef, responseCode, message = '', amount }) {
    const donation = transactionId
      ? await donationRepository.findById(transactionId)
      : await donationRepository.findByOrderId(txnRef);

    if (!donation) throw { status: 404, message: 'Không tìm thấy giao dịch' };

    if (String(responseCode) === '00') {
      const updatedDonation = await donationRepository.updateStatus(donation._id, {
        status: 'completed',
        completedAt: new Date(),
        gatewayResponse: {
          ...(donation.gatewayResponse || {}),
          responseCode,
          message,
          amount,
        },
      });

      await safeNotify(
        updatedDonation.author?.email,
        'Bạn vừa nhận được một lượt ủng hộ',
        `Bài viết "${updatedDonation.postSnapshot?.title || 'IT Forum'}" vừa nhận ${updatedDonation.amount.toLocaleString('vi-VN')}đ từ một người dùng.`
      );

      return updatedDonation;
    }

    return await donationRepository.updateStatus(donation._id, {
      status: 'rejected',
      rejectedAt: new Date(),
      gatewayResponse: {
        ...(donation.gatewayResponse || {}),
        responseCode,
        message,
        amount,
      },
    });
  }

  async approveCodDonation(donationId, adminId) {
    const donation = await donationRepository.findById(donationId);

    if (!donation) throw { status: 404, message: 'Không tìm thấy giao dịch' };
    if (donation.paymentMethod !== 'cod') throw { status: 400, message: 'Chỉ duyệt được giao dịch chuyển khoản thủ công' };
    if (donation.status !== 'pending_review') throw { status: 400, message: 'Giao dịch này không ở trạng thái chờ duyệt' };

    const updatedDonation = await donationRepository.updateStatus(donationId, {
      status: 'completed',
      approvedBy: adminId,
      approvedAt: new Date(),
      completedAt: new Date(),
    });

    await safeNotify(
      updatedDonation.author?.email,
      'Một lượt ủng hộ vừa được duyệt',
      `Bill chuyển khoản cho bài viết "${updatedDonation.postSnapshot?.title || 'IT Forum'}" vừa được admin duyệt với số tiền ${updatedDonation.amount.toLocaleString('vi-VN')}đ.`
    );

    return updatedDonation;
  }

  async getAuthorDonationProfile(authorId) {
    const [author, donations, summary] = await Promise.all([
      userRepository.findById(authorId),
      donationRepository.findReceivedByAuthor(authorId, 20),
      donationRepository.getReceivedSummary(authorId),
    ]);

    if (!author) throw { status: 404, message: 'Tác giả không tồn tại' };

    return {
      author,
      donationSummary: {
        totalAmount: summary.totalAmount || 0,
        donationCount: summary.donationCount || 0,
      },
      donations,
    };
  }
}

export default new DonationService();
