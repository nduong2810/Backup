import { body } from 'express-validator';

export const forgotPasswordValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ')
];

export const loginValidation = [
    body('email')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
];

export const resetPasswordValidation = [
    body('newPassword')
        .isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự')
        .matches(/\d/).withMessage('Phải chứa ít nhất 1 số'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.newPassword) throw new Error('Mật khẩu xác nhận không khớp');
        return true;
    })
];