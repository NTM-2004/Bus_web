const jwt = require('jsonwebtoken');

// Hàm tạo token JWT
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token hết hạn sau 30 ngày
  });
};

// Hàm xác thực token JWT
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, data: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
