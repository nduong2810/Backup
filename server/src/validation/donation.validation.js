import { body, param } from 'express-validator';

const donationAmountValues = [20000, 50000, 100000];

const normalizeMongoId = (value) => {
  if (!value) return value;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    if (value._id) {
      if (typeof value._id === 'string') return value._id.trim();
      if (typeof value._id.toString === 'function') return value._id.toString();
    }
    if (value.id) {
      if (typeof value.id === 'string') return value.id.trim();
      if (typeof value.id.toString === 'function') return value.id.toString();
    }
    if (typeof value.toString === 'function') {
      const stringValue = value.toString();
      if (stringValue && stringValue !== '[object Object]') return stringValue;
    }
  }
  return value;
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