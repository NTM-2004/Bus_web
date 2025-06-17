const jwt = require('jsonwebtoken');
const { connectDB, sql } = require('../config/db');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Lấy thông tin user từ token
      const pool = await connectDB();
      const result = await pool.request()
        .input('id', sql.VarChar, decoded.id)
        .query('SELECT id, name, username, mail FROM User_account WHERE id = @id');

      if (result.recordset.length === 0) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.user = result.recordset[0];
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

