const { connectDB } = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../config/auth");
const qrCodeService = require("../services/qrCodeService");
const User = require("../models/User");
const MonthlyTicket = require("../models/MonthlyTicket");

// Xác nhận form email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Đăng ký
exports.registerUser = async (req, res) => {
    const { name, mail, username, password } = req.body;

    if (!name || !mail || !username || !password) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!isValidEmail(mail)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        const pool = await connectDB();

        // kiểm tra username đã được dùng chưa
        const existingUser = await User.findByUsername(pool, username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // kiểm tra email đã tồn tại chưa
        const existingEmail = await User.findByEmail(pool, mail);
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // mật khẩu băm
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // tạo id
        const userId = 'user_' + Date.now();

        // thêm user bằng model
        const user = new User({
            id: userId,
            name,
            mail,
            username,
            password: hashedPassword,
            role: 'client'
        });
        await user.save(pool);

        // tạo token
        const token = generateToken(userId);

        res.status(201).json({
            id: userId,
            name,
            mail,
            username,
            token
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: err.message });
    }
};

// đăng nhập
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        const pool = await connectDB();

        // tìm user bằng model
        const user = await User.findByUsername(pool, username);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // so sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // tạo token
        const token = generateToken(user.id);

        res.json({
            id: user.id,
            name: user.name,
            mail: user.mail,
            username: user.username,
            token
        });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ error: err.message });
    }
};

// Tài khoản
exports.getUserProfile = async (req, res) => {
    try {
        const pool = await connectDB();
        const user = await User.findById(pool, req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user.id,
            name: user.name,
            mail: user.mail,
            username: user.username,
            role: user.role 
        });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ error: err.message });
    }
};

// thêm vé tháng
exports.addMonthlyTicket = async (req, res) => {
    const { startDate, endDate, price } = req.body;
    const userId = req.user.id;

    if (!startDate || !endDate || !price) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const pool = await connectDB();

        // tạo id vé tháng
        const ticketId = 'ticket_' + Date.now();

        // Mã QR
        const ticketData = {
            id: ticketId,
            userId: userId,
            startDate: startDate,
            endDate: endDate,
            price: price,
            issueDate: new Date().toISOString()
        };

        // Tạo QR code dưới dạng base64
        const qrCodeBase64 = await qrCodeService.generateQRCodeAsBase64(ticketData, {
            width: 400,
            color: {
                dark: '#0066CC',
                light: '#FFFFFF'
            }
        });

        // thêm vé bằng model
        const ticket = new MonthlyTicket({
            id: ticketId,
            user_id: userId,
            start_date: startDate,
            end_date: endDate,
            qr_code: qrCodeBase64,
            price: price,
            status: 'active'
        });
        await ticket.save(pool);

        res.status(201).json({
            id: ticketId,
            userId,
            startDate,
            endDate,
            qrCode: qrCodeBase64,
            price,
            status: 'active'
        });
    } catch (err) {
        console.error('Error adding monthly ticket:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy vé tháng của user
exports.getUserTickets = async (req, res) => {
    try {
        const pool = await connectDB();
        // lấy vé bằng model
        const tickets = await MonthlyTicket.findByUser(pool, req.user.id);
        res.json(tickets);
    } catch (err) {
        console.error('Error fetching user tickets:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy QR code của vé
exports.getTicketQRCode = async (req, res) => {
    try {
        const pool = await connectDB();
        // lấy qr code bằng model
        const qrCode = await MonthlyTicket.findQRCode(pool, req.params.id, req.user.id);

        if (!qrCode) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Gửi QR code dưới dạng base64
        res.json({ qrCode });
    } catch (err) {
        console.error('Error fetching ticket QR code:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy tất cả tài khoản client (admin only)
exports.getAllClients = async (req, res) => {
    try {
        const pool = await connectDB();
        // lấy tất cả user client bằng model
        const allUsers = await pool.request()
            .query("SELECT id, name, mail, username FROM User_account WHERE role = 'client'");
        res.json(allUsers.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xóa vé tháng
exports.deleteMonthlyTicket = async (req, res) => {
    const ticketId = req.params.id;
    const userId = req.user.id;
    try {
        const pool = await connectDB();
        await MonthlyTicket.deleteById(pool, ticketId, userId);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting monthly ticket:', err);
        res.status(500).json({ error: err.message });
    }
};

// Cập nhật thông tin người dùng
exports.updateUserProfile = async (req, res) => {
    const { name, mail, username, password } = req.body;
    if (!name || !mail || !username) {
        return res.status(400).json({ message: 'Please provide name, email, and username.' });
    }
    try {
        const pool = await connectDB();
        const user = await User.findById(pool, req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if username is being changed and is unique
        if (username !== user.username) {
            const existingUser = await User.findByUsername(pool, username);
            if (existingUser && existingUser.id !== user.id) {
                return res.status(400).json({ message: 'Username already exists.' });
            }
        }

        user.name = name;
        user.mail = mail;
        user.username = username;

        let updatePassword = false;
        if (password && password.length >= 8) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            updatePassword = true;
        } else if (password && password.length > 0 && password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
        }

        await user.update(pool, updatePassword);
        res.json({ message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Error updating user profile:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy danh sách user client kèm vé tháng (admin only)
exports.getAllClientsWithTickets = async (req, res) => {
    try {
        const pool = await connectDB();
        // Lấy tất cả user client
        const usersResult = await pool.request()
            .query("SELECT id, name FROM User_account WHERE role = 'client'");
        const users = usersResult.recordset;

        // Lấy tất cả vé tháng
        const ticketsResult = await pool.request()
            .query("SELECT id, user_id, start_date, end_date FROM Monthly_ticket");
        const tickets = ticketsResult.recordset;

        // Gộp vé tháng vào user
        const userMap = {};
        users.forEach(u => userMap[u.id] = { ...u, tickets: [] });
        tickets.forEach(t => {
            if (userMap[t.user_id]) {
                userMap[t.user_id].tickets.push({
                    ticketId: t.id,
                    startDate: t.start_date,
                    endDate: t.end_date
                });
            }
        });

        res.json(Object.values(userMap));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

