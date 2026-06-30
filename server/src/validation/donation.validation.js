import { body, param } from 'express-validator';

const donationAmountValues = [20000, 50000, 100000];

const normalizeMongoId = (value, seen = new WeakSet()) => {
  if (!value) return value;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);

  if (typeof value === 'object') {
    if (seen.has(value)) return '';
    seen.add(value);

    if (typeof value.toHexString === 'function') return value.toHexString();
    if (value.$oid) return normalizeMongoId(value.$oid, seen);
    if (value._id && value._id !== value) return normalizeMongoId(value._id, seen);
    if (typeof value.id === 'string') return value.id.trim();
  }

  return '';
};

export const createDonationValidation = [
  body('postId').customSanitizer(normalizeMongoId).isMongoId().withMessage('ID bài viết không hợp lệ'),
  body('authorId')
    .customSanitizer(normalizeMongoId)
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('ID tác giả không hợp lệ'),
  body('answerId').customSanitizer(normalizeMongoId).optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('ID câu trả lời không hợp lệ'),
  body('amount').isInt({ min: 1000 }).withMessage('Số tiền không hợp lệ'),
  body('paymentMethod').isIn(['cod', 'vnpay']).withMessage('Phương thức thanh toán không hợp lệ'),
  body('billImage').optional({ nullable: true }).isString().withMessage('Ảnh bill không hợp lệ'),
  body('note').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Ghi chú tối đa 500 ký tự'),
  body('amount').custom((value) => {
    if (!donationAmountValues.includes(Number(value))) {
      throw new Error('Chỉ hỗ trợ các mức 20K, 50K, 100K');
    }
    return true;
  }),
  body('billImage').custom((value, { req }) => {
    if (req.body.paymentMethod !== 'cod') return true;

    const billImage = String(value || '').trim();
    if (!billImage) {
      throw new Error('Bạn cần tải ảnh bill chuyển khoản trước khi gửi giao dịch thủ công');
    }

    if (!billImage.startsWith('data:image/') && !/^https?:\/\//i.test(billImage)) {
      throw new Error('Ảnh bill chuyển khoản không hợp lệ');
    }

    return true;
  }),
];

export const vnpayConfirmValidation = [
  body('transactionId').customSanitizer(normalizeMongoId).optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('ID giao dịch không hợp lệ'),
  body('txnRef').optional({ nullable: true }).notEmpty().withMessage('txnRef không được để trống'),
  body('responseCode').isString().withMessage('responseCode không hợp lệ'),
];

export const donationIdValidation = [
  param('donationId').customSanitizer(normalizeMongoId).isMongoId().withMessage('ID giao dịch không hợp lệ'),
];

export const authorIdValidation = [
  param('userId').customSanitizer(normalizeMongoId).isMongoId().withMessage('ID tác giả không hợp lệ'),
];