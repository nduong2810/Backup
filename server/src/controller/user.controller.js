import userService from '../service/user.service.js';
import { validationResult } from 'express-validator';

class UserController {
    async getMyProfile(req, res) {
        try {
            const user = await userService.getProfile(req.user.userId);
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async updateMyProfile(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const updatedUser = await userService.updateProfile(req.user.userId, req.body);
            res.status(200).json({ message: "Cập nhật thành công", user: updatedUser });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async changeMyPassword(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { oldPassword, newPassword } = req.body;
            await userService.changePassword(req.user.userId, oldPassword, newPassword);
            res.status(200).json({ message: "Đổi mật khẩu thành công" });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

export default new UserController();