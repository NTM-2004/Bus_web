const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    addMonthlyTicket,
    getUserTickets,
    // getTicketQRCode,
    getAllClients,
    getAllClientsWithTickets,
    deleteMonthlyTicket,
    updateUserProfile 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Đăng ký người dùng
router.post('/users/register', registerUser);

// Đăng nhập
router.post('/users/login', loginUser);

// Lấy thông tin người dùng
router.get('/users/profile', protect, getUserProfile);
// Cập nhật thông tin người dùng
router.put('/users/profile', protect, updateUserProfile);

// Thêm vé tháng
router.post('/users/tickets', protect, addMonthlyTicket);

// Lấy danh sách vé tháng của người dùng
router.get('/users/tickets', protect, getUserTickets);

// Lấy QR code của vé
// router.get('/users/tickets/:id/qrcode', protect, getTicketQRCode);

// Lấy danh sách người dùng
router.get('/users/clients', protect, getAllClients);

// Lấy danh sách user client kèm vé tháng (admin only)
router.get('/users/clients-with-tickets', protect, getAllClientsWithTickets);

// Xóa vé tháng
router.delete('/users/tickets/:id', protect, deleteMonthlyTicket);

module.exports = router;
