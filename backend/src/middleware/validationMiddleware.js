const { body, validationResult } = require('express-validator');

exports.validateUser = [
  body('name').notEmpty().withMessage('Name is required'),
  body('mail').isEmail().withMessage('Invalid email address'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
