const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Use __dirname to ensure the correct relative path
const logDirectory = path.join(__dirname, '../logs');

// Ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' });

// Setup the logger
const logging = morgan('combined', { stream: accessLogStream });

module.exports = { logging };
